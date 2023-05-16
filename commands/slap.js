const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    name: 'slap',
    description: 'Dê um tapa em alguém.',
    options: [{
        name: 'target',
        description: 'A pessoa que você quer dar um tapa.',
        type: 6, // USER type
        required: true
    }],
    async execute(interaction) {
        let combo = 1;
        let target = interaction.options.getMember('target');

        const sendSlapMessage = async (slapper, slapped) => {
            const apiKey = 'AIzaSyDn6lJ4Me-qGWpwTE2FId4heuCl9-5BPbE';
            const gifURL = `https://tenor.googleapis.com/v2/search?q=anime+slap&key=${apiKey}&client_key=my_test_app&limit=25`;

            // Busca um GIF aleatório de tapa de animes
            const response = await fetch(gifURL);
            const json = await response.json();

            const validResults = json.results.filter(result => result.media_formats);
            const gif = validResults[Math.floor(Math.random() * validResults.length)].media_formats.gif.url;

            // Cria um botão para revidar
            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('slap_revenge')
                        .setLabel('Revidar')
                        .setStyle('PRIMARY')
                );

            // Cria um embed com o GIF
            const embed = new MessageEmbed()
                .setTitle(`💥 Slap! [COMBO: ${combo}]`)
                .setDescription(`${slapper.toString()} deu um tapa em ${slapped.toString()}!`)
                .setImage(gif)
                .setColor('RED');

            await interaction.reply({ embeds: [embed], components: [row] });
        };

        await sendSlapMessage(interaction.user, target);

        // Listener do botão de revidar
        const filter = i => i.customId === 'slap_revenge';

        const collector = interaction.channel.createMessageComponentCollector({ filter }); // Sem limite de tempo

        let isAck = false;

        collector.on('collect', async (i) => {
            if (i.user.id === target.id && !isAck) {
                await i.deferUpdate();
                isAck = true; // Marque a interação como reconhecida
                combo++;
                target = interaction.user;
                interaction.user = i.user;
                await sendSlapMessage(interaction.user, target);
            } else if (!isAck) {
                await i.reply({ content: 'Você não pode revidar neste momento.', ephemeral: true });
                isAck = true; // Marque a interação como reconhecida
            }
        });
        
    }
};
