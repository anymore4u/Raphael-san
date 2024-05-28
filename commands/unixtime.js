const moment = require('moment-timezone');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'unixtime',
    description: 'Converte data e hora para timestamp Unix.',
    options: [
        {
            name: 'data',
            description: 'Data no formato dd/mm/yyyy.',
            type: 3, // Tipo 3 corresponde a uma string
            required: false
        },
        {
            name: 'hora',
            description: 'Hora no formato HH:MM.',
            type: 3, // Tipo 3 corresponde a uma string
            required: false
        }
    ],
    async execute(interaction) {
        const data = interaction.options.getString('data');
        const hora = interaction.options.getString('hora');
        let unixtime;

        if (data && hora) {
            // Agora usando o fuso horário local
            unixtime = moment.tz(`${data} ${hora}`, 'DD/MM/YYYY HH:mm', 'America/Sao_Paulo').unix();
        } else {
            unixtime = moment.tz('America/Sao_Paulo').unix();
        }

        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Timestamps Unix do Discord')
            .setDescription(`
                \\<t:${unixtime}> - <t:${unixtime}>
                \\<t:${unixtime}:t> - <t:${unixtime}:t>
                \\<t:${unixtime}:T> - <t:${unixtime}:T>
                \\<t:${unixtime}:d> - <t:${unixtime}:d>
                \\<t:${unixtime}:D> - <t:${unixtime}:D>
                \\<t:${unixtime}:f> - <t:${unixtime}:f>
                \\<t:${unixtime}:F> - <t:${unixtime}:F>
                \\<t:${unixtime}:R> - <t:${unixtime}:R>
            `);

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
