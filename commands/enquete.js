const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'enquete',
    description: 'Cria uma enquete com uma pergunta e várias opções usando emojis.',
    options: [
        {
            name: 'pergunta',
            description: 'Pergunta para a enquete.',
            type: 3,
            required: true
        },
        {
            name: 'opcoes',
            description: 'Opções para a enquete separadas por vírgula (máx. 9).',
            type: 3,
            required: true
        },
        {
            name: 'tempo',
            description: 'Tempo para a enquete em minutos.',
            type: 4, // Tipo inteiro
            required: true
        }
    ],
    async execute(interaction, client) {
        const pergunta = interaction.options.getString('pergunta');
        const opcoesArray = interaction.options.getString('opcoes').split(',').slice(0, 9); // Limita a 9 opções
        const tempo = interaction.options.getInteger('tempo');
        let tempoTexto;
        
        // Verifica se o tempo é maior que 60 minutos para exibir em horas
        if (tempo > 60) {
            const horas = Math.floor(tempo / 60);
            const minutos = tempo % 60;
            tempoTexto = `${horas} hora(s)` + (minutos > 0 ? ` e ${minutos} minuto(s)` : '');
        } else {
            tempoTexto = `${tempo} minuto(s)`;
        }
        
        // Criação do Embed com a pergunta e opções
        const embed = new MessageEmbed()
            .setTitle('Question')
            .setDescription(pergunta)
            .setColor('BLUE') // Escolha a cor que preferir
            .setFooter(`Autor: ${interaction.user.tag} | Tempo: ${tempoTexto}`);
        

        // Adicionando as opções ao Embed
        const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
        opcoesArray.forEach((opcao, index) => {
            if (index < emojis.length) {
                embed.addField(`${emojis[index]} ${opcao}`, '\n', false);
            }
        });

        // Enviando a mensagem de enquete
        const mensagemEnquete = await interaction.reply({ embeds: [embed], fetchReply: true });

        // Reagindo com os emojis
        for (let i = 0; i < opcoesArray.length; i++) {
            await mensagemEnquete.react(emojis[i]);
        }

        // Conectar ao MongoDB
        const db = global.mongoClient.db("discordBot");
        const enquetesCollection = db.collection("enquetes");
        
        // Criar um ID único para a enquete
        const enqueteId = `${interaction.guild.id}_${interaction.channel.id}_${Date.now()}`;
        
        // Dados da enquete
        const enqueteData = {
            _id: enqueteId,
            pergunta: pergunta,
            opcoes: opcoesArray,
            votos: new Array(opcoesArray.length).fill(0),
            votantes: [],
            channelId: interaction.channel.id,
            guildId: interaction.guild.id,
            messageId: mensagemEnquete.id,
            tempo: tempo,
            startTime: new Date(),
            endTime: new Date(Date.now() + tempo * 60000),
            active: true
        };

        // Salvar os dados da enquete no MongoDB
        await enquetesCollection.insertOne(enqueteData);

        // Coletor de reações para a enquete
        const filter = (reaction, user) => {
            return emojis.includes(reaction.emoji.name) && !user.bot;
        };

        const collector = mensagemEnquete.createReactionCollector({ filter, time: tempo * 60000 });

        collector.on('collect', async (reaction, user) => {
            // Ignorar se o usuário for um bot
            if (user.bot) return;
        
            // Verificar qual opção foi votada com base no emoji
            const voteIndex = emojis.indexOf(reaction.emoji.name);
        
            // Se o emoji não for relevante para a votação, ignorar
            if (voteIndex === -1) return;
        
            // Buscar dados atuais da enquete no MongoDB
            const currentEnquete = await enquetesCollection.findOne({ _id: enqueteId });
            if (!currentEnquete || !currentEnquete.active) return;
            
            // Verificar se o usuário já votou
            if (currentEnquete.votantes.includes(user.id)) {
                // O usuário já votou, remover a reação para indicar que não pode votar novamente
                reaction.users.remove(user.id);
                return;
            }
        
            // Atualizar no MongoDB: adicionar votante e incrementar voto
            await enquetesCollection.updateOne(
                { _id: enqueteId },
                { 
                    $push: { votantes: user.id },
                    $inc: { [`votos.${voteIndex}`]: 1 }
                }
            );
            
        
            // Feedback opcional para o usuário
            user.send(`Obrigado por votar em: ${opcoesArray[voteIndex]}`).catch(error => {
                console.error(`Não foi possível enviar DM para ${user.tag}: ${error}`);
                // Envie uma mensagem no canal da enquete informando sobre o erro
                // Nota: Você precisará ter acesso ao objeto `interaction` ou `channel` para enviar uma mensagem no canal
                const channel = reaction.message.channel; // Obtem o canal onde a reação foi coletada
                channel.send(`Olá, ${user.toString()}, parece que suas configurações de privacidade não permitem receber mensagens diretas. Obrigado por votar na enquete!`).catch(console.error);
            });
            
        });
        
        collector.on('end', async _collected => {
            // Buscar dados finais da enquete no MongoDB
            const finalEnquete = await enquetesCollection.findOne({ _id: enqueteId });
            if (!finalEnquete) return;
            
            // Marcar enquete como inativa
            await enquetesCollection.updateOne(
                { _id: enqueteId },
                { $set: { active: false } }
            );
            
            // Calcular o total de votos
            const totalVotos = finalEnquete.votantes.length;
            
            // Criar um novo Embed para os resultados
            const embedResultados = new MessageEmbed()
                .setTitle(`Resultados da Enquete: ${finalEnquete.pergunta}`)
                .setColor('GREEN')
                .setDescription('A votação acabou. Aqui estão os resultados:')
                .setFooter('Enquete encerrada');
        
            // Adicionar cada opção e o número de votos ao Embed
            finalEnquete.opcoes.forEach((opcao, index) => {
                const votos = finalEnquete.votos[index];
                const porcentagem = totalVotos > 0 ? (votos / totalVotos * 100).toFixed(2) : 0;
                embedResultados.addField(`${emojis[index]} ${opcao}`, `Votos: ${votos} (${porcentagem}%)`, false);
            });
        
            // Enviar o Embed com os resultados no canal da enquete
            const channel = client.channels.cache.get(finalEnquete.channelId);
            if (channel) {
                channel.send({ embeds: [embedResultados] }).catch(console.error);
            }
        
        });
        
    }
}
