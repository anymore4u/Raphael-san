const { MessageAttachment } = require('discord.js');
const path = require('path');

module.exports = {
    name: 'ohayo',
    description: 'ohayo~',
    async execute(interaction) {
        // Substitua 'caminho/para/o/video.mp4' pelo caminho real do vídeo
        const filePath = path.join(__dirname, 'DiscordOut/ohayo.gif');
        const videoAttachment = new MessageAttachment(filePath);

        await interaction.reply({ files: [videoAttachment], content: 'ohayo~' });
    }
};
