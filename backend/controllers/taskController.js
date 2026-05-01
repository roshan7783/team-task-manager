const Task = require("../models/Task");
const Project = require("../models/Project");

// ─── @route   POST /api/tasks ─────────────────────────────────────────────────
// ─── @access  Private / Admin
const createTask = async (req, res, next) => {
  try {
    const { title, description, projectId, assignedTo, dueDate, priority } =
      req.body;

    // Verify project exists and user is its creator
    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Only the project admin can create tasks" });
    }

    // If assigning to someone, make sure they're a project member
    if (assignedTo) {
      const isMember = project.members.some(
        (m) => m.toString() === assignedTo
      );
      if (!isMember) {
        return res.status(400).json({
          success: false,
          message: "Assigned user is not a member of this project",
        });
      }
    }

    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignedTo: assignedTo || null,
      dueDate,
      priority,
      createdBy: req.user._id,
    });

    await task.populate([
      { path: "assignedTo", select: "name email" },
      { path: "project", select: "name" },
      { path: "createdBy", select: "name email" },
    ]);

    res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// ─── @route   GET /api/tasks?projectId=xxx ───────────────────────────────────
// ─── @access  Private
const getTasks = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    let query = {};

    if (projectId) {
      // Verify user is a member of the project
      const project = await Project.findById(projectId);
      if (!project) {
        return res
          .status(404)
          .json({ success: false, message: "Project not found" });
      }
      const isMember = project.members.some(
        (m) => m.toString() === req.user._id.toString()
      );
      if (!isMember) {
        return res
          .status(403)
          .json({ success: false, message: "Not authorized" });
      }
      query.project = projectId;
    } else {
      // No projectId: admins see all tasks they created, members see assigned tasks
      if (req.user.role === "admin") {
        query.createdBy = req.user._id;
      } else {
        query.assignedTo = req.user._id;
      }
    }

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email")
      .populate("project", "name")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    next(error);
  }
};

// ─── @route   GET /api/tasks/:id ─────────────────────────────────────────────
// ─── @access  Private
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name email")
      .populate("project", "name members")
      .populate("createdBy", "name email");

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// ─── @route   PUT /api/tasks/:id ─────────────────────────────────────────────
// ─── @access  Private (Admin: full update | Member: status only)
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    if (req.user.role === "member") {
      // Members can only update the status of tasks assigned to them
      if (
        !task.assignedTo ||
        task.assignedTo.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only update tasks assigned to you",
        });
      }
      // Only allow status field for members
      const { status } = req.body;
      if (!status) {
        return res
          .status(400)
          .json({ success: false, message: "Members can only update task status" });
      }
      task.status = status;
    } else {
      // Admin can update everything
      const { title, description, status, priority, dueDate, assignedTo } =
        req.body;
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (status) task.status = status;
      if (priority) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    }

    await task.save();
    await task.populate([
      { path: "assignedTo", select: "name email" },
      { path: "project", select: "name" },
      { path: "createdBy", select: "name email" },
    ]);

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// ─── @route   DELETE /api/tasks/:id ──────────────────────────────────────────
// ─── @access  Private / Admin
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    if (task.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Only the task creator can delete it" });
    }

    await task.deleteOne();
    res.json({ success: true, message: "Task deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask };
