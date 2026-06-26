const express = require("express");
const router = express.Router();
const equipoController = require("../controllers/equipoController");

// Ruta para registrar equipo
router.post("/", equipoController.crearEquipo);

// Ruta para ver el inventario
router.get("/", equipoController.obtenerEquipos);

module.exports = router;