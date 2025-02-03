const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  playerId: { type: String, required: true },
  positionX: { type: Number, default: 5 },
  positionY: { type: Number, default: 5 },
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  nextMoveAvailable: { type: Date, default: new Date() },
  nbVictory: { type: Number, default: 0 },
  discoveredCases: [
    {
      positionX: { type: Number },
      positionY: { type: Number }
    }
  ]
});

module.exports = mongoose.model('Player', PlayerSchema);
