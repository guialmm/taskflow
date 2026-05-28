import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Member, Task, TaskStatus } from "../../types";
import TaskCard from "../task/TaskCard";

const columnConfig: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: "To Do", color: "bg-gray-100 text-gray-600" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-600" },
  done: { label: "Done", color: "bg-green-100 text-green-600" },
};

interface Props {
  status: TaskStatus;
  tasks: Task[];
  members: Member[];
  onAddTask: (status: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
}

export default function KanbanColumn({ status, tasks, onAddTask, onTaskClick }: Props) {
  const { label, color } = columnConfig[status];
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`badge ${color} font-semibold`}>{label}</span>
          <span className="text-xs text-gray-400">{tasks.length}</span>
        </div>
        <button
          onClick={() => onAddTask(status)}
          className="text-gray-400 hover:text-primary-600 text-lg leading-none font-medium transition-colors"
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
            className="flex flex-col items-center justify-center min-h-[80px] rounded-xl border-2 border-dashed border-gray-200 text-center hover:border-primary-300 hover:bg-primary-50 transition-colors group"
          >
            <span className="text-xs text-gray-400 group-hover:text-primary-500">+ Add task</span>
          </button>
        )}
      </div>
    </div>
  );
}
