import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Member, Task, TaskStatus } from "../../types";
import TaskCard from "../task/TaskCard";

const columnConfig: Record<TaskStatus, { label: string; color: string; accent: string }> = {
  todo:        { label: "To Do",       color: "bg-navy-700/60 text-slate-400",       accent: "rgba(100,116,139,0.5)" },
  in_progress: { label: "In Progress", color: "bg-blue-900/40 text-blue-400",        accent: "rgba(59,130,246,0.6)"  },
  done:        { label: "Done",        color: "bg-emerald-900/40 text-emerald-400",  accent: "rgba(16,185,129,0.6)"  },
};

interface Props {
  status: TaskStatus;
  tasks: Task[];
  members: Member[];
  onAddTask: (status: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
  index?: number;
}

export default function KanbanColumn({ status, tasks, onAddTask, onTaskClick, index = 0 }: Props) {
  const { label, color, accent } = columnConfig[status];
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div
      className="flex flex-col w-72 flex-shrink-0 animate-fade-in-up"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
    >
      <div className="mb-3 flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full flex-shrink-0"
            style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
          />
          <span className={`badge ${color} font-semibold`}>{label}</span>
          <span className="text-xs text-slate-500 tabular-nums">{tasks.length}</span>
        </div>
        <button
          onClick={() => onAddTask(status)}
          className="text-slate-500 hover:text-primary-400 text-xl leading-none font-light transition-all hover:scale-110 hover:rotate-90 duration-200"
          title="Add task"
        >
          +
        </button>
      </div>

      <div ref={setNodeRef} className="flex flex-col gap-2 min-h-[120px]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <button
            onClick={() => onAddTask(status)}
            className="flex flex-col items-center justify-center min-h-[80px] rounded-xl text-center transition-all duration-250 group"
            style={{
              border: '1.5px dashed rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.015)',
              transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = `${accent}`;
              e.currentTarget.style.background = 'rgba(59,130,246,0.04)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.015)';
            }}
          >
            <span className="text-xs text-slate-500 group-hover:text-primary-400 transition-colors">+ Add task</span>
          </button>
        )}
      </div>
    </div>
  );
}
