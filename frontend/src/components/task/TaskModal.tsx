import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { Member, Task, TaskPriority, TaskStatus } from "../../types";
import Modal from "../ui/Modal";

interface FormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string;
  assignee_id: string;
}

interface Props {
  task?: Task;
  defaultStatus?: TaskStatus;
  members: Member[];
  onClose: () => void;
  onSave: (data: Partial<FormData>) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export default function TaskModal({ task, defaultStatus = "todo", members, onClose, onSave, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const submitRef = useRef<HTMLButtonElement>(null);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? defaultStatus,
      priority: task?.priority ?? "medium",
      deadline: task?.deadline?.slice(0, 10) ?? "",
      assignee_id: task?.assignee?.id?.toString() ?? "",
    },
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        submitRef.current?.click();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const onSubmit = async (data: FormData) => {
    await onSave({
      ...data,
      assignee_id: data.assignee_id || undefined,
      deadline: data.deadline || undefined,
    });
  };

  return (
    <Modal title={task ? "Edit Task" : "New Task"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Title *</label>
          <input className="input" placeholder="Task title" {...register("title", { required: true })} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Description</label>
          <textarea className="input resize-none" rows={3} placeholder="Details..." {...register("description")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Status</label>
            <select className="input" {...register("status")}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Priority</label>
            <select className="input" {...register("priority")}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Deadline</label>
            <input type="date" className="input" {...register("deadline")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Assignee</label>
            <select className="input" {...register("assignee_id")}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user.id} value={m.user.id}>{m.user.username}</option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-xs text-gray-400">Tip: Ctrl+Enter to save</p>

        {confirmDelete ? (
          <div className="flex items-center gap-2 pt-1">
            <span className="flex-1 text-xs text-red-600">Delete this task?</span>
            <button type="button" onClick={() => setConfirmDelete(false)} className="btn-secondary text-xs px-3 py-1.5">
              Cancel
            </button>
            <button type="button" onClick={onDelete} className="btn-danger text-xs px-3 py-1.5">
              Confirm
            </button>
          </div>
        ) : (
          <div className="flex gap-2 pt-1">
            {onDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="btn-danger text-xs px-3 py-1.5"
              >
                Delete
              </button>
            )}
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button ref={submitRef} type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </form>
    </Modal>
  );
}
