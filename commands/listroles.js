module.exports = {
    name: 'listroles',
    description: 'Lista todos os cargos que contenham "XP" no nome e seus IDs (comando apenas para administradores)',

    async execute(interaction) {
        // Verifica se o usuário tem a permissão de administrador
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply('Você não tem permissão para usar este comando.');
        }

        // Recupera todos os cargos do servidor e filtra apenas aqueles que contenham "XP" no nome
        const roles = interaction.guild.roles.cache.filter(role => role.name.includes('XP'));
        let roleList = 'Lista de Cargos com "XP" no nome e seus IDs:\n';

        // Monta a lista de cargos filtrados com seus respectivos IDs
        roles.forEach(role => {
            roleList += `${role.name} - ID: ${role.id}\n`;
        });

        // Se não houver cargos com "XP", envie uma mensagem de feedback
        if (roles.size === 0) {
            return interaction.reply('Nenhum cargo com "XP" no nome foi encontrado.');
        }

        // Divide a lista em partes menores se necessário
        const messages = [];
        while (roleList.length > 2000) {
            let splitIndex = roleList.lastIndexOf('\n', 2000);
            if (splitIndex === -1) splitIndex = 2000;
            messages.push(roleList.slice(0, splitIndex));
            roleList = roleList.slice(splitIndex);
        }
        messages.push(roleList);

        // Envia as mensagens sequencialmente
        for (const message of messages) {
            await interaction.channel.send(message);
        }
    }
};
