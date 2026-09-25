const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    // Récupérer le token dans le header Authorization
    const token = req.headers.authorization.split(" ")[1];

    // Vérifier le token
    const decodedToken = jwt.verify(token, "SECRET_TOKEN");

    // Ajouter l'utilisateur à la requête
    req.auth = {
      userId: decodedToken.userId
    };

    // Continuer vers la route
    next();

  } catch (error) {
    res.status(401).json({
      message: "Requête non authentifiée"
    });
  }
};