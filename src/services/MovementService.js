const Player = require('../models/Player');
const Case = require('../models/Case');

const movePlayer = async (playerId, direction) => {
  const player = await Player.findOne({ playerId });
  if (!player) {
    throw new Error('Joueur non trouvé');
  }

  const now = new Date();
  
  // Vérifier si le joueur est sur une case déjà découverte
  const isCurrentCaseDiscovered = player.discoveredCases.some(
    (caseDiscovered) => caseDiscovered.positionX === player.positionX && caseDiscovered.positionY === player.positionY
  );

  // Si la case actuelle est déjà découverte, ignorer le délai
  if (!isCurrentCaseDiscovered && now < player.nextMoveAvailable) {
    return {message: "TimeError"}; //Veuillez attendre votre tour.
  }

  // Calculer la nouvelle position
  let newX = player.positionX;
  let newY = player.positionY;
  if (direction === 'up') newY -= 1;
  if (direction === 'down') newY += 1;
  if (direction === 'left') newX -= 1;
  if (direction === 'right') newX += 1;

  // Vérifier les limites de la grille (11x11)
  if (newX < 0 || newX >= 11 || newY < 0 || newY >= 11) {
    return {message: "SizeError"}; // déplacement hors de la grille
  }

  // Vérifier si la nouvelle case est déjà découverte
  const isNewCaseDiscovered = player.discoveredCases.some(
    (caseDiscovered) => caseDiscovered.positionX === newX && caseDiscovered.positionY === newY
  );

  // Si la case n'est pas encore découverte, l'ajouter à la liste
  if (!isNewCaseDiscovered) {
    player.discoveredCases.push({ positionX: newX, positionY: newY });
  }

  // Vérifier s'il y a un coffre ou un piège à la nouvelle position
  const targetCase = await Case.findOne({ gameId: player.gameId, positionX: newX, positionY: newY });

  let additionalDelay = 0;
  let trapMessage = '';

  if (targetCase) {
    if (targetCase.type === 'chest') {
      player.nbVictory += 1;
      await player.save();
      return {
        message: 'Félicitations ! Vous avez trouvé le coffre. Le jeu va être réinitialisé.',
        resetGame: true
      };
    }

    if (targetCase.type === 'trap') {
      additionalDelay = 5 * 60 * 1000; // Exemple de délai additionnel si c’est un piège (serpent par défaut)
      trapMessage = 'Vous êtes tombé dans un piège. Vous devrez attendre 5 minutes.';
    }
  }

  // Mettre à jour la position du joueur
  player.positionX = newX;
  player.positionY = newY;
  player.nextMoveAvailable = new Date(now.getTime() + 2 * 60 * 1000 + additionalDelay);

  await player.save();

  return {
    message: trapMessage || 'Déplacement effectué avec succès.',
    player,
    trapEncountered: !!trapMessage
  };
};

module.exports = {
  movePlayer
};
