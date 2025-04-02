const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const JWT_EXPIRES_IN = "1d"; // Token válido por 1 día

// Controlador de inicio de sesión
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Buscar usuario en la base de datos
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.log("Usuario no encontrado:", email);
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log("Contraseña incorrecta para el usuario:", email);
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        // Generar token JWT
        const token = jwt.sign({ id: user.id, roleId: user.roleId }, JWT_SECRET, {
            expiresIn: "1d", // Token válido por 1 día
        });

        // Enviar token en una cookie segura
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Solo en producción
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000, // 1 día
        });

        console.log("Inicio de sesión exitoso para el usuario:", email);
        // En el método login, actualiza la respuesta:
        res.json({ 
          message: "Inicio de sesión exitoso", 
          user: { 
            id: user.id, 
            roleId: user.roleId 
          },
          roleId: user.roleId // Asegúrate de incluir esto
        });
    } catch (error) {
        console.error("Error en el inicio de sesión:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// Controlador de registro
exports.register = async (req, res) => {
    const { email, password, username, roleId } = req.body;

    try {
        // Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear el usuario en la base de datos
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword, // Guardar la contraseña encriptada
                username,
                roleId,
            },
        });

        res.status(201).json({ message: "Usuario registrado exitosamente", user: newUser });
    } catch (error) {
        console.error("Error al registrar usuario:", error);
        res.status(500).json({ message: "Error al registrar usuario" });
    }
};