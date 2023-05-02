module.exports = {
    name: 'hello',
    description: 'Says hello back to you!',
    async execute(interaction) {
        await interaction.reply('Hello!');
    },
};