const { MessageAttachment } = require('discord.js');
const path = require('path');

module.exports = {
    name: 'kotori',
    description: 'Kotori dancing to brighten your day.',
    async execute(interaction) {
        const filePath = path.join(__dirname, 'DiscordOut/kotori.mp4');
        const videoAttachment = new MessageAttachment(filePath);

        const sendMessage = async (retryCount = 0) => {
            try {
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferReply();
                }
                await interaction.editReply({ files: [videoAttachment], content: '✨✨✨ KOTORI DANÇANDO PARA ILUMINAR SEU DIA ✨✨✨ ' });
            } catch (error) {
                if (retryCount < 3) {
                    console.error(`Erro ao enviar o vídeo, tentando novamente (${retryCount + 1}/3):`, error);
                    await new Promise(resolve => setTimeout(resolve, 5000)); // Aguarda 5 segundos antes de tentar novamente
                    await sendMessage(retryCount + 1);
                } else {
                    console.error('Falha ao enviar o vídeo após 3 tentativas:', error);
                    if (interaction.deferred || interaction.replied) {
                        await interaction.followUp({ content: 'Ocorreu um erro ao enviar o vídeo. Por favor, tente novamente mais tarde.', ephemeral: true });
                    } else {
                        await interaction.reply({ content: 'Ocorreu um erro ao enviar o vídeo. Por favor, tente novamente mais tarde.', ephemeral: true });
                    }
                }
            }
        };

        await sendMessage();
    }
};
