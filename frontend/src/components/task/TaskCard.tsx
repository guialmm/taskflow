import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import type { Task } from "../../types";
import Avatar from "../ui/Avatar";

const priorityStyles: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

interface Props {
  task: Task;
  onClick: () => void;
}

export default function TaskCard({ task, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isDone = task.status === "done";

  let deadlineLabel = "";
  let deadlineClass = "text-gray-400";
  if (task.deadline) {
    const dl = parseISO(task.deadline);
    deadlineLabel = format(dl, "MMM d");
    if (!isDone) {
      const days = differenceInCalendarDays(dl, new Date());
      if (days < 0) deadlineClass = "text-red-600 font-medium";
      else if (days <= 3) deadlineClass = "text-amber-600 font-medium";
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`card p-3 cursor-pointer hover:shadow-md active:shadow-sm transition-all select-none ${isDone ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-1.5">
        {isDone && <span className="text-green-500 text-sm flex-shrink-0 mt-0.5">✓</span>}
        <p className={`text-sm font-medium leading-snug ${isDone ? "line-through text-gray-500" : "text-gray-900"}`}>
          {task.title}
        </p>
      </div>

      {task.description && (
        <p className="mt-1 text-xs text-gray-400 line-clamp-2">{task.description}</p>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className={`badge ${priorityStyles[task.priority]}`}>{task.priority}</span>
        <div className="flex items-center gap-2">
          {deadlineLabel && (
            <span className={`text-xs ${deadlineClass}`}>{deadlineLabel}</span>
          )}
          {task.assignee && (
            <Avatar username={task.assignee.username} color={task.assignee.avatar_color} size="sm" />
          )}
        </div>
      </div>
    </div>
  );
}
