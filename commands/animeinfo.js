const axios = require('axios');


async function isValidUrl(url) {
  try {
    const response = await axios.head(url);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

module.exports = {
  name: 'animeinfo',
  description: 'Mostra informações de um anime',
  options: [
    {
      name: 'nome',
      type: 3,
      description: 'Nome do anime',
      required: true,
    },
  ],
  async execute(interaction) {
    const query = interaction.options.getString('nome');

    try {

      const response = await axios.get(`https://api.jikan.moe/v4/anime?q=${query}&limit=10`);
      const results = response.data.data;

      const exactMatch = results.find(
        (anime) =>
          anime.title.toLowerCase() === query.toLowerCase() ||
          (anime.title_english && anime.title_english.toLowerCase() === query.toLowerCase())
      );

      const partialMatch = results.find(
        (anime) =>
          anime.title.toLowerCase().includes(query.toLowerCase()) ||
          (anime.title_english && anime.title_english.toLowerCase().includes(query.toLowerCase()))
      );

      const anime = exactMatch || partialMatch;

      if (!anime) {
        return interaction.reply('Anime não encontrado. Tente novamente com outro nome.');
      }

      const animeId = anime.mal_id;
      const detailsResponse = await axios.get(`https://api.jikan.moe/v4/anime/${animeId}`);
      const animeDetails = detailsResponse.data.data;

      const malUrl = `https://myanimelist.net/anime/${anime.mal_id}`;
      const description = anime.synopsis
      ? anime.synopsis.replace('[Written by MAL Rewrite]', `[Continue lendo no MyAnimeList](${malUrl})`)
      : 'N/A';
      const studio = animeDetails.studios && animeDetails.studios.length > 0
        ? animeDetails.studios[0].name
        : 'N/A';
      
      const infoEmbed = {
        color: 0x0099ff,
        title: anime.title,
        url: malUrl,
        description: description,
        thumbnail: {
          url: anime.images.webp.image_url,
        },
        fields: [
          {
            name: 'Episódios',
            value: anime.episodes ? anime.episodes.toString() : 'N/A',
            inline: true,
          },
          {
            name: 'Score',
            value: anime.score ? anime.score.toString() : 'N/A',
            inline: true,
          },
          {
            name: 'Tipo',
            value: anime.type ? anime.type.toString() : 'N/A',
            inline: true,
          },
          {
            name: 'Rank',
            value: anime.rank ? anime.rank.toString() : 'N/A',
            inline: true,
          },
          {
            name: 'Status',
            value: anime.status ? anime.status.toString() : 'N/A',
            inline: true,
          },
          {
            name: 'Studio',
            value: studio,
            inline: true,
          },
        ],
        timestamp: new Date(),
      };

      interaction.reply({ embeds: [infoEmbed] });
    } catch (error) {
      console.error('Erro ao buscar informações do anime:', error);
      interaction.reply('Ocorreu um erro ao buscar informações do anime. Tente novamente mais tarde.');
    }
  },
};
