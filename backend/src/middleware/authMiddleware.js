const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

function authenticateToken(req, res, next) {
    const token = req.cookies.token; // Leer el token de las cookies

    if (!token) {
        return res.status(401).json({ message: "No autenticado" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET); // Verificar el token
        req.user = decoded; // Agregar los datos del usuario al objeto `req`
        next(); // Continuar con la ejecución de la ruta
    } catch (error) {
        res.status(401).json({ message: "Token inválido o expirado" });
    }
}

module.exports = authenticateToken;