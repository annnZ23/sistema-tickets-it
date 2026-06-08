import { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ AGREGADO
import "./Login.css";
import Chatbot from "./Chatbot";

// IMÁGENES
import iconLogin from "../assets/icon-login.png";
import control from "../assets/control de equipo.png";
import mantenimiento from "../assets/mantenimiento.png";
import seguimiento from "../assets/seguimiento.png";
import logo from "../assets/Baprosa logo.png";
import seguridad from "../assets/Seguridad.png";
import userIcon from "../assets/usuario.png";
import passIcon from "../assets/contraseña.png";
import chatIcon from "../assets/chat.png";

function Login({ setUsuario }) {

  const navigate = useNavigate(); // ✅ AGREGADO

  const [showPass, setShowPass] = useState(false);
  const [usuarioInput, setUsuarioInput] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario: usuarioInput.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      console.log("DATA:", data);

      if (data && data.ok === true) {
        // ✅ GUARDAR USUARIO
        setUsuario(data.user);

        // ✅ 🚀 REDIRECCIÓN AL SISTEMA
        navigate("/crear");

      } else {
        alert("❌ Usuario o contraseña incorrectos");
      }

    } catch (error) {
      console.error("ERROR:", error);
      alert("❌ No se pudo conectar con el servidor");
    }
  };

  return (
    <div className="container">

      {/* LOGO */}
      <img src={logo} className="logo" alt="Baprosa" />

      {/* PANEL IZQUIERDO */}
      <div className="panel-left">

        <div className="icon-circle">
          <img src={iconLogin} alt="" />
        </div>

        <h2>Sistema de Inventario</h2>
        <p className="subtitle-left">Soporte Técnico IT</p>

        <div className="divider-line"></div>

        <div className="features">
          <div>
            <img src={control} alt="" />
            <span>Control de equipos y dispositivos</span>
          </div>

          <div>
            <img src={mantenimiento} alt="" />
            <span>Gestión de mantenimientos</span>
          </div>

          <div>
            <img src={seguimiento} alt="" />
            <span>Seguimiento de incidencias</span>
          </div>
        </div>

      </div>

      {/* PANEL DERECHO */}
      <div className="panel-right">

        <h3>
          <img src={seguridad} alt="" />
          Iniciar Sesión
        </h3>

        <p className="login-text">
          Ingresa tus credenciales para acceder al sistema
        </p>

        {/* USUARIO */}
        <label className="form-label">Usuario</label>
        <div className="input-row">
          <img src={userIcon} className="input-icon" alt="" />

          <div className="input-group">
            <input
              type="text"
              placeholder="Escribe tu usuario"
              value={usuarioInput}
              onChange={(e) => setUsuarioInput(e.target.value)}
            />
          </div>
        </div>

        {/* PASSWORD */}
        <label className="form-label">Contraseña</label>
        <div className="input-row">
          <img src={passIcon} className="input-icon" alt="" />

          <div className="input-group password-group">
            <input
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <span
              className="eye-icon"
              onClick={() => setShowPass(!showPass)}
            >
              👁
            </span>
          </div>
        </div>

        <div className="options">
          <label>
            <input type="checkbox" />
            Recordarme
          </label>
        </div>

        <button className="btn-login" onClick={handleLogin}>
          Acceder al Sistema
        </button>

        <div className="separator">
          <span></span>
          <span>o</span>
          <span></span>
        </div>

        <button className="btn-forgot">
          ¿Olvidaste tu contraseña?
        </button>

        <p className="support">
          ¿Necesitas ayuda?<br />
          <strong>soporte@empresa.com</strong>
        </p>

      </div>

      {/* CHATBOT */}
      <img src={chatIcon} alt="chat" className="chat-icon" />
      <Chatbot />

    </div>
  );
}

export default Login;