module.exports = {
    name: 'janjan',
    description: 'Menciona o usuário e envia uma mensagem e um gif.',
    async execute(interaction) {
        await interaction.reply(`Cuidado com o <@246684210960531458>! tu da mão, ele já coloca o dedo na boca.`);
        const gifUrl = 'https://media.tenor.com/tWvHDenlQXgAAAAC/killer-rabbit-killer-bunny.gif';
        await interaction.followUp(gifUrl);
    }
}
