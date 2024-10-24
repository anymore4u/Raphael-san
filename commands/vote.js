module.exports = {
    name: 'vote',
    description: 'Retorna o link para votação de animes',
    async execute(interaction) {
        await interaction.reply('Vote nos seus animes favoritos aqui: https://vote.raphael-san.app/vote');
    }
};