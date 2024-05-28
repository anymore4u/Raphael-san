const config = require('../config.json'); // Certifique-se de que o caminho está correto

module.exports = {
    name: 'mensagem',
    description: 'Envia uma mensagem.',
    options: [
        {
            name: 'texto',
            description: 'A mensagem para enviar',
            type: 3, // Tipo 3 para strings
            required: true
        }
    ],
    async execute(interaction) {
        // Verifica se o usuário é o dono do bot
        if (interaction.user.id !== config.ownerId) {
            return interaction.reply({ content: 'Somente o dono do bot pode usar este comando.', ephemeral: true });
        }

        // Obtém a mensagem do comando
        const messageContent = interaction.options.getString('texto');

        // Envia a mensagem como uma mensagem separada no canal
        await interaction.channel.send(messageContent);

        // Confirma que a mensagem foi enviada
        await interaction.reply({ content: 'A mensagem foi enviada em uma mensagem separada.', ephemeral: true });
    },
};
