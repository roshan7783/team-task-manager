import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { taskAPI, projectAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import TaskCard from "../components/TaskCard";
import Modal from "../components/Modal";
import toast from "react-hot-toast";
import { Plus, CheckSquare, Filter } from "lucide-react";

const Tasks = () => {
  const { isAdmin, user } = useAuth();
  const [searchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get("projectId");

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterProject, setFilterProject] = useState(projectIdFromUrl || "");
  const [filterStatus, setFilterStatus] = useState("");

  // Create task modal
  const [createOpen, setCreateOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    projectId: projectIdFromUrl || "",
    assignedTo: "",
    dueDate: "",
    priority: "Medium",
  });
  const [creating, setCreating] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data } = await taskAPI.getAll(filterProject || undefined);
      setTasks(data.tasks);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data } = await projectAPI.getAll();
      setProjects(data.projects);
    } catch {
      console.error("Failed to load projects");
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [filterProject]);

  // When project changes in the create form, load its members
  useEffect(() => {
    const loadMembers = async () => {
      if (!taskForm.projectId) {
        setProjectMembers([]);
        return;
      }
      try {
        const { data } = await projectAPI.getById(taskForm.projectId);
        setProjectMembers(data.project.members);
      } catch {
        setProjectMembers([]);
      }
    };
    if (isAdmin) loadMembers();
  }, [taskForm.projectId, isAdmin]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        ...taskForm,
        assignedTo: taskForm.assignedTo || undefined,
        dueDate: taskForm.dueDate || undefined,
      };
      const { data } = await taskAPI.create(payload);
      setTasks((prev) => [data.task, ...prev]);
      setCreateOpen(false);
      setTaskForm({
        title: "",
        description: "",
        projectId: filterProject || "",
        assignedTo: "",
        dueDate: "",
        priority: "Medium",
      });
      toast.success("Task created!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      const { data } = await taskAPI.update(taskId, { status });
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? data.task : t))
      );
      toast.success("Status updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm("Delete this task?")) return;
    try {
      await taskAPI.delete(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      toast.success("Task deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete task");
    }
  };

  // Apply client-side status filter
  const filteredTasks = filterStatus
    ? tasks.filter((t) => t.status === filterStatus)
    : tasks;

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 mt-1">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="text-sm text-gray-700 bg-transparent focus:outline-none"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm text-gray-700 bg-transparent focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option>Pending</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No tasks found</p>
          {isAdmin && (
            <p className="text-sm mt-1">Create a task to get started</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              isAdmin={isAdmin}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create New Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Title *
            </label>
            <input
              type="text"
              value={taskForm.title}
              onChange={(e) =>
                setTaskForm((p) => ({ ...p, title: e.target.value }))
              }
              required
              placeholder="Task title"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              value={taskForm.description}
              onChange={(e) =>
                setTaskForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={2}
              placeholder="Optional details..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Project *
            </label>
            <select
              value={taskForm.projectId}
              onChange={(e) =>
                setTaskForm((p) => ({
                  ...p,
                  projectId: e.target.value,
                  assignedTo: "",
                }))
              }
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Select project...</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Assign to
            </label>
            <select
              value={taskForm.assignedTo}
              onChange={(e) =>
                setTaskForm((p) => ({ ...p, assignedTo: e.target.value }))
              }
              disabled={!taskForm.projectId}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">Unassigned</option>
              {projectMembers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Priority
              </label>
              <select
                value={taskForm.priority}
                onChange={(e) =>
                  setTaskForm((p) => ({ ...p, priority: e.target.value }))
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Due date
              </label>
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) =>
                  setTaskForm((p) => ({ ...p, dueDate: e.target.value }))
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              {creating ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Tasks;
