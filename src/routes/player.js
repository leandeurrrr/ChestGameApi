const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const Game = require('../models/Game');
const Case = require('../models/Case');
const { movePlayer } = require('../services/MovementService');

// Fonction pour générer les cases (coffre + pièges)
const generateCases = async (gameId) => {
  // Génération d'une position aléatoire pour le coffre
  const chestPosition = {
    x: Math.floor(Math.random() * 11),
    y: Math.floor(Math.random() * 11)
  };

  // Génération des positions de pièges
  const traps = [];
  while (traps.length < 5) {
    const trapPosition = {
      x: Math.floor(Math.random() * 11),
      y: Math.floor(Math.random() * 11)
    };

    // Éviter les doublons et la position du coffre
    if (
      !traps.some(trap => trap.x === trapPosition.x && trap.y === trapPosition.y) &&
      (trapPosition.x !== chestPosition.x || trapPosition.y !== chestPosition.y)
    ) {
      traps.push(trapPosition);
    }
  }

  // Créer les cases dans la base de données
  await Case.deleteMany({ gameId }); // Supprimer les anciennes cases
  await Case.create({ gameId, type: 'chest', positionX: chestPosition.x, positionY: chestPosition.y });

  for (const trap of traps) {
    await Case.create({ gameId, type: 'trap', positionX: trap.x, positionY: trap.y });
  }
};

// Fonction de réinitialisation du jeu
const resetGame = async () => {
  const activeGame = await Game.findOne({ isActive: true });

  if (activeGame) {
    // Réinitialiser les positions des joueurs
    await Player.updateMany({}, { positionX: 5, positionY: 5, nextMoveAvailable: new Date(), $set: { discoveredCases: [] } });
    // Générer de nouvelles cases
    await generateCases(activeGame._id);
  }
};

router.post('/move', async (req, res) => {
  const { playerId, direction } = req.body;

  try {
    // Déplacer le joueur
    const result = await movePlayer(playerId, direction);

    if (result.resetGame) {
      // Réinitialiser le jeu si un joueur trouve le coffre
      await resetGame();
    }

    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/add', async (req, res) => {
    const { playerId } = req.body;
  
    try {
      // Vérifier si un jeu actif existe
      let activeGame = await Game.findOne({ isActive: true });
      if (!activeGame) {
        // Si aucun jeu actif, en créer un
        activeGame = new Game({ isActive: true });
        await activeGame.save();
  
        // Générer les cases (coffre + pièges) pour ce nouveau jeu
        await generateCases(activeGame._id);
      }
  
      // Vérifier si le joueur existe déjà
      let existingPlayer = await Player.findOne({ playerId });
      if (existingPlayer) {
        return res.status(400).json({ message: 'Le joueur existe déjà dans la partie.' });
      }
  
      // Créer le joueur
      const newPlayer = new Player({
        playerId,
        positionX: 5, // Centre de la grille
        positionY: 5, // Centre de la grille
        gameId: activeGame._id,
        nextMoveAvailable: new Date(), // Disponible immédiatement
        nbVictory: 0
      });
  
      await newPlayer.save();
  
      res.status(201).json({
        message: 'Nouveau joueur ajouté avec succès.',
        player: newPlayer
      });
    } catch (err) {
      res.status(500).json({ message: 'Erreur lors de l’ajout du joueur.', error: err.message });
    }
});

router.get('/:playerId/discovered', async (req, res) => {
    const { playerId } = req.params;
  
    try {
      const player = await Player.findOne({ playerId });
  
      if (!player) {
        return res.status(404).json({ message: 'Joueur non trouvé.' });
      }
  
      res.json({
        message: 'Carte des cases découvertes récupérée avec succès.',
        discoveredCases: player.discoveredCases
      });
    } catch (err) {
      res.status(500).json({ message: 'Erreur lors de la récupération des cases.', error: err.message });
    }
});
  

router.get('/reveal', async (req, res) => {
    try {
      // Chercher la case contenant le coffre
      const chest = await Case.findOne({ type: 'chest' });
  
      if (!chest) {
        return res.status(404).json({ message: "Le coffre n'a pas été trouvé." });
      }
  
      res.json({
        message: "Coffre trouvé.",
        coordinates: {
          positionX: chest.positionX,
          positionY: chest.positionY
        }
      });
    } catch (err) {
      res.status(500).json({ message: "Erreur lors de la récupération des coordonnées du coffre.", error: err.message });
    }
});

module.exports = router;
