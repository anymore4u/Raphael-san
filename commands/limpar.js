const { Permissions } = require('discord.js');

module.exports = {
    name: 'limpar',
    description: 'Apaga um número específico de mensagens no canal. (Apenas para administradores e moderadores)',
    options: [{
        name: 'quantidade',
        description: 'Número de mensagens a serem apagadas.',
        type: 4, // INTEGER type
        required: true
    }],
    async execute(interaction) {
        // Verifica se o membro tem permissões de administrador ou moderador
        if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR) &&
            !interaction.member.roles.cache.some(role => role.name.toLowerCase() === 'mod')) {
            return await interaction.reply({
                content: 'Você não tem permissão para usar este comando.',
                ephemeral: true
            });
        }

        let quantidade = interaction.options.getInteger('quantidade');

        if (quantidade >= 100) {
            quantidade = 99;
        }

        await interaction.channel.bulkDelete(quantidade + 1, true);
        const msg = await interaction.reply({ content: `${quantidade} mensagens foram apagadas.`, fetchReply: true });

        setTimeout(() => {
            interaction.deleteReply();
        }, 3000);
    }
}
