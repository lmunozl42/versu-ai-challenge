import client from "./client";

export interface UserOut {
  id: string;
  email: string;
  name: string;
  org_id: string;
  organization: { id: string; name: string; slug: string };
}

export async function loginUser(email: string, password: string): Promise<string> {
  const { data } = await client.post<{ access_token: string }>("/auth/login", { email, password });
  return data.access_token;
}

export async function fetchCurrentUser(): Promise<UserOut> {
  const { data } = await client.get<UserOut>("/auth/me");
  return data;
}
