const { Client, MessageEmbed ,Intents } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildIds, token } = require('./config.json');
const { DateTime } = require('luxon');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const enquetePath = path.join(__dirname, 'commands', 'data');
const { connectMongo } = require('./mongodbClient.js');
const moment = require('moment-timezone');
const Evento = require('./models/Evento');
const mongoose = require('mongoose');

// Chama a função para conectar ao MongoDB
connectMongo().then((mongoClient) => {
    if (mongoClient) {
        console.log("Conectado ao MongoDB com sucesso.");
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
    } else {
        console.error("Falha ao conectar ao MongoDB.");
    }
}).catch(err => {
    console.error('Erro ao conectar ao MongoDB:', err);
});

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
    // Verifica se o usuário específico está envolvido na atualização de estado
    if (newState.member.id === specificUserId || oldState.member.id === specificUserId) {
        const channel = newState.guild.channels.cache.get(specificTextChannelId);
        if (!channel) return;

        // Hora atual formatada
        const now = DateTime.now().setZone('America/Sao_Paulo').toFormat('HH:mm:ss');

        // Verifica se o usuário entrou em um canal de voz
        if (!oldState.channel && newState.channel) {
            channel.send(`Registrando ponto de entrada da <@${specificUserId}> às ${now}.`);
            channel.send('https://media1.tenor.com/m/cwOI3DtZRzgAAAAC/anya-forger-taking-notes.gif');
        }
        // Verifica se o usuário saiu de um canal de voz
        else if (oldState.channel && !newState.channel) {
            channel.send(`Registrando ponto de saída da <@${specificUserId}> às ${now}.`);
            channel.send('https://media1.tenor.com/m/lFCX6zJnNNMAAAAC/frieren-anime.gif');
        }
    }
});

// Substitua pelos seus valores
const twitchClientID = 'ncl4z9vl557x0bg0xzw3b27fj77hfk';
const twitchClientSecret = '9h73oqhvie27ye2zi2y9n96dg0tru6';
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
const phID = '560444018622857247';
// ID do servidor (guild)
const guildId = '1167636254930772129';
const apelidos = [
    'Pê sem H - Três e Mei',
    'P 3.5',
    'h 3.5',
    'phThree and a half'
    // Adicione mais apelidos aqui, se necessário
];

