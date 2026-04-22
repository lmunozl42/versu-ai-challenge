import api from "./client";

export interface UserOut {
  id: string;
  email: string;
  name: string;
  org_id: string;
  organization: { id: string; name: string; slug: string };
}

export async function login(email: string, password: string): Promise<string> {
  const { data } = await api.post<{ access_token: string }>("/auth/login", { email, password });
  return data.access_token;
}

export async function getMe(): Promise<UserOut> {
  const { data } = await api.get<UserOut>("/auth/me");
  return data;
}
