import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Member, Task, TaskStatus } from "../../types";
import TaskCard from "../task/TaskCard";

const columnConfig: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: "To Do", color: "bg-navy-700 text-slate-400" },
  in_progress: { label: "In Progress", color: "bg-blue-900/40 text-blue-400" },
  done: { label: "Done", color: "bg-emerald-900/40 text-emerald-400" },
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
  const { label, color } = columnConfig[status];
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div
      className="flex flex-col w-72 flex-shrink-0 animate-fade-in-up"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`badge ${color} font-semibold`}>{label}</span>
          <span className="text-xs text-slate-500">{tasks.length}</span>
        </div>
        <button
          onClick={() => onAddTask(status)}
          className="text-slate-500 hover:text-primary-400 text-lg leading-none font-medium transition-all hover:scale-110"
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
            className="flex flex-col items-center justify-center min-h-[80px] rounded-xl border-2 border-dashed border-navy-600 text-center hover:border-primary-600/50 hover:bg-primary-900/10 transition-all duration-200 group"
          >
            <span className="text-xs text-slate-500 group-hover:text-primary-400 transition-colors">+ Add task</span>
          </button>
        )}
      </div>
    </div>
  );
}
