const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const bcrypt = require("bcrypt");
router.post("/", async (req, res) => {
  try {
    const { username, name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        name,
        email,
        password: hashedPassword,
        role: role || "USER"
      }
    });

    res.json({
      message: "Usuario creado correctamente",
      user
    });

  } catch (error) {
    res.status(500).json({
      message: "Error al crear usuario"
    });
  }
});

module.exports = router;