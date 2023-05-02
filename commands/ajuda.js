const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'ajuda',
    description: 'Exibe a lista de comandos disponíveis.',
    async execute(interaction) {
        const embed = new MessageEmbed()
            .setTitle('Comandos do bot')
            .setDescription('Aqui estão os comandos disponíveis:')
            .setColor('BLUE')
            .addFields(
                { name: '/enquete', value: 'Cria uma enquete.', inline: false },
                { name: '/foto [membro]', value: 'Exibe o avatar de um membro. Se nenhum membro for especificado, exibe o avatar do autor da mensagem.', inline: false },
                { name: '/infoservidor', value: 'Exibe informações sobre o servidor.', inline: false },
                { name: '/infousuario [membro]', value: 'Exibe informações sobre um usuário. Se nenhum usuário for mencionado, exibe informações sobre você.', inline: false },
            );

        await interaction.reply({ embeds: [embed] });
    },
};
