const { Permissions } = require('discord.js');

module.exports = {
    name: 'bansync',
    description: 'Sincroniza as permissões de banimento de texto para um cargo específico.',
    async execute(interaction) {
        const guildId = '1167636254930772129'; // ID do servidor onde o comando pode ser usado
        const roleId = '1170823905972326481'; // ID do cargo que será atualizado
        const adminRoleId = '1167638827804934214'; // ID do cargo específico para usar o comando

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

        // Verifica se o usuário possui o cargo específico
        const hasAdminRole = interaction.member.roles.cache.has(adminRoleId);
        if (!hasAdminRole) {
            return interaction.reply({ content: 'Você não tem permissão para usar esse comando.', ephemeral: true });
        }

        try {
            const role = await interaction.guild.roles.fetch(roleId);

            // Remove a permissão de enviar mensagens de texto no cargo
            await role.setPermissions(role.permissions.remove(Permissions.FLAGS.SEND_MESSAGES)).catch(console.error);

            // Atualiza as permissões em todos os canais e categorias
            const channels = await interaction.guild.channels.fetch();

            channels.forEach(async (channel) => {
                if (
                    ['GUILD_TEXT', 'GUILD_NEWS', 'GUILD_VOICE', 'GUILD_FORUM', 'GUILD_CATEGORY', 'GUILD_STAGE_VOICE'].includes(channel.type)
                ) {
                    // Aplica permissão, incluindo canais dentro de categorias restritas
                    if (restrictedCategories.includes(channel.parentId) || restrictedCategories.includes(channel.id)) {
                        await channel.permissionOverwrites.edit(roleId, {
                            SEND_MESSAGES: false
                        }).catch(console.error);
                    }
                }
            });

            interaction.reply({ content: 'Permissões atualizadas com sucesso para o cargo!' });

        } catch (error) {
            console.error('Erro ao atualizar as permissões:', error);
            interaction.reply({ content: 'Ocorreu um erro ao atualizar as permissões.', ephemeral: true });
        }
    },
};
