import { useEffect, useState, type FormEvent } from "react";
import { api, today, type Weight } from "./api";

function Chart({ data }: { data: Weight[] }) {
  if (data.length < 2) return <p className="muted">Registre pelo menos dois pesos para ver o gráfico.</p>;
  const W = 600, H = 180, P = 24;
  const ys = data.map((d) => d.kg);
  const min = Math.min(...ys) - 1, max = Math.max(...ys) + 1;
  const pts = data.map((d, i) => [P + (i * (W - 2 * P)) / (data.length - 1), H - P - ((d.kg - min) / (max - min)) * (H - 2 * P)]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Evolução do peso">
      <polyline fill="none" stroke="var(--green)" strokeWidth="3" points={pts.map((p) => p.join(",")).join(" ")} />
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="4" fill="var(--green)" />
          <text x={x} y={y - 9} textAnchor="middle" fontSize="11" fill="currentColor">{data[i].kg}</text>
        </g>
      ))}
    </svg>
  );
}

export default function WeightPage() {
  const [list, setList] = useState<Weight[]>([]);
  const [kg, setKg] = useState("");
  const [date, setDate] = useState(today());
  const [err, setErr] = useState("");

  const load = () => api<Weight[]>("/weights").then(setList);
  useEffect(() => { load(); }, []);

  async function add(e: FormEvent) {
    e.preventDefault();
    try {
      await api("/weights", { method: "POST", body: { kg: Number(kg.replace(",", ".")), date } });
      setKg("");
      setErr("");
      load();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <>
      <h2>Evolução de peso</h2>
      <form className="row card" onSubmit={add}>
        <input placeholder="Peso (kg)" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} required />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="btn">Registrar peso</button>
        {err && <p className="err">{err}</p>}
      </form>
      <div className="card"><Chart data={list} /></div>
      <ul className="items card">
        {[...list].reverse().map((w) => (
          <li key={w.id}>
            <span>{new Date(w.date).toLocaleDateString("pt-BR")}</span>
            <b>{w.kg} kg</b>
            <button className="link" onClick={async () => { await api(`/weights/${w.id}`, { method: "DELETE" }); load(); }}>Remover</button>
          </li>
        ))}
        {list.length === 0 && <li className="muted">Nenhum registro ainda.</li>}
      </ul>
    </>
  );
}
