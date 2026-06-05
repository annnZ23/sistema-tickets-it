async function cargarTickets() {
  const res = await fetch("http://localhost:3000/api/tickets");
  const tickets = await res.json();

  document.getElementById("total").innerText = tickets.length;
  document.getElementById("pendientes").innerText =
    tickets.filter(t => t.estado === "Pendiente").length;
  document.getElementById("resueltos").innerText =
    tickets.filter(t => t.estado === "Resuelto").length;

  const lista = document.getElementById("listaTickets");
  lista.innerHTML = "";

  tickets.forEach(t => {
    const div = document.createElement("div");
    div.innerHTML = `
      <strong>${t.id}</strong><br>
      ${t.nombre} - ${t.estado}<br><br>
    `;
    lista.appendChild(div);
  });
}

cargarTickets();