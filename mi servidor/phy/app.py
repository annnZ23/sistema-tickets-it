from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    usuario = data.get("username")
    password = data.get("password")

    # Usuario de prueba (luego se conecta a BD o JSON)
    if usuario == "admin" and password == "1234":
        return jsonify({"success": True})

    return jsonify({"success": False, "message": "Credenciales incorrectas"}), 401


# ===== BARPOCHAT =====
@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    message = data.get("message", "").lower()

    if "hola" in message:
        reply = "¡Hola! Soy BarpoChat ¿En qué puedo ayudarte?"
    elif "no enciende" in message:
        reply = "Revisa el cargador y mantén presionado el botón 10 segundos."
    elif "contraseña" in message:
        reply = "Puedes solicitar el cambio de contraseña al administrador IT."
    elif "soporte" in message:
        reply = "El soporte técnico está disponible de 7:30 a.m. a 4:30 p.m."    
    if "problemas de red" in message:
        reply = ¿Quieres comunicarte con un agente de soporte?"
    elif "problemas con mi impresora" in message:
        reply = "Reiniciala con el boton de apagado mantenlo presionado por 10 segundos, si el problema no se soluciona contactar a soporte tecnico "
    elif "usuario bloqueado" in message:
        reply = "Contactar a soporte tecnico."
    elif "mantenimiento de equipo" in message:
        reply = "El soporte técnico está disponible de 7:30 a.m. a 4:30 p.m."


    return jsonify({"reply": reply})


# ===== HOME =====
@app.route("/")
def home():
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True)
