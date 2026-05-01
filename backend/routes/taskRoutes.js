const express = require("express");
const { body } = require("express-validator");
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");
const { protect, authorizeRoles } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

router.use(protect);

// GET  /api/tasks?projectId=xxx
router.get("/", getTasks);

// POST /api/tasks
router.post(
  "/",
  authorizeRoles("admin"),
  [
    body("title").trim().notEmpty().withMessage("Task title is required"),
    body("projectId").notEmpty().withMessage("projectId is required"),
  ],
  validate,
  createTask
);

// GET  /api/tasks/:id
router.get("/:id", getTaskById);

// PUT  /api/tasks/:id
router.put("/:id", updateTask);

// DELETE /api/tasks/:id
router.delete("/:id", authorizeRoles("admin"), deleteTask);

module.exports = router;
