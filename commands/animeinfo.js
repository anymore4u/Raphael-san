const axios = require('axios');
const cheerio = require('cheerio');

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
    
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply();
    }
  
    try {
      const response = await axios.get(`https://api.jikan.moe/v4/anime?q=${query}&limit=10`);
      const results = response.data.data;
  
      const anime = await findValidResult(results, query);
  
      if (!anime) {
        return interaction.editReply('Anime não encontrado. Tente novamente com outro nome.');
      }
  
      const animeId = anime.mal_id;
      const detailsResponse = await axios.get(`https://api.jikan.moe/v4/anime/${animeId}`);
      const animeDetails = detailsResponse.data.data;

      const malUrl = `https://myanimelist.net/anime/${anime.mal_id}`;
      const description = anime.synopsis
      ? anime.synopsis.replace('[Written by MAL Rewrite]', `[Continue lendo no MyAnimeList](${malUrl})`)
      : 'N/A';
      const studio = animeDetails.studios && animeDetails.studios.length > 0
      ? `[${animeDetails.studios[0].name}](${animeDetails.studios[0].url})`
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

      interaction.editReply({ embeds: [infoEmbed] });
    } catch (error) {
      console.error('Erro ao buscar informações do anime:', error);
      interaction.editReply('Ocorreu um erro ao buscar informações do anime. Tente novamente mais tarde.');
    }
  },
};

async function findValidResult(results, query) {
  const exactMatches = [];
  const partialMatches = [];

  for (const result of results) {
    const malUrl = `https://myanimelist.net/anime/${result.mal_id}`;

    try {
      const urlResponse = await axios.get(malUrl);
      const $ = cheerio.load(urlResponse.data);
      const pageTitle = $('title').text();

      if (pageTitle !== '404 Not Found - MyAnimeList.net') {
        if (
          result.title.toLowerCase() === query.toLowerCase() ||
          (result.title_english && result.title_english.toLowerCase() === query.toLowerCase())
        ) {
          exactMatches.push(result);
        } else if (
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          (result.title_english && result.title_english.toLowerCase().includes(query.toLowerCase()))
        ) {
          partialMatches.push(result);
        }
      }
    } catch (error) {
      // Não faça nada aqui. A mensagem de erro será exibida apenas se não houver resultados válidos no final.
    }
  }

  const validResult = exactMatches[0] || partialMatches[0] || null;

  if (!validResult) {
    console.error(`Erro ao pesquisar "${query}": Nenhum resultado válido encontrado.`);
  }

  return validResult;
}





