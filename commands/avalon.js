module.exports = {
    name: 'avalon',
    description: 'Resumo do que é a Avalon.',
    async execute(interaction) {
        await interaction.reply(` <:AHAHAHAHAHA:1006618975167315968> `);
        const gifUrl = 'https://imgur.com/fO0WNCR.gif';
        await interaction.followUp(gifUrl);
    }
}
