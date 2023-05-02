const { ownerId } = require('../config.json');

module.exports = {
    name: 'shutdown',
    description: 'Desliga o bot (somente o dono).',
    async execute(interaction) {
        if (interaction.user.id === ownerId) {
            await interaction.reply('Desligando o bot...');

            // Definir o status do bot como offline
            await interaction.client.user.setStatus('invisible');

            // Aguarde 5 segundos para dar tempo ao Discord de atualizar o status
            setTimeout(() => {
                process.exit();
            }, 5000);
        } else {
            await interaction.reply({ content: 'Você não tem permissão para executar este comando.', ephemeral: true });
        }
    }
}
