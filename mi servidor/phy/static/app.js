// ===== LOGIN =====
async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const msg = document.getElementById("login-msg");

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (res.ok) {
    msg.textContent = "✅ Login exitoso";
    msg.style.color = "green";
  } else {
    msg.textContent = "❌ Usuario o contraseña incorrectos";
    msg.style.color = "red";
  }
}

// ===== CHAT =====
function toggleChat() {
  const box = document.getElementById("chat-box");
  box.style.display = box.style.display === "block" ? "none" : "block";
}

document.getElementById("chat-input").addEventListener("keypress", async function (e) {
  if (e.key === "Enter") {
    const input = e.target;
    const message = input.value;
    if (!message) return;

    const messages = document.getElementById("chat-messages");
    messages.innerHTML += `<p><b>Tú:</b> ${message}</p>`;
    input.value = "";

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    messages.innerHTML += `<p><b>BarpoChat:</b> ${data.reply}</p>`;
    messages.scrollTop = messages.scrollHeight;
  }
});
