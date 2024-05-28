const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'foto',
    description: 'Exibe o avatar de um membro. Se nenhum membro for especificado, exibe o avatar do autor da mensagem.',
    options: [{
        name: 'membro',
        description: 'Membro do qual deseja exibir o avatar.',
        type: 6,
        required: false
    }],
    async execute(interaction) {
        const member = interaction.options.getMember('membro') || interaction.member;
        const guild = interaction.guild;

        const embed = new MessageEmbed()
            .setColor(member.displayHexColor || 'BLUE')
            .setTitle(`Avatar de ${member.user.username}`)
            .setImage(member.displayAvatarURL({ dynamic: true, size: 4096, format: 'png' }))
            .setFooter(`Foto de: ${member.displayName}`, guild.iconURL({ dynamic: true }));

        // Responder com o embed
        await interaction.reply({ embeds: [embed] });
    },
};
