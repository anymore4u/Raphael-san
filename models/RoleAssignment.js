const mongoose = require('mongoose');

// Definição do esquema para atribuição de cargos
const RoleAssignmentSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    roleId: { type: String, required: true },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, required: true }
});

const RoleAssignment = mongoose.model('RoleAssignment', RoleAssignmentSchema);

module.exports = RoleAssignment;
