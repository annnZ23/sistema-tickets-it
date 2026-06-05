function login() {
  const usuario = document.getElementById("usuario").value;
  const password = document.getElementById("password").value;

  fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.ok) {
      localStorage.setItem("usuario", usuario);
      localStorage.setItem("rol", data.rol);
      window.location.href = "dashboard.html";
    } else {
      alert("Credenciales incorrectas");
    }
  })
  .catch(() => alert("Error de conexión"));
  
}


