import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import type { Task } from "../../types";
import Avatar from "../ui/Avatar";

const priorityStyles: Record<string, string> = {
  low: "bg-emerald-900/40 text-emerald-400",
  medium: "bg-amber-900/40 text-amber-400",
  high: "bg-red-900/40 text-red-400",
};

interface Props {
  task: Task;
  onClick: () => void;
}

export default function TaskCard({ task, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : 'transform 0.22s cubic-bezier(0.16,1,0.3,1), box-shadow 0.22s cubic-bezier(0.16,1,0.3,1)',
  };

  const isDone = task.status === "done";

  let deadlineLabel = "";
  let deadlineClass = "text-slate-500";
  if (task.deadline) {
    const dl = parseISO(task.deadline);
    deadlineLabel = format(dl, "MMM d");
    if (!isDone) {
      const days = differenceInCalendarDays(dl, new Date());
      if (days < 0) deadlineClass = "text-red-400 font-medium";
      else if (days <= 3) deadlineClass = "text-amber-400 font-medium";
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`card p-3 cursor-pointer select-none active:scale-[0.98]
        ${isDragging ? "opacity-40 scale-[0.97]" : ""}
        ${isDone ? "opacity-55" : ""}
      `}
      onMouseEnter={e => {
        if (!isDragging) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div className="flex items-start gap-1.5">
        {isDone && <span className="text-emerald-400 text-sm flex-shrink-0 mt-0.5">✓</span>}
        <p className={`text-sm font-medium leading-snug ${isDone ? "line-through text-slate-500" : "text-slate-100"}`}>
          {task.title}
        </p>
      </div>

      {task.description && (
        <p className="mt-1 text-xs text-slate-500 line-clamp-2">{task.description}</p>
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
