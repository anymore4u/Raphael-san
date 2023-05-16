const { Permissions } = require('discord.js');

module.exports = {
    name: 'roulette',
    description: 'Jogue a roleta russa.',
    async execute(interaction) {
        const userId = interaction.user.id;
        const randomNumber = Math.floor(Math.random() * 6) + 1; // Gera um número aleatório entre 1 e 6
        const member = interaction.guild.members.cache.get(userId);
        const targetChannel = interaction.channel;

        if (randomNumber === 1) {
            // O usuário "levou um tiro"
            await interaction.reply(`💥 <@${userId}>, você levou um tiro!`);

            // Verifica se o bot tem permissão para gerenciar permissões do canal
            if (interaction.guild.me.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
                // Silencia o usuário por 10 segundos
                if (interaction.guild.me.permissions.has(Permissions.FLAGS.MUTE_MEMBERS) && member.voice.channel) {
                    await member.voice.setMute(true, 'Roleta russa');
                }

                // Impede o usuário de enviar mensagens por 10 segundos
                await targetChannel.permissionOverwrites.create(userId, {
                    SEND_MESSAGES: false
                });

                setTimeout(async () => {
                    // Permite o usuário enviar mensagens após 10 segundos
                    await targetChannel.permissionOverwrites.edit(userId, {
                        SEND_MESSAGES: null
                    });

                    // Desmuta o usuário após 10 segundos (se ele estiver em um canal de voz)
                    if (interaction.guild.me.permissions.has(Permissions.FLAGS.MUTE_MEMBERS) && member.voice.channel) {
                        await member.voice.setMute(false, 'Fim do timeout da roleta russa');
                    }
                }, 10000); // 10000 ms = 10 segundos
            } else {
                await interaction.followUp('Eu não tenho permissão para gerenciar permissões do canal neste servidor.');
            }
        } else {
            // O usuário sobreviveu
            await interaction.reply(`🍀 <@${userId}>, você sobreviveu!`);
        }
    },
};
