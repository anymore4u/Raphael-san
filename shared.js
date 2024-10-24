// Objeto para armazenar temporizadores ativos
const activeTimeouts = {};

// Função para remover o cargo após o tempo expirar
async function removeRoleAfterTimeout(client, guildId, userId, roleId, collection) {
    try {
        const guild = await client.guilds.fetch(guildId);
        const member = await guild.members.fetch(userId);

        if (member.roles.cache.has(roleId)) {
            await member.roles.remove(roleId);
            console.log(`Cargo <@&${roleId}> removido de <@${userId}> após o tempo expirar.`);
        }

        // Remove a atribuição do banco de dados
        await collection.deleteOne({
            type: 'roleAssignment',
            guildId: guildId,
            userId: userId,
            roleId: roleId
        });

        // Remove o temporizador do registro
        delete activeTimeouts[userId];

    } catch (error) {
        console.error(`Erro ao remover o cargo de <@${userId}>:`, error);
    }
}

module.exports = {
    activeTimeouts,
    removeRoleAfterTimeout,
};
