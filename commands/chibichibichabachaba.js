const { MessageAttachment } = require('discord.js');
const path = require('path');

module.exports = {
    name: 'chibichibichabachaba',
    description: 'Chibi Chibi Chaba Chaba dubi dubi.',
    async execute(interaction) {
        // Substitua 'caminho/para/o/video.mp4' pelo caminho real do vídeo
        const filePath = path.join(__dirname, 'DiscordOut/catdance.mp4');
        const videoAttachment = new MessageAttachment(filePath);

        await interaction.reply({ files: [videoAttachment], content: 'Chibi Chibi Chaba Chaba dubi dubi daba daba magico mi dubi dubi BOOM BOOM BOOM BOOM <a:chibichibichabachaba:1187371510416027700> <a:chibichibichabachaba:1187371510416027700> <a:chibichibichabachaba:1187371510416027700> <a:chibichibichabachaba:1187371510416027700> <a:chibichibichabachaba:1187371510416027700>' });
    }
};
