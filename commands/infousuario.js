const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'infousuario',
    description: 'Exibe informações do membro. Se não especificado, exibe informações do autor.',
    options: [{
        name: 'membro',
        description: 'Membro para exibir informações.',
        type: 6, // USER type
        required: false
    }],
    async execute(interaction) {
        const member = interaction.options.getMember('membro') || interaction.member;

        const embed = new MessageEmbed()
            .setTitle(`Informações do usuário: ${member.user.username}`)
            .setColor(member.displayHexColor || 'BLUE')
            .addField('ID', member.id, false)
            .addField('Entrou no servidor em', member.joinedAt.toLocaleDateString('pt-BR'), false)
            .addField('Conta criada em', member.user.createdAt.toLocaleDateString('pt-BR'), false);

        await interaction.reply({ embeds: [embed] });
    }
}
