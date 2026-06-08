import { useNavigate, useLocation } from "react-router-dom";

// ✅ iconos correctos
import { FaTicketAlt, FaListUl, FaComments, FaUsers, FaChartBar, FaCog } from "react-icons/fa";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="sidebar">

      <div className="logo">
        IT
      </div>

      <p className="nav-title">Navegación</p>

      <div className="menu">

        {/* Tickets */}
        <div
          className={`menu-item ${isActive("/crear") ? "active" : ""}`}
          onClick={() => navigate("/crear")}
        >
          <FaTicketAlt />
          <span>Tickets Soporte</span>
        </div>

        {/* Asignación */}
        <div className="menu-item">
          <FaListUl />
          <span>Asignación Tareas IT</span>
        </div>

        {/* Chat */}
        <div className="menu-item">
          <FaComments />
          <span>Chat por Área</span>
        </div>

        {/* Usuarios */}
        <div className="menu-item">
          <FaUsers />
          <span>Usuarios</span>
        </div>

        {/* Reportes */}
        <div className="menu-item">
          <FaChartBar />
          <span>Reportes</span>
        </div>

        {/* Config */}
        <div className="menu-item">
          <FaCog />
          <span>Configuración</span>
        </div>

      </div>

    </div>
  );
}
