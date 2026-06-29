const express = require("express");
const router = express.Router();
const {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
} = require("../controllers/usuarioController");
const { verificarToken, permitirRoles } = require("../../src/middleware/auth");

router.get("/", verificarToken, obtenerUsuarios);
router.get("/:id", verificarToken, obtenerUsuarioPorId);
router.post("/", verificarToken, permitirRoles("SUPERADMIN"), crearUsuario);
router.put("/:id", verificarToken, permitirRoles("SUPERADMIN"), actualizarUsuario);
router.delete("/:id", verificarToken, permitirRoles("SUPERADMIN"), eliminarUsuario);

module.exports = router;