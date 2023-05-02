const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'infoservidor',
    description: 'Exibe informações sobre o servidor.',
    async execute(interaction) {
        const server = interaction.guild;
        const numeroCanais = server.channels.cache.size;
        const numeroMembros = server.memberCount;

        const embed = new MessageEmbed()
            .setTitle(`Informações do servidor: ${server.name}`)
            .setColor('BLUE')
            .setImage(server.iconURL({ dynamic: true, size: 512 }))
            .addField('Número de canais', numeroCanais.toString(), false)
            .addField('Número de membros', numeroMembros.toString(), false);

        await interaction.reply({ embeds: [embed] });
    }
}
