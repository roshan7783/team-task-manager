const express = require("express");
const { body } = require("express-validator");
const {
  createProject,
  getProjects,
  getProjectById,
  addMember,
  removeMember,
  getAllUsers,
} = require("../controllers/projectController");
const { protect, authorizeRoles } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

// All project routes require authentication
router.use(protect);

// GET  /api/projects/users  — list all users (for admin member-picker)
router.get("/users", authorizeRoles("admin"), getAllUsers);

// GET  /api/projects
router.get("/", getProjects);

// POST /api/projects
router.post(
  "/",
  authorizeRoles("admin"),
  [body("name").trim().notEmpty().withMessage("Project name is required")],
  validate,
  createProject
);

// GET  /api/projects/:id
router.get("/:id", getProjectById);

// POST /api/projects/:id/members
router.post(
  "/:id/members",
  authorizeRoles("admin"),
  [body("userId").notEmpty().withMessage("userId is required")],
  validate,
  addMember
);

// DELETE /api/projects/:id/members/:userId
router.delete("/:id/members/:userId", authorizeRoles("admin"), removeMember);

module.exports = router;
