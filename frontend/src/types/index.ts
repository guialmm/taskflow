export interface User {
  id: number;
  email: string;
  username: string;
  avatar_color: string;
  created_at: string;
}

export interface UserPublic {
  id: number;
  username: string;
  avatar_color: string;
}

export interface Member {
  id: number;
  user: UserPublic;
  role: "owner" | "member";
  joined_at: string;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  color: string;
  owner_id: number;
  created_at: string;
  members: Member[];
  tasks_done: number;
  tasks_total: number;
}

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  deadline: string | null;
  project_id: number;
  assignee: UserPublic | null;
  created_by: UserPublic;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
