const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model('Game', GameSchema);
