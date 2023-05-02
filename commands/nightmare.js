module.exports = {
    name: 'nightmare',
    description: 'Menciona o usuário e envia uma mensagem e uma imagem.',
    async execute(interaction) {
        await interaction.reply("o <@128346888863875072> é fofinho! uwu");
        const imgUrl = 'https://imgur.com/hWfEF3D.png';
        await interaction.followUp(imgUrl);
    }
}
