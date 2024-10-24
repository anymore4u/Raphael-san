const { MessageActionRow, MessageButton, MessageEmbed, Permissions } = require('discord.js');
const moment = require('moment-timezone');

let timeoutHandle = null; // Handle para o setTimeout
let accumulatedTime = 0; // Tempo acumulado
let isSpecialActive = false; // Indicador se o modo especial está ativo

const getRandomDuration = () => {
    const durations = [
        //{ time: 15000, weight: 30 },  // 15 segundos (mais comum)
        { time: 30000, weight: 35 },  // 30 segundos
        { time: 60000, weight: 25 },  // 60 segundos
        { time: 120000, weight: 15 }, // 120 segundos
        { time: 300000, weight: 12 },  // 300 segundos (5 minutos)
        { time: 600000, weight: 9 },  // 600 segundos (10 minutos)
        { time: 1800000, weight: 5 }, // 1800 segundos (30 minutos)
        { time: 3600000, weight: 2 }, // 3600 segundos (1 hora)
        { time: 14400000, weight: 0.5 }, // 14400 segundos (4 horas) (mais raro)
        { time: 28800000, weight: 0.25 }, // 28800 segundos (8 horas) (mais raro)
        { time: 86400000, weight: 0.1 } // 86400 segundos (24 horas) (mais raro)
    ];

    const totalWeight = durations.reduce((acc, curr) => acc + curr.weight, 0);
    const random = Math.random() * totalWeight;

    let cumulativeWeight = 0;
    for (let duration of durations) {
        cumulativeWeight += duration.weight;
        if (random <= cumulativeWeight) {
            return duration.time;
        }
    }
};

module.exports = {
    name: 'asura',
    description: 'Atribui um cargo temporariamente a um usuário específico.',
    options: [
        {
            name: 'adminforce',
            description: 'Força o modo especial. Somente usuários com o cargo específico podem usar.',
            type: 5, // BOOLEAN type
            required: false
        }
    ],
    async execute(interaction) {
        const guildId = '1167636254930772129'; // ID do servidor onde o comando pode ser usado
        const roleId = '1170823905972326481'; // ID do cargo que será atribuído
        const specialUserId = '446434441804513338'; // ID do usuário especial
        const adminRoleId = '1167638827804934214'; // ID do cargo específico para usar adminforce

        const restrictedCategories = [
            '1167638975306018826',
            '1167638974379073556',
            '1167652844363583508',
            '1221519956206686208',
            '1167638977612894258',
            '1176730182674042940'
        ]; // IDs das categorias restritas

        if (interaction.guild.id !== guildId) {
            return interaction.reply({ content: 'Este comando não pode ser usado neste servidor.', ephemeral: true });
        }

        const member = await interaction.guild.members.fetch(specialUserId).catch(console.error);
        if (!member) {
            return interaction.reply({ content: 'Usuário não encontrado.', ephemeral: true });
        }

        // Verifica se a opção 'adminforce' foi usada
        const adminForce = interaction.options.getBoolean('adminforce');

        // Verifica se o usuário possui o cargo específico
        let randomDuration;
        if (adminForce) {
            const hasAdminRole = interaction.member.roles.cache.has(adminRoleId);
            if (!hasAdminRole) {
                return interaction.reply({ content: 'Você não tem permissão para usar essa opção.', ephemeral: true });
            }
            isSpecialActive = true;
        }

        randomDuration = getRandomDuration();

        if (isSpecialActive) {
            accumulatedTime += randomDuration;
        } else {
            accumulatedTime = randomDuration;
        }

        // Desativa o modo especial se adminForce for false
        if (!adminForce && interaction.user.id === specialUserId) {
            isSpecialActive = false;
            accumulatedTime = randomDuration;
        }

        clearTimeout(timeoutHandle);
        timeoutHandle = setTimeout(async () => {
            if (member.roles.cache.has(roleId)) {
                await member.roles.remove(roleId);
                console.log(`Cargo <@&${roleId}> removido de <@${specialUserId}> após ${accumulatedTime / 1000} segundos.`);
            }
            isSpecialActive = false; // Desativa o modo especial
            accumulatedTime = 0; // Reseta o tempo acumulado

            // Permite o usuário enviar mensagens após o tempo especificado
            await interaction.guild.roles.fetch(roleId).then(role => {
                role.setPermissions(role.permissions.remove(Permissions.FLAGS.SEND_MESSAGES)).catch(console.error);
            });

            await interaction.guild.channels.cache.forEach(async (channel) => {
                if ((channel.type === 'GUILD_TEXT' || channel.type === 'GUILD_NEWS' || channel.type === 'GUILD_FORUM') && !restrictedCategories.includes(channel.parentId)) {
                    await channel.permissionOverwrites.edit(roleId, {
                        SEND_MESSAGES: null
                    }).catch(console.error);
                }
            });

        }, accumulatedTime);

        try {
            await member.roles.add(roleId);
            let responseMessage = `Cargo <@&${roleId}> atribuído a <@${specialUserId}> por ${randomDuration / 1000} segundos.`;
            if (isSpecialActive) {
                const endTime = moment().add(accumulatedTime, 'milliseconds').tz('America/Sao_Paulo').unix();
                responseMessage += ` Tempo acumulado: <t:${endTime}:R>.`;
            }
            interaction.reply({ content: responseMessage });

            // Impede o usuário de enviar mensagens em todos os canais de texto
            await interaction.guild.roles.fetch(roleId).then(role => {
                role.setPermissions(role.permissions.remove(Permissions.FLAGS.SEND_MESSAGES)).catch(console.error);
            });

            await interaction.guild.channels.cache.forEach(async (channel) => {
                if ((channel.type === 'GUILD_TEXT' || channel.type === 'GUILD_NEWS' || channel.type === 'GUILD_FORUM') && !restrictedCategories.includes(channel.parentId)) {
                    await channel.permissionOverwrites.edit(roleId, {
                        SEND_MESSAGES: false
                    }).catch(console.error);
                }
            });

        } catch (error) {
            console.error('Erro ao atribuir o cargo:', error);
            interaction.reply({ content: 'Ocorreu um erro ao atribuir o cargo.', ephemeral: true });
        }
    },
};
