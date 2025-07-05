const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'infousuario',
    description: 'Sincroniza permissões de todos os canais de uma categoria com a categoria.',
    options: [
        {
            name: 'category_id',
            description: 'ID da categoria para sincronizar as permissões.',
            type: 3, // STRING type
            required: true
        }
    ],
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
