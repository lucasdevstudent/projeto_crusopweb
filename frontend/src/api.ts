const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const loginUrl = `${BASE}/auth/github`;
export const getToken = () => localStorage.getItem("token");

export async function api<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method: opts.method ?? "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 401) {
    localStorage.removeItem("token");
    location.reload();
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Algo deu errado. Tente de novo.");
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const today = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export type Profile = { heightCm: number; birthYear: number; sex: "M" | "F"; activity: number };
export type User = { id: number; name: string; githubLogin: string; avatarUrl: string | null; profile: Profile | null };
export type Food = { id: number; name: string; kcal: number; protein: number; carbs: number; fat: number };
export type Item = { id: number; grams: number; food: Food };
export type Meal = { id: number; name: string; items: Item[] };
export type Weight = { id: number; kg: number; date: string };
export type Summary = {
  totals: { kcal: number; protein: number; carbs: number; fat: number };
  goalKcal: number | null;
  bmi: number | null;
  weightKg: number | null;
};
