const { MessageAttachment } = require('discord.js');
const path = require('path');

module.exports = {
    name: 'sabado',
    description: 'Sozinho em um sábado a noite?.',
    async execute(interaction) {
        // Substitua 'caminho/para/o/video.mp4' pelo caminho real do vídeo
        const filePath = path.join(__dirname, 'DiscordOut/sabado.mp4');
        const videoAttachment = new MessageAttachment(filePath);

        await interaction.reply({ files: [videoAttachment], content: 'Sozinho em um sábado a noite? Meu Deus, você é ***patético***' });
    }
};
