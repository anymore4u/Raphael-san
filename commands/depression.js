module.exports = {
    name: 'depression',
    description: 'Menciona o usuário e envia uma mensagem e um gif.',
    async execute(interaction) {
        const serverId = '1167636254930772129'; // ID do servidor específico
        const currentServerId = interaction.guild.id; // ID do servidor onde o comando foi executado

        // Verifica se o comando está sendo executado no servidor específico
        if (currentServerId === serverId) {
             // Comportamento padrão para outros servidores
             await interaction.reply("gatilho no <@579099528045789185> || <@&1167638928573083758> || !");
             const gifUrl = 'https://media.tenor.com/7xvdEql6Z28AAAAC/smirk-smirk-afk.gif';
             await interaction.followUp(gifUrl);
        } else {
            // Comportamento padrão para outros servidores
            await interaction.reply("<@579099528045789185>, ");
            const gifUrl = 'https://imgur.com/4FrLfrF';
            await interaction.followUp(gifUrl);
        }
    }
}
