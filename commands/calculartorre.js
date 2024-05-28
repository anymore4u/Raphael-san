const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'calculartorre',
    description: 'Calcula o valor total das torres ou andares.',
    options: [
        {
            name: 'tipo',
            type: 3, // STRING type
            description: 'Escolha entre calcular por "torre" ou por "andares".',
            required: true,
            choices: [
                { name: 'Torre', value: 'torre' },
                { name: 'Andares', value: 'andares' },
            ],
        },
        {
            name: 'quantidade',
            type: 4, // INTEGER type
            description: 'Número de torres ou andares.',
            required: true,
        },
    ],
    async execute(interaction) {
        const tipo = interaction.options.getString('tipo');
        const quantidade = interaction.options.getInteger('quantidade');
        let x, valorTotal, descricao;
        const valorBase = 5000;

        try {
            // Validando a entrada
            if (quantidade <= 0 || !Number.isInteger(quantidade)) {
                throw new Error('Por favor, insira um número inteiro positivo.');
            }

            if (tipo === 'torre') {
                x = quantidade * 12;
                descricao = `O cálculo para construir ${quantidade} torre(s) (${x} andares) é: `;
            } else { // 'andares'
                x = quantidade;
                let qtdeTorre = parseFloat((x / 12).toFixed(1));
                descricao = `O cálculo para construir ${x} andares (${qtdeTorre} torre(s)) é: `;
            }

            valorTotal = valorBase * (x * (x + 1) / 2);
            const valorFormatado = formatarValor(valorTotal);

            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Cálculo da Torre')
                .setDescription(`${descricao}<:kakeris:1194243901339480114>${valorFormatado} Kakeras`);

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({ content: error.message, ephemeral: true });
        }
    }
};

function formatarValor(valor) {
    return valor.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}