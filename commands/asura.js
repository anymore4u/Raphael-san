const { MessageActionRow, MessageButton, MessageEmbed, Permissions } = require('discord.js');

let timeoutHandle = null; // Handle para o setTimeout
let accumulatedTime = 0; // Tempo acumulado
const baseDuration = 30000; // Duração base de 30 segundos
let isSpecialActive = false; // Indicador se o modo especial está ativo

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
        if (adminForce) {
            const hasAdminRole = interaction.member.roles.cache.has(adminRoleId);
            if (!hasAdminRole) {
                return interaction.reply({ content: 'Você não tem permissão para usar essa opção.', ephemeral: true });
            }
            isSpecialActive = true;
        } else {
            if (interaction.user.id === specialUserId) {
                isSpecialActive = true;
                accumulatedTime += baseDuration;
            } else {
                if (isSpecialActive) {
                    accumulatedTime += baseDuration;
                } else {
                    accumulatedTime = baseDuration; // Reset para 30 segundos se o modo especial não estiver ativo
                }
            }
        }

        clearTimeout(timeoutHandle);
        timeoutHandle = setTimeout(async () => {
            if (member.roles.cache.has(roleId)) {
                await member.roles.remove(roleId);
                console.log(`Cargo <@&${roleId}> removido de <@${specialUserId}> após ${accumulatedTime / 1000} segundos.`);
            }
            isSpecialActive = false; // Desativa o modo especial
            accumulatedTime = 0; // Reseta o tempo acumulado
        }, accumulatedTime);

        try {
            await member.roles.add(roleId);
            let responseMessage = `Cargo <@&${roleId}> atribuído a <@${specialUserId}>.`;
            if (isSpecialActive) {
                responseMessage += ` Tempo acumulado: ${accumulatedTime / 1000} segundos.`;
            }
            interaction.reply({ content: responseMessage });
        } catch (error) {
            console.error('Erro ao atribuir o cargo:', error);
            interaction.reply({ content: 'Ocorreu um erro ao atribuir o cargo.', ephemeral: true });
        }
    },
};