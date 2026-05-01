const Project = require("../models/Project");
const User = require("../models/User");

// ─── @route   POST /api/projects ─────────────────────────────────────────────
// ─── @access  Private / Admin
const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description,
      createdBy: req.user._id,
      members: [req.user._id], // creator is automatically a member
    });

    await project.populate("createdBy", "name email");

    res.status(201).json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// ─── @route   GET /api/projects ──────────────────────────────────────────────
// ─── @access  Private
const getProjects = async (req, res, next) => {
  try {
    // Admins see projects they created; members see projects they belong to
    const query =
      req.user.role === "admin"
        ? { createdBy: req.user._id }
        : { members: req.user._id };

    const projects = await Project.find(query)
      .populate("createdBy", "name email")
      .populate("members", "name email role")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: projects.length, projects });
  } catch (error) {
    next(error);
  }
};

// ─── @route   GET /api/projects/:id ──────────────────────────────────────────
// ─── @access  Private
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("members", "name email role");

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Only members of the project can view it
    const isMember = project.members.some(
      (m) => m._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to view this project" });
    }

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// ─── @route   POST /api/projects/:id/members ─────────────────────────────────
// ─── @access  Private / Admin
const addMember = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Only the project creator can add members
    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Only the project admin can add members" });
    }

    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Prevent duplicate members
    if (project.members.includes(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "User is already a member" });
    }

    project.members.push(userId);
    await project.save();
    await project.populate("members", "name email role");

    res.json({ success: true, message: "Member added", project });
  } catch (error) {
    next(error);
  }
};

// ─── @route   DELETE /api/projects/:id/members/:userId ───────────────────────
// ─── @access  Private / Admin
const removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Only the project admin can remove members" });
    }

    // Cannot remove the creator
    if (req.params.userId === project.createdBy.toString()) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot remove the project creator" });
    }

    project.members = project.members.filter(
      (m) => m.toString() !== req.params.userId
    );
    await project.save();

    res.json({ success: true, message: "Member removed", project });
  } catch (error) {
    next(error);
  }
};

// ─── @route   GET /api/projects/users ────────────────────────────────────────
// ─── @access  Private / Admin  (to populate member dropdowns)
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select(
      "name email role"
    );
    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  addMember,
  removeMember,
  getAllUsers,
};
