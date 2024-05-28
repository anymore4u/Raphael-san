const fetch = require('node-fetch');
const path = require('path');
const { MessageAttachment } = require('discord.js');

module.exports = {
    name: 'ayu',
    description: 'Menciona o usuário e envia uma mensagem e um gif.',
    async execute(interaction) {
        // Substitua 'caminho/para/o/video.mp4' pelo caminho real do vídeo
        const filePath = path.join(__dirname, 'DiscordOut/milho.png');
        const videoAttachment = new MessageAttachment(filePath);

        await interaction.reply({ files: [videoAttachment], content: 'Escondam seus milhos da <@539596207849340948> ' });
    }
}
