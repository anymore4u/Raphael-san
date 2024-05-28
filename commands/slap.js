const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    name: 'slap',
    description: 'Dê um tapa em alguém.',
    options: [{
        name: 'alvo',
        description: 'A pessoa que você quer dar um tapa.',
        type: 6, // USER type
        required: true
    }],
    async execute(interaction) {
        let combo = 0;
        let target = interaction.options.getMember('alvo');

        const sendSlapMessage = async (slapper, slapped) => {
            const apiKey = 'AIzaSyDn6lJ4Me-qGWpwTE2FId4heuCl9-5BPbE'; // Assegure-se de manter essa chave segura e não expô-la publicamente
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
                .setTitle(`💥 Slap!${combo > 0 ? ` [COMBO: ${combo}]` : ''}`)
                .setDescription(`${slapper.toString()} deu um tapa em ${slapped.toString()}!`)
                .setImage(gif)
                .setColor('RED');

            await interaction.reply({ embeds: [embed], 
                //components: [row] 
            });
        };

        await sendSlapMessage(interaction.user, target);

        // Listener do botão de revidar
        const filter = i => i.customId === 'slap_revenge';

        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 30000 }); // Definindo um limite de tempo para o coletor

        collector.on('collect', async (i) => {
            // Verifica se o usuário que interagiu é o alvo e se a interação ainda não foi tratada
            if (i.customId === 'slap_revenge' && i.user.id === target.id && !i.deferred && !i.replied) {
                await i.deferUpdate(); // Reconhece a interação
                combo++;
                const previousTarget = target;
                target = i.user; // Atualiza o alvo para o usuário que revidou
        
                // Limpa os botões para prevenir interações futuras
                await interaction.editReply({ components: [] });
        
                await sendSlapMessage(target, previousTarget);
            } else {
                // Responde apenas se a interação não foi tratada
                if (!i.deferred && !i.replied) {
                    await i.reply({ content: 'Você não pode revidar neste momento.', ephemeral: true });
                }
            }
        });      
        
        /*
        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.followUp({ content: 'Ninguém revidou o tapa.', ephemeral: true });
            }
        }); 
        */
    }
};
