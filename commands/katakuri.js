module.exports = {
    name: 'katakuri',
    description: 'Menciona o usuário e envia uma mensagem e um gif.',
    async execute(interaction) {
        await interaction.reply("o <@393581900155060224> é gado!");
        const gifUrl = 'https://media.tenor.com/EcBswA4sYJQAAAAd/rei-do-gado-cowboy.gif';
        await interaction.followUp(gifUrl);
    }
}
