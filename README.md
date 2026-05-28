# TaskFlow

Aplicação full-stack de gerenciamento de projetos com boards Kanban, desenvolvida como projeto de portfólio para demonstrar desenvolvimento end-to-end com tecnologias modernas.

**Stack:** FastAPI · PostgreSQL · SQLAlchemy · React 18 · TypeScript · Tailwind CSS · Docker

---

## Funcionalidades

- **Autenticação JWT** — registro, login e sessões persistentes com Zustand + localStorage
- **Gerenciamento de Projetos** — CRUD completo com cores customizadas, convite de membros e controle de permissões por papel (owner / member)
- **Board Kanban** — drag-and-drop acessível entre colunas com posição persistida no banco ([@dnd-kit](https://dnd-kit.com/))
- **Tarefas** — título, descrição, prioridade, deadline com alerta de vencimento, assignee e confirmação de exclusão em dois passos
- **Filtros e Visualizações** — busca por texto, filtro por prioridade/assignee, alternância entre view Kanban e lista ordenável
- **Interface responsiva** — dark mode com paleta navy, animações CSS via Tailwind e feedback visual em tempo real

---

## Stack Técnica

### Backend

| Tecnologia | Finalidade |
|---|---|
| **FastAPI** | API REST com documentação OpenAPI automática (Swagger UI em `/docs`) |
| **SQLAlchemy 2.0** | ORM com session management; contagens de tarefas em query única com `func.sum(case(...))` — sem N+1 |
| **Alembic** | Migrações de schema do banco de dados |
| **PostgreSQL / SQLite** | PostgreSQL em produção; SQLite como fallback automático em dev |
| **Pydantic v2** | Validação e serialização de requests/responses |
| **python-jose + bcrypt** | Geração/verificação de JWT e hash de senha |

### Frontend

| Tecnologia | Finalidade |
|---|---|
| **React 18 + TypeScript** | UI component-based com tipagem estática em todo o frontend |
| **Tailwind CSS** | Design system utilitário com tokens customizados (paleta navy + animações CSS) |
| **Zustand** | Estado global com middleware `persist` para sessão resiliente ao reload |
| **@dnd-kit** | Drag-and-drop acessível via teclado no board Kanban |
| **React Hook Form** | Formulários performáticos com validação e feedback de erro inline |
| **Axios** | HTTP client com interceptor para injeção automática do token Bearer |
| **Vite** | Build tool com HMR e proxy de dev |

### Infraestrutura

| Tecnologia | Finalidade |
|---|---|
| **Docker + Compose** | Ambiente containerizado para dev e produção |
| **Nginx** | Serve o frontend buildado e faz proxy de `/api` para o backend |

---

## Decisões Técnicas Relevantes

**N+1 eliminado no backend** — A listagem de projetos retorna `tasks_total` e `tasks_done` em uma única query SQL com `GROUP BY` e `func.sum(case(...))`, independente da quantidade de projetos do usuário.

**Datas sem bug de timezone** — JavaScript interpreta strings `"YYYY-MM-DD"` como UTC midnight, o que causa regressão de dia em timezones negativos. Todos os deadlines usam `date-fns/parseISO` para manter as datas em horário local.

**Drag-and-drop otimista** — No `DragEnd`, o frontend reordena a lista localmente antes da resposta do servidor. O `PATCH` é disparado em background com o novo `status` e `position`, mantendo a UI fluida.

**Auth sem flicker** — O Zustand `persist` reidrata `{ user, token }` do localStorage antes do primeiro render. O interceptor do Axios injeta o `Bearer` em toda requisição; um 401 limpa o store e redireciona para `/login`.

---

## Como Rodar

### Docker (recomendado)

```bash
git clone https://github.com/guialmm/taskflow.git
cd taskflow
docker compose up --build
```

| Serviço | URL |
|---|---|
| Frontend | http://localhost |
| API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |

### Desenvolvimento Local

**Backend**
```bash
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env                              # configure DATABASE_URL e SECRET_KEY
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

> Sem PostgreSQL? O backend detecta automaticamente e usa SQLite como fallback.

---

## Licença

MIT
