const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

// Controlador de inicio de sesión
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Buscar usuario incluyendo el rol
        const user = await prisma.user.findUnique({
            where: { email },
            include: { role: true }
        });

        if (!user) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        // Generar token JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                roleId: user.roleId,
                roleName: user.role.roleName 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
        );

        // Generar token CSRF
        const csrfToken = crypto.randomBytes(32).toString('hex');

        // Configurar cookie segura
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000, // 1 día
        });

        // Respuesta exitosa
        res.json({
            message: "Inicio de sesión exitoso",
            user: {
                id: user.id,
                roleId: user.roleId,
                roleName: user.role.roleName
            },
            csrfToken
        });

    } catch (error) {
        console.error("Error en el inicio de sesión:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// Añadir esta función de registro
exports.register = async (req, res) => {
    const { email, password, username } = req.body;

    try {
        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ message: "El usuario ya existe" });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear nuevo usuario
        const newUser = await prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
                roleId: 2 // Asignar rol por defecto (empleado)
            },
            include: { role: true }
        });

        res.status(201).json({
            message: "Usuario registrado exitosamente",
            user: {
                id: newUser.id,
                email: newUser.email,
                roleId: newUser.roleId
            }
        });

    } catch (error) {
        console.error("Error en el registro:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};