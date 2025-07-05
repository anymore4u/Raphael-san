const { MessageAttachment } = require('discord.js');
const path = require('path');

module.exports = {
    name: 'juju',
    description: 'Menciona o usuário e envia uma mensagem e um gif (com teste de sorte d20).',
    async execute(interaction, client) {
        try {
            // Acessa a base de dados a partir do mongoClient global
            const db = global.mongoClient.db("discordBot");
            const jujuDifficultyCollection = db.collection("jujuDifficulty");
            
            // Buscar a dificuldade atual no banco de dados
            let difficultyData = await jujuDifficultyCollection.findOne({ _id: 'global' });
            
            // Se não existir, criar com dificuldade padrão 10
            if (!difficultyData) {
                difficultyData = {
                    _id: 'global',
                    difficulty: 10,
                    lastModified: new Date(),
                    modifiedBy: 'system'
                };
                await jujuDifficultyCollection.insertOne(difficultyData);
            }

            const difficulty = difficultyData.difficulty;

            // Enviar gif do d20 rolando
            await interaction.reply('🎲 Rolando o dado...');
            const d20GifPath = path.join(__dirname, 'DiscordOut/d20.gif');
            const d20Attachment = new MessageAttachment(d20GifPath);
            await interaction.followUp({ files: [d20Attachment] });

            // Simular um pequeno delay para o suspense
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Rolar o d20
            const roll = Math.floor(Math.random() * 20) + 1;
            const specificUserId = '491459349957312512'; // ID do juju
            const porvalopeCommand = client.commands.get('porvalope');

            if (roll === 1) {
                // Crítico falha! Porvalope no autor do comando
                await interaction.followUp(`💀 **CRÍTICO FALHA!** Você rolou **${roll}** e o feitiço voltou contra você!`);
                
                if (porvalopeCommand) {
                    // Executa porvalope no autor do comando
                    await porvalopeCommand.execute(interaction, client, interaction.user.id, interaction.guild, interaction.user, true);
                } else {
                    await interaction.followUp('O comando porvalope não foi encontrado.');
                }
            } else if (roll === 20) {
                // Crítico sucesso! 5 porvalopes no juju
                await interaction.followUp(`⭐ **CRÍTICO SUCESSO!** Você rolou **${roll}** - COMBO x5 PORVALOPES!`);
                
                if (porvalopeCommand) {
                    // Executa 5 porvalopes no juju
                    for (let i = 1; i <= 5; i++) {
                        await interaction.followUp(`🔥 **PORVALOPE ${i}/5**`);
                        await porvalopeCommand.execute(interaction, client, specificUserId, interaction.guild, interaction.user, true);
                        // Pequeno delay entre os porvalopes
                        if (i < 5) await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                } else {
                    await interaction.followUp('O comando porvalope não foi encontrado.');
                }
            } else if (roll >= difficulty) {
                // Sucesso normal! Executar comando original
                await interaction.followUp(`🎉 **Sucesso!** Você rolou **${roll}** (dificuldade: ${difficulty})`);
                
                if (porvalopeCommand) {
                    // Caminho para o arquivo juju.gif
                    const jujuGifPath = path.join(__dirname, 'DiscordOut/juju.gif');
                    const attachment = new MessageAttachment(jujuGifPath);

                    // Envia o gif
                    await interaction.followUp({ files: [attachment] });

                    // Executa o comando porvalope no juju
                    await porvalopeCommand.execute(interaction, client, specificUserId, interaction.guild, interaction.user, true);
                } else {
                    await interaction.followUp('O comando porvalope não foi encontrado.');
                }
            } else {
                // Falha normal! Enviar gif de falha
                await interaction.followUp(`😅 **Falhou!** Você rolou **${roll}** (dificuldade: ${difficulty})`);
                const failGifPath = path.join(__dirname, 'DiscordOut/jujuju.gif');
                const failAttachment = new MessageAttachment(failGifPath);
                await interaction.followUp({ files: [failAttachment] });
            }
        } catch (error) {
            console.error('Erro no comando juju:', error);
            await interaction.followUp('❌ Ocorreu um erro ao executar o comando.');
        }
    }
}
