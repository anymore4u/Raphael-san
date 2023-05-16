module.exports = {
    name: 'sukuna',
    description: 'Menciona o usuário e envia uma mensagem e um gif.',
    async execute(interaction) {
        await interaction.reply(`<@611224928502677506>, O maior calvo do Brasil!`);
        const gifUrl = 'https://media.tenor.com/k13ksjrxjDYAAAAC/dog-dog-fried-chicken.gif';
        await interaction.followUp(gifUrl);
    }
}
