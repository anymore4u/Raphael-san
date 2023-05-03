const jikanjs  = require('jikanjs');
const { Interaction } = require('discord.js');

module.exports = {
  name: 'animeinfo',
  description: 'Mostra informações de um anime',
  options: [
    {
      name: 'nome',
      description: 'Nome do anime que deseja buscar',
      type: 3,
      required: true,
    },
  ],

  async execute(interaction) {
    await interaction.reply("Comando está em desenvolvimento");
    const gifUrl = 'https://media.tenor.com/eAqD-5MDzFAAAAAC/mai-sakurajima-sakurajima-mai.gif';
    await interaction.followUp(gifUrl);
}

  /*
  async execute(interaction) {
    const query = interaction.options.getString('nome');

        try {
            const animeSearchResult = await jikanjs.search('anime', query);
            const animeId = animeSearchResult.results[0].mal_id;
            const animeInfo = await jikanjs.loadAnime(animeId);

            const embed = {
                title: animeInfo.title,
                url: animeInfo.url,
                thumbnail: {
                    url: animeInfo.image_url,
                },
                fields: [
                    {
                        name: 'Sinopse',
                        value: animeInfo.synopsis,
                    },
                    {
                        name: 'Tipo',
                        value: animeInfo.type,
                        inline: true,
                    },
                    {
                        name: 'Episódios',
                        value: animeInfo.episodes,
                        inline: true,
                    },
                    {
                        name: 'Média de notas',
                        value: animeInfo.score,
                        inline: true,

          },
        ],
      };

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply('Ocorreu um erro ao buscar o anime.');
    }
  },*/
};
