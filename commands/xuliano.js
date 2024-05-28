module.exports = {
    name: 'xuliano',
    description: 'Menciona o usuário e envia um PORVALOPE no juju.',
    async execute(interaction) {
        await interaction.reply("<@491459349957312512> vai tomano <a:Porvalope:1143972898873278607>");
        const gifUrl = 'https://imgur.com/esTaYPx';
        await interaction.followUp(gifUrl);
    }
}
