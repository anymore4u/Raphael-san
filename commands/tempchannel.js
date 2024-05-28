const { MessageEmbed, Permissions } = require('discord.js');
const moment = require('moment-timezone');

module.exports = {
    name: 'tempchannel',
    description: 'Cria um canal de texto temporário com permissões específicas.',
    options: [
        {
            name: 'duration',
            description: 'Duração em minutos que o canal deve existir.',
            type: 4, // Tipo INTEGER
            required: false
        },
        {
            name: 'role',
            description: 'Cargo que pode ver e interagir no canal.',
            type: 8, // Tipo ROLE
            required: false
        },
        {
            name: 'user',
            description: 'Usuário que pode ver e interagir no canal.',
            type: 6, // Tipo USER
            required: false
        }
    ],
    async execute(interaction) {
        let duration = interaction.options.getInteger('duration') || 120; // Duração padrão de 2 horas
        const role = interaction.options.getRole('role');
        const user = interaction.options.getUser('user');
        const creator = interaction.user; // Usuário que executou o comando
        const guild = interaction.guild;

        // Verificar se o usuário é um bot
        if (user && user.bot) {
            return await interaction.reply({ content: "Você não pode selecionar um bot como membro do canal.", ephemeral: true });
        }

        // Verificar se o cargo contém bots
        if (role) {
            const roleMembers = await guild.members.fetch();
            const botsInRole = roleMembers.filter(member => member.roles.cache.has(role.id) && member.user.bot);
            if (botsInRole.size > 0) {
                return await interaction.reply({ content: "Você não pode selecionar um cargo que contém bots.", ephemeral: true });
            }
        }

        let category = guild.channels.cache.find(c => c.name === 'Temporary chats' && c.type === 'GUILD_CATEGORY');
        if (!category) {
            category = await guild.channels.create('Temporary chats', {
                type: 'GUILD_CATEGORY',
            });
        }

        let permissions = [{
            id: guild.roles.everyone,
            deny: ['VIEW_CHANNEL']
        }];
        if (role) permissions.push({ id: role.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] });
        if (user) permissions.push({ id: user.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] });

        // Assegurar que o criador do canal tenha acesso
        permissions.push({
            id: creator.id,
            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
        });

        const channelName = `Temporary ${interaction.user.username} text chat`;
        const channel = await guild.channels.create(channelName, {
            type: 'GUILD_TEXT',
            permissionOverwrites: permissions,
            parent: category.id
        });

        await interaction.reply(`Canal <#${channel.id}> criado por ${duration} minutos.`);

        // Gravar no MongoDB com tempo correto
        const deleteTime = moment().tz("America/Sao_Paulo").add(duration, 'minutes').valueOf();
        const db = global.mongoClient.db("discordBot");
        const channelsCollection = db.collection("temporaryChannels");
        await channelsCollection.insertOne({
            channelId: channel.id,
            deleteTime: deleteTime
        });
    }
};
