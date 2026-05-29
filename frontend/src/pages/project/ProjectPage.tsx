import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { format, parseISO } from "date-fns";
import { getProject, inviteMember, updateProject } from "../../api/projects";
import { createTask, deleteTask, getTasks, updateTask } from "../../api/tasks";
import { useAuthStore } from "../../store/auth";
import type { Member, Project, Task, TaskPriority, TaskStatus } from "../../types";
import KanbanColumn from "../../components/board/KanbanColumn";
import TaskModal from "../../components/task/TaskModal";
import Modal from "../../components/ui/Modal";
import Avatar from "../../components/ui/Avatar";
import { useForm } from "react-hook-form";

const STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];
const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#22c55e", "#14b8a6", "#3b82f6"];

const priorityBadge: Record<TaskPriority, string> = {
  low: "bg-emerald-900/40 text-emerald-400",
  medium: "bg-amber-900/40 text-amber-400",
  high: "bg-red-900/40 text-red-400",
};
const statusBadge: Record<TaskStatus, string> = {
  todo: "bg-navy-700 text-slate-400",
  in_progress: "bg-blue-900/40 text-blue-400",
  done: "bg-emerald-900/40 text-emerald-400",
};
const statusLabel: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

interface EditProjectForm {
  name: string;
  description: string;
  color: string;
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);

  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "">("");
  const [filterAssignee, setFilterAssignee] = useState<number | "">("");
  const [view, setView] = useState<"kanban" | "list">("kanban");

  const editForm = useForm<EditProjectForm>();
  const editProjectErrors = editForm.formState.errors;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    getProject(projectId).then(setProject);
    getTasks(projectId).then(setTasks);
  }, [projectId]);

  const filteredTasks = tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterAssignee && t.assignee?.id !== filterAssignee) return false;
    return true;
  });

  const tasksByStatus = useCallback(
    (status: TaskStatus) =>
      filteredTasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position),
    [filteredTasks]
  );

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;

    const overId = over.id as string | number;
    const overStatus = STATUSES.includes(overId as TaskStatus)
      ? (overId as TaskStatus)
      : tasks.find((t) => t.id === overId)?.status;

    if (!overStatus) return;
    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask || activeTask.status === overStatus) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === active.id ? { ...t, status: overStatus } : t))
    );
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id)!;
    const overId = over.id as string | number;
    const overStatus = STATUSES.includes(overId as TaskStatus)
      ? (overId as TaskStatus)
      : tasks.find((t) => t.id === overId)?.status ?? activeTask.status;

    const columnTasks = tasks.filter((t) => t.status === overStatus).sort((a, b) => a.position - b.position);
    const oldIdx = columnTasks.findIndex((t) => t.id === active.id);
    const newIdx = columnTasks.findIndex((t) => t.id === overId);
    const reordered = oldIdx !== -1 && newIdx !== -1 ? arrayMove(columnTasks, oldIdx, newIdx) : columnTasks;

    const updated = reordered.map((t, i) => ({ ...t, position: i, status: overStatus }));
    setTasks((prev) => [
      ...prev.filter((t) => t.status !== overStatus),
      ...updated,
    ]);

    await updateTask(projectId, activeTask.id, {
      status: overStatus,
      position: updated.findIndex((t) => t.id === activeTask.id),
    });
  };

  const handleCreateTask = async (data: any) => {
    const task = await createTask(projectId, data);
    setTasks((prev) => [...prev, task]);
    setNewTaskStatus(null);
  };

  const handleUpdateTask = async (data: any) => {
    const updated = await updateTask(projectId, selectedTask!.id, {
      ...data,
      assignee_id: data.assignee_id ? Number(data.assignee_id) : null,
    });
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTask(null);
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    await deleteTask(projectId, selectedTask.id);
    setTasks((prev) => prev.filter((t) => t.id !== selectedTask.id));
    setSelectedTask(null);
  };

  const handleInvite = async () => {
    try {
      setInviteError("");
      setInviteSuccess(false);
      await inviteMember(projectId, inviteUsername);
      const updated = await getProject(projectId);
      setProject(updated);
      setInviteUsername("");
      setInviteSuccess(true);
      setTimeout(() => setShowInvite(false), 1200);
    } catch (e: any) {
      setInviteError(e.response?.data?.detail ?? "Failed to invite");
    }
  };

  const openEditProject = () => {
    if (!project) return;
    editForm.reset({ name: project.name, description: project.description ?? "", color: project.color });
    setShowEditProject(true);
  };

  const handleEditProject = async (data: EditProjectForm) => {
    const updated = await updateProject(projectId, data);
    setProject((prev) => prev ? { ...prev, ...updated } : updated);
    setShowEditProject(false);
  };

  if (!project) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3 text-slate-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-navy-600 border-t-primary-500" />
        Loading...
      </div>
    </div>
  );

  const members: Member[] = project.members;
  const isOwner = project.owner_id === user?.id;
  const editColor = editForm.watch("color");

  const hasFilters = search || filterPriority || filterAssignee;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="glass-nav sticky top-0 z-10">
      <header className="px-6 py-3">
        <div className="mx-auto flex max-w-full items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">← Projects</Link>
            <div className="h-4 w-px bg-navy-600" />
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md flex-shrink-0 shadow-sm" style={{ backgroundColor: project.color }} />
              <h1 className="text-base font-semibold text-slate-100">{project.name}</h1>
              {isOwner && (
                <button
                  onClick={openEditProject}
                  className="text-slate-500 hover:text-slate-300 text-xs ml-1 transition-colors"
                  title="Edit project"
                >
                  ✎
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-navy-600 overflow-hidden text-xs">
              <button
                onClick={() => setView("kanban")}
                className={`px-3 py-1.5 transition-colors ${view === "kanban" ? "bg-primary-500 text-white" : "bg-navy-700 text-slate-400 hover:bg-navy-600"}`}
              >
                Board
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-3 py-1.5 transition-colors ${view === "list" ? "bg-primary-500 text-white" : "bg-navy-700 text-slate-400 hover:bg-navy-600"}`}
              >
                List
              </button>
            </div>
            <div className="flex -space-x-1">
              {members.slice(0, 5).map((m) => (
                <Avatar key={m.id} username={m.user.username} color={m.user.avatar_color} size="sm" />
              ))}
            </div>
            {isOwner && (
              <button onClick={() => { setInviteSuccess(false); setInviteError(""); setShowInvite(true); }} className="btn-secondary text-xs px-3 py-1.5">
                + Invite
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="border-t border-white/[0.05] px-6 py-2">
        <div className="flex items-center gap-3 flex-wrap">
          <input
            className="input max-w-[200px] py-1 text-xs"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-1">
            {(["", "low", "medium", "high"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${filterPriority === p ? "bg-primary-500 text-white border-primary-500" : "border-navy-600 text-slate-400 hover:border-navy-500 hover:text-slate-300"}`}
              >
                {p || "All"}
              </button>
            ))}
          </div>
          <select
            className="input max-w-[160px] py-1 text-xs"
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Any assignee</option>
            {members.map((m) => (
              <option key={m.user.id} value={m.user.id}>{m.user.username}</option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setFilterPriority(""); setFilterAssignee(""); }}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear filters
            </button>
          )}
          <span className="text-xs text-slate-500 ml-auto">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
      </div>

      <main className="flex-1 overflow-x-auto p-6">
        {view === "kanban" ? (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
            <div className="flex gap-5 min-h-full">
              {STATUSES.map((status, i) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  tasks={tasksByStatus(status)}
                  members={members}
                  onAddTask={(s) => setNewTaskStatus(s)}
                  onTaskClick={setSelectedTask}
                  index={i}
                />
              ))}
            </div>
          </DndContext>
        ) : (
          <div className="card overflow-hidden animate-fade-in-up">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-600 bg-navy-700">
                  <th className="text-left py-2.5 px-4 font-medium text-slate-400">Title</th>
                  <th className="text-left py-2.5 px-4 font-medium text-slate-400">Status</th>
                  <th className="text-left py-2.5 px-4 font-medium text-slate-400">Priority</th>
                  <th className="text-left py-2.5 px-4 font-medium text-slate-400">Assignee</th>
                  <th className="text-left py-2.5 px-4 font-medium text-slate-400">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks
                  .slice()
                  .sort((a, b) => {
                    const so: Record<TaskStatus, number> = { todo: 0, in_progress: 1, done: 2 };
                    return so[a.status] - so[b.status] || a.position - b.position;
                  })
                  .map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="border-b border-navy-700 hover:bg-navy-700 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <span className={`font-medium ${task.status === "done" ? "line-through text-slate-500" : "text-slate-200"}`}>
                          {task.status === "done" && <span className="text-emerald-400 mr-1.5">✓</span>}
                          {task.title}
                        </span>
                        {task.description && (
                          <span className="block text-xs text-slate-500 truncate max-w-[300px]">{task.description}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`badge ${statusBadge[task.status]}`}>{statusLabel[task.status]}</span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`badge ${priorityBadge[task.priority]}`}>{task.priority}</span>
                      </td>
                      <td className="py-2.5 px-4">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar username={task.assignee.username} color={task.assignee.avatar_color} size="sm" />
                            <span className="text-xs text-slate-400">{task.assignee.username}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        {task.deadline ? (
                          <span className="text-xs text-slate-400">{format(parseISO(task.deadline), "MMM d, yyyy")}</span>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {filteredTasks.length === 0 && (
              <div className="text-center py-10 text-slate-500">
                <p className="text-2xl mb-2">📋</p>
                <p className="text-sm">{hasFilters ? "No tasks match your filters" : "No tasks yet. Switch to Board view to add one."}</p>
              </div>
            )}
          </div>
        )}
      </main>

      {newTaskStatus && (
        <TaskModal
          defaultStatus={newTaskStatus}
          members={members}
          onClose={() => setNewTaskStatus(null)}
          onSave={handleCreateTask}
        />
      )}

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          members={members}
          onClose={() => setSelectedTask(null)}
          onSave={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}

      {showInvite && (
        <Modal title="Invite Member" onClose={() => setShowInvite(false)}>
          <div className="space-y-3">
            {inviteSuccess && <p className="text-sm text-emerald-400 font-medium">Member invited successfully!</p>}
            {inviteError && <p className="text-sm text-red-400">{inviteError}</p>}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Username</label>
              <input
                className="input"
                placeholder="Enter username"
                value={inviteUsername}
                onChange={(e) => setInviteUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowInvite(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleInvite} className="btn-primary flex-1">Invite</button>
            </div>
          </div>
        </Modal>
      )}

      {showEditProject && (
        <Modal title="Edit Project" onClose={() => setShowEditProject(false)}>
          <form onSubmit={editForm.handleSubmit(handleEditProject)} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Name *</label>
              <input className={`input ${editProjectErrors.name ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`} {...editForm.register("name", { required: true })} />
              {editProjectErrors.name && <p className="mt-1 text-xs text-red-400">Name is required</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Description</label>
              <textarea className="input resize-none" rows={2} {...editForm.register("description")} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Color</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => editForm.setValue("color", c)}
                    className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${editColor === c ? "border-white scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowEditProject(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
