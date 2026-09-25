import { API_URL } from "@/lib/api";
import { demoCall, demoMode } from "@/lib/demo";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

type AuthResponse = {
  token: string;
  user: SessionUser;
};

const TOKEN_KEY = "rosi-token";

export function readToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAdmin(user: SessionUser | null) {
  return user?.role === "Admin";
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (demoMode) return demoCall(path, init) as T;

  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = readToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    let message = "Заявката не мина.";
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      /* empty body */
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function login(email: string, password: string) {
  return api<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(name: string, email: string, password: string) {
  return api<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function currentUser() {
  return api<SessionUser>("/api/auth/me");
}
