const express = require("express");
const router = express.Router();

// Cambiamos esto para resolver la referencia directa de las funciones
const { getTasks, createTask } = require("../controllers/taskController");

router.get("/", getTasks);
router.post("/", createTask);

module.exports = router;

