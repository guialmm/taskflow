import client from "./client";
import type { Task, TaskPriority, TaskStatus } from "../types";

export const getTasks = (
  projectId: number,
  filters?: { status?: TaskStatus; priority?: TaskPriority; assignee_id?: number }
) =>
  client
    .get<Task[]>(`/projects/${projectId}/tasks/`, { params: filters })
    .then((r) => r.data);

export const createTask = (
  projectId: number,
  data: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    deadline?: string;
    assignee_id?: number;
  }
) => client.post<Task>(`/projects/${projectId}/tasks/`, data).then((r) => r.data);

export const updateTask = (
  projectId: number,
  taskId: number,
  data: Partial<{
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    deadline: string;
    assignee_id: number;
    position: number;
  }>
) =>
  client.patch<Task>(`/projects/${projectId}/tasks/${taskId}`, data).then((r) => r.data);

export const deleteTask = (projectId: number, taskId: number) =>
  client.delete(`/projects/${projectId}/tasks/${taskId}`);
