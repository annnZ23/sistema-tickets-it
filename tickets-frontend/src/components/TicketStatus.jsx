function TicketStatus() {
  return (
    <div style={container}>

      <h3 style={{ textAlign: "center" }}>
        Estado del Ticket #TK-1042
      </h3>

      <div style={timeline}>

        <Step label="Creado" active />
        <Line active />
        <Step label="Asignado" active />
        <Line active />
        <Step label="En Proceso" current />
        <Line />
        <Step label="Resuelto" />
        <Line />
        <Step label="Encuesta" />

      </div>

      <p style={{ marginTop: "15px", fontSize: "13px" }}>
        Al finalizar se enviará encuesta de satisfacción
      </p>

    </div>
  );
}

const container = {
  width: "500px",
  background: "#fff",
  borderRadius: "12px",
  padding: "20px",
  boxShadow: "0px 4px 10px rgba(0,0,0,0.1)"
};

const timeline = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: "20px"
};

const Step = ({ label, active, current }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      background: current ? "#ff7a00" : active ? "#2ecc71" : "#ccc",
      color: "white",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      {active ? "✔" : current ? "⏳" : ""}
    </div>
    <small>{label}</small>
  </div>
);

const Line = ({ active }) => (
  <div style={{
    height: "5px",
    width: "40px",
    background: active ? "#2ecc71" : "#ccc"
  }} />
);

export default TicketStatus;
