const { DateTime } = require('luxon');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'enquete',
    description: 'Cria uma enquete com uma pergunta e as opções de sim e não.',
    options: [{
        name: 'pergunta',
        description: 'Pergunta para a enquete.',
        type: 3, // Verifique se o tipo está correto
        required: true,
    }],
    async execute(interaction, client) {
        const pergunta = interaction.options.getString('pergunta');
        const mensagem = `${pergunta}\n\n`;
    
        const embed = new MessageEmbed()
            .setTitle('Enquete')
            .setDescription(mensagem)
            .setColor('BLUE')
            .setFooter(`Autor: ${interaction.user.tag} | ${new Date().toLocaleString()}`);
    
        const mensagemEnquete = await interaction.reply({ embeds: [embed], fetchReply: true });
    
        await mensagemEnquete.react('✅');
        await mensagemEnquete.react('❌');
    
        const filter = (reaction, user) => {
            return user.id !== client.user.id && ['✅', '❌'].includes(reaction.emoji.name);
        };
        
        const collector = mensagemEnquete.createReactionCollector({ filter, time: 86400000 });
    
        collector.on('collect', (reaction, user) => {
            console.log(`Collected ${reaction.emoji.name} from ${user.tag}`);
        });
    
        collector.on('end', collected => {
            const votosSim = collected.get('✅') ? collected.get('✅').count - 1 : 0;
            const votosNao = collected.get('❌') ? collected.get('❌').count - 1 : 0;
    
            const mensagemResultados = `**Resultados da enquete:** ${pergunta}\n\n`;
            mensagemResultados += `✅ Sim: **${votosSim}**\n`;
            mensagemResultados += `❌ Não: **${votosNao}**\n`;
    
            const embedResultados = new MessageEmbed()
            .setTitle('Enquete encerrada')
            .setDescription(mensagemResultados)
            .setColor('BLUE')
            .setFooter(`Autor: ${interaction.user.tag} | ${new Date().toLocaleString()}`);
    
            interaction.followUp({ embeds: [embedResultados] });
        });
    }
}