import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./dashboard.css";

export default function RegisterTicket() {
  const navigate = useNavigate();

  // ✅ usuario seguro
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  // ✅ estados
  const [tipo, setTipo] = useState("");
  const [impacto, setImpacto] = useState("");
  const [estado] = useState("Creado");
  const [urgencia, setUrgencia] = useState("");
  const [prioridad, setPrioridad] = useState("");
  const [nombre] = useState(user ? user.name : "");
  const [correo] = useState(user ? user.email : "");
  const [descripcion, setDescripcion] = useState("");

  // ✅ prioridad automática
  const calcularPrioridad = (tipo, urgencia, impacto) => {
    if (tipo === "Incidente" && urgencia === "Alta") return "Alta";
    if (tipo === "Problema") return "Media";
    if (tipo === "Solicitud de información") return "Baja";
    return "Media";
  };

  const actualizarPrioridad = (nuevoTipo, nuevaUrgencia, nuevoImpacto) => {
    const p = calcularPrioridad(
      nuevoTipo || tipo,
      nuevaUrgencia || urgencia,
      nuevoImpacto || impacto
    );
    setPrioridad(p);
  };

  // ✅ crear ticket
  const crearTicket = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          correo,
          tipo,
          prioridad,
          descripcion,
        }),
      });

      const data = await res.json();
      navigate(`/chat/${data.id}`);

    } catch (error) {
      console.error(error);
      alert("Error al crear ticket");
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <div className="content">
        <h2>Nuevo incidente</h2>

        <div className="form-box">

          {/* FILA 1 */}
          <div className="grid">

            <select
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value);
                actualizarPrioridad(e.target.value, null, null);
              }}
            >
              <option value="">Tipo de solicitud</option>
              <option>Incidente</option>
              <option>Problema</option>
              <option>Solicitud de mantenimiento</option>
              <option>Solicitud de información</option>
            </select>

            <select
              value={impacto}
              onChange={(e) => {
                setImpacto(e.target.value);
                actualizarPrioridad(null, null, e.target.value);
              }}
            >
              <option value="">Impacto</option>
              <option>Alto</option>
              <option>Medio</option>
              <option>Bajo</option>
            </select>

          </div>

          {/* FILA 2 */}
          <div className="grid">

            <input value={estado} readOnly />

            <input value={prioridad} placeholder="Prioridad" readOnly />

          </div>

          {/* FILA 3 */}
          <div className="grid">

            <select
              value={urgencia}
              onChange={(e) => {
                setUrgencia(e.target.value);
                actualizarPrioridad(null, e.target.value, null);
              }}
            >
              <option value="">Urgencia</option>
              <option>Alta</option>
              <option>Media</option>
              <option>Baja</option>
            </select>

            <input placeholder="Detalles del impacto" />

          </div>

          <h3>Datos del solicitante</h3>

          {/* FILA 4 */}
          <div className="grid">

            <input value={nombre} readOnly />

            <input value={correo} readOnly />

          </div>

          {/* FILA 5 */}
          <div className="grid">

            <select>
              <option>Área</option>
              <option>Soporte Técnico</option>
              <option>Desarrollo Web</option>
            </select>

            <select>
              <option>Asesor</option>
              <option>Ing Manuel Flores</option>
              <option>Ing Luis Salgado</option>
            </select>

          </div>

          <input className="full" placeholder="Asunto" />

          <input
            className="full"
            placeholder="Descripción del problema"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />

          <div className="upload">
            Arrastra archivos aquí
          </div>

          <div className="buttons">
            <button className="btn-primary" onClick={crearTicket}>
              Crear Ticket
            </button>

            <button className="btn-light">
              Cancelar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}