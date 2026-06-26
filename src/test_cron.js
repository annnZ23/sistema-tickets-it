const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { revisarEncuestasPendientes } = require("./services/encuestaCron");

console.log("Ejecutando revisión de encuestas manualmente (sin esperar el cron)...\n");

revisarEncuestasPendientes()
  .then(() => {
    console.log("\nRevisión completada.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });