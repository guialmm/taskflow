import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProjects, createProject, updateProject, deleteProject } from "../../api/projects";
import { useAuthStore } from "../../store/auth";
import type { Project } from "../../types";
import Modal from "../../components/ui/Modal";
import Avatar from "../../components/ui/Avatar";
import { useForm } from "react-hook-form";

interface ProjectForm {
  name: string;
  description: string;
  color: string;
}

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#22c55e", "#14b8a6", "#3b82f6"];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const createForm = useForm<ProjectForm>({ defaultValues: { color: COLORS[0] } });
  const editForm = useForm<ProjectForm>();
  const createColor = createForm.watch("color");
  const editColor = editForm.watch("color");
  const createErrors = createForm.formState.errors;
  const editErrors = editForm.formState.errors;

  useEffect(() => {
    getProjects().then(setProjects);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const onCreateProject = async (data: ProjectForm) => {
    const project = await createProject(data);
    setProjects((prev) => [project, ...prev]);
    createForm.reset({ color: COLORS[0] });
    setShowCreate(false);
  };

  const openEdit = (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    editForm.reset({ name: project.name, description: project.description ?? "", color: project.color });
    setEditingProject(project);
  };

  const onEditProject = async (data: ProjectForm) => {
    if (!editingProject) return;
    const updated = await updateProject(editingProject.id, data);
    setProjects((prev) => prev.map((p) => (p.id === editingProject.id ? { ...p, ...updated } : p)));
    setEditingProject(null);
  };

  const onDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    if (!confirm("Delete this project and all its tasks? This cannot be undone.")) return;
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-navy-600 bg-navy-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-white font-bold text-sm shadow-md shadow-primary-500/30">T</div>
            <span className="text-lg font-bold text-slate-100">TaskFlow</span>
          </div>
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-navy-700 transition-colors"
            >
              {user && <Avatar username={user.username} color={user.avatar_color} />}
              <span className="text-sm text-slate-300">{user?.username}</span>
              <span className="text-slate-500 text-xs">▾</span>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-navy-600 bg-navy-700 shadow-xl shadow-black/40 py-1 z-20 animate-slide-down">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-navy-600 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  Profile
                </Link>
                <hr className="my-1 border-navy-600" />
                <button
                  onClick={() => { logout(); navigate("/login"); }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-950/30 transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6 animate-fade-in-up">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">My Projects</h1>
            <p className="text-sm text-slate-400 mt-1">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            + New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-slate-400">No projects yet. Create your first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="card p-5 hover:shadow-xl hover:shadow-black/40 hover:-translate-y-1 hover:border-navy-500 transition-all duration-200 group block animate-card-enter"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg flex-shrink-0 shadow-md" style={{ backgroundColor: p.color }} />
                    <div>
                      <h3 className="font-semibold text-slate-100 group-hover:text-primary-400 transition-colors">{p.name}</h3>
                      {p.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{p.description}</p>}
                    </div>
                  </div>
                  {p.owner_id === user?.id && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => openEdit(e, p)}
                        className="text-slate-500 hover:text-primary-400 text-sm px-1 transition-colors"
                        title="Edit project"
                      >
                        ✎
                      </button>
                      <button
                        onClick={(e) => onDelete(e, p.id)}
                        className="text-slate-500 hover:text-red-400 text-lg leading-none px-1 transition-colors"
                        title="Delete project"
                      >
                        &times;
                      </button>
                    </div>
                  )}
                </div>

                {p.tasks_total > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-500">{p.tasks_done}/{p.tasks_total} done</span>
                      <span className="text-xs text-slate-500">{Math.round((p.tasks_done / p.tasks_total) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-navy-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all shadow-sm shadow-primary-500/40"
                        style={{ width: `${(p.tasks_done / p.tasks_total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  {p.members.slice(0, 4).map((m) => (
                    <Avatar key={m.id} username={m.user.username} color={m.user.avatar_color} size="sm" />
                  ))}
                  {p.members.length > 4 && (
                    <span className="text-xs text-slate-500">+{p.members.length - 4}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <Modal title="New Project" onClose={() => setShowCreate(false)}>
          <form onSubmit={createForm.handleSubmit(onCreateProject)} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Name *</label>
              <input className={`input ${createErrors.name ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`} placeholder="My awesome project" {...createForm.register("name", { required: true })} />
              {createErrors.name && <p className="mt-1 text-xs text-red-400">Name is required</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Description</label>
              <textarea className="input resize-none" rows={2} placeholder="What's this project about?" {...createForm.register("description")} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Color</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => createForm.setValue("color", c)}
                    className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${createColor === c ? "border-white scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">Create</button>
            </div>
          </form>
        </Modal>
      )}

      {editingProject && (
        <Modal title="Edit Project" onClose={() => setEditingProject(null)}>
          <form onSubmit={editForm.handleSubmit(onEditProject)} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Name *</label>
              <input className={`input ${editErrors.name ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`} {...editForm.register("name", { required: true })} />
              {editErrors.name && <p className="mt-1 text-xs text-red-400">Name is required</p>}
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
              <button type="button" onClick={() => setEditingProject(null)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
