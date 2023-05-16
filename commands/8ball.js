module.exports = {
    name: '8ball',
    description: 'Responde a uma pergunta com uma resposta aleatória.',
    options: [{
        name: 'pergunta',
        description: 'A pergunta que você deseja fazer.',
        type: 3, // STRING type
        required: true
    }],
    async execute(interaction) {
        const question = interaction.options.getString('pergunta');
        const answers = [
            'É certo.',
            'É decididamente assim.',
            'Sem dúvida.',
            'Sim, definitivamente.',
            'Você pode contar com isso.',
            'Como eu vejo, sim.',
            'Provavelmente.',
            'Outlook bom.',
            'Sim.',
            'Os sinais apontam para sim.',
            'Resposta nebulosa, tente novamente.',
            'Pergunte novamente mais tarde.',
            'Melhor não te contar agora.',
            'Não posso prever agora.',
            'Concentre-se e pergunte novamente.',
            'Não conte com isso.',
            'Minha resposta é não.',
            'Minhas fontes dizem não.',
            'Outlook não é tão bom.',
            'Muito duvidoso.'
        ];

        const randomAnswer = answers[Math.floor(Math.random() * answers.length)];

        await interaction.reply(`🎱 **Pergunta:** ${question}\n**Resposta:** ${randomAnswer}`);
    }
};
