const { MessageAttachment } = require('discord.js');
const path = require('path');

module.exports = {
    name: 'ph',
    description: 'Demonstra toda a inteligencia do Ph.',
    async execute(interaction) {
        // Substitua 'caminho/para/o/video.mp4' pelo caminho real do vídeo
        const filePath = path.join(__dirname, 'DiscordOut/ph7.mp4');
        const videoAttachment = new MessageAttachment(filePath);

        await interaction.reply({ files: [videoAttachment], content: 'esse é o nível do <@560444018622857247> <:NecoMia:1174455016266944585>' });
    }
};
