const { MessageActionRow, MessageButton, MessageEmbed, MessageAttachment } = require('discord.js');
const path = require('path');

function formatDate(date) {
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

module.exports = {
    name: 'agenda',
    description: 'Gerencia eventos da agenda',
    options: [
        {
            name: 'subcommand',
            type: 3, // Tipo String para subcomando
            description: 'O subcomando a ser executado (criar, listar, remover, inscrever)',
            required: true,
            choices: [
                { name: 'criar', value: 'criar' },
                { name: 'listar', value: 'listar' },
                { name: 'remover', value: 'remover' },
                { name: 'inscrever', value: 'inscrever' }
            ]
        },
        {
            name: 'descricao',
            type: 3, // String
            description: 'Descrição do evento',
            required: false
        },
        {
            name: 'data',
            type: 3, // String
            description: 'Data do evento (DD/MM/AAAA)',
            required: false
        },
        {
            name: 'hora',
            type: 3, // String
            description: 'Hora do evento (HH:MM)',
            required: false
        },
        {
            name: 'id',
            type: 3, // String
            description: 'ID do evento para remover ou inscrever',
            required: false
        },
        {
            name: 'lembrete_minutos',
            type: 4, // Integer
            description: 'Minutos antes do evento para receber o lembrete',
            required: false
        }
    ],
    async execute(interaction) {
        const subcommand = interaction.options.get('subcommand').value;

        switch (subcommand) {
            case 'criar':
                // Código para capturar as informações do evento
                const descricao = interaction.options.get('descricao').value;
                const data = interaction.options.get('data').value;
                const hora = interaction.options.get('hora').value;
                const [day, month, year] = data.split('/');
                const formattedDate = `${year}-${month}-${day}T${hora}:00`;
                const dataHora = new Date(formattedDate);

                if (isNaN(dataHora.getTime())) {
                    await interaction.reply('A data e/ou hora fornecida é inválida. Por favor, use o formato DD/MM/AAAA para a data e HH:MM para a hora.');
                    return;
                }

                const db = mongoClient.db("my_database");
                const eventosCollection = db.collection("eventos");

                try {
                    const result = await eventosCollection.insertOne({
                        descricao,
                        dataHora,
                        criadorId: interaction.user.id,
                        inscritos: []
                    });

                    const eventId = result.insertedId.toString();

                    const embed = new MessageEmbed()
                        .setColor('#0099ff') // Cor azul, ajustável conforme a paleta do seu servidor
                        .setTitle('Evento Criado')
                        .setDescription(`**${descricao}**`)
                        .addField('Data', formatDate(dataHora), true)
                        .addField('Hora', dataHora.toLocaleTimeString('pt-BR', { timeStyle: 'short' }), true)
                        .setThumbnail('https://imgur.com/L1aoKFZ.gif') // Opcional, adicione uma imagem relevante se desejar
                        .setTimestamp()
                        .setFooter({ text: 'Clique no botão abaixo para se inscrever.' });                

                    const row = new MessageActionRow()
                        .addComponents(
                            new MessageButton()
                                .setCustomId(`inscrever_${eventId}`)
                                .setLabel('Inscrever-se')
                                .setStyle('PRIMARY')
                        );

                    await interaction.reply({ embeds: [embed], components: [row] });
                } catch (error) {
                    console.error('Erro ao salvar o evento:', error);
                    await interaction.reply('Ocorreu um erro ao salvar o evento. Por favor, tente novamente.');
                }
                break;
            case 'listar':
                const eventos = await Evento.find({});
                let resposta = eventos.map(e => `${e.descricao} - ${e.dataHora.toLocaleString()} (ID: ${e._id})`).join('\n');
                if (!resposta) resposta = "Não há eventos programados.";
                await interaction.reply(resposta);
                break;
            case 'remover':
                const idRemover = interaction.options.get('id').value;
                await Evento.findByIdAndDelete(idRemover);
                await interaction.reply(`Evento com ID ${idRemover} foi removido.`);
                break;
            case 'inscrever':
                const idInscrever = interaction.options.get('id').value;
                console.log(`Tentando inscrever no evento com ID: ${idInscrever}`);
                // Enviar uma resposta imediata
                await interaction.deferReply();
                try {
                    const evento = await Evento.findById(idInscrever);
                    if (!evento) {
                        console.log('Evento não encontrado.');
                        await interaction.editReply({ content: 'Evento não encontrado.' });
                        return;
                    }
                    console.log(`Evento encontrado: ${evento.descricao}`);
                    
                    evento.inscritos.push({ usuarioId: interaction.user.id, lembreteMinutos: interaction.options.get('lembrete_minutos')?.value || 15 });
                    await evento.save();
                    console.log(`Usuário inscrito no evento. Total de inscritos: ${evento.inscritos.length}`);
                    
                    await interaction.editReply(`Você se inscreveu no evento '${evento.descricao}' com um lembrete de 15 minutos antes.`);
                } catch (error) {
                    console.error('Erro ao inscrever no evento:', error);
                    await interaction.editReply({ content: 'Ocorreu um erro ao tentar se inscrever no evento.' });
                }
                break;                            
            default:
                await interaction.reply('Subcomando não reconhecido.');
                break;
        }
    }
};
