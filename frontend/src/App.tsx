import { useEffect, useState } from "react";
import { api, getToken, type User } from "./api";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Meals from "./Meals";
import WeightPage from "./WeightPage";

const TABS = [
  ["painel", "Painel"],
  ["refeicoes", "Refeições"],
  ["peso", "Peso"],
] as const;
type Tab = (typeof TABS)[number][0];

export default function App() {
  const [token, setToken] = useState(() => {
    const t = new URLSearchParams(location.search).get("token");
    if (t) {
      localStorage.setItem("token", t);
      history.replaceState({}, "", "/");
    }
    return getToken();
  });
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>("painel");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (token) api<User>("/me").then(setUser).catch(() => {});
  }, [token, version]);

  if (!token) return <Login />;

  return (
    <div className="app">
      <header className="top">
        <span className="logo">SiNutre</span>
        <nav>
          {TABS.map(([id, label]) => (
            <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="who">
          {user?.avatarUrl && <img src={user.avatarUrl} alt="" />}
          <span>{user?.name}</span>
          <button
            className="link"
            onClick={() => {
              localStorage.removeItem("token");
              setToken(null);
            }}
          >
            Sair
          </button>
        </div>
      </header>
      <main>
        {tab === "painel" && <Dashboard user={user} onSaved={() => setVersion((v) => v + 1)} />}
        {tab === "refeicoes" && <Meals />}
        {tab === "peso" && <WeightPage />}
      </main>
    </div>
  );
}
