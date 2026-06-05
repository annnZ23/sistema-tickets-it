function login() {
  fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      usuario: document.getElementById("usuario").value,
      password: document.getElementById("password").value
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.ok) {
      window.location.href = "dashboard.html";
    } else {
      alert("Credenciales incorrectas");
    }
  })
  .catch(error => {
    console.error(error);
    alert("Error de conexión");
  });
}