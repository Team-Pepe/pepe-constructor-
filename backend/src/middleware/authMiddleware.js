const jwt = require("jsonwebtoken");

exports.authenticateToken = (req, res, next) => {
    // Obtener token de las cookies
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "No autenticado - Token no proporcionado" });
    }

    try {
        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("Error al verificar token:", error);
        
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expirado" });
        }
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Token inválido" });
        }
        
        res.status(401).json({ message: "Error de autenticación" });
    }
};

exports.verifyCSRF = (req, res, next) => {
    // Solo verificar CSRF en métodos no seguros (POST, PUT, DELETE, etc.)
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        return next();
    }

    const csrfToken = req.headers['x-csrf-token'] || req.body.csrfToken;
    
    if (!csrfToken) {
        return res.status(403).json({ message: "Token CSRF no proporcionado" });
    }

    // Aquí normalmente verificarías contra el token CSRF almacenado
    // Por ahora solo verificamos que exista
    next();
};