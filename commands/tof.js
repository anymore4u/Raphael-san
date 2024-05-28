module.exports = {
    name: 'tof',
    description: 'Exibe o status atual do ToF.',
    async execute(interaction) {
        await interaction.reply(`F TOF`);
        const gifUrl = 'https://imgur.com/LUpEQlc.png';
        //https://imgur.com/LUpEQlc.png VASCO
        //https://imgur.com/75aVgQi.png DEADGE
        await interaction.followUp(gifUrl);
    }
}
