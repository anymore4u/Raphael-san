const { DateTime } = require('luxon');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'ultimamsg',
    description: 'Encontra a última mensagem de um usuário em um canal.',
    userPermissions: ['ADMINISTRATOR', 'MANAGE_MESSAGES'],
        options: [
          {
            name: 'membro',
            description: 'ID do usuário cuja última mensagem você deseja encontrar.',
            type: 6,
            required: true
          }],
          async execute(interaction) {
              const user_id = interaction.options.get('membro').value;
              const canal = interaction.channel;
              const data_hora_utc = new Date();
              const data_hora_local = DateTime.fromJSDate(data_hora_utc).setZone('America/Sao_Paulo');

              const limit = 100;

              let lastMessage = null;
              await canal.messages.fetch({ limit }).then(messages => {
                  lastMessage = messages.find(message => message.author.id === user_id);
              });

              if (lastMessage) {
                  const link = `https://discord.com/channels/${lastMessage.guild.id}/${lastMessage.channel.id}/${lastMessage.id}`;
                  const conteudo = lastMessage.content;
                  const data_hora_mensagem = DateTime.fromJSDate(lastMessage.createdAt).setZone('America/Sao_Paulo');
                  const embed = new MessageEmbed()
                      .setTitle(`Última mensagem de <@${user_id}>`)
                      .setDescription(conteudo)
                      .setColor('BLUE')
                      .addField('Link da mensagem', link)
                      .addField('Data e hora da mensagem (horário de Brasília)', data_hora_mensagem.toFormat('dd/MM/yyyy HH:mm:ss'));

                  await interaction.reply({ embeds: [embed] });
              } else {
                  await interaction.reply(`Não foi possível encontrar nenhuma mensagem recente de <@${user_id}> neste canal.`);
              }
          }  
}

