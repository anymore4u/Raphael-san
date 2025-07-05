const fetch = require('node-fetch');

module.exports = {
    name: 'bell',
    description: 'Menciona o usuário e envia uma mensagem e um gif.',
    async execute(interaction) {
        await interaction.reply(`<@307180420787863552> = Futanari! **Cuidado!**`);
        const apiKey = 'AIzaSyBufz2lnKKB3LNUci2mkF8xMCp00dBE9uY';
        const gifURL = `https://tenor.googleapis.com/v2/search?q=trap+anime&key=${apiKey}&client_key=my_test_app&limit=10`;

        const response = await fetch(gifURL);
        const json = await response.json();

        const validResults = json.results.filter(result => result.media_formats);
        const gif = validResults[Math.floor(Math.random() * validResults.length)].media_formats.gif.url;

        //const gifUrl = 'https://media.tenor.com/ThBdJLTGObkAAAAC/to-love-ru-succ.gif';
        await interaction.followUp(gif);
    }
}
