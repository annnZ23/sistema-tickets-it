import Chat from "../components/Chat";
import TicketStatus from "../components/TicketStatus";
import { useState } from "react";

function TicketView({ ticket }) {

  if (!ticket) return <h2>Cargando ticket...</h2>;

  return (
    <div style={layout}>

      {/* IZQUIERDA */}
      <div style={left}>

        <div style={card}>
          <h2>{ticket.id} - {ticket.asunto}</h2>
          <p><strong>Estado:</strong> {ticket.estado}</p>
        </div>

        <Chat ticket={ticket} />

        <div style={{ marginTop: "20px" }}>
          <TicketStatus />
        </div>

      </div>

      {/* DERECHA */}
      <div style={right}>

        <Accordion title="Propiedades">

          <Row label="ID de la solicitud" value={ticket.id} />
          <Row label="Estado" value={ticket.estado} />
          <Row label="Área" value={ticket.area} />
          <Row label="Asesor" value={ticket.asesor} />
          <Row label="Archivos adjuntos" value="0" />
          <Row label="Recordatorios" value="0" />

        </Accordion>

        <Accordion title="Detalles del solicitante">

          <div style={userBox}>
            <div style={avatar}></div>
            <div>
              <strong>Ana Zepeda</strong>
              <p style={{ fontSize: "12px", color: "#777" }}>usuario</p>
            </div>
          </div>

          <Row label="Correo" value="usuario@email.com" />
          <Row label="Departamento" value="IT" />
          <Row label="Sitio" value="Base Site" />
          <Row label="Teléfono" value="-" />

        </Accordion>

      </div>

    </div>
  );
}

export default TicketView;

function Accordion({ title, children }) {
  const [open, setOpen] = useState(true);

  return (
    <div style={accordion}>
      <div style={accordionHeader} onClick={() => setOpen(!open)}>
        {title} {open ? "▾" : "▸"}
      </div>

      {open && <div style={accordionBody}>{children}</div>}
    </div>
  );
}

const Row = ({ label, value }) => (
  <div style={row}>
    <span style={labelStyle}>{label}</span>
    <span style={valueStyle}>{value}</span>
  </div>
);

const layout = {
  display: "flex",
  gap: "20px",
  padding: "20px",
  background: "#f3ede5"
};

const left = {
  flex: 2,
  display: "flex",
  flexDirection: "column",
  gap: "15px"
};

const right = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: "15px"
};

const card = {
  background: "white",
  padding: "15px",
  borderRadius: "12px",
  boxShadow: "0px 4px 10px rgba(0,0,0,0.1)"
};


const accordion = {
  background: "white",
  borderRadius: "12px",
  padding: "12px",
  boxShadow: "0px 3px 8px rgba(0,0,0,0.08)"
};

const accordionHeader = {
  fontWeight: "600",
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
  paddingBottom: "8px",
  borderBottom: "1px solid #eee"
};

const accordionBody = {
  marginTop: "10px",
  display: "flex",
  flexDirection: "column",
  gap: "8px"
};

const row = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "13px"
};

const labelStyle = {
  color: "#777"
};

const valueStyle = {
  fontWeight: "500",
  color: "#333"
};


const userBox = {
  display: "flex",
  gap: "10px",
  marginBottom: "10px",
  alignItems: "center"
};

const avatar = {
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  background: "#ddd"
};