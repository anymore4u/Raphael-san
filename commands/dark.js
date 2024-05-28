module.exports = {
    name: 'dark',
    description: 'Menciona o usuário e envia uma mensagem e um gif.',
    async execute(interaction) {
        await interaction.reply(`<@380826553329909763> vendo cosplay da Inori da <@159075102296768512>:`);
        const gifUrl = 'https://media.tenor.com/VcyAx_jPOMcAAAAC/reaction-boner.gif';
        await interaction.followUp(gifUrl);
    }
}
