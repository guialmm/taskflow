import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "./auth";

const mockUser = {
  id: 1,
  email: "user@test.com",
  username: "testuser",
  avatar_color: "#6366f1",
  created_at: "2024-01-01T00:00:00",
};

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null });
    localStorage.clear();
  });

  it("starts with null user and token", () => {
    const { user, token } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(token).toBeNull();
  });

  it("setAuth stores user and token in state", () => {
    useAuthStore.getState().setAuth(mockUser, "my-token");
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().token).toBe("my-token");
  });

  it("setAuth persists token to localStorage", () => {
    useAuthStore.getState().setAuth(mockUser, "my-token");
    expect(localStorage.getItem("token")).toBe("my-token");
  });

  it("logout clears user and token from state", () => {
    useAuthStore.getState().setAuth(mockUser, "my-token");
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it("logout removes token from localStorage", () => {
    useAuthStore.getState().setAuth(mockUser, "my-token");
    useAuthStore.getState().logout();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("updateUser replaces user data without changing token", () => {
    useAuthStore.getState().setAuth(mockUser, "my-token");
    const updated = { ...mockUser, username: "renamed" };
    useAuthStore.getState().updateUser(updated);
    expect(useAuthStore.getState().user?.username).toBe("renamed");
    expect(useAuthStore.getState().token).toBe("my-token");
  });
});
