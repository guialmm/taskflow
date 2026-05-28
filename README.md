# TaskFlow

A full-stack project management application with Kanban boards, built as a portfolio project to demonstrate end-to-end software development with modern technologies.

> **Stack:** FastAPI · PostgreSQL · SQLAlchemy · React 18 · TypeScript · TailwindCSS · Docker

---

## Features

### Authentication & Users
- JWT-based register/login with persistent sessions (localStorage via Zustand)
- Profile page: edit username and avatar color
- Colored initials avatar system (no image uploads required)

### Project Management
- Create, edit, and delete projects with custom colors
- Invite team members by username; role system (owner / member)
- Project cards with live task progress bars (done/total)
- Owner-only controls for edit and delete

### Kanban Board
- Three columns: **To Do**, **In Progress**, **Done**
- Drag-and-drop tasks between columns and within columns ([@dnd-kit](https://dnd-kit.com/))
- Position persisted to the database on every drag
- Empty-column placeholder with a quick-add button

### Task Management
- Create and edit tasks with title, description, priority (low / medium / high), deadline, and assignee
- Inline delete with two-step confirmation (no accidental deletions)
- Keyboard shortcuts: `Escape` to close modals, `Ctrl+Enter` / `⌘+Enter` to submit

### Task Cards
- Deadline display with color coding: red if overdue, amber if ≤ 3 days away
- Assignee avatar shown on each card
- Done tasks rendered with reduced opacity and strikethrough title

### Filtering & Views
- Search bar (title keyword), priority filter (pill buttons), assignee dropdown
- Task count updates live as filters are applied; "Clear filters" one-click reset
- **List view** alternative to Kanban: sortable table with status badges

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **FastAPI** | 0.115 | REST API framework, automatic OpenAPI docs |
| **SQLAlchemy** | 2.0 | ORM with async-ready session management |
| **Alembic** | 1.13 | Database schema migrations |
| **PostgreSQL** | 16 | Relational database (SQLite in local dev) |
| **Pydantic v2** | 2.9 | Request/response validation and serialization |
| **python-jose** | 3.3 | JWT creation and verification |
| **bcrypt** | 4.0 | Password hashing |
| **pydantic-settings** | 2.5 | Environment-based configuration |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | 18 | UI component framework |
| **TypeScript** | 5 | Static typing across the entire frontend |
| **Tailwind CSS** | 3 | Utility-first styling with custom design tokens |
| **Zustand** | 4 | Lightweight global state with `persist` middleware |
| **@dnd-kit** | 6 | Accessible drag-and-drop for the Kanban board |
| **React Hook Form** | 7 | Performant form state and validation |
| **Axios** | 1 | HTTP client with auth interceptor |
| **date-fns** | 3 | Timezone-safe date parsing and formatting |
| **Vite** | 5 | Build tool and dev server with HMR |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker + Compose** | Containerized dev and production environment |
| **Nginx** | Serves the built frontend, proxies `/api` to the backend |

---

## Getting Started

### Option 1 — Docker (recommended)

The fastest way to run the full stack. Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
git clone https://github.com/guialmm/taskflow.git
cd taskflow
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost |
| API (FastAPI) | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |

### Option 2 — Local Development

#### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (or use the SQLite default for local dev)

#### Backend

```bash
cd taskflow/backend

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set DATABASE_URL, SECRET_KEY

# Start the API server
uvicorn app.main:app --reload --port 9000
```

The API will be available at `http://localhost:9000`.  
Interactive docs at `http://localhost:9000/docs`.

#### Frontend

```bash
cd taskflow/frontend

npm install
npm run dev
```

The dev server runs at `http://localhost:5173` and proxies all `/api` requests to `http://localhost:9000`.

#### Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

```env
DATABASE_URL=postgresql://taskflow:taskflow@localhost:5432/taskflow
SECRET_KEY=generate-with-openssl-rand-hex-32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

For local dev without PostgreSQL, the app falls back to SQLite automatically when `DATABASE_URL` points to a `.db` file.

---

## API Reference

Full interactive documentation is available at `/docs` (Swagger UI) or `/redoc` when the backend is running.

### Authentication

```
POST  /auth/register     Register a new account
POST  /auth/login        Authenticate and receive a JWT token
```

### Users

```
GET   /users/me          Get the authenticated user's profile
PATCH /users/me          Update username or avatar color
```

### Projects

```
GET    /projects/                     List all projects the user belongs to
POST   /projects/                     Create a new project
GET    /projects/{id}                 Get a single project with members and task counts
PATCH  /projects/{id}                 Update project name, description, or color
DELETE /projects/{id}                 Delete project and all its tasks (owner only)
POST   /projects/{id}/members         Invite a member by username
DELETE /projects/{id}/members/{uid}   Remove a member
```

### Tasks

```
GET    /projects/{id}/tasks/              List tasks (supports ?status=, ?priority=, ?assignee_id=)
POST   /projects/{id}/tasks/             Create a task
PATCH  /projects/{id}/tasks/{task_id}    Update task fields or move between columns
DELETE /projects/{id}/tasks/{task_id}    Delete a task
```

---

## Project Structure

```
taskflow/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py              # FastAPI app, CORS, router registration
│       ├── config.py            # Pydantic Settings (reads .env)
│       ├── database.py          # SQLAlchemy engine and session factory
│       ├── dependencies.py      # get_current_user() dependency
│       ├── models/
│       │   ├── user.py          # User model
│       │   ├── project.py       # Project + ProjectMember models
│       │   └── task.py          # Task model
│       ├── schemas/
│       │   ├── user.py          # UserCreate, UserUpdate, UserOut, Token
│       │   ├── project.py       # ProjectCreate/Update/Out, MemberOut, InviteMember
│       │   └── task.py          # TaskCreate, TaskUpdate, TaskOut
│       ├── routers/
│       │   ├── auth.py          # /auth/register, /auth/login
│       │   ├── users.py         # /users/me (GET, PATCH)
│       │   ├── projects.py      # /projects/ CRUD + members
│       │   └── tasks.py         # /projects/{id}/tasks/ CRUD
│       └── services/
│           └── auth.py          # JWT helpers, password hashing
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── vite.config.ts           # Dev proxy: /api → localhost:9000
    ├── tailwind.config.js       # Custom primary color (indigo-based)
    └── src/
        ├── App.tsx              # Route definitions (public/private guards)
        ├── main.tsx             # React entry point
        ├── index.css            # Tailwind directives + component classes
        ├── api/
        │   ├── client.ts        # Axios instance with Bearer token interceptor
        │   ├── auth.ts          # register(), login(), updateProfile()
        │   ├── projects.ts      # Project CRUD + member management
        │   └── tasks.ts         # Task CRUD
        ├── store/
        │   └── auth.ts          # Zustand store: user, token, setAuth, logout, updateUser
        ├── types/
        │   └── index.ts         # Shared TypeScript interfaces
        ├── pages/
        │   ├── auth/
        │   │   ├── LoginPage.tsx
        │   │   └── RegisterPage.tsx
        │   ├── dashboard/
        │   │   └── DashboardPage.tsx   # Project grid, create/edit/delete modals
        │   ├── project/
        │   │   └── ProjectPage.tsx     # Kanban board, list view, filters, task modals
        │   └── profile/
        │       └── ProfilePage.tsx     # Edit username and avatar color
        └── components/
            ├── board/
            │   └── KanbanColumn.tsx    # Droppable column with SortableContext
            ├── task/
            │   ├── TaskCard.tsx        # Draggable card with deadline colors
            │   └── TaskModal.tsx       # Create/edit task modal
            └── ui/
                ├── Modal.tsx           # Generic accessible modal wrapper
                └── Avatar.tsx          # Colored initials avatar
```

---

## Architecture Notes

### Backend

**Single-query task counts** — Project list responses include `tasks_total` and `tasks_done` counts computed in a single SQL query using `GROUP BY project_id` with `func.sum(case(...))`, avoiding N+1 queries regardless of how many projects a user has.

**Pydantic v2 immutability** — `ProjectOut` instances returned by `model_validate()` are immutable. Task counts are attached using `model_copy(update={...})` which produces a new model instance without mutating the original.

**JWT auth flow** — Tokens are signed with HS256 and expire after 24 hours by default. The `get_current_user` FastAPI dependency decodes the token on every authenticated request and loads the user from the database, so revoked or tampered tokens fail at the dependency level.

### Frontend

**Timezone-safe dates** — JavaScript's `new Date("YYYY-MM-DD")` parses plain date strings as UTC midnight, which shifts them to the previous day in negative-offset timezones. All deadline parsing uses `date-fns/parseISO`, which keeps dates in local time and avoids this bug.

**Drag-and-drop** — The board uses `@dnd-kit/core` (`DndContext`) wrapping three `@dnd-kit/sortable` (`SortableContext`) lists. On `DragEnd`, the frontend optimistically reorders the task list and fires `PATCH /tasks/{id}` with the new `status` and `position`. Drag handles are keyboard-accessible.

**Auth persistence** — Zustand's `persist` middleware serializes the `{ user, token }` slice to `localStorage`. On page reload the token is read back and the Axios interceptor injects it as a `Bearer` header on every request. A 401 response clears the store and redirects to `/login`.

**Form state** — `react-hook-form`'s `useForm` is instantiated separately for "create" and "edit" operations (two different `useForm` instances) to prevent shared state between modals and to enable independent `reset()` calls with the correct default values.

---

## Screenshots

> Add your own screenshots here after deploying or running the project locally.

| Dashboard | Kanban Board | Task Modal |
|---|---|---|
| *(project grid with progress bars)* | *(drag-and-drop columns)* | *(create/edit form)* |

---

## License

MIT — feel free to use this project as a reference or starting point for your own work.
