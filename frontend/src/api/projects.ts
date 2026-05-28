import client from "./client";
import type { Project } from "../types";

export const getProjects = () =>
  client.get<Project[]>("/projects/").then((r) => r.data);

export const getProject = (id: number) =>
  client.get<Project>(`/projects/${id}`).then((r) => r.data);

export const createProject = (data: { name: string; description?: string; color?: string }) =>
  client.post<Project>("/projects/", data).then((r) => r.data);

export const updateProject = (id: number, data: Partial<{ name: string; description: string; color: string }>) =>
  client.patch<Project>(`/projects/${id}`, data).then((r) => r.data);

export const deleteProject = (id: number) =>
  client.delete(`/projects/${id}`);

export const inviteMember = (projectId: number, username: string) =>
  client.post(`/projects/${projectId}/members`, { username }).then((r) => r.data);

export const removeMember = (projectId: number, userId: number) =>
  client.delete(`/projects/${projectId}/members/${userId}`);
