const ytdl = require('ytdl-core');
const { createAudioResource, createAudioPlayer } = require('@discordjs/voice');
const SpotifyWebApi = require('spotify-web-api-node');
const search = require('youtube-search');

module.exports = {
    name: 'tocar',
    description: 'Toca uma música ou playlist do Spotify',
    options: [{
        name: 'link',
        description: 'Link da playlist ou música do Spotify',
        type: 3,
        required: true
    }],
    async execute(interaction) {
        const link = interaction.options.getString('link');

        if (!link.startsWith('https://open.spotify.com/')) {
            return interaction.reply({ content: 'Por favor, insira um link válido do Spotify.', ephemeral: true });
        }

        const trackDetails = await getSpotifyTrack(link);
        if (!trackDetails) {
            return interaction.reply({ content: 'Não foi possível obter detalhes da faixa do Spotify.', ephemeral: true });
        }

        const youtubeLink = await findYoutubeLink(trackDetails.title, trackDetails.artist);
        if (!youtubeLink) {
            return interaction.reply({ content: 'Não foi possível encontrar um link alternativo para a música.', ephemeral: true });
        }

        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return interaction.reply('Você precisa estar em um canal de voz para tocar música!');
        }

        await playMusic(voiceChannel, youtubeLink, interaction);
    }
};

async function playMusic(voiceChannel, youtubeLink, interaction) {
    const stream = ytdl(youtubeLink, { filter: 'audioonly' });
    const resource = createAudioResource(stream);
    const player = createAudioPlayer();

    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    connection.subscribe(player);
    player.play(resource);
    await interaction.reply(`Tocando música encontrada para a sua solicitação do Spotify.`);
}

const opts = {
  maxResults: 1,
  key: 'AIzaSyBufz2lnKKB3LNUci2mkF8xMCp00dBE9uY',
  type: 'video'
};

async function findYoutubeLink(title, artist) {
  const query = `${title} ${artist}`;
  
  try {
    const results = await search(query, opts);
    if (results.results.length > 0) {
      return results.results[0].link;
    } else {
      return null; // Nenhum resultado encontrado
    }
  } catch (error) {
    console.error('Erro na busca do YouTube:', error);
    return null;
  }
}


// Configuração do Spotify API
const spotifyApi = new SpotifyWebApi({
    clientId: 'b73a8df863604523b19b40f081b69383',
    clientSecret: 'e07b744d633f41d7b1a0243bdecfacc5'
});

// Obter um access token para autenticação
// Este passo é necessário para autenticar suas requisições à API do Spotify
async function authenticateSpotify() {
    try {
        const response = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(response.body['access_token']);
    } catch (error) {
        console.error('Erro ao autenticar no Spotify:', error);
    }
}

// Função para extrair o ID da faixa a partir do link
function extractSpotifyId(link) {
    const parts = link.split('/');
    const lastPart = parts.pop() || parts.pop();  // Trata um possível '/' no final
    return lastPart.split('?')[0];
}

// Função para obter detalhes da faixa
async function getSpotifyTrack(link) {
    const trackId = extractSpotifyId(link);

    try {
        await authenticateSpotify(); // Certifica-se de que o API está autenticada
        const data = await spotifyApi.getTrack(trackId);
        return {
            title: data.body.name,
            artist: data.body.artists.map(artist => artist.name).join(', '),
            album: data.body.album.name,
            // Você pode extrair mais informações conforme necessário
        };
    } catch (err) {
        console.error('Erro ao obter detalhes da faixa:', err);
        return null;
    }
}