module.exports = {
    name: 'berzerkfg',
    description: 'Menciona o usuário e envia uma mensagem e um gif.',
    async execute(interaction) {
        await interaction.reply(`O <@346295489911717889> destruiu meus dois bandos e vai destruir meu outro bando no Pegasu`);
        const gifUrl = 'https://media.tenor.com/25-0ywVG_2IAAAAC/inferno.gif';
        await interaction.followUp(gifUrl);
    }
}
