const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const auth = require("./middleware/auth");

const app = express();
const PORT = 3000;

// Permet de recevoir du JSON
app.use(express.json());

// Connexion à MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/mon-vieux-grimoire")
  .then(() => {
    console.log("Connecté à MongoDB");
  })
  .catch((error) => {
    console.error("Erreur MongoDB :", error);
  });

// Modèle Livre
const Livre = mongoose.model("Livre", {
  title: String,
  author: String
});

// Route d'accueil
app.get("/", (req, res) => {
  res.send("Bienvenue sur Mon Vieux Grimoire !");
});

// Route POST pour ajouter un livre
app.post("/api/books", auth, async (req, res) => {
  try {
    console.log(req.body);

    const livre = new Livre({
      title: req.body.title,
      author: req.body.author
    });

    const livreSauvegarde = await livre.save();

    res.status(201).json({
      message: "Livre enregistré !",
      livre: livreSauvegarde
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur lors de l'enregistrement du livre"
    });
  }
});

app.get("/api/books", auth, async (req, res) => {
  try {
    const livres = await Livre.find();

    res.json(livres);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur lors de la récupération des livres"
    });
  }
});

// Route GET pour récupérer un seul livre
app.get("/api/books/:id", async (req, res) => {
  try {
    const livre = await Livre.findById(req.params.id);

    if (!livre) {
      return res.status(404).json({
        message: "Livre non trouvé"
      });
    }

    res.json(livre);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur lors de la récupération du livre"
    });
  }
});

// Route PUT pour modifier un livre
app.put("/api/books/:id", async (req, res) => {
  try {
    const livre = await Livre.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        author: req.body.author
      },
      { new: true }
    );

    if (!livre) {
      return res.status(404).json({
        message: "Livre non trouvé"
      });
    }

    res.json({
      message: "Livre modifié !",
      livre: livre
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur lors de la modification du livre"
    });
  }
});

// Route DELETE pour supprimer un livre
app.delete("/api/books/:id", async (req, res) => {
  try {
    const livre = await Livre.findByIdAndDelete(req.params.id);

    if (!livre) {
      return res.status(404).json({
        message: "Livre non trouvé"
      });
    }

    res.json({
      message: "Livre supprimé !",
      livre: livre
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur lors de la suppression du livre"
    });
  }
});

// Route POST pour créer un utilisateur
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const utilisateurExistant = await User.findOne({ email });

    if (utilisateurExistant) {
      return res.status(400).json({
        message: "Cet email est déjà utilisé"
      });
    }

    // Hacher le mot de passe
    const motDePasseHache = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const utilisateur = new User({
      email: email,
      password: motDePasseHache
    });

    // Enregistrer dans MongoDB
    await utilisateur.save();

    res.status(201).json({
      message: "Utilisateur créé !"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur lors de la création de l'utilisateur"
    });
  }
});

// Route POST pour connecter un utilisateur
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Chercher l'utilisateur dans la base de données
    const utilisateur = await User.findOne({ email });

    if (!utilisateur) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect"
      });
    }

    // Vérifier le mot de passe
    const motDePasseCorrect = await bcrypt.compare(
      password,
      utilisateur.password
    );

    if (!motDePasseCorrect) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect"
      });
    }

// Générer le token JWT
const token = jwt.sign(
  { userId: utilisateur._id },
  "SECRET_TOKEN",
  { expiresIn: "24h" }
);

// Connexion réussie
res.json({
  message: "Connexion réussie !",
  token: token
});
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur lors de la connexion"
    });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});