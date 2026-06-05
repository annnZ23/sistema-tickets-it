import Sidebar from "../components/Sidebar";
import "./dashboard.css";

export default function RegisterTicket() {
  return (
    <div style={{ display: "flex" }}>

      <Sidebar />

      <div className="content">

        <h2>Nuevo incidente</h2>

        <div className="form-box">

          {/* FILA 1 */}
          <div className="grid">
            <select><option>Tipo de solicitud</option></select>
            <select><option>Impacto</option></select>
            <select><option>Estado</option></select>
            <input placeholder="Detalles del impacto" />
          </div>

          {/* FILA 2 */}
          <div className="grid">
            <select><option>Urgencia</option></select>
            <select><option>Prioridad</option></select>
          </div>

          <h3>Datos del solicitante</h3>

          {/* FILA 3 */}
          <div className="grid">
            <input placeholder="Nombre" />
            <input placeholder="Correo" />

            <select>
              <option>Área</option>
              <option>Soporte Técnico</option>
              <option>Desarrollo Web</option>
              <option>Analista de Rutas</option>
            </select>

            <select>
              <option>Asesor</option>
              <option>Ing Manuel Flores</option>
              <option>Ing Luis Salgado</option>
              <option>Ing Fredy Fajardo</option>
              <option>Ing Erick Rapalo</option>
              <option> Lic Ana Zepeda</option>
            </select>
          </div>

          {/* ASUNTO */}
          <input className="full" placeholder="Asunto" />

          {/* DESCRIPCIÓN */}
           <input className="full" placeholder="Descripcion del problema" />

          {/* ADJUNTOS */}
          <div className="upload">
            Arrastra archivos aquí
          </div>

          {/* BOTONES */}
          <div className="buttons">
            <button className="btn-primary">Agregar solicitud</button>
            <button className="btn-light">Cancelar</button>
          </div>

        </div>

      </div>

    </div>
  );
}