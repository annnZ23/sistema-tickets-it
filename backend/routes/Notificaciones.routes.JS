const express = require("express");
const router = express.Router();
const { obtenerNotificaciones, obtenerCorreosRecientes } = require("../controllers/notificacionController");
const { verificarToken } = require("../../src/middleware/auth");

router.get("/", verificarToken, obtenerNotificaciones);
router.get("/correos", verificarToken, obtenerCorreosRecientes);

module.exports = router;