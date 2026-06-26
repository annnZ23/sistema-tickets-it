const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Registrar un nuevo equipo
exports.crearEquipo = async (req, res) => {
    try {
        const { serie, nombre, categoria } = req.body;
        const nuevoEquipo = await prisma.equipo.create({
            data: { serie, nombre, categoria }
        });
        res.status(201).json(nuevoEquipo);
    } catch (error) {
        res.status(500).json({ error: "No se pudo registrar el equipo." });
    }
};

// Listar todo el inventario
exports.obtenerEquipos = async (req, res) => {
    try {
        const equipos = await prisma.equipo.findMany();
        res.json(equipos);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener el inventario." });
    }
};