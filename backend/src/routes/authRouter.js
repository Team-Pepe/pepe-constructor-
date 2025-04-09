// filepath: backend/src/routes/authRouter.js
const express = require("express");
const { login, register } = require("../controllers/authController");
// Quitar la definición duplicada del middleware
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();
// Ruta de inicio de sesión
router.post("/login", login);

// Ruta de registro
router.post("/register", register);

// Ruta para verificar el token y obtener datos del usuario
// Ruta corregida para /me usando el middleware importado
router.get("/me", authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

// Ruta para cerrar sesión
router.post("/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Sesión cerrada exitosamente" });
});

module.exports = router;