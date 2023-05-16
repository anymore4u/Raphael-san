const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'syncperms',
    description: 'Sincroniza permissões de todos os canais de uma categoria com a categoria.',
    async execute(interaction) {
        // Verificar se o usuário tem permissões de administrador ou moderação
        if (!interaction.member.permissions.has('ADMINISTRATOR') && !interaction.member.permissions.has('MANAGE_CHANNELS')) {
            return interaction.reply({ content: 'Você não tem permissão para executar este comando.', ephemeral: true });
        }

        const channel = interaction.channel;
        const category = channel.parent;

        if (!category) {
            return interaction.reply({ content: 'Este canal não está em uma categoria.', ephemeral: true });
        }

        const channels = category.children;

        for (const channel of channels.values()) {
            const overwrites = Array.from(category.permissionOverwrites.cache, ([_, overwrite]) => ({
                id: overwrite.id,
                allow: overwrite.allow,
                deny: overwrite.deny,
                type: overwrite.type
            }));
            await channel.permissionOverwrites.set(overwrites, `Sincronizando permissões com a categoria: ${category.name}`);
        }

        const embed = new MessageEmbed()
            .setColor('#00FF00')
            .setTitle('Permissões sincronizadas')
            .setDescription(`As permissões de todos os canais na categoria ${category.name} foram sincronizadas com sucesso.`);

        await interaction.reply({ embeds: [embed] });
    }
}
