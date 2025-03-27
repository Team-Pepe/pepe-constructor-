const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Controlador para iniciar sesión
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar al usuario por correo electrónico
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Devolver el token simulado y el roleId
    res.json({ token: "fake-jwt-token", role_id: user.roleId });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Controlador para registrar usuarios
const register = async (req, res) => {
  const { email, password, username, roleId } = req.body;

  try {
    // Verificar si el correo ya está registrado
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "El correo ya está registrado" });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el nuevo usuario
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        roleId,
      },
    });

    res.status(201).json({ message: "Usuario registrado exitosamente", user: newUser });
  } catch (error) {
    console.error("Error en register:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = { login, register };