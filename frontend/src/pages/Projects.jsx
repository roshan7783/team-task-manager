import { useEffect, useState } from "react";
import { projectAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import toast from "react-hot-toast";
import { Plus, FolderKanban, Users, Trash2, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Projects = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create project modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);

  // Add member modal
  const [memberModal, setMemberModal] = useState({ open: false, project: null });
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  const fetchProjects = async () => {
    try {
      const { data } = await projectAPI.getAll();
      setProjects(data.projects);
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data } = await projectAPI.create(createForm);
      setProjects((prev) => [data.project, ...prev]);
      setCreateOpen(false);
      setCreateForm({ name: "", description: "" });
      toast.success("Project created!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const openMemberModal = async (project) => {
    setMemberModal({ open: true, project });
    try {
      const { data } = await projectAPI.getAllUsers();
      // Filter out users already in the project
      const existingIds = project.members.map((m) => m._id);
      setAllUsers(data.users.filter((u) => !existingIds.includes(u._id)));
    } catch {
      toast.error("Failed to load users");
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setAddingMember(true);
    try {
      await projectAPI.addMember(memberModal.project._id, selectedUser);
      toast.success("Member added!");
      setMemberModal({ open: false, project: null });
      setSelectedUser("");
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add member");
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (projectId, userId) => {
    if (!confirm("Remove this member from the project?")) return;
    try {
      await projectAPI.removeMember(projectId, userId);
      toast.success("Member removed");
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove member");
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No projects yet</p>
          {isAdmin && (
            <p className="text-sm mt-1">Create your first project to get started</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <div
              key={project._id}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => navigate(`/tasks?projectId=${project._id}`)}
                >
                  <h3 className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Members */}
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-gray-400" />
                <div className="flex -space-x-2">
                  {project.members.slice(0, 5).map((member) => (
                    <div
                      key={member._id}
                      title={member.name}
                      className="w-7 h-7 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center"
                    >
                      <span className="text-xs font-semibold text-indigo-700">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  ))}
                  {project.members.length > 5 && (
                    <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                      <span className="text-xs text-gray-500">
                        +{project.members.length - 5}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {project.members.length} member{project.members.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/tasks?projectId=${project._id}`)}
                  className="flex-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors"
                >
                  View Tasks
                </button>
                {isAdmin && project.createdBy?._id === user._id && (
                  <button
                    onClick={() => openMemberModal(project)}
                    className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Members
                  </button>
                )}
              </div>

              {/* Member list with remove (admin only) */}
              {isAdmin && project.createdBy?._id === user._id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  {project.members.map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-gray-700">
                        {member.name}
                        <span className="text-gray-400 ml-1 capitalize">
                          ({member.role})
                        </span>
                      </span>
                      {member._id !== project.createdBy._id && (
                        <button
                          onClick={() =>
                            handleRemoveMember(project._id, member._id)
                          }
                          className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create New Project"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Project name *
            </label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, name: e.target.value }))
              }
              required
              placeholder="e.g. Website Redesign"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              value={createForm.description}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={3}
              placeholder="What is this project about?"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              {creating ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        isOpen={memberModal.open}
        onClose={() => setMemberModal({ open: false, project: null })}
        title={`Add Member — ${memberModal.project?.name}`}
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Select user
            </label>
            {allUsers.length === 0 ? (
              <p className="text-sm text-gray-400">No users available to add</p>
            ) : (
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Choose a user...</option>
                {allUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email}) — {u.role}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setMemberModal({ open: false, project: null })}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addingMember || !selectedUser}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              {addingMember ? "Adding..." : "Add Member"}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Projects;
