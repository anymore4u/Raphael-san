const { MessageActionRow, MessageButton, MessageEmbed, MessageAttachment } = require('discord.js');
const path = require('path');

module.exports = {
    name: 'porvalope',
    description: 'Envia uma mensagem "vai tomano" com uma figurinha para um membro escolhido.',
    options: [
        {
            name: 'membro',
            description: 'Membro do qual deseja enviar a mensagem "vai tomano".',
            type: 6,
            required: true
        }
    ],
    async execute(interaction, client, userId, guild, user, useFollowUp = false) {
        let targetMember = userId ? await guild.members.fetch(userId) : interaction.options.getMember('membro');
        user = user || interaction.user; // Use o usuário da interação se disponível
    
        // Acessa a base de dados a partir do mongoClient global
        const db = global.mongoClient.db("my_database");
        const blacklistCollection = db.collection("blacklist"); // Ajuste para o nome da sua coleção
    
        // Verificar se o usuário está na blacklist
        const userIsBlocked = await blacklistCollection.findOne({ userId: user.id });
        if (userIsBlocked) {
            // Mudar o target para quem enviou o comando se o alvo estiver na blacklist
            targetMember = user;
        }
            
        //let targetMember = interaction.options.getMember('membro');
        if (!targetMember) {
          return interaction.reply({ content: 'Membro inválido.', ephemeral: true });
        }

        const messageContent = `Vai tomano ${targetMember}! <a:Porvalope:1143972898873278607> <a:Porvalope:1143972898873278607> <a:Porvalope:1143972898873278607> <a:Porvalope:1143972898873278607> <a:Porvalope:1143972898873278607> <a:Porvalope:1143972898873278607> <a:Porvalope:1143972898873278607> <a:Porvalope:1143972898873278607> `;
        
        // Crie uma figurinha e anexe-a à mensagem
        const filePath = path.join(__dirname, 'DiscordOut/porvalope.gif');
        const stickerAttachment = new MessageAttachment(filePath);

        // Crie uma mensagem personalizada
        if (useFollowUp) {
            await interaction.followUp(messageContent);
        } else {
            await interaction.reply(messageContent);
        }

        // Modificar messageContent para DM
        const messageContentForDM = `<@${user.id}> te porvalopou!\n\ ${messageContent}`;

        // Verifique se o membro alvo é um bot
        if (targetMember.bot || (targetMember.user && targetMember.user.bot)) {
            console.log(`O membro ${targetMember.user.tag} é um bot.`);
        } else {
            // Envie uma mensagem privada para o membro alvo
            try {
                const dmChannel = await targetMember.createDM();
                await dmChannel.send({ content: messageContentForDM, files: [stickerAttachment] });
            } catch (error) {
                if(targetMember && targetMember.user){
                    console.error(`Erro ao enviar mensagem para ${targetMember.user.tag}: ${error.message}`);
                } else {
                    console.error(`Erro ao enviar mensagem para ${targetMember.tag}: ${error.message}`);
                }
                // Verificar se o membro já está na blacklist
                const exists = await blacklistCollection.findOne({ userId: targetMember.id });
                if (!exists) {
                    // Adicionar à blacklist se não estiver presente
                    await blacklistCollection.insertOne({ userId: targetMember.id });
                    console.log(`${targetMember.user.tag} adicionado à blacklist.`);
                }
            }
        }

        // Envie a figurinha no canal atual
        try {
            // Tenta primeiro como um followUp da interação
            if (interaction.followUp) {
                await interaction.followUp({ files: [stickerAttachment] });
            } else if (interaction.channel && interaction.channel.send) {
                // Se o followUp falhar, tente enviar como uma nova mensagem no canal
                await interaction.channel.send({ files: [stickerAttachment] });
            }
        } catch (error) {
            console.error(`Erro ao enviar a mensagem: ${error.message}`);
            // Aqui você pode decidir o que fazer se não conseguir enviar a mensagem de nenhuma forma
            // Talvez registrar o erro ou enviar uma notificação para um canal de logs
        }


    },
};
