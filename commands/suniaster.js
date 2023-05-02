module.exports = {
    name: 'suniaster',
    description: 'Menciona o usuário e envia uma mensagem e um gif.',
    async execute(interaction) {
        await interaction.reply(`<@196433743416655872>, nosso ex-top1`);
        const gifUrl = 'https://imgur.com/CpDR3oq.gif';
        await interaction.followUp(gifUrl);
    }
}
