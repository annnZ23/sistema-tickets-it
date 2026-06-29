const express = require("express");
const router = express.Router();
const {
  obtenerAreas,
  obtenerAreaPorId,
  crearArea,
  actualizarArea,
  eliminarArea,
} = require("../controllers/areaController");
const { verificarToken, permitirRoles } = require("../../src/middleware/auth");

router.get("/", verificarToken, obtenerAreas);
router.get("/:id", verificarToken, obtenerAreaPorId);
router.post("/", verificarToken, permitirRoles("SUPERADMIN"), crearArea);
router.put("/:id", verificarToken, permitirRoles("SUPERADMIN"), actualizarArea);
router.delete("/:id", verificarToken, permitirRoles("SUPERADMIN"), eliminarArea);

module.exports = router;