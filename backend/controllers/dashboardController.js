const Task = require("../models/Task");
const Project = require("../models/Project");

// ─── @route   GET /api/dashboard ─────────────────────────────────────────────
// ─── @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === "admin";
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build task query based on role
    const taskQuery = isAdmin
      ? { createdBy: userId }
      : { assignedTo: userId };

    const [totalTasks, completedTasks, pendingTasks, inProgressTasks, overdueTasks, totalProjects] =
      await Promise.all([
        Task.countDocuments(taskQuery),
        Task.countDocuments({ ...taskQuery, status: "Completed" }),
        Task.countDocuments({ ...taskQuery, status: "Pending" }),
        Task.countDocuments({ ...taskQuery, status: "In Progress" }),
        // Overdue: dueDate is in the past AND task is not completed
        Task.countDocuments({
          ...taskQuery,
          dueDate: { $lt: today },
          status: { $ne: "Completed" },
        }),
        isAdmin
          ? Project.countDocuments({ createdBy: userId })
          : Project.countDocuments({ members: userId }),
      ]);

    // Recent tasks (last 5)
    const recentTasks = await Task.find(taskQuery)
      .populate("project", "name")
      .populate("assignedTo", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        overdueTasks,
        totalProjects,
      },
      recentTasks,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
