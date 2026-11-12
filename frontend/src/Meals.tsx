import { useEffect, useState, type FormEvent } from "react";
import { api, today, type Food, type Meal } from "./api";

const sum = (m: Meal) => Math.round(m.items.reduce((a, i) => a + (i.food.kcal * i.grams) / 100, 0));

function AddItem({ mealId, reload }: { mealId: number; reload: () => void }) {
  const [q, setQ] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [foodId, setFoodId] = useState("");
  const [grams, setGrams] = useState("100");
  const [err, setErr] = useState("");

  useEffect(() => {
    api<Food[]>(`/foods?q=${encodeURIComponent(q)}`).then((r) => {
      setFoods(r);
      setFoodId(r[0] ? String(r[0].id) : "");
    });
  }, [q]);

  async function add(e: FormEvent) {
    e.preventDefault();
    try {
      await api(`/meals/${mealId}/items`, { method: "POST", body: { foodId: Number(foodId), grams: Number(grams) } });
      setErr("");
      reload();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <form className="row" onSubmit={add}>
      <input placeholder="Buscar alimento" value={q} onChange={(e) => setQ(e.target.value)} />
      <select value={foodId} onChange={(e) => setFoodId(e.target.value)}>
        {foods.length === 0 && <option value="">Nenhum alimento encontrado</option>}
        {foods.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.kcal} kcal/100 g)</option>)}
      </select>
      <input className="sm" type="number" min="1" value={grams} onChange={(e) => setGrams(e.target.value)} aria-label="Quantidade em gramas" />
      <span>g</span>
      <button className="btn" disabled={!foodId}>Adicionar</button>
      {err && <p className="err">{err}</p>}
    </form>
  );
}

export default function Meals() {
  const [date, setDate] = useState(today());
  const [meals, setMeals] = useState<Meal[]>([]);
  const [name, setName] = useState("");

  const load = () => api<Meal[]>(`/meals?date=${date}`).then(setMeals);
  useEffect(() => { load(); }, [date]);

  async function addMeal(e: FormEvent) {
    e.preventDefault();
    await api("/meals", { method: "POST", body: { name: name || "Refeição", date } });
    setName("");
    load();
  }

  return (
    <>
      <div className="row between">
        <h2>Refeições</h2>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <form className="row card" onSubmit={addMeal}>
        <input placeholder="Nome da refeição (ex.: Almoço)" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn">Nova refeição</button>
      </form>
      {meals.length === 0 && <p className="muted">Nenhuma refeição neste dia. Crie a primeira acima.</p>}
      {meals.map((m) => (
        <div className="card" key={m.id}>
          <div className="row between">
            <h3>{m.name} <small>{sum(m)} kcal</small></h3>
            <button className="link" onClick={async () => { await api(`/meals/${m.id}`, { method: "DELETE" }); load(); }}>Excluir refeição</button>
          </div>
          <ul className="items">
            {m.items.map((i) => (
              <li key={i.id}>
                <span>{i.food.name} · {i.grams} g</span>
                <span>{Math.round((i.food.kcal * i.grams) / 100)} kcal</span>
                <button className="link" onClick={async () => { await api(`/meals/${m.id}/items/${i.id}`, { method: "DELETE" }); load(); }}>Remover</button>
              </li>
            ))}
          </ul>
          <AddItem mealId={m.id} reload={load} />
        </div>
      ))}
    </>
  );
}
