module.exports = {
    name: 'juju',
    description: 'Menciona o usuário e envia uma mensagem e um gif.',
    async execute(interaction) {
        await interaction.reply("lança qualquer coisa. <@491459349957312512> MIM DE!");
        const gifUrl = 'https://imgur.com/CRS6Rz0.gif';
        await interaction.followUp(gifUrl);
    }
}
