import { useEffect, useState, type FormEvent } from "react";
import { api, today, type Profile, type Summary, type User } from "./api";

const ACTIVITY: [number, string][] = [
  [1.2, "Sedentário"],
  [1.375, "Leve (1–3 treinos/semana)"],
  [1.55, "Moderado (3–5 treinos/semana)"],
  [1.725, "Intenso (6–7 treinos/semana)"],
];

const bmiLabel = (b: number) =>
  b < 18.5 ? "Abaixo do peso" : b < 25 ? "Peso normal" : b < 30 ? "Sobrepeso" : "Obesidade";

export default function Dashboard({ user, onSaved }: { user: User | null; onSaved: () => void }) {
  const [s, setS] = useState<Summary | null>(null);
  const [edit, setEdit] = useState(false);
  const [err, setErr] = useState("");
  const p = user?.profile;

  useEffect(() => {
    api<Summary>(`/summary?date=${today()}`).then(setS).catch((e) => setErr(e.message));
  }, [user]);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body: Profile = {
      heightCm: Number(f.get("heightCm")),
      birthYear: Number(f.get("birthYear")),
      sex: f.get("sex") as "M" | "F",
      activity: Number(f.get("activity")),
    };
    try {
      await api("/profile", { method: "PUT", body });
      setEdit(false);
      setErr("");
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  const t = s?.totals;
  const macroSum = t ? t.protein + t.carbs + t.fat : 0;
  const pct = s?.goalKcal && t ? Math.min(100, Math.round((t.kcal / s.goalKcal) * 100)) : 0;

  return (
    <>
      <h2>Olá, {user?.name?.split(" ")[0] ?? ""}</h2>
      {err && <p className="err">{err}</p>}

      {(!p || edit) && (
        <form className="card" onSubmit={save}>
          <h3>Seus dados</h3>
          <p className="muted">Usamos esses dados para calcular seu IMC e sua meta calórica.</p>
          <div className="grid">
            <label>Altura (cm)<input name="heightCm" type="number" step="0.1" defaultValue={p?.heightCm} required /></label>
            <label>Ano de nascimento<input name="birthYear" type="number" defaultValue={p?.birthYear} required /></label>
            <label>Sexo
              <select name="sex" defaultValue={p?.sex ?? "F"}>
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
              </select>
            </label>
            <label>Atividade física
              <select name="activity" defaultValue={p?.activity ?? 1.375}>
                {ACTIVITY.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
          </div>
          <button className="btn">Salvar dados</button>
        </form>
      )}

      <div className="card">
        <h3>Calorias de hoje</h3>
        {s?.goalKcal ? (
          <>
            <p className="big-num">{t?.kcal} <small>de {s.goalKcal} kcal</small></p>
            <div className="bar"><i style={{ width: `${pct}%` }} /></div>
            <p className="muted">Meta diária estimada pelo seu peso atual e nível de atividade.</p>
          </>
        ) : (
          <p className="muted">
            {p ? "Registre seu peso na aba Peso para ver sua meta calórica." : "Preencha seus dados para ver sua meta calórica."}
          </p>
        )}
      </div>

      <div className="card">
        <h3>Macronutrientes de hoje</h3>
        {([["Proteínas", t?.protein ?? 0, "prot"], ["Carboidratos", t?.carbs ?? 0, "carb"], ["Gorduras", t?.fat ?? 0, "fat"]] as const).map(([l, g, c]) => (
          <div className="macro" key={l}>
            <span>{l}</span>
            <div className="bar"><i className={c} style={{ width: `${macroSum ? (g / macroSum) * 100 : 0}%` }} /></div>
            <b>{g} g</b>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>IMC atual</h3>
        {s?.bmi ? (
          <p className="big-num">{s.bmi} <small>{bmiLabel(s.bmi)} · {s.weightKg} kg</small></p>
        ) : (
          <p className="muted">Precisamos da sua altura e de um registro de peso.</p>
        )}
        {p && !edit && <button className="link" onClick={() => setEdit(true)}>Editar meus dados</button>}
      </div>
    </>
  );
}