/*client.on('ready', () => {
    console.log(`Logado como ${client.user.tag}!`);

    setInterval(async () => {
        try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return console.log('Servidor não encontrado.');

            const member = guild.members.cache.get(phID);
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

function verificarEnquetes(client) {
    fs.readdir(enquetePath, (err, files) => {
        if (err) {
            console.error("Erro ao ler diretório de enquetes:", err);
            return;
        }

        files.forEach(async file => {
            const filePath = path.join(enquetePath, file);
            const enqueteData = JSON.parse(fs.readFileSync(filePath));

            if (Date.now() > enqueteData.endTime) {
                // Calcular o total de votos
                const totalVotos = enqueteData.votantes.length;
                const embedResultados = new MessageEmbed()
                    .setTitle(`Resultados da Enquete: ${enqueteData.pergunta}`)
                    .setColor('GREEN')
                    .setDescription('A votação acabou. Aqui estão os resultados:')
                    .setFooter('Enquete encerrada');

                // Adicionar os resultados ao Embed
                enqueteData.opcoes.forEach((opcao, index) => {
                    const votos = enqueteData.votos[index];
                    const porcentagem = totalVotos > 0 ? (votos / totalVotos * 100).toFixed(2) : 0;
                    embedResultados.addField(`${opcao}`, `Votos: ${votos} (${porcentagem}%)`, false);
                });

                try {
                    // Enviar os resultados no canal da enquete
                    const channel = await client.channels.fetch(enqueteData.channelId);
                    await channel.send({ embeds: [embedResultados] });
                
                    // Excluir o arquivo JSON após enviar os resultados
                    fs.unlink(filePath, (err) => {
                        if (err) throw err;
                        console.log(`${filePath} foi excluído`);
                    });
                } catch (error) {
                    console.error("Erro ao enviar resultados da enquete ou ao excluir o arquivo JSON:", error);
                }
            }
        });
    });
}

client.on('messageCreate', async message => {
    if (message.content === ';juju') {
        const specificUserId = '491459349957312512';
        const porvalopeCommand = client.commands.get('porvalope');
        if (porvalopeCommand) {
            const simulatedInteraction = {
                reply: message.reply.bind(message),
                followUp: message.channel.send.bind(message.channel),
                channel: message.channel
            };
            await porvalopeCommand.execute(simulatedInteraction, client, specificUserId, message.guild, message.author);
        } else {
            message.reply('O comando porvalope não foi encontrado.');
        }
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (/\b(GAY|YAG|GAE|GUEI|GAI|HOMOSEXUAL)\b/i.test(message.content.toUpperCase())) {
        // Lista de mensagens possíveis
        const messages = [
            'tão falando de vc <@446434441804513338>',
            'tão falando de vc <@393581900155060224>'
        ];

        // Escolher uma mensagem aleatória da lista
        const msg = messages[Math.floor(Math.random() * messages.length)];
        
        await message.reply(msg);
    } else if (/\b(BAITOLA|CHORÃO|CHORAO|SÓ FALA BOSTA|MACONHEIRO|NOIA|PROPLAYER DE ANIME)\b/i.test(message.content.toUpperCase())) {
        const msg = 'tão falando de vc <@393581900155060224>';
        await message.reply(msg);
    }else if (/\b(ESPECIALISTA)\b/i.test(message.content.toUpperCase())) {
        const msg = 'se for de anime e transa, é o <@393581900155060224>';
        await message.reply(msg);
    } else if (/\b(WHALE|BEBADO|TARTARUGA SLAYER)\b/i.test(message.content.toUpperCase())) {
        const msg = 'tão falando de vc <@491459349957312512>';
        await message.reply(msg);
    } else if (/\b(PESADELO)\b/i.test(message.content.toUpperCase())) {
        const msg = '[A NÃO É O](https://media1.tenor.com/m/63kQYZ0mgWAAAAAC/nightmare-nightmare-sans.gif) <@128346888863875072>';
        await message.reply(msg);
    } else if (/\b(METADE|METADINHA)\b/i.test(message.content.toUpperCase())) {
        const msg = 'tão falando de vc <@560444018622857247>';
        await message.reply(msg);
    } else if (/\b(NECROFILO|LOLICON|INCESTO)\b/i.test(message.content.toUpperCase())) {
        const msg = 'tão falando de vc <@380826553329909763>';
        await message.reply(msg);
    } else if (/\b(BEBADA)\b/i.test(message.content.toUpperCase())) {
        const msg = 'tão falando de vc <@159075102296768512>';
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
            '<@539596207849340948>'
        ];
    
        const gifs = [
            'https://media1.tenor.com/m/fHraspOHAYwAAAAC/mushoku-tensei-anime.gif',
            'https://imgur.com/d3HDZ2b.gif'
        ];
    
        // Escolher um usuário e um GIF aleatoriamente
        const user = users[Math.floor(Math.random() * users.length)];
        const gif = gifs[Math.floor(Math.random() * gifs.length)];
    
        // Criar a mensagem formatada
        const msg = `[Tão falando de você](${gif}) ${user}`;
    
        await message.reply(msg);
    }  else if (/\b(CALVO)\b/i.test(message.content.toUpperCase())) {
        const userIds = [
            '560444018622857247',
            '225331823742418944',
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
            '305133277755211777'
        ];
        const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
        const msg = `tão falando de vc <@${randomUserId}>`;
        await message.reply(msg);
    }
});

client.on('messageCreate', async message => {
    if (message.content.startsWith(';porvalope')) {
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
                '560444018622857247', '225331823742418944', '246684210960531458', 
                '539596207849340948', '446434441804513338', '128346888863875072', 
                '518669408554713108', '380826553329909763', '159075102296768512',
                '393581900155060224', '302252030922326017', '491459349957312512',
                '346295489911717889', '305133277755211777'
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

// Defina a verificação para ocorrer a cada X minutos
setInterval(() => verificarEnquetes(client), 1 * 60000); // Ajuste o intervalo conforme necessário

client.login(token);
