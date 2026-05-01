import { Calendar, User, Tag } from "lucide-react";

const statusStyles = {
  Pending: "bg-yellow-100 text-yellow-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
};

const priorityStyles = {
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-orange-100 text-orange-600",
  High: "bg-red-100 text-red-600",
};

const TaskCard = ({ task, onStatusChange, isAdmin, onDelete, onClick }) => {
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "Completed";

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug flex-1">
          {task.title}
        </h3>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${statusStyles[task.status]}`}
        >
          {task.status}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityStyles[task.priority]}`}
        >
          {task.priority}
        </span>
        {task.project?.name && (
          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {task.project.name}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          {task.assignedTo && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {task.assignedTo.name}
            </span>
          )}
          {task.dueDate && (
            <span
              className={`flex items-center gap-1 ${isOverdue ? "text-red-500 font-medium" : ""}`}
            >
              <Calendar className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString()}
              {isOverdue && " (Overdue)"}
            </span>
          )}
        </div>
      </div>

      {/* Quick status update for members */}
      {!isAdmin && task.assignedTo && (
        <div className="mt-3 pt-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task._id, e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option>Pending</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>
        </div>
      )}

      {/* Admin delete button */}
      {isAdmin && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onDelete(task._id)}
            className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
