const fetch = require('node-fetch');

module.exports = {
    name: 'favonius',
    description: 'Escolhe um personagem aleatório e envia uma mensagem com gif.',
    async execute(interaction) {
        // Lista de personagens
        const characterList = [
            "Amber", "Barbara", "Beidou", "Bennett", "Chongyun", "Diluc", "Fischl", "Jean", "Kaeya", "Keqing",
            "Lisa", "Mona", "Ningguang", "Noelle", "Qiqi", "Razor", "Sucrose", "Lumine", "Aether",
            "Venti", "Xiangling", "Xingqiu", "Klee", "Diona", "Tartaglia (Childe)", "Xinyan", "Zhongli", "Albedo",
            "Ganyu", "Xiao", "Hu Tao", "Rosaria", "Yanfei", "Eula", "Kaedehara Kazuha", "Kamisato Ayaka", "Sayu",
            "Yoimiya", "Aloy", "Kujou Sara", "Shogun Raiden", "Sangonomiya Kokomi", "Thoma", "Arataki Itto", "Gorou",
            "Shenhe", "Yun Jin", "Yae Miko", "Kamisato Ayato", "Yelan", "Kuki Shinobu", "Shikanoin Heizou", "Tighnari",
            "Collei", "Dori", "Cyno", "Nilou", "Candace", "Nahida", "Layla", "Andarilho (Scaramouche)", "Faruzan",
            "Alhaitham", "Yaoyao", "Dehya", "Mika", "Baizhu", "Kaveh", "Kirara", "Lyney", "Lynette", "Freminet",
            "Neuvillette", "Wriothesley", "Furina", "Charlotte", "Navia", "Chevreuse", "Xianyun", "Jogos", "Chiori",
            "Arlecchino", "Sethos", "Clorinde", "Sigewinne", "Emilie", "Mualani", "Kachina", "Kinich", "Xilonen",
            "Chasca", "Ororon"
        ];

        // Seleciona um personagem aleatório
        const randomCharacter = characterList[Math.floor(Math.random() * characterList.length)];
        // Gera um número aleatório entre 1 e 100
        const randomNumber = Math.floor(Math.random() * 100) + 1;

        // Configuração da API Tenor
        const apiKey = 'AIzaSyBufz2lnKKB3LNUci2mkF8xMCp00dBE9uY'; // Substitua pela sua chave de API válida
        const gifSearchTerm = `${randomCharacter} Genshin Impact`;
        const gifURL = `https://tenor.googleapis.com/v2/search?q=genshin+${encodeURIComponent(gifSearchTerm)}&key=${apiKey}&client_key=my_test_app&limit=5`;

        try {
            // Consulta à API de GIFs
            const response = await fetch(gifURL);
            const json = await response.json();

            // Filtra e escolhe um GIF válido
            const validResults = json.results.filter(result => result.media_formats && result.media_formats.gif);
            const gif = validResults.length > 0
                ? validResults[Math.floor(Math.random() * validResults.length)].media_formats.gif.url
                : null;

            // Mensagem de resposta
            const message = `O <@246684210960531458> colocou uma Favonius em [**${randomCharacter}**](${gif}) e conseguiu ultar **${randomNumber}** vezes no abismo.`;

            if (gif) {
                // Responde ao comando com a mensagem e o GIF
                await interaction.reply({ content: `${message}`, ephemeral: false });
            } else {
                // Caso nenhum GIF seja encontrado
                await interaction.reply({ content: `${message}\nDesculpe, não consegui encontrar um GIF para **${randomCharacter}**.`, ephemeral: false });
            }
        } catch (error) {
            console.error('Erro ao buscar GIF:', error);
            await interaction.reply({ content: `${message}\nOcorreu um erro ao buscar o GIF.`, ephemeral: false });
        }
    },
};