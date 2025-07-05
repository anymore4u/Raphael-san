const { Permissions, MessageAttachment } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');
const { activeTimeouts, removeRoleAfterTimeout } = require('../shared');

const durations = [
    { time: 30000, weight: 35 },
    { time: 60000, weight: 25 },
    { time: 120000, weight: 15 },
    { time: 300000, weight: 12 },
    { time: 600000, weight: 9 },
    { time: 1800000, weight: 5 },
    { time: 3600000, weight: 2 },
    { time: 14400000, weight: 0.5, pity: true },
    { time: 28800000, weight: 0.25, pity: true },
    { time: 86400000, weight: 0.1, pity: true }
];
const totalWeight = durations.reduce((acc, curr) => acc + curr.weight, 0);

const getRandomDuration = () => {
    const random = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    for (let duration of durations) {
        cumulativeWeight += duration.weight;
        if (random <= cumulativeWeight) return duration;
    }
};

const MAX_PITY = 80;
const PITY_SHINE_CHANCE = 0.005;

const assignRoleAndScheduleRemoval = async (interaction, member, roleId, duration, asuraCollection) => {
    const now = Date.now();
    const newEndTime = now + duration;

    const existing = await asuraCollection.findOne({ _id: `${interaction.guild.id}_${member.id}_${roleId}` });
    const existingEndTime = existing ? new Date(existing.endTime).getTime() : 0;

    if (existingEndTime > newEndTime) {
        return existingEndTime; // mantém o tempo mais longo
    }

    await member.roles.add(roleId);
    await asuraCollection.updateOne(
        { _id: `${interaction.guild.id}_${member.id}_${roleId}` },
        {
            $set: {
                type: 'roleAssignment',
                guildId: interaction.guild.id,
                userId: member.id,
                roleId,
                endTime: new Date(newEndTime)
            }
        },
        { upsert: true }
    );

    if (activeTimeouts[member.id]) {
        clearTimeout(activeTimeouts[member.id]);
    }

    const timeoutHandle = setTimeout(async () => {
        await removeRoleAfterTimeout(interaction.client, interaction.guild.id, member.id, roleId, asuraCollection);
    }, newEndTime - now);

    activeTimeouts[member.id] = timeoutHandle;
    return newEndTime;
};

const isOnCooldown = async (cooldownCollection, command, userId) => {
    const now = Date.now();
    const entry = await cooldownCollection.findOne({ command, userId });
    if (!entry) return false;
    return now < new Date(entry.endTime).getTime();
};

const getCooldownRemaining = async (cooldownCollection, command, userId) => {
    const now = Date.now();
    const entry = await cooldownCollection.findOne({ command, userId });
    if (!entry) return null;
    const end = new Date(entry.endTime).getTime();
    return end > now ? end : null;
};

const sendInteractionMessage = async (interaction, message) => {
    if (interaction.pityMessage) {
        await interaction.pityMessage.reply(message);
    } else if (interaction.replied || interaction.deferred) {
        await interaction.editReply(message);
    } else {
        await interaction.reply(message);
    }
};

const handlePitySystem = async (interaction, pityCollection, asuraCollection, specialUserId, roleId, randomDuration) => {
    const now = Date.now();
    const pityId = 'global';
    let pityData = await pityCollection.findOne({ _id: pityId });
    if (!pityData) {
        pityData = { _id: pityId, pity: 1 };
        await pityCollection.insertOne(pityData);
    }
    let pity = pityData.pity + 1;
    let isPityShine = false;
    let forcedPity = false;

    if (pity >= MAX_PITY) {
        forcedPity = true;
        isPityShine = Math.random() < 0.75; // 75% chance de shine
    } else {
        isPityShine = randomDuration.pity || Math.random() < PITY_SHINE_CHANCE;
    }

    const member = await interaction.guild.members.fetch(specialUserId).catch(console.error);
    if (!member) return false;

    if (isPityShine) {
        const shineDuration = Math.random() < 0.5 ? 8 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        await assignRoleAndScheduleRemoval(interaction, member, roleId, shineDuration, asuraCollection);

        const gifPath = path.resolve(__dirname, '../commands/DiscordOut/genshin-impact-wish.gif');
        let gif;
        try {
            await fs.access(gifPath);
            gif = new MessageAttachment(gifPath);
        } catch (err) {
            gif = null;
        }

        const durationHours = shineDuration / (60 * 60 * 1000);
        const message = {
            content: `Parabéns! O <@${specialUserId}> ganhou o cargo por ${durationHours} horas!`
        };
        if (gif) message.files = [gif];
        await sendInteractionMessage(interaction, message);

    } else if (forcedPity) {
        const pityDuration = 1 * 60 * 60 * 1000; // 1 hora
        await assignRoleAndScheduleRemoval(interaction, member, roleId, pityDuration, asuraCollection);

        const altGifPath = path.resolve(__dirname, '../commands/DiscordOut/t4-wish.gif');
        let altGif;
        try {
            await fs.access(altGifPath);
            altGif = new MessageAttachment(altGifPath);
        } catch (err) {
            altGif = null;
        }

        const message = {
            content: `O <@${specialUserId}> foi abençoado pelo pity, mas não brilhou. Ganhou o cargo por 1 hora.`
        };
        if (altGif) message.files = [altGif];
        await sendInteractionMessage(interaction, message);
    } else {
        const pityMsg = await interaction.followUp({
            content: `Você não teve sorte desta vez. O contador global de pity está em ${pity}.
Pity atual: ${pity}`,
            fetchReply: true
        });
        interaction.pityMessage = pityMsg;
        await pityCollection.updateOne({ _id: pityId }, { $set: { pity } });
        return false;
    }

    await pityCollection.updateOne({ _id: pityId }, { $set: { pity: 1 } });
    return isPityShine;
};

module.exports = {
    name: 'asura',
    description: 'Atribui um cargo temporariamente a um usuário específico.',
    async execute(interaction) {
        await interaction.deferReply();
        const guildId = '1167636254930772129';
        const roleId = '1170823905972326481';
        const specialUserId = '446434441804513338';
        const blockedUserId = '560444018622857247';

        // Verificar se o usuário bloqueado está tentando usar o comando
        if (interaction.user.id === blockedUserId) {
            return interaction.editReply({
                content: `<@${blockedUserId}> não sabe brincar, não desce pro play! 🚫🎮`
            });
        }

        const member = await interaction.guild.members.fetch(specialUserId).catch(console.error);
        if (!member) return interaction.reply({ content: 'Usuário não encontrado.' });

        const db = global.mongoClient.db("discordBot");
        const asuraCollection = db.collection('asura');
        const cooldownCollection = db.collection('cooldowns');
        const pityCollection = db.collection('pity');
        const userId = interaction.user.id;
        const now = Date.now();

        const cooldownUntil = await getCooldownRemaining(cooldownCollection, 'asura', userId);
        if (cooldownUntil) {
            return interaction.editReply({
                content: `Você deve esperar antes de usar este comando novamente. Liberado <t:${Math.floor(cooldownUntil / 1000)}:R>.`,
                ephemeral: true
            });
        }

        await cooldownCollection.updateOne(
            { command: 'asura', userId },
            { $set: { endTime: new Date(now + 10 * 60 * 1000) } },
            { upsert: true }
        );

        const randomDuration = getRandomDuration();
        const pityTriggered = await handlePitySystem(interaction, pityCollection, asuraCollection, specialUserId, roleId, randomDuration);
        if (pityTriggered) return;

        const accumulatedTime = randomDuration.time;
        const previous = await asuraCollection.findOne({ _id: `${guildId}_${specialUserId}_${roleId}` });
        const existingEndTime = previous ? new Date(previous.endTime).getTime() : 0;
        const newEndTime = now + accumulatedTime;

        if (existingEndTime > newEndTime) {
            const existingUnix = Math.floor(existingEndTime / 1000);
            return await sendInteractionMessage(interaction, {
                content: `O usuário <@${specialUserId}> já possui o cargo por um tempo maior. O cargo será removido <t:${existingUnix}:R>.`
            });
        }

        const updatedEndTime = await assignRoleAndScheduleRemoval(interaction, member, roleId, accumulatedTime, asuraCollection);
        const durationSeconds = Math.floor(accumulatedTime / 1000);
        const endTimeUnix = Math.floor(updatedEndTime / 1000);
        const emojiSequence = '<:KatakuriGay:1238542143295983697>'.repeat(5);

        if (existingEndTime && updatedEndTime > existingEndTime) {
            await sendInteractionMessage(interaction, {
                content: `A duração do cargo para <@${specialUserId}> foi atualizada. O cargo será removido <t:${endTimeUnix}:R>.`
            });
        } else {
            await sendInteractionMessage(interaction, {
                content: `Cargo <@&${roleId}> atribuído a <@${specialUserId}> por ${durationSeconds} segundos. O cargo será removido <t:${endTimeUnix}:R>.
${emojiSequence}`
            });
        }
    }
};
