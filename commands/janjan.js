const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs'); // Importando fs para leitura de diretórios
const { MessageAttachment } = require('discord.js');

module.exports = {
    name: 'janjan',
    description: 'Menciona o usuário e envia uma mensagem e um gif.',
    async execute(interaction) {
        const dirPath = path.join(__dirname, 'DiscordOut/janjan'); // Caminho para a pasta
        fs.readdir(dirPath, (err, files) => {
            if (err) {
                return interaction.reply('Erro ao acessar a pasta de imagens.');
            }

            if (files.length === 0) {
                return interaction.reply('Não há imagens na pasta.');
            }

            // Seleciona um arquivo aleatório
            const chosenFile = files[Math.floor(Math.random() * files.length)];
            const filePath = path.join(dirPath, chosenFile);
            const imageAttachment = new MessageAttachment(filePath);

            interaction.reply({ files: [imageAttachment], content: 'FIU FIU <@246684210960531458>' });
        });
    }
}
