const mongoose = require('mongoose');

const CaseSchema = new mongoose.Schema({
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  type: { type: String, enum: ['chest', 'trap'], required: true },
  positionX: { type: Number, required: true },
  positionY: { type: Number, required: true },
});

module.exports = mongoose.model('Case', CaseSchema);
