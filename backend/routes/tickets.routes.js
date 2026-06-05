const express = require("express");
const {
  crearTicket,
  obtenerTickets,
  actualizarEstado
} = require("./tickets.data");

const router = express.Router();

// Crear ticket (desde chatbot)
router.post("/", (req, res) => {
  const ticket = crearTicket(req.body);
  res.json(ticket);
});

// Ver tickets (SOLO ADMIN IT)
router.get("/", (req, res) => {
  res.json(obtenerTickets());
});

// Cambiar estado
router.put("/:id", (req, res) => {
  const { estado } = req.body;
  const ticket = actualizarEstado(req.params.id, estado);
  res.json(ticket);
});

module.exports = router;
