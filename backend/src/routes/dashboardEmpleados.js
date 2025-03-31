const express = require("express");
const router = express.Router();

// Ruta protegida básica para el dashboard de empleados
router.get("/", (req, res) => {
    res.json({ message: "Acceso permitido al dashboard de empleados", user: req.user });
});

module.exports = router;