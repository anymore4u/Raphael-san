const { Permissions } = require('discord.js');
const moment = require('moment-timezone');

// Importe activeTimeouts e removeRoleAfterTimeout do shared.js
const { activeTimeouts, removeRoleAfterTimeout } = require('../shared'); // Ajuste o caminho conforme a estrutura do seu projeto

const getRandomDuration = () => {
    const durations = [
        { time: 30000, weight: 35 },  // 30 segundos
        { time: 60000, weight: 25 },  // 60 segundos
        { time: 120000, weight: 15 }, // 120 segundos
        { time: 300000, weight: 12 },  // 300 segundos (5 minutos)
        { time: 600000, weight: 9 },  // 600 segundos (10 minutos)
        { time: 1800000, weight: 5 }, // 1800 segundos (30 minutos)
        { time: 3600000, weight: 2 }, // 3600 segundos (1 hora)
        { time: 14400000, weight: 0.5 }, // 14400 segundos (4 horas)
        { time: 28800000, weight: 0.25 }, // 28800 segundos (8 horas)
        { time: 86400000, weight: 0.1 } // 86400 segundos (24 horas)
    ];

    // Precomputação de pesos cumulativos para otimização
    const cumulativeWeights = [];
    let totalWeight = 0;
    for (const duration of durations) {
        totalWeight += duration.weight;
        cumulativeWeights.push(totalWeight);
    }

    const random = Math.random() * totalWeight;

    for (let i = 0; i < durations.length; i++) {
        if (random <= cumulativeWeights[i]) {
            return durations[i].time;
        }
    }
    // Caso nenhum seja selecionado, retorna o último
    return durations[durations.length - 1].time;
};

module.exports = {
    name: 'pikaverde',
    description: 'Atribui o cargo temporariamente a um dos usuários específicos.',
    async execute(interaction) {
        const guildId = '1167636254930772129'; // Substitua pelo ID do seu servidor
        const roleId = '1289376985398771756'; // ID do cargo que será atribuído
        const targetUserIds = [
            '560444018622857247', '246684210960531458', '286855009482702849',
            '539596207849340948', '446434441804513338', '128346888863875072',
            '518669408554713108', '380826553329909763', '159075102296768512',
            '393581900155060224', '302252030922326017', '491459349957312512',
            '216417824141344770'
        ];

        if (interaction.guild.id !== guildId) {
            return interaction.reply({ content: 'Este comando não pode ser usado neste servidor.', ephemeral: true });
        }

        // Acessa o MongoDB
        const db = global.mongoClient.db("discordBot");
        const pikachuverdeCollection = db.collection('pikachuverde'); // Coleção unificada
        const cooldownCollection = db.collection('cooldowns'); // Nova coleção para cooldowns

        const userId = interaction.user.id;
        const now = Date.now();

        // Verifica se o usuário está em cooldown
        const cooldownEntry = await cooldownCollection.findOne({
            command: 'pikaverde',
            userId: userId
        });

        if (cooldownEntry) {
            const cooldownEndTime = new Date(cooldownEntry.endTime).getTime();
            if (now < cooldownEndTime) {
                const remainingTime = cooldownEndTime - now;
                return interaction.reply({ content: `Você deve esperar ${Math.ceil(remainingTime / 60000)} minutos antes de usar este comando novamente.`, ephemeral: true });
            }
        }

        // Define o novo cooldown de 10 minutos
        const cooldownEndTime = now + (10 * 60 * 1000); // 10 minutos
        await cooldownCollection.updateOne(
            { command: 'pikaverde', userId: userId },
            { $set: { endTime: new Date(cooldownEndTime) } },
            { upsert: true }
        );

        // Seleciona um usuário aleatório da lista
        let targetUserId = targetUserIds[Math.floor(Math.random() * targetUserIds.length)];

        let targetMember;
        try {
            targetMember = await interaction.guild.members.fetch(targetUserId);
        } catch (error) {
            console.error(`Erro ao buscar o membro com ID ${targetUserId}:`, error);
            return interaction.reply({ content: 'Erro ao buscar o usuário.', ephemeral: true });
        }

        if (!targetMember) {
            return interaction.reply({ content: 'Usuário não encontrado no servidor.', ephemeral: true });
        }

        // Verifica se o usuário está na blacklist específica deste comando
        const blacklistEntry = await pikachuverdeCollection.findOne({
            type: 'blacklist',
            userId: targetUserId
        });

        if (blacklistEntry) {
            // Muda o alvo para quem enviou o comando
            targetMember = interaction.member;
            targetUserId = interaction.user.id;
        }

        // Verifica se o bot pode gerenciar o membro
        if (!targetMember.manageable) {
            return interaction.reply({ content: 'Não é possível atribuir o cargo a este usuário.', ephemeral: true });
        }

        const randomDuration = getRandomDuration();
        const endTime = now + randomDuration;

        try {
            // Verifica se o membro já possui o cargo e compara os tempos
            const existingAssignment = await pikachuverdeCollection.findOne({
                type: 'roleAssignment',
                guildId: guildId,
                userId: targetUserId,
                roleId: roleId
            });

            // Armazena o client para uso no setTimeout
            const client = interaction.client;

            if (existingAssignment) {
                const existingEndTime = new Date(existingAssignment.endTime).getTime();
                if (existingEndTime > endTime) {
                    // O usuário já tem uma duração maior, manter a atual
                    const remainingTime = existingEndTime - now;
                    return interaction.reply({ content: `O usuário já possui o cargo por um tempo maior. Tempo restante: ${Math.ceil(remainingTime / 1000)} segundos.`, ephemeral: true });
                } else {
                    // Atualiza a duração no banco de dados
                    await pikachuverdeCollection.updateOne(
                        {
                            type: 'roleAssignment',
                            guildId: guildId,
                            userId: targetUserId,
                            roleId: roleId
                        },
                        {
                            $set: { endTime: new Date(endTime) }
                        }
                    );

                    // Cancela o temporizador anterior, se existir
                    if (activeTimeouts[targetUserId]) {
                        clearTimeout(activeTimeouts[targetUserId]);
                        console.log(`Temporizador anterior para <@${targetUserId}> cancelado.`);
                    }

                    // Configura um novo temporizador
                    const remainingTime = endTime - now;
                    const timeoutHandle = setTimeout(async () => {
                        // Código para remover o cargo após o tempo expirar
                        await removeRoleAfterTimeout(client, guildId, targetUserId, roleId, pikachuverdeCollection);
                    }, remainingTime);

                    // Salva o novo temporizador no registro
                    activeTimeouts[targetUserId] = timeoutHandle;

                    // Informa no chat
                    return interaction.reply({ content: `A duração do cargo para <@${targetUserId}> foi atualizada para ${Math.ceil(randomDuration / 1000)} segundos.`, ephemeral: false });
                }
            } else {
                // Atribui o cargo
                await targetMember.roles.add(roleId);

                // Salva a atribuição no MongoDB
                await pikachuverdeCollection.insertOne({
                    type: 'roleAssignment',
                    guildId: guildId,
                    userId: targetUserId,
                    roleId: roleId,
                    endTime: new Date(endTime)
                });

                // Configura o temporizador para remover o cargo
                const timeoutHandle = setTimeout(async () => {
                    // Código para remover o cargo após o tempo expirar
                    await removeRoleAfterTimeout(client, guildId, targetUserId, roleId, pikachuverdeCollection);
                }, randomDuration);

                // Salva o temporizador no registro
                activeTimeouts[targetUserId] = timeoutHandle;

                // Responde ao usuário com a sequência de emojis
                const durationSeconds = Math.floor(randomDuration / 1000);
                const endTimeUnix = Math.floor(endTime / 1000);
                const emojiSequence = '<:PikaIcon:1289380843466264666>'.repeat(5);

                await interaction.reply({ content: `Cargo <@&${roleId}> atribuído a <@${targetUserId}> por ${durationSeconds} segundos. O cargo será removido <t:${endTimeUnix}:R>.\n${emojiSequence}` });
            }
        } catch (error) {
            console.error('Erro ao atribuir o cargo:', error);
            interaction.reply({ content: 'Ocorreu um erro ao atribuir o cargo.', ephemeral: true });
        }
    },
};