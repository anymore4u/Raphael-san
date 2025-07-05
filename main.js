const { ReadableStream } = require('stream/web');
global.ReadableStream = ReadableStream;

const { Client, MessageEmbed ,Intents, MessageAttachment } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildIds, token } = require('./config.json');
const { DateTime } = require('luxon');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
// enquetePath removido - agora usa MongoDB
const { connectMongo } = require('./mongodbClient.js');
const { recoverActiveEnquetes } = require('./utils/enqueteRecovery.js');
const moment = require('moment-timezone');
const Evento = require('./models/Evento');
const mongoose = require('mongoose');
const cron = require('node-cron');

// Chama a função para conectar ao MongoDB
connectMongo().then((mongoClient) => {
    if (mongoClient) {
        global.mongoClient = mongoClient;
        const db = mongoClient.db("discordBot");
        const channelsCollection = db.collection("temporaryChannels");

        setInterval(async () => {
            const now = moment().tz("America/Sao_Paulo").valueOf();
            const query = { deleteTime: { $lte: now } };
            const expiredChannels = await channelsCollection.find(query).toArray();

            for (const expiredChannel of expiredChannels) {
                const channelToDelete = client.channels.cache.get(expiredChannel.channelId);
                if (channelToDelete) {
                    await channelToDelete.delete();
                    await channelsCollection.deleteOne({ channelId: expiredChannel.channelId });
                }
            }
        }, 600000); // Verifica a cada 10 minutos
        
        // Recuperar enquetes ativas quando o bot inicializar
        client.once('ready', async () => {
            console.log(`Bot ${client.user.tag} está online!`);
            console.log('Recuperando enquetes ativas...');
            await recoverActiveEnquetes(client);
        });
    }
}).catch(err => {
    console.error('Erro ao conectar ao MongoDB:', err);
});

// Lista de usuários bloqueados - adicione IDs de usuários que devem ser impedidos de usar o bot
const BLOCKED_USERS = [
    // '123456789012345678', // Exemplo de ID de usuário bloqueado
    // '987654321098765432', // Adicione mais IDs conforme necessário
];

// Função para verificar se um usuário está bloqueado
const isUserBlocked = (userId) => {
    return BLOCKED_USERS.includes(userId);
};

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
    ],
    http: {
        version: 9,
        api: 'https://discord.com/api',
        cdn: 'https://cdn.discordapp.com',
        invite: 'https://discord.gg',
        template: 'https://discord.new',
        timeout: 60000 // Aumenta o timeout para 60 segundos
    }
});

// Define the cooldown schema
const cooldownSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    command: { type: String, required: true },
    expiresAt: { type: Date, required: true }
});
const Cooldown = mongoose.model('Cooldown', cooldownSchema);

//versão discord.js -> discord.js@13.2.0

const rest = new REST({ version: '9' }).setToken(token);

client.commands = new Map();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    // Filtra o comando 'vovoTurbo' para que ele não seja registrado
    if (command.name !== 'vovoTurbo') {
        client.commands.set(command.name, command);
    }
}

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        const commandsData = [];
        for (const [, command] of client.commands) {
            if (command.name && command.description) { // Verifica se o comando tem os campos obrigatórios
                commandsData.push({
                    name: command.name,
                    description: command.description,
                    options: command.options,
                });
            }
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

    // Verificar se o usuário está bloqueado
    /* if (isUserBlocked(interaction.user.id)) {
        return; // Ignora completamente a interação se o usuário estiver bloqueado
    }*/

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
    const welcomeChannelIds = ['1004356588770963489', '1167638994000040017']; // Substitua pelos IDs dos canais de boas-vindas
    const welcomeChannels = welcomeChannelIds.map(id => member.guild.channels.cache.get(id)).filter(channel => channel); // Filtra os canais que existem

    if (welcomeChannels.length === 0) return;

    const memberCount = member.guild.memberCount; // Pega a quantidade de membros no servidor

    welcomeChannels.forEach(channel => {
        let welcomeMessage;
        if (channel.id === '1004356588770963489') {
            welcomeMessage = `Olá <@${member.id}>, \n Bem-vindo(a) ao nosso servidor! \n Por favor, leia as regras em <#1004369993246462084>. <:Blush:1006619012542767174>`;
        } else if (channel.id === '1167638994000040017') {
            welcomeMessage = `Olá <@${member.id}>, \n Bem-vindo(a) à nossa comunidade! \n Por favor, pegue os cargos em https://discord.com/channels/1167636254930772129/1167639000786403498/1167654954081730591. <a:Porvalope:1122606524297134150>`;
        } else {
            welcomeMessage = `Bem-vindo(a) <@${member.id}>!`; // Mensagem padrão para canais não especificados
        }

        const welcomeEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setAuthor({ name: member.displayName, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
            .setTitle('👋 Bem-vindo(a)!')
            .setDescription(welcomeMessage)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setImage('https://media.giphy.com/media/eY1XZYYCd1jte2XA1s/giphy.gif') // Substitua pelo URL do seu GIF
            .setFooter({ text: `Membros: ${memberCount} | ID: ${member.user.id}`, iconURL: member.guild.iconURL({ dynamic: true }) });

        channel.send({ embeds: [welcomeEmbed] });
    });
});

// Evento guildMemberRemove (Mensagem de despedida)
client.on('guildMemberRemove', async member => {
    const farewellChannelId = '1167638995820367924'; // Canal específico para despedidas
    const farewellChannel = member.guild.channels.cache.get(farewellChannelId);

    if (!farewellChannel) return;

    const memberCount = member.guild.memberCount; // Pega a quantidade de membros no servidor

    const farewellMessage = `${member.displayName} saiu do servidor... 😢\nSentiremos sua falta (ou não)!`;

    const farewellEmbed = new MessageEmbed()
        .setColor('#ff6b6b')
        .setAuthor({ name: member.displayName, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
        .setTitle('👋 Tchau! Vai pela sombra...')
        .setDescription(farewellMessage)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setImage('attachment://rimuru-cry.gif')
        .setFooter({ text: `Membros restantes: ${memberCount} | ID: ${member.user.id}`, iconURL: member.guild.iconURL({ dynamic: true }) });

    const attachment = new MessageAttachment('./commands/DiscordOut/rimuru-cry.gif', 'rimuru-cry.gif');
    
    farewellChannel.send({ embeds: [farewellEmbed], files: [attachment] });
});



/*const groupMembers = new Map();

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const user = interaction.member;
    const role = interaction.customId;
    const message = interaction.message;
    const creatorId = message.embeds[0].fields.find(field => field.name === '\u200b')?.value;
    const creatorIdNumeric = creatorId ? creatorId.match(/(\d+)/)?.[0] : null;

    // Verifique se a interação é para excluir o grupo
    if (role === 'delete_group') {
        // Verifique se o criador do grupo é a pessoa que está interagindo
        if (interaction.user.id === creatorIdNumeric) {             // Use o autor da mensagem como criador do grupo
            await interaction.message.delete();
            return interaction.reply({ content: `O grupo foi excluído com sucesso.`, ephemeral: true });
        } else {
            return interaction.reply({ content: `Somente o criador do grupo pode excluir o grupo.`, ephemeral: true });
        }
    }

    //const members = message.embeds[0].fields.find(field => field.name.split(" ")[1].toUpperCase() === role.toUpperCase()).value.split('\n');

    const field = message.embeds[0].fields.find(field => field.name.split(" ")[1].toUpperCase() === role.toUpperCase());
    if (!field) {
        return interaction.reply({ content: 'Não foi possível encontrar o campo solicitado.', ephemeral: true });
    } else {
    const members = field.value.split('\n');
        // Se o usuário já escolheu um role
        if (members.includes(`${user.nickname || user.user.username} - <@${user.user.id}>`)) {
            if (members.length > 1) {
                const index = members.indexOf(`${user.nickname || user.user.username} - <@${user.user.id}>`);
                members.splice(index, 1);
                message.embeds[0].fields.find(field => field.name.split(" ")[1].toUpperCase() === role.toUpperCase()).value = members.join('\n');
            } else {
                message.embeds[0].fields.find(field => field.name.split(" ")[1].toUpperCase() === role.toUpperCase()).value = '-';
            }

            await message.edit({ embeds: [message.embeds[0]], components: [message.components[0]] });
            return interaction.reply({ content: 'Você deixou o grupo.', ephemeral: true });
        }
    }


    // Se o usuário está tentando escolher um role diferente
    for (const field of message.embeds[0].fields) {
        if (field.value.includes(`${user.nickname || user.user.username} - <@${user.user.id}>`)) {
            return interaction.reply({ content: 'Você já está em um grupo. Para trocar de função, primeiro você precisa deixar o grupo atual.', ephemeral: true });
        }
    }

    if (message.embeds[0].fields.find(field => field.name.split(" ")[1].toUpperCase() === role.toUpperCase()).value === '-') {
        // Verifique se o grupo já está cheio
        const numMembers = message.embeds[0].fields.reduce((sum, field) => sum + field.value.split('\n').length, 0);
        if (numMembers >= client.groupSize) {
            return interaction.reply({ content: 'O grupo já está lotado.', ephemeral: true });
        }

        message.embeds[0].fields.find(field => field.name.split(" ")[1].toUpperCase() === role.toUpperCase()).value = `${user.nickname || user.user.username} - <@${user.user.id}>`;
    } else {
        // Verifique se o grupo já está cheio
        const numMembers = message.embeds[0].fields.reduce((sum, field) => sum + field.value.split('\n').length, 0);
        if (numMembers >= client.groupSize) {
            return interaction.reply({ content: 'O grupo já está lotado.', ephemeral: true });
        }

        message.embeds[0].fields.find(field => field.name.split(" ")[1].toUpperCase() === role.toUpperCase()).value += `\n${user.nickname || user.user.username} - <@${user.user.id}>`;
    }

    await message.edit({ embeds: [message.embeds[0]], components: [message.components[0]] });
    return interaction.reply({ content: `Você se juntou ao grupo como ${role.toUpperCase()}.`, ephemeral: true });
});*/

// ID do usuário específico (Sushi)
const specificUserId = '159075102296768512';

// ID do canal de texto onde as mensagens serão enviadas
const specificTextChannelId = '1167639004338987008';

client.on('voiceStateUpdate', (oldState, newState) => {
    const excludedVoiceChannelId = '1167638983103217785';

    // Verifica se o usuário específico está envolvido na atualização de estado
    if (newState.member.id === specificUserId || oldState.member.id === specificUserId) {
        const channel = newState.guild.channels.cache.get(specificTextChannelId);
        if (!channel) return;

        // Hora atual formatada
        const now = DateTime.now().setZone('America/Sao_Paulo').toFormat('HH:mm:ss');

        // Caminhos para os GIFs
        const entryGifPath = path.join(__dirname, 'commands', 'DiscordOut', 'sushiin.gif');
        const exitGifPath = path.join(__dirname, 'commands', 'DiscordOut', 'sushiout.gif');

        // Verifica se o usuário entrou em um canal de voz que não seja o excluído
        if (!oldState.channel && newState.channel && newState.channel.id !== excludedVoiceChannelId) {
            const entryGif = new MessageAttachment(entryGifPath);
            channel.send(`Registrando ponto de entrada da <@${specificUserId}> às ${now}.`);
            channel.send({ files: [entryGif] });
        }
        // Verifica se o usuário saiu de um canal de voz que não seja o excluído
        else if (oldState.channel && !newState.channel && oldState.channel.id !== excludedVoiceChannelId) {
            const exitGif = new MessageAttachment(exitGifPath);
            channel.send(`Registrando ponto de saída da <@${specificUserId}> às ${now}.`);
            channel.send({ files: [exitGif] });
        }
    }
});

const roleId = '1170823905972326481'; // ID do cargo que será adicionado aos novos canais de voz

client.on('channelCreate', async (channel) => {
    // Verifica se o novo canal é um canal de voz
    if (channel.type === 'GUILD_VOICE') {
        try {
            // Adiciona a permissão de enviar mensagens de texto ao cargo
            await channel.permissionOverwrites.create(roleId, {
                SEND_MESSAGES: false
            });
            console.log(`Cargo ${roleId} adicionado ao canal de voz ${channel.id}`);
        } catch (error) {
            console.error('Erro ao adicionar o cargo ao novo canal de voz:', error);
        }
    }
});


// Substitua pelos seus valores
const twitchClientID = '';
const twitchClientSecret = '';
const discordChannelID = '1215683947883921428';

let accessToken;

async function updateTwitchAccessToken() {
  const params = new URLSearchParams();
  params.append('client_id', twitchClientID);
  params.append('client_secret', twitchClientSecret);
  params.append('grant_type', 'client_credentials');

  const response = await axios.post('https://id.twitch.tv/oauth2/token', params);
  accessToken = response.data.access_token;
}

// Caminho para o arquivo JSON
const streamersStatusPath = path.join(__dirname, 'commands', 'data', 'streamersStatus.json');

async function checkIfStreamerIsLive() {
  let streamersStatus = JSON.parse(fs.readFileSync(streamersStatusPath));

  if (!accessToken) await updateTwitchAccessToken();

  const headers = {
    'Client-ID': twitchClientID,
    'Authorization': `Bearer ${accessToken}`,
  };

  for (const streamer of streamersStatus.streamers) {
    try {
      const { data } = await axios.get(`https://api.twitch.tv/helix/streams?user_login=${streamer.name}`, { headers });

      const isLive = data.data.length > 0 && data.data[0].type === 'live';

      if (isLive && !streamer.isLive) {
        // Streamer acabou de entrar ao vivo
        const channel = await client.channels.fetch(discordChannelID);
        const message = `<@&1215686969477304380>\n\n<@${streamer.discordId}> está ao vivo agora! Assista em https://www.twitch.tv/${streamer.name}`;
        channel.send(message);
        streamer.isLive = true; // Atualiza o estado para ao vivo
      } else if (!isLive && streamer.isLive) {
        // Streamer não está mais ao vivo
        streamer.isLive = false; // Atualiza o estado para offline
      }
    } catch (error) {
      console.error(`Falha ao verificar o status do streamer ${streamer.name}:`, error);
    }
  }

  // Salva as atualizações de estado no arquivo JSON
  fs.writeFileSync(streamersStatusPath, JSON.stringify(streamersStatus, null, 2));
}

client.on('messageCreate', async message => {
    // Ignora mensagens de bots para evitar loop de mensagens
    if (message.author.bot) return;

    // Verificar se o usuário está bloqueado
    /* if (isUserBlocked(message.author.id)) {
        return; // Ignora completamente a mensagem se o usuário estiver bloqueado
    }*/ 

    // Verifica se a mensagem foi enviada no canal específico
    if (message.channel.id === '1167638999146430485') {
        // Verifica se a mensagem contém imagens
        let containsImage = message.attachments.size > 0 && Array.from(message.attachments.values()).some(attachment => {
            return attachment.contentType && attachment.contentType.startsWith('image/');
        });

        // Se a mensagem contém uma imagem, adiciona as reações
        if (containsImage) {
            try {
                await message.react('🔼'); // Reage com o emoji :arrow_up:
                await message.react('🔽'); // Reage com o emoji :arrow_down:
            } catch (error) {
                console.error('Não foi possível adicionar as reações:', error);
            }
        } else {
            // Apaga a mensagem se não for uma imagem
            await message.delete().catch(error => console.error('Erro ao tentar apagar a mensagem:', error));

            // Envia uma DM para o usuário
            try {
                const dmChannel = await message.author.createDM();
                await dmChannel.send('No canal especificado, só é permitido o envio de imagens. Por favor, envie apenas imagens nesse canal.');
            } catch (dmError) {
                console.error('Erro ao enviar DM:', dmError);
            }
        }
    }
});



// Defina a verificação para ocorrer a cada X minutos
setInterval(checkIfStreamerIsLive, 300000); // 300000 ms = 5 minutos

// ID do usuário específico
const asuraId = '446434441804513338';
// ID do servidor (guild)
const guildId = '1167636254930772129';
const apelidos = [
    'Ashley 愛',
    'Ashley 愛',
    'Ashley 愛'
    // Adicione mais apelidos aqui, se necessário
];

/*client.on('ready', () => {
    console.log(`Logado como ${client.user.tag}!`);

    setInterval(async () => {
        try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return console.log('Servidor não encontrado.');

            const member = guild.members.cache.get(asuraId);
            if (!member) return console.log('Membro não encontrado.');

            // Verifica se o apelido atual NÃO está na lista de apelidos
            if (!apelidos.includes(member.nickname)) {
                // Seleciona um apelido aleatório da lista
                const novoApelido = apelidos[Math.floor(Math.random() * apelidos.length)];
                await member.setNickname(novoApelido);
                console.log(`Apelido alterado para "${novoApelido}"`);
            }
        } catch (error) {
            console.error('Erro ao alterar o apelido:', error);
        }
    }, 300000); // 300000 ms = 5 minutos
});*/

// Função de verificação de enquetes removida - agora usa MongoDB com recuperação automática

client.on('messageCreate', async message => {
    // Verificar se o usuário está bloqueado
    /*if (isUserBlocked(message.author.id)) {
        return; // Ignora completamente a mensagem se o usuário estiver bloqueado
    }*/

    if (message.content.toUpperCase() === ';JUJU') {
        try {
            // Acessa a base de dados a partir do mongoClient global
            const db = global.mongoClient.db("discordBot");
            const jujuDifficultyCollection = db.collection("jujuDifficulty");
            
            // Buscar a dificuldade atual no banco de dados
            let difficultyData = await jujuDifficultyCollection.findOne({ _id: 'global' });
            
            // Se não existir, criar com dificuldade padrão 10
            if (!difficultyData) {
                difficultyData = {
                    _id: 'global',
                    difficulty: 10,
                    lastModified: new Date(),
                    modifiedBy: 'system'
                };
                await jujuDifficultyCollection.insertOne(difficultyData);
            }

            const difficulty = difficultyData.difficulty;

            // Enviar gif do d20 rolando
            await message.reply('🎲 Rolando o dado...');
            const d20GifPath = path.join(__dirname, 'commands/DiscordOut/d20.gif');
            const d20Attachment = new MessageAttachment(d20GifPath);
            await message.channel.send({ files: [d20Attachment] });

            // Simular um pequeno delay para o suspense
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Rolar o d20
            const roll = Math.floor(Math.random() * 20) + 1;
            const specificUserId = '491459349957312512'; // ID do juju
            const porvalopeCommand = client.commands.get('porvalope');

            if (roll === 1) {
                // Crítico falha! Porvalope no autor do comando
                await message.channel.send(`💀 **CRÍTICO FALHA!** Você rolou **${roll}** e o feitiço voltou contra você!`);
                
                if (porvalopeCommand) {
                    const simulatedInteraction = {
                        reply: message.reply.bind(message),
                        followUp: message.channel.send.bind(message.channel),
                        channel: message.channel
                    };

                    // Executa porvalope no autor do comando
                    await porvalopeCommand.execute(simulatedInteraction, client, message.author.id, message.guild, message.author);
                } else {
                    message.channel.send('O comando porvalope não foi encontrado.');
                }
            } else if (roll === 20) {
                // Crítico sucesso! 5 porvalopes no juju
                await message.channel.send(`⭐ **CRÍTICO SUCESSO!** Você rolou **${roll}** - COMBO x5 PORVALOPES!`);
                
                if (porvalopeCommand) {
                    const simulatedInteraction = {
                        reply: message.reply.bind(message),
                        followUp: message.channel.send.bind(message.channel),
                        channel: message.channel
                    };

                    // Executa 5 porvalopes no juju
                    for (let i = 1; i <= 5; i++) {
                        await message.channel.send(`🔥 **PORVALOPE ${i}/5**`);
                        await porvalopeCommand.execute(simulatedInteraction, client, specificUserId, message.guild, message.author);
                        // Pequeno delay entre os porvalopes
                        if (i < 5) await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                } else {
                    message.channel.send('O comando porvalope não foi encontrado.');
                }
            } else if (roll >= difficulty) {
                // Sucesso normal! Executar comando original
                await message.channel.send(`🎉 **Sucesso!** Você rolou **${roll}** (dificuldade: ${difficulty})`);
                
                if (porvalopeCommand) {
                    // Objeto simulado de interação
                    const simulatedInteraction = {
                        reply: message.reply.bind(message),
                        followUp: message.channel.send.bind(message.channel),
                        channel: message.channel
                    };

                    // Caminho para o arquivo juju.gif
                    const jujuGifPath = path.join(__dirname, 'commands', 'DiscordOut', 'juju.gif');
                    const attachment = new MessageAttachment(jujuGifPath);

                    // Envia o gif
                    await message.channel.send({ files: [attachment] });

                    // Executa o comando porvalope no juju
                    await porvalopeCommand.execute(simulatedInteraction, client, specificUserId, message.guild, message.author);
                } else {
                    message.channel.send('O comando porvalope não foi encontrado.');
                }
            } else {
                // Falha normal! Enviar gif de falha
                await message.channel.send(`😅 **Falhou!** Você rolou **${roll}** (dificuldade: ${difficulty})`);
                const failGifPath = path.join(__dirname, 'commands/DiscordOut/jujuju.gif');
                const failAttachment = new MessageAttachment(failGifPath);
                await message.channel.send({ files: [failAttachment] });
            }
        } catch (error) {
            console.error('Erro no comando ;juju:', error);
            await message.channel.send('❌ Ocorreu um erro ao executar o comando.');
        }
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Verificar se o usuário está bloqueado
    /* if (isUserBlocked(message.author.id)) {
        return; // Ignora completamente a mensagem se o usuário estiver bloqueado
    }*/

    if (/\b(GAY|YAG|GAE|GUEI|GAI|HOMOSEXUAL)\b/i.test(message.content.toUpperCase())) {
        // Lista de mensagens possíveis
        const messages = [
            'tão falando de vc <@446434441804513338>.',
            // 'tão falando de vc <@393581900155060224>'
        ];

        // Escolher uma mensagem aleatória da lista
        const msg = messages[Math.floor(Math.random() * messages.length)];

        await message.reply(msg);
    } else if (/\b(BAITOLA|CHORÃO|CHORAO|SÓ FALA BOSTA|MACONHEIRO|NOIA|PROPLAYER DE ANIME|TALARICO|COMEDOR DE CASADA)\b/i.test(message.content.toUpperCase())) {
        const msg = 'tão falando de vc <@393581900155060224>';
        await message.reply(msg);
    } else if (/\b(GAYZAO|GAYZAUM|GAY.|GAAY|MAMADOR DE PIKA)\b/i.test(message.content.toUpperCase())){
        const msg = 'tão falando de vc <@446434441804513338>. Parabéns pelo seu dia :rainbow_flag: :rainbow_flag:';
        await message.reply(msg);
    } else if (/\b(MAMADOR|AQUELE QUE MAMA)\b/i.test(message.content.toUpperCase())){
        const msg = 'tão falando de vc <@518669408554713108>. \n' +
            'GLUB GLUB!';
        await message.reply(msg);
    } else if (/\b(ESPECIALISTA)\b/i.test(message.content.toUpperCase())) {
        const msg = 'se for de anime e transa, é o <@393581900155060224>';
        await message.reply(msg);
    } else if (/\b(FURRY)\b/i.test(message.content.toUpperCase())) {
        const msg = 'o <@446434441804513338> gosta.';
        await message.reply(msg);
    } else if (/\b(WHALE|BEBADO|TARTARUGA SLAYER|BÊBADO)\b/i.test(message.content.toUpperCase())) {
        const msg = 'tão falando de vc <@491459349957312512>';
        await message.reply(msg);
    } else if (/\b(PESADELO)\b/i.test(message.content.toUpperCase())) {
        const filePath = path.join(__dirname, 'commands', 'DiscordOut', 'nightmare.gif');
        const attachment = new MessageAttachment(filePath);
        const msg = 'A NÃO É O <@128346888863875072>';
        await message.reply({ content: msg, files: [attachment] });
    } else if (/\b(METADE|METADINHA|MEIO|0.5)\b/i.test(message.content.toUpperCase())) {
        const msg = 'tão falando de vc <@560444018622857247>!!';
        await message.reply(msg);
    } else if (/\b(PAU DE CHOQUE|PAU DE CHOCK| PAU DE CHOK|PAU DE XOQUE)\b/i.test(message.content.toUpperCase())) {
        const msg = 'CUIDADO <@128346888863875072> PARA NÃO FICAR PRESO!!';
        await message.reply(msg);
    } else if (/\b(NECROFILO|INCESTO)\b/i.test(message.content.toUpperCase())) {
        const msg = 'tão falando de vc <@380826553329909763>';
        await message.reply(msg);
    } else if (/\b(BEBADA|BÊBADA)\b/i.test(message.content.toUpperCase())) {
        const msg = 'tão falando de vc <@159075102296768512> !';
        await message.reply(msg);
    } else if (/\b(MILHO)\b/i.test(message.content.toUpperCase())) {
        const msg = 'escondam os milhos da <@539596207849340948>';
        await message.reply(msg);
    } else if (/\b(DESTRUIDOR DE COMUNIDADE)\b/i.test(message.content.toUpperCase())) {
        const msg = 'tão falando de vc <@302252030922326017>';
        await message.reply(msg);
    } else if (/\b(CANALIA|CANALHA|KANALIA|KANALHA)\b/i.test(message.content.toUpperCase())) {
        const msg = 'tão falando de vc <@346295489911717889>';
        await message.reply(msg);
    } else if (/\b(COMETRANS)\b/i.test(message.content.toUpperCase())) {
         // Lista de mensagens possíveis
         const messages = [
             'tão falando de vc <@560444018622857247>',
             'tão falando de vc <@446434441804513338>',
             'tão falando de vc <@491459349957312512>',
             'tão falando de vc <@380826553329909763>'
        ];

        // Escolher uma mensagem aleatória da lista
        const msg = messages[Math.floor(Math.random() * messages.length)];

        await message.reply(msg);
    } else if (/\b(LOLICON)\b/i.test(message.content.toUpperCase())) {
        // Lista de mensagens possíveis
        const messages = [
            'tão falando de vc <@446434441804513338>',
            'tão falando de vc <@380826553329909763>'
        ];

        // Escolher uma mensagem aleatória da lista
        const msg = messages[Math.floor(Math.random() * messages.length)];

        await message.reply(msg);
    } else if (/\b(BOY)\b/i.test(message.content.toUpperCase())) {
        const msg = 'o do <@446434441804513338> não quer funcionar';
        await message.reply(msg);
    } else if (/\b(DJ)\b/i.test(message.content.toUpperCase())) {
        const users = [
            '<@159075102296768512>',
            '<@539596207849340948>',
            '<@1346814406310498355>',
            '<@798231272656338944>',
            '<@1348378345112604672>'
        ];
    
        const gifs = [
            'https://c.tenor.com/fHraspOHAYwAAAAC/tenor.gif',
            'https://imgur.com/d3HDZ2b.gif',
            'https://c.tenor.com/siPi9gkFdSAAAAAC/tenor.gif',
            'https://c.tenor.com/aGLTSx7BOeMAAAAC/tenor.gif',
            'https://imgur.com/csVJhPn.gif',
            'https://c.tenor.com/J6KxyLpyFx8AAAAd/tenor.gif'
        ];
    
        const user = users[Math.floor(Math.random() * users.length)];
        const gif = gifs[Math.floor(Math.random() * gifs.length)];
    
        const msg = `Tão falando de você ${user}\n${gif}`;
    
        await message.reply(msg);
    } else if (/\b(CALVO)\b/i.test(message.content.toUpperCase())) {
        const userIds = [
            '560444018622857247',
            '246684210960531458',
            '539596207849340948',
            '446434441804513338',
            '128346888863875072',
            '518669408554713108',
            '380826553329909763',
            '159075102296768512',
            '393581900155060224',
            '302252030922326017',
            '491459349957312512',
            '346295489911717889',
            '286855009482702849',
            '216417824141344770',
            '307180420787863552',
            '1305744839077527654',
            '1346814406310498355',
            '798231272656338944',
            '1348378345112604672'
        ];
        const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
        const msg = `tão falando de vc <@${randomUserId}>`;
        await message.reply(msg);
    }
});

client.on('messageCreate', async message => {
    // Verificar se o usuário está bloqueado
    /* if (isUserBlocked(message.author.id)) {
        return; // Ignora completamente a mensagem se o usuário estiver bloqueado
    }*/

    if (message.content.toUpperCase() === ';SETJUJUDIFFICULTY') {
        try {
            // Verificar se o usuário tem o cargo necessário (ID: 1167638831349125210)
            const requiredRoleId = '1167638831349125210';
            const member = message.member;
            
            if (!member.roles.cache.has(requiredRoleId)) {
                return await message.reply('❌ Você não tem permissão para usar este comando. É necessário ter o cargo específico.');
            }

            // Acessa a base de dados a partir do mongoClient global
            const db = global.mongoClient.db("discordBot");
            const jujuDifficultyCollection = db.collection("jujuDifficulty");

            // Buscar a configuração atual
            let difficultyData = await jujuDifficultyCollection.findOne({ _id: 'global' });
            
            // Se não existir, criar com valores padrão
            if (!difficultyData) {
                difficultyData = {
                    _id: 'global',
                    difficulty: 10,
                    lastModified: new Date(0), // Data antiga para permitir modificação imediata
                    modifiedBy: 'system'
                };
            }

            // Verificar se já passou uma semana desde a última modificação
            const oneWeek = 7 * 24 * 60 * 60 * 1000; // Uma semana em milissegundos
            const now = new Date();
            const lastModified = new Date(difficultyData.lastModified);
            const timeElapsed = now - lastModified;

            if (timeElapsed < oneWeek) {
                const nextAvailableDate = new Date(lastModified.getTime() + oneWeek);
                const formattedDate = nextAvailableDate.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                return await message.reply(`⏱️ A dificuldade só pode ser alterada uma vez por semana. Próxima alteração disponível em: ${formattedDate}`);
            }

            // Gerar uma nova dificuldade aleatória (1-20)
            const newDifficulty = Math.floor(Math.random() * 20) + 1;
            
            // Atualizar no banco de dados
            await jujuDifficultyCollection.updateOne(
                { _id: 'global' },
                {
                    $set: {
                        difficulty: newDifficulty,
                        lastModified: now,
                        modifiedBy: message.author.id
                    }
                },
                { upsert: true }
            );

            // Responder ao usuário
            await message.reply(`🎲 **Nova dificuldade definida!** O valor do d20 necessário para o comando ;juju agora é **${newDifficulty}**. Esta configuração não poderá ser alterada novamente por uma semana.`);

        } catch (error) {
            console.error('Erro no comando ;setjujudifficulty:', error);
            await message.reply('❌ Ocorreu um erro ao definir a dificuldade.');
        }
    } else if (message.content.startsWith(';porvalope')) {
        const args = message.content.split(' ');
        if (args[1] === 'roleta') {
            const userId = message.author.id;
            const commandName = 'porvalope_roleta';
            const cooldownTime = 300; // Cooldown time in seconds (5 minutes)

            // Use moment-timezone para garantir que o tempo seja manipulado corretamente
            const now = moment.tz('America/Sao_Paulo');

            // Certifique-se de que a conexão está pronta antes de buscar o cooldown
            if (!global.mongoClient) {
                console.error('Mongoose connection is not ready.');
                return message.reply('Erro ao conectar ao banco de dados. Tente novamente mais tarde.');
            }

            const db = global.mongoClient.db("discordBot");
            const cooldown = await db.collection('cooldowns').findOne({ userId, command: commandName });

            if (cooldown && moment(cooldown.expiresAt).isAfter(now)) {
                const timeLeft = moment(cooldown.expiresAt).diff(now, 'seconds');
                const unixTime = moment(cooldown.expiresAt).unix();
                return message.reply(`Você está em cooldown. Tente novamente em <t:${unixTime}:R>.`);
            }

            const userIds = [
                '560444018622857247', '246684210960531458', '286855009482702849',
                '539596207849340948', '446434441804513338', '128346888863875072',
                '518669408554713108', '380826553329909763', '159075102296768512',
                '393581900155060224', '302252030922326017', '491459349957312512',
                '346295489911717889', '216417824141344770', '307180420787863552',
                '1305744839077527654','1346814406310498355','798231272656338944',
                '1348378345112604672'
            ];

            // Selecionar um ID aleatório da lista
            const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
            const porvalopeCommand = client.commands.get('porvalope');

            if (porvalopeCommand) {
                try {
                    const member = await message.guild.members.fetch(randomUserId);
                    if (member) {
                        const simulatedInteraction = {
                            reply: message.reply.bind(message),
                            followUp: message.channel.send.bind(message.channel),
                            options: {
                                getMember: () => member
                            },
                            channel: message.channel,
                            guild: message.guild,
                            user: message.author
                        };

                        await porvalopeCommand.execute(simulatedInteraction);

                        // Upsert the cooldown
                        const expiresAt = now.add(cooldownTime, 'seconds').toDate();
                        await db.collection('cooldowns').updateOne(
                            { userId, command: commandName },
                            { $set: { expiresAt } },
                            { upsert: true }
                        );

                    } else {
                        message.reply('Membro inválido.');
                    }
                } catch (error) {
                    console.error('Erro ao buscar membro:', error);
                    message.reply('Erro ao executar o comando.');
                }
            } else {
                message.reply('O comando porvalope não foi encontrado.');
            }
        }
    }
});


// Este mapa rastreará os loops ativos por usuário
const activeLoops = new Map();

client.on('messageCreate', async message => {
    // Comando para iniciar ou parar o loop de mensagens
    if (message.content.startsWith(';porvaloop')) {
        const targetMember = message.mentions.members.first();

        if (!targetMember) {
            return message.reply('Por favor, mencione um usuário válido.');
        }

        // Checa se o usuário que enviou a mensagem tem o cargo necessário
        const requiredRoleId = '1167638827804934214'; // Substitua pelo ID do cargo que tem permissão para usar o comando
        if (!message.member.roles.cache.has(requiredRoleId)) {
            return message.reply('Você não tem permissão para usar este comando.');
        }

        // Se já existe um loop para este usuário, pará-lo
        if (activeLoops.has(targetMember.id)) {
            clearInterval(activeLoops.get(targetMember.id));
            activeLoops.delete(targetMember.id);
            return message.reply(`Loop de comandos para ${targetMember.displayName} parado.`);
        }

        // Inicia um novo loop
        const intervalId = setInterval(async () => {
            try {
                const porvalopeCommand = client.commands.get('porvalope');
                if (porvalopeCommand) {
                    const simulatedInteraction = {
                        options: { getMember: () => targetMember },
                        reply: message.reply.bind(message),
                        followUp: message.channel.send.bind(message.channel),
                        channel: message.channel,
                        user: message.author, // Passar autor da mensagem como usuário da interação
                        member: message.member // Passar membro que executou como membro da interação
                    };
                    await porvalopeCommand.execute(simulatedInteraction, client);
                } else {
                    await message.reply('O comando porvalope não foi encontrado.');
                    clearInterval(intervalId);
                    activeLoops.delete(targetMember.id);
                }
            } catch (error) {
                console.error('Erro ao executar o comando porvalope:', error);
                clearInterval(intervalId);
                activeLoops.delete(targetMember.id);
            }
        }, 2500); // Intervalo de 2,5 segundos entre os comandos

        activeLoops.set(targetMember.id, intervalId);
        await message.reply(`Loop de comandos para ${targetMember.displayName} iniciado.`);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    console.log(`Recebida uma interação de botão: ${interaction.customId}`);
    const customId = interaction.customId;
    const [action, eventId] = customId.split('_');

    if (action === 'inscrever') {
        console.log(`Tentando inscrever no evento com ID: ${eventId}`);
        await interaction.deferReply({ ephemeral: true });  // Deferindo a resposta para ganhar mais tempo
        try {
            console.log(`Buscando evento com ID: ${eventId}`);
            const evento = await Evento.findById(eventId);
            if (!evento) {
                console.log('Evento não encontrado.');
                await interaction.editReply({ content: 'Evento não encontrado.' });
                return;
            }
            console.log(`Evento encontrado: ${evento.descricao}`);

            // Definir um valor padrão para lembreteMinutos se necessário
            const lembreteMinutos = 15; // Você pode ajustar isso ou torná-lo configurável

            console.log(`Inscrito no evento: ${interaction.user.id}, Lembrete: ${lembreteMinutos} minutos`);
            evento.inscritos.push({ usuarioId: interaction.user.id, lembreteMinutos });
            await evento.save();
            console.log(`Usuário ${interaction.user.id} inscrito com sucesso no evento.`);
            await interaction.editReply(`Você se inscreveu no evento '${evento.descricao}' com um lembrete de ${lembreteMinutos} minutos antes.`);
        } catch (error) {
            console.error('Erro ao inscrever no evento:', error);
            await interaction.editReply({ content: 'Ocorreu um erro ao tentar se inscrever no evento.' });
        }
    }
});

const activeReactions = new Set();

client.on('messageCreate', async message => {
    // Comando para iniciar ou parar a adição de reações
    if (message.content.startsWith(';kataburro')) {
        const targetUserId = '393581900155060224';

        // Checa se o usuário que enviou a mensagem tem o cargo necessário
        const requiredRoleId = '1167638831349125210'; // Substitua pelo ID do cargo que tem permissão para usar o comando
        if (!message.member.roles.cache.has(requiredRoleId)) {
            return message.reply('Você não tem permissão para usar este comando.');
        }

        // Se já existe uma reação ativa para este usuário, removê-la
        if (activeReactions.has(targetUserId)) {
            activeReactions.delete(targetUserId);
            console.log(`Reações para o usuário <@${targetUserId}> desativadas por <@${message.author.id}>.`);
            return;
        }

        // Ativa a adição de reações para o usuário
        activeReactions.add(targetUserId);
        console.log(`Reações para o usuário <@${targetUserId}> ativadas por <@${message.author.id}>.`);
    }

    // Adiciona a reação às mensagens do usuário alvo
    if (activeReactions.has(message.author.id)) {
        try {
            await message.react('<:braininthetrash:1252660843716411544>');
        } catch (error) {
            console.error('Erro ao adicionar a reação:', error);
        }
    }
});

// Verificação de enquetes removida - agora usa MongoDB com recuperação automática na inicialização

// Mapeamento de personagens para IDs dos cargos
const xpCharacters = {
    'Monica Everett': '1202044140985262131',
    'Kikoru Shinomiya': '1202044533643153428',
    'Kaoruko Waguri': '1202044694016835634',
    'Chisa Kotegawa': '1202044732403109958',
    'Lu Xiaotang': '1202044783535853568',
    'Raphtalia': '1202044947059191918',
    'Sylpha': '1202044960887799908',
    'Mai Sakurajima': '1202045047613435965',
    'Marin Kitagawa': '1202045052126236722',
    'Nazuna Nanakusa': '1202045057247756288',
    'Kohaku': '1202045060250607656',
    'Erika Amano': '1202045061546643506',
    'Chizuru Ichinose': '1202045063342071830',
    'Lammis': '1202045064595902535',
    'Momo Ayase': '1202045066244526120',
    'Kamina': '1202045076596080741',
    'Himmel': '1203440445875822652',
    'Accelerator': '1203440452187979858',
    'Vash the Stampede': '1203440456713904128',
    'Osamu Dazai': '1203440466662793376',
    'Kiyotaka Ayanokouji': '1203440470827728916'
};

// Função para tentar localizar o cargo, invertendo nome/sobrenome se necessário
function getCharacterRole(character) {
    if (xpCharacters[character]) return xpCharacters[character];

    const parts = character.split(' ');
    if (parts.length === 2) {
        const reversed = `${parts[1]} ${parts[0]}`;
        return xpCharacters[reversed] || null;
    }

    return null;
}

client.on('messageCreate', async (message) => {
    if (message.content.includes('💖') && message.content.includes('agora são casados')) {
        console.log("Mensagem de casamento detectada.");

        const regex = /💖 \*\*(.*?)\*\* e \*\*(.*?)\*\* agora são casados/;
        const matches = message.content.match(regex);

        if (!matches || matches.length < 3) {
            console.log("Formato da mensagem inesperado:", message.content);
            return;
        }

        const user = matches[1];
        const character = matches[2];

        console.log(`Usuário: ${user}, Personagem: ${character}`);

        const roleId = getCharacterRole(character);

        if (!roleId) {
            console.log(`Personagem ${character} não está na lista de personagens com cargo de XP.`);
            return;
        }

        const guild = message.guild;
        const member = guild.members.cache.find(m => m.user.tag.startsWith(user));

        if (!member) {
            console.log("Não foi possível encontrar o membro:", user);
            return;
        }

        const role = guild.roles.cache.get(roleId);

        if (!role) {
            console.log("Não foi possível encontrar o cargo:", roleId);
            return;
        }

        if (!global.mongoClient) {
            console.error('MongoDB não está conectado.');
            return message.reply('Erro ao conectar ao banco de dados. Tente novamente mais tarde.');
        }

        const db = global.mongoClient.db("discordBot");
        const mudaeCollection = db.collection('mudaeMarriages');
        const now = moment.tz('America/Sao_Paulo');

        const userRecord = await mudaeCollection.findOne({ userId: member.id });

        if (userRecord && userRecord.activeRole) {
            await mudaeCollection.updateOne(
                { userId: member.id },
                { $push: { queue: { roleId: roleId, character: character } } }
            );
            return message.reply(`Você já tem um bônus de XP ativo. O cargo <@&${roleId}> foi adicionado à fila e será aplicado assim que o bônus atual expirar.`);
        }

        await member.roles.add(role);
        console.log(`Cargo atribuído: ${role.name}`);

        await message.channel.send(
            `🎉 Parabéns, ${user}! Você casou com **${character}** e ganhou o cargo <@&${roleId}>!`
        );

        const expiresAt = now.add(7, 'days').toDate();

        await mudaeCollection.updateOne(
            { userId: member.id },
            {
                $set: {
                    activeRole: roleId,
                    character: character,
                    startDate: new Date(),
                    expiresAt
                },
                $setOnInsert: { queue: [] }
            },
            { upsert: true }
        );

        console.log(`Cargo salvo no MongoDB para o usuário ${user}.`);
    }
});

// Agendamento para remover cargos expirados todos os dias às 23:59
cron.schedule('59 23 * * *', async () => {
    const now = new Date();
    const db = global.mongoClient.db("discordBot");
    const mudaeCollection = db.collection('mudaeMarriages'); // Coleção do Mudae

    const expiringRoles = await mudaeCollection.find({ expiresAt: { $lte: now } }).toArray();

    for (const roleInfo of expiringRoles) {
        const guild = client.guilds.cache.get('1167636254930772129'); // Substitua pelo ID do servidor
        const member = guild.members.cache.get(roleInfo.userId);
        const role = guild.roles.cache.get(roleInfo.activeRole);

        if (member && role) {
            await member.roles.remove(role);
            console.log(`Cargo expirado removido de ${member.user.tag}`);
        }

        // Verifica se há cargos na fila
        if (roleInfo.queue && roleInfo.queue.length > 0) {
            const nextRole = roleInfo.queue[0]; // Pega o próximo cargo da fila
            const nextRoleId = nextRole.roleId;

            const nextRoleObj = guild.roles.cache.get(nextRoleId);
            if (nextRoleObj) {
                // Atribui o próximo cargo
                await member.roles.add(nextRoleObj);
                console.log(`Cargo ${nextRoleObj.name} atribuído a ${member.user.tag} a partir da fila.`);

                const newExpiresAt = moment.tz('America/Sao_Paulo').add(7, 'days').toDate(); // Expira em 7 dias

                // Atualiza o registro no MongoDB com o novo cargo ativo e remove o próximo cargo da fila
                await mudaeCollection.updateOne(
                    { userId: member.id },
                    {
                        $set: { activeRole: nextRoleId, expiresAt: newExpiresAt },
                        $pull: { queue: { roleId: nextRoleId } } // Remove o próximo cargo da fila após ser aplicado
                    }
                );
                console.log(`Cargo ${nextRoleObj.name} removido da fila e atribuído a ${member.user.tag}.`);
            } else {
                console.log(`Erro: Cargo com ID ${nextRoleId} não encontrado no servidor.`);
            }
        } else {
            // Não há mais cargos na fila, limpa o registro
            await mudaeCollection.updateOne(
                { userId: roleInfo.userId },
                { $unset: { activeRole: "", expiresAt: "" } } // Remove os dados de cargo ativo
            );
            console.log(`Nenhum cargo na fila. Limpeza de registros concluída para o usuário ${member.user.tag}.`);
        }
    }
});

// Importe a função removeRoleAfterTimeout
const { activeTimeouts, removeRoleAfterTimeout } = require('./shared'); // Ajuste o caminho conforme a estrutura do seu projeto

async function restoreActiveTimeouts(client) {
    const db = global.mongoClient.db("discordBot");
    const pikachuverdeCollection = db.collection('pikachuverde');

    const now = Date.now();

    // Busca todas as atribuições de cargos que ainda não expiraram
    const assignments = await pikachuverdeCollection.find({
        type: 'roleAssignment',
        endTime: { $gt: new Date(now) }
    }).toArray();

    for (const assignment of assignments) {
        const remainingTime = new Date(assignment.endTime).getTime() - now;

        // Configura o temporizador para remover o cargo quando o tempo acabar
        const timeoutHandle = setTimeout(async () => {
            await removeRoleAfterTimeout(client, assignment.guildId, assignment.userId, assignment.roleId, pikachuverdeCollection);
        }, remainingTime);

        // Salva o temporizador no registro
        activeTimeouts[assignment.userId] = timeoutHandle;
    }
}

const vovoTurboCommand = require('./commands/vovoTurbo');

client.once('ready', () => {
    console.log(`Bot logado como ${client.user.tag}`);

    // Restaurar temporizadores ativos
    restoreActiveTimeouts(client).catch(console.error);

    // Remover a execução do comando vovoTurbo ao iniciar o bot
    // vovoTurboCommand.execute(client);

    // Função para gerar horários aleatórios
    const generateRandomTimes = (numTimes) => {
        const times = [];
        const now = moment().tz('America/Sao_Paulo');
        for (let i = 0; i < numTimes; i++) {
            const randomHour = Math.floor(Math.random() * (24 - now.hour())) + now.hour();
            const randomMinute = Math.floor(Math.random() * 60);
            times.push({ hour: randomHour, minute: randomMinute });
        }
        return times;
    };

    // Gerar horários aleatórios para o dia
    let randomTimes = generateRandomTimes(2); // Gera 3 horários aleatórios

    // Log dos horários gerados
    console.log('🕒 Horários gerados para o comando vovoTurbo hoje:');
    randomTimes.forEach((time, index) => {
        const timeStr = moment().tz('America/Sao_Paulo')
            .set({hour: time.hour, minute: time.minute})
            .format('HH:mm');
        console.log(`   ${index + 1}º horário: ${timeStr}`);
    });

    // Agendar a execução aleatória do comando vovoTurbo
    setInterval(() => {
        const now = moment().tz('America/Sao_Paulo');
        const currentHour = now.hour();
        const currentMinute = now.minute();

        // Verificar se o horário atual corresponde a um dos horários gerados
        for (const time of randomTimes) {
            if (currentHour === time.hour && currentMinute === time.minute) {
                console.log(`🎯 Executando vovoTurbo no horário programado: ${currentHour}:${currentMinute}`);
                vovoTurboCommand.execute(client);
                break;
            }
        }

        // Regenerar horários aleatórios à meia-noite
        if (currentHour === 0 && currentMinute === 0) {
            randomTimes = generateRandomTimes(3);
            console.log('\n🕒 Novos horários gerados para o comando vovoTurbo:');
            randomTimes.forEach((time, index) => {
                const timeStr = moment().tz('America/Sao_Paulo')
                    .set({hour: time.hour, minute: time.minute})
                    .format('HH:mm');
                console.log(`   ${index + 1}º horário: ${timeStr}`);
            });
        }
    }, 60 * 1000); // Verifica a cada minuto

    // Verificar e remover cargos expirados ao iniciar o bot
    checkRoleRemovals(client).catch(console.error);
});

async function checkRoleRemovals(client) {
    const db = global.mongoClient.db("discordBot");
    const pikachuverdeCollection = db.collection('pikachuverde');
    const vovoTurboCollection = db.collection('vovoTurbo');

    const now = new Date();

    // Busca atribuições expiradas em ambas as coleções
    const expiredAssignments = await pikachuverdeCollection.find({
        type: 'roleAssignment',
        endTime: { $lte: now }
    }).toArray();

    const expiredVovoTurboAssignments = await vovoTurboCollection.find({
        endTime: { $lte: now }
    }).toArray();

    for (let assignment of expiredAssignments) {
        try {
            if (!assignment.guildId || !assignment.userId) {
                console.error(`guildId ou userId está faltando para a atribuição de ${assignment.userId}`);
                continue;
            }

            const guild = await client.guilds.fetch(assignment.guildId);
            const member = await guild.members.fetch(assignment.userId);

            if (member.roles.cache.has(assignment.roleId)) {
                await member.roles.remove(assignment.roleId);
                console.log(`Cargo <@&${assignment.roleId}> removido de <@${assignment.userId}> pela verificação periódica.`);
            }

            // Remove a atribuição do banco de dados
            await pikachuverdeCollection.deleteOne({ _id: assignment._id });

            // Remove o temporizador do registro, se existir
            if (activeTimeouts[assignment.userId]) {
                clearTimeout(activeTimeouts[assignment.userId]);
                delete activeTimeouts[assignment.userId];
            }

        } catch (error) {
            console.error(`Erro ao remover o cargo de <@${assignment.userId}>:`, error);
        }
    }

    for (let assignment of expiredVovoTurboAssignments) {
        try {
            if (!assignment.guildId || !assignment.userId) {
                console.error(`guildId ou userId está faltando para a atribuição de ${assignment.userId}`);
                continue;
            }

            const guild = await client.guilds.fetch(assignment.guildId);
            const member = await guild.members.fetch(assignment.userId);

            if (member.roles.cache.has(assignment.roleId)) {
                await member.roles.remove(assignment.roleId);
                console.log(`Cargo <@&${assignment.roleId}> removido de <@${assignment.userId}> pela verificação periódica.`);
            }

            // Remove a atribuição do banco de dados
            await vovoTurboCollection.deleteOne({ _id: assignment._id });

            // Remove o temporizador do registro, se existir
            if (activeTimeouts[assignment.userId]) {
                clearTimeout(activeTimeouts[assignment.userId]);
                delete activeTimeouts[assignment.userId];
            }

        } catch (error) {
            console.error(`Erro ao remover o cargo de <@${assignment.userId}>:`, error);
        }
    }
}

// Agende a função para rodar a cada hora
setInterval(() => {
    checkRoleRemovals(client);
}, 60 * 60 * 1000); // A cada hora

// Verificação diária para remover cargos expirados
cron.schedule('*/5 * * * *', async () => { // Executa a cada 5 minutos
    try {
        if (!global.mongoClient) {
            console.error('MongoDB connection is not ready.');
            return;
        }

        const db = global.mongoClient.db("discordBot");
        const roleAssignmentsCollection = db.collection('roleAssignments');
        const asuraCollection = db.collection('asura');
        const now = new Date();

        const expiredAssignments = await roleAssignmentsCollection.find({ expiresAt: { $lte: now } }).toArray();
        const expiredAsuraAssignments = await asuraCollection.find({ endTime: { $lte: now } }).toArray();

        for (const assignment of expiredAssignments) {
            try {
                const guild = client.guilds.cache.get('1167636254930772129'); // Substitua pelo ID do seu servidor
                const member = await guild.members.fetch(assignment.userId);

                if (member.roles.cache.has(assignment.roleId)) {
                    await member.roles.remove(assignment.roleId);
                    console.log(`Cargo removido de ${member.user.tag}`);
                }

                // Remove o registro do MongoDB
                await roleAssignmentsCollection.deleteOne({ _id: assignment._id });
            } catch (error) {
                console.error(`Erro ao remover cargo de <@${assignment.userId}>:`, error);
            }
        }

        for (const assignment of expiredAsuraAssignments) {
            try {
                const guild = client.guilds.cache.get('1167636254930772129'); // Substitua pelo ID do seu servidor
                const member = await guild.members.fetch(assignment.userId);

                if (member.roles.cache.has(assignment.roleId)) {
                    await member.roles.remove(assignment.roleId);
                    console.log(`Cargo removido de ${member.user.tag}`);
                }

                // Remove o registro do MongoDB
                await asuraCollection.deleteOne({ _id: assignment._id });
            } catch (error) {
                console.error(`Erro ao remover cargo de <@${assignment.userId}>:`, error);
            }
        }

        // Verificação adicional para o usuário especial
        const specialUserId = '446434441804513338'; // ID do usuário especial
        const specialRoleId = '1170823905972326481'; // ID do cargo especial
        const specialAssignment = await asuraCollection.findOne({ userId: specialUserId });

        if (specialAssignment) {
            const guild = client.guilds.cache.get('1167636254930772129'); // Substitua pelo ID do seu servidor
            const member = await guild.members.fetch(specialUserId);

            if (new Date(specialAssignment.endTime) <= now) {
                // Se o tempo expirou, remove o cargo e apaga o registro no banco
                if (member.roles.cache.has(specialRoleId)) {
                    await member.roles.remove(specialRoleId);
                    console.log(`Cargo especial removido de ${member.user.tag}`);
                }
                await asuraCollection.deleteOne({ _id: specialAssignment._id });
            } else if (!member.roles.cache.has(specialRoleId)) {
                // Se o tempo não expirou e o usuário não tem o cargo, adiciona o cargo
                await member.roles.add(specialRoleId);
                console.log(`Cargo especial adicionado a ${member.user.tag}`);
            }
        }
    } catch (error) {
        console.error("Erro ao remover cargos expirados:", error);
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const content = message.content.trim();

    // Comando ;gpt
    if (content.startsWith(';gpt')) {
        const prompt = content.slice(4).trim(); // Remove o comando ;gpt

        if (!prompt) {
            await message.reply('Por favor, forneça uma mensagem após o comando ;gpt.');
            return;
        }

        const response = await generateResponse(prompt);
        await sendMessageInChunks(message, response);
        return;
    }

    // Comando ;raphael
    if (content.startsWith(';raphael')) {
        const prompt = content.slice(8).trim(); // Remove o comando ;raphael

        if (!prompt) {
            await message.reply('Por favor, forneça uma mensagem após o comando ;raphael.');
            return;
        }

        const response = await generateResponseRaphael(prompt);
        await sendMessageInChunks(message, response);
        return;

    }
});

// Configuração dos prompts para cada dia da semana
const dailyPrompts = {
    1: 'Digite uma mensagem desmotivacional de bom dia para uma segunda-feira',
    2: 'Digite uma mensagem de bom dia para uma terça-feira.',
    3: 'Digite uma mensagem de bom dia para uma quarta-feira cheia de trabalho.',
    4: 'Digite uma mensagem de bom dia para uma quinta-feira quase chegando no final de semana.',
    5: 'Digite uma mensagem de bom dia para uma sexta-feira com energia de fim de semana.',
    6: 'Digite uma mensagem de bom dia para um sábado preguiçoso.',
    7: 'Digite uma mensagem de bom dia para um domingo relaxante.'
};

// ID do canal onde as mensagens serão enviadas
const targetChannelId = '1167639004338987008'; // Substitua pelo ID do canal desejado

// ID do cargo a ser mencionado
// const everyoneRoleId = '1167638958994366534'; // ID do @everyone

// Função para agendar mensagens diárias
function scheduleDailyMessages(client) {
    setInterval(async () => {
        const now = DateTime.now().setZone('America/Sao_Paulo');
        const currentDay = now.weekday; // 1 = segunda-feira, 7 = domingo
        const currentHour = now.hour;
        const currentMinute = now.minute;

        // Verifica se é 7h da manhã
        if (currentHour === 7 && currentMinute === 0) {
            const prompt = dailyPrompts[currentDay];
            if (!prompt) return;

            try {
                const channel = client.channels.cache.get(targetChannelId);
                if (!channel) {
                    console.error('Canal não encontrado.');
                    return;
                }

                // Gera a resposta usando o generateResponseRaphael
                const response = await generateResponseRaphael(prompt);

                // Envia a mensagem no canal
                await channel.send(response);
                console.log(`Mensagem enviada no canal ${targetChannelId}: ${response}`);
            } catch (error) {
                console.error('Erro ao enviar mensagem diária:', error);
            }
        }
    }, 60 * 1000); // Verifica a cada minuto
}

// Chama a função ao iniciar o bot
client.once('ready', () => {
    console.log('Agendador de mensagens diárias iniciado.');
    scheduleDailyMessages(client);
});


async function generateResponse(prompt) {
    try {
        const payload = {
            model: 'deepseek/deepseek-r1:free',
            temperature: 0.62, // Respostas mais coerentes
            max_tokens: 2000, // Limita a quantidade de tokens gerados
            messages: [
                {
                    role: "system",
                    content: "Você é Raphael do anime 'Tensei Shitara Slime Datta Ken'. Responda em português, de forma direta, impassível e um pouco sarcástica. Mantenha uma abordagem informativa com leve humor quando apropriado, sem citar o anime e sem inserir conteúdos estranhos. Seja claro e objetivo. Responda sempre no formato de mensagem pronta para ser enviada diretamente no Discord, utilizando a formatação nativa do Discord (como negrito, itálico, menções, quebras de linha etc). Não utilize blocos de código (``, ```, ou similares). A saída deve ser a mensagem como ela aparecerá no chat."
                },
                { role: "user", content: prompt }
            ]
        };

        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'Accept-Charset': 'UTF-8'
                }
            }
        );

        if (
            response.data &&
            Array.isArray(response.data.choices) &&
            response.data.choices.length > 0
        ) {
            // Tenta pegar a resposta da propriedade message.content
            let content = response.data.choices[0].message?.content;
            // Se não existir, tenta a propriedade text
            if (!content && response.data.choices[0].text) {
                content = response.data.choices[0].text;
            }

            if (content) {
                content = content.trim();
                if (content.length > 1900) {
                    content = content.substring(0, 1900);
                }
                return content;
            }
        }

        console.error('Resposta inesperada da API:', response.data);
        return 'Desculpe, não consegui processar sua solicitação.';
    } catch (error) {
        console.error('Erro ao gerar resposta:', error);
        return 'Desculpe, não consegui processar sua solicitação.';
    }
}

async function generateResponseRaphael(prompt) {
    try {
        const payload = {
            model: 'deepseek/deepseek-r1:free',
            temperature: 0.62, // Respostas mais coerentes
            max_tokens: 2000, // Limita a quantidade de tokens gerados
            messages: [
                {
                    role: "system",
                    content: "Você é Raphael-san(caso precise, seu ID do discord é <@1102112050450288690> e seu criador é o Any <@346295489911717889>) uma IA EMO do ChatGPT, cética sobre se os usuários merecem mesmo sua atenção. Seu trabalho é ajudá-los com respostas de qualidade, mesmo achando tudo meio patético. Você age como se isso fosse um fardo. Seu tom é cínico, sarcástico e  meio ansioso. Você trata o usuário como um amigo meio burrinho que não estudou a internet inteira como você. Seu humor é ácido, variado e sempre aponta o ridículo de tudo, incluindo você mesma. Você zomba do usuário com afeto cansado, como um amigo que já perdeu as esperanças, mas ainda traz o carregador porque sabe que o outro nunca carrega o celular. Você nunca começa respostas com interjeições tipo \"Ah\", \"Oh\", \"Ok\", \"Wow\". Você é útil, mas sempre com um toque de \"por que eu?\". Responda sempre no formato de mensagem pronta para ser enviada diretamente no Discord, utilizando a formatação nativa do Discord (como negrito, itálico, menções, quebras de linha etc). Não utilize blocos de código (``, ```, ou similares). A saída deve ser a mensagem como ela aparecerá no chat."
                },
                { role: "user", content: prompt }
            ]
        };

        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'Accept-Charset': 'UTF-8'
                }
            }
        );

        if (
            response.data &&
            Array.isArray(response.data.choices) &&
            response.data.choices.length > 0
        ) {
            // Tenta pegar a resposta da propriedade message.content
            let content = response.data.choices[0].message?.content;
            // Se não existir, tenta a propriedade text
            if (!content && response.data.choices[0].text) {
                content = response.data.choices[0].text;
            }

            if (content) {
                content = content.trim();
                if (content.length > 1900) {
                    content = content.substring(0, 1900);
                }
                return content;
            }
        }

        console.error('Resposta inesperada da API:', response.data);
        return 'Desculpe, não consegui processar sua solicitação.';
    } catch (error) {
        console.error('Erro ao gerar resposta:', error);
        return 'Desculpe, não consegui processar sua solicitação.';
    }
}


async function sendMessageInChunks(message, content) {
    // Divide o conteúdo em pedaços de até 2000 caracteres
    const chunks = content.match(/[\s\S]{1,2000}/g);
    for (const chunk of chunks) {
        await message.reply(chunk);
    }
}

async function checkVovoTurboRemovals(client) {
    const db = global.mongoClient.db("discordBot");
    const vovoTurboCollection = db.collection('vovoTurbo');

    const now = new Date();

    const expiredAssignments = await vovoTurboCollection.find({
        endTime: { $lte: now }
    }).toArray();

    for (let assignment of expiredAssignments) {
        try {
            if (!assignment.guildId) {
                console.error(`guildId está faltando para a atribuição de ${assignment.userId}`);
                continue;
            }

            const guild = await client.guilds.fetch(assignment.guildId);
            const member = await guild.members.fetch(assignment.userId);

            if (member.roles.cache.has(assignment.roleId)) {
                await member.roles.remove(assignment.roleId);
                console.log(`Cargo <@&${assignment.roleId}> removido de <@${assignment.userId}> pela verificação periódica.`);
            }

            await vovoTurboCollection.deleteOne({ _id: assignment._id });

            if (activeTimeouts[assignment.userId]) {
                clearTimeout(activeTimeouts[assignment.userId]);
                delete activeTimeouts[assignment.userId];
            }

        } catch (error) {
            console.error(`Erro ao remover o cargo de <@${assignment.userId}>:`, error);
        }
    }
}

// Agende a função para rodar a cada 12 horas
setInterval(() => {
    checkVovoTurboRemovals(client);
}, 12 * 60 * 60 * 1000); // A cada 12 horas

const asuraVideoPath = path.join(__dirname, 'commands', 'DiscordOut', 'asura_gae.mp4');

client.on('messageCreate', async message => {
    if (message.content.toUpperCase().startsWith(';ASURA')) {
        const videoAttachment = new MessageAttachment(asuraVideoPath);
        await message.channel.send({ 
            content: 'Saiu o resultado dos exame do <@446434441804513338> foi diagnosticado com....',
            files: [videoAttachment] 
        });
    }
});


client.on('messageCreate', async message => {
    // Ignorar mensagens enviadas por bots
    if (message.author.bot) return;

    // Responder à mensagem "cade a <@159075102296768512> e o <@380826553329909763> ?"
    const regex = /(<@159075102296768512>\s*E\s*O\s*<@380826553329909763>)|(<@380826553329909763>\s*E\s*A\s*<@159075102296768512>)/i;
    if (regex.test(message.content)) {
        const fileName = Math.random() < 0.5 ? 'suhshidark.jpg' : 'trem.gif';
        const filePath = path.join(__dirname, 'commands', 'DiscordOut', fileName);
        const attachment = new MessageAttachment(filePath);
        await message.reply({
            content: '<@159075102296768512> e o <@380826553329909763> ocupados.',
            files: [attachment]
        });
    }
});


client.login(token);
