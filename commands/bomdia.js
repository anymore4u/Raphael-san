const { MessageAttachment } = require('discord.js');
const path = require('path');

module.exports = {
    name: 'bomdia',
    description: 'BOM DIAAA.',
    async execute(interaction) {
        // Substitua 'caminho/para/o/video.mp4' pelo caminho real do vídeo
        const filePath = path.join(__dirname, 'DiscordOut/bomdia.mp4');
        const videoAttachment = new MessageAttachment(filePath);

        await interaction.reply({ files: [videoAttachment], content: '<a:BocchiJam:1122606225163563188><a:TGSway:1122605795532611654> bom dia <a:Sussy:1122605808400740402><a:SaberDrum:1122606906326929470>' });
    }
};
