import { useEffect, useState } from "react";
import { dashboardAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import {
  CheckSquare,
  Clock,
  AlertCircle,
  ListTodo,
  FolderKanban,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";

const statusStyles = {
  Pending: "bg-yellow-100 text-yellow-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await dashboardAPI.getStats();
        setStats(data.stats);
        setRecentTasks(data.recentTasks);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      </Layout>
    );
  }

  const statCards = [
    {
      title: "Total Tasks",
      value: stats?.totalTasks ?? 0,
      icon: ListTodo,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "Completed",
      value: stats?.completedTasks ?? 0,
      icon: CheckSquare,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "In Progress",
      value: stats?.inProgressTasks ?? 0,
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Pending",
      value: stats?.pendingTasks ?? 0,
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      title: "Overdue",
      value: stats?.overdueTasks ?? 0,
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      title: "Projects",
      value: stats?.totalProjects ?? 0,
      icon: FolderKanban,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name} 👋
        </h1>
        <p className="text-gray-500 mt-1 capitalize">
          {user?.role} · Here's your overview
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      {/* Recent tasks */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Tasks</h2>
          <Link
            to="/tasks"
            className="text-sm text-indigo-600 hover:underline font-medium"
          >
            View all
          </Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <ListTodo className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No tasks yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentTasks.map((task) => {
              const isOverdue =
                task.dueDate &&
                new Date(task.dueDate) < new Date() &&
                task.status !== "Completed";

              return (
                <div
                  key={task._id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {task.project?.name}
                      {task.assignedTo && ` · ${task.assignedTo.name}`}
                      {isOverdue && (
                        <span className="text-red-500 ml-1">· Overdue</span>
                      )}
                    </p>
                  </div>
                  <span
                    className={`ml-4 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${statusStyles[task.status]}`}
                  >
                    {task.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
