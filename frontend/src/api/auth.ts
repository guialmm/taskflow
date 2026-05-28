import client from "./client";
import type { AuthResponse, User } from "../types";

export const register = (data: { email: string; username: string; password: string }) =>
  client.post<AuthResponse>("/auth/register", data).then((r) => r.data);

export const login = (data: { email: string; password: string }) =>
  client.post<AuthResponse>("/auth/login", data).then((r) => r.data);

export const updateProfile = (data: { username?: string; avatar_color?: string }) =>
  client.patch<User>("/users/me", data).then((r) => r.data);
