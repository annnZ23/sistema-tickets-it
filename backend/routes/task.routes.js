const express = require("express");
const router = express.Router();
const { getTasks, createTask, actualizarEstadoTask } = require("../controllers/taskController");
const { verificarToken, permitirRoles } = require("../../src/middleware/auth");

router.get("/", verificarToken, getTasks);
router.post("/", verificarToken, permitirRoles("SUPERADMIN"), createTask);
router.put("/:id", verificarToken, actualizarEstadoTask);

module.exports = router;