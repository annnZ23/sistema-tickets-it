let tickets = [];
let contador = 1;

function crearTicket({ nombre, correo, descripcion }) {
  const ticket = {
    id: "BAP-" + String(contador).padStart(4, "0"),
    nombre,
    correo,
    descripcion,
    estado: "Pendiente",
    fecha: new Date()
  };

  contador++;
  tickets.push(ticket);
  return ticket;
}

function obtenerTickets() {
  return tickets;
}

function actualizarEstado(id, estado) {
  const t = tickets.find(x => x.id === id);
  if (t) t.estado = estado;
  return t;
}

module.exports = {
  crearTicket,
  obtenerTickets,
  actualizarEstado
};