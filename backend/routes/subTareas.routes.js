const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  obtenerSubTareas,
  crearSubTarea,
  actualizarSubTarea,
  eliminarSubTarea,
  responderSubTarea,
} = require("../controllers/subTareaController");
const { verificarToken, permitirRoles } = require("../../src/middleware/auth");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

router.get("/", verificarToken, permitirRoles("SUPERADMIN", "ADMIN"), obtenerSubTareas);
router.post("/", verificarToken, permitirRoles("SUPERADMIN", "ADMIN"), upload.single("archivo"), crearSubTarea);
router.put("/:id", verificarToken, permitirRoles("SUPERADMIN", "ADMIN"), actualizarSubTarea);
router.post("/:id/respuesta", verificarToken, permitirRoles("SUPERADMIN", "ADMIN"), upload.single("archivo"), responderSubTarea);
router.delete("/:id", verificarToken, permitirRoles("SUPERADMIN", "ADMIN"), eliminarSubTarea);

module.exports = router;