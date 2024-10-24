const { MessageAttachment } = require('discord.js');
const path = require('path');

module.exports = {
    name: 'sushiiih',
    description: 'Descubra a altura da sushiiih.',
    async execute(interaction) {
        // Substitua 'caminho/para/o/video.mp4' pelo caminho real do vídeo
        const filePath = path.join(__dirname, 'DiscordOut/sushiiih.jpg');
        const videoAttachment = new MessageAttachment(filePath);

        await interaction.reply({ files: [videoAttachment], content: 'sim, a <@159075102296768512> é menor que um Toddynho (Sushiiih tem 1,50m) 🍣🤏🍣🤏🍣🤏🍣🤏🍣🤏🍣🤏' });
    }
};
