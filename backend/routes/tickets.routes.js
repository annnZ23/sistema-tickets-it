const express = require("express");
const {
  crearTicket,
  obtenerTickets,
  actualizarEstado
} = require("./tickets.data");

const router = express.Router();


router.post("/", (req, res) => {
  const ticket = crearTicket(req.body);
  res.json(ticket);
});


router.get("/", (req, res) => {
  res.json(obtenerTickets());
});

router.put("/:id", (req, res) => {
  const { estado } = req.body;
  const ticket = actualizarEstado(req.params.id, estado);
  res.json(ticket);
});

module.exports = router;
