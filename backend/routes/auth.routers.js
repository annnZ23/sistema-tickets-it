const prisma = require("../lib/prisma");
const bcrypt = require("bcrypt");
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email }
    });
    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado"
      });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({
        message: "Contraseña incorrecta"
      });
    }
    res.json({
      message: "Login exitoso",
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error en el login"
    });
  }
};
