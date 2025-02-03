const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Charger les routes
const playerRoutes = require('./routes/player.js');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

mongoose.connect('mongodb://admin:password@localhost:27017/gameDB', {
    authSource: "admin", // Indique que l’authentification se fait sur la base admin
    dbName: "gameDB" // Base de données cible
  }).then(() => {
    console.log("✅ Connecté à MongoDB !");
  }).catch(err => {
    console.error("❌ Erreur de connexion à MongoDB :", err);
  });

// Routes de l'API
app.use('/player', playerRoutes);

// Lancer le serveur
app.listen(port, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${port}`);
});
