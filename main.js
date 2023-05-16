const { Client, MessageEmbed ,Intents } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildIds, token } = require('./config.json');
const { DateTime } = require('luxon');
const fs = require('fs');

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS, 
        Intents.FLAGS.GUILD_BANS,
        Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
        Intents.FLAGS.GUILD_INVITES,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
    ]
});

const rest = new REST({ version: '9' }).setToken(token);

client.commands = new Map();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        const commandsData = [];
        for (const [, command] of client.commands) {
            commandsData.push({
                name: command.name,
                description: command.description,
                options: command.options,
            });
        }

        for (const guildId of guildIds) {
            await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commandsData }
            );
        }

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    // Verificar permissões do usuário
    if (command.userPermissions) {
        const authorPerms = interaction.channel.permissionsFor(interaction.member);
        if (!authorPerms || !authorPerms.has(command.userPermissions)) {
            return await interaction.reply({ content: 'Você não tem permissão para executar este comando.', ephemeral: true });
        }
    }

    try {
        await command.execute(interaction, client); // Adicione o objeto "client" aqui
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Ocorreu um erro ao executar esse comando.', ephemeral: true });
    }
});

// Evento guildMemberAdd (Mensagem de boas-vindas)
client.on('guildMemberAdd', async member => {
    const welcomeChannelId = '1004356588770963489'; // Substitua pelo ID do canal de boas-vindas
    const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
    
    if (welcomeChannel) {
        const memberCount = member.guild.memberCount;

        const welcomeEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setAuthor(member.displayName, member.user.displayAvatarURL({ dynamic: true }))
            .setTitle('👋 Bem-vindo(a)!')
            .setDescription(`Olá <@${member.id}>, \n Bem-vindo(a) a Avalon! \n Por favor, leia as <#1004369993246462084> <:Blush:1006619012542767174>`) // Lembre-se de usar um emoji Unicode ou um emoji personalizado válido
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true })) // Adiciona a foto de perfil do usuário como thumbnail
            .setImage('https://media.giphy.com/media/eY1XZYYCd1jte2XA1s/giphy.gif') // Insira o URL do seu GIF aqui
            .setFooter(` Membros: ${memberCount} | ID: ${member.user.id} `, member.guild.iconURL({ dynamic: true })); // Adiciona o ícone do servidor, a quantidade de membros e o ID do membro no footer

            welcomeChannel.send({ content: `<@${member.id}>`, embeds: [welcomeEmbed] });
    }
});

client.login(token);
