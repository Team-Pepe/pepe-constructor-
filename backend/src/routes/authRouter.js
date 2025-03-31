// filepath: backend/src/routes/authRouter.js
const express = require("express");
const { login, register } = require("../controllers/authController");
const jwt = require("jsonwebtoken");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Middleware para autenticar el token
function authenticateToken(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "No autenticado" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: "Token inválido o expirado" });
    }
}

// Ruta de inicio de sesión
router.post("/login", login);

// Ruta de registro
router.post("/register", register);

// Ruta para verificar el token y obtener datos del usuario
router.get("/me", authenticateToken, (req, res) => {
    res.json({ user: req.user }); // Devolver los datos del usuario autenticado
});

// Ruta para cerrar sesión
router.post("/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Sesión cerrada exitosamente" });
});

module.exports = router;