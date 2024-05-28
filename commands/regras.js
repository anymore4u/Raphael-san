const fs = require('fs');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'regras',
    description: 'Posta as regras do servidor',
    usage: '/regras',
    adminOnly: true,
    execute(interaction) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({ content: 'Você não tem permissão para executar este comando.', ephemeral: true });
        }

        fs.readFile('regras.txt', 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return;
            }

            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Regras do servidor')
                .setDescription(data);

            interaction.reply({ content: 'As regras foram enviadas em uma mensagem separada.', ephemeral: true });

            const channel = interaction.channel;
            channel.send({ embeds: [embed] });
        });
    },
};