const mongoose = require('mongoose');

const inscricaoSchema = new mongoose.Schema({
    usuarioId: String,
    lembreteMinutos: Number
});

const eventoSchema = new mongoose.Schema({
    descricao: String,
    dataHora: Date,
    inscritos: [inscricaoSchema],
    criadorId: String
});

// Adicionando índices
eventoSchema.index({ criadorId: 1 });
eventoSchema.index({ "inscritos.usuarioId": 1 });

const Evento = mongoose.model('Evento', eventoSchema);

module.exports = Evento;
