import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

function TicketForm({ setVista }) {

  const [plantilla, setPlantilla] = useState("");
  const [tipo, setTipo] = useState("");
  const [area, setArea] = useState("");
  const [asesor, setAsesor] = useState("");
  const [asunto, setAsunto] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const plantillas = {
    "Laptop": "Incidente",
    "Internet": "Incidente",
    "Cámaras": "Incidente",
    "Clientes": "Solicitud",
    "Pagos": "Solicitud",
    "Bug web": "Problema",
    "Formulario": "Problema",
    "GPS": "Incidente"
  };

  const handlePlantilla = (value) => {
    setPlantilla(value);
    setTipo(plantillas[value] || "");
  };

  const crearTicket = () => {
    const ticket = {
      plantilla,
      tipo,
      area,
      asesor,
      asunto,
      descripcion
    };

    console.log(" Ticket creado:", ticket);

    setVista("ticket");
  };

  return (
    <div>

      {/* HEADER */}
      <Header />

      <div style={{ display: "flex" }}>

        {/* SIDEBAR */}
        <Sidebar />

        {/* CONTENIDO PRINCIPAL */}
        <div style={main}>

          {/* CONTENEDOR GRANDE */}
          <div style={card}>

            <h2 style={{ marginBottom: "20px" }}>
              Nuevo incidente
            </h2>

            {/* FILA 1 */}
            <div style={row}>
              <div style={field}>
                <label>Seleccionar plantilla</label>
                <select onChange={(e) => handlePlantilla(e.target.value)}>
                  <option value="">Seleccionar</option>
                  {Object.keys(plantillas).map((p, i) => (
                    <option key={i}>{p}</option>
                  ))}
                </select>
              </div>

              <div style={field}>
                <label>Tipo</label>
                <input value={tipo} disabled />
              </div>
            </div>

            {/* FILA 2 */}
            <div style={row}>
              <div style={field}>
                <label>Estado</label>
                <input value="Open" disabled />
              </div>

              <div style={field}>
                <label>Área</label>
                <select onChange={(e) => setArea(e.target.value)}>
                  <option>Soporte IT</option>
                  <option>Desarrollo web</option>
                  <option>Analista de Rutas</option>
                </select>
              </div>
            </div>

            {/* FILA 3 */}
            <div style={row}>
              <div style={field}>
                <label>Asesor</label>
                <select onChange={(e) => setAsesor(e.target.value)}>
                  <option>Ing Manuel Flores</option>
                  <option>Ing Luis Salgado</option>
                  <option>Ing Arnol Sanchez</option>
                  <option>Ing Fredy Fajardo</option>
                </select>
              </div>
            </div>

            {/* ASUNTO */}
            <div style={full}>
              <label>Asunto</label>
              <input
                placeholder="Resumen del problema"
                onChange={(e) => setAsunto(e.target.value)}
              />
            </div>

            {/* DESCRIPCIÓN */}
            <div style={full}>
              <label>Descripción</label>
              <textarea
                rows="5"
                placeholder="Describe el problema..."
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            {/* BOTONES */}
            <div style={buttons}>
              <button style={btnPrimary} onClick={crearTicket}>
                Agregar solicitud
              </button>

              <button style={btnSecundary}>
                Cancelar
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

/* ESTILOS */

const main = {
  flex: 1,
  padding: "30px",
  background: "#f3ede5"
};

const card = {
  background: "white",
  padding: "30px",
  borderRadius: "12px",
  boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
  maxWidth: "900px"
};

const row = {
  display: "flex",
  gap: "20px",
  marginBottom: "15px"
};

const field = {
  flex: 1,
  display: "flex",
  flexDirection: "column"
};

const full = {
  marginBottom: "15px",
  display: "flex",
  flexDirection: "column"
};

const buttons = {
  marginTop: "20px",
  display: "flex",
  gap: "10px"
};

const btnPrimary = {
  background: "#ff7a00",
  color: "white",
  border: "none",
  padding: "10px 20px",
  borderRadius: "8px",
  cursor: "pointer"
};

const btnSecundary = {
  background: "#ddd",
  border: "none",
  padding: "10px 20px",
  borderRadius: "8px"
};

export default TicketForm;

