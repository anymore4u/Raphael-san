module.exports = {
    name: 'kinama',
    description: 'Menciona o usuário e envia uma mensagem e um gif.',
    async execute(interaction) {
        await interaction.reply(`<@518669408554713108>, aquele que mama!`);
        const gifUrl = 'https://media.tenor.com/VeEvVqWLZ84AAAAC/anime-suck.gif';
        await interaction.followUp(gifUrl);
    }
}
