const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");
const { verificarToken } = require("../../src/middleware/auth");

router.post("/", ticketController.crearTicket);
router.get("/", verificarToken, ticketController.obtenerTickets);
router.put("/:id", verificarToken, ticketController.actualizarEstado);
router.put("/:id/tiempo-estimado", verificarToken, ticketController.declararTiempoEstimado);
router.post("/:ticketId/encuesta", ticketController.responderEncuesta);

module.exports = router;

