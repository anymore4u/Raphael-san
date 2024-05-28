module.exports = {
    name: 'any',
    description: 'Quem enviar esse comando é calvo.',
    async execute(interaction) {
        const gifUrl = 'https://media.tenor.com/uFKdpQunTQIAAAAC/wut-nani.gif';
        await interaction.reply(gifUrl);
    }
}
