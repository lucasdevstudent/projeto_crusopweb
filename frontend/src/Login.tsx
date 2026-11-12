import { loginUrl } from "./api";

const FOODS = ["🥑", "🍓", "🥦", "🍳", "🥕", "🍗", "🍌", "🥜", "🍚"];

export default function Login() {
  return (
    <div className="login">
      <section className="login-left">
        <h1 className="logo big">SiNutre</h1>
        <div className="collage" aria-hidden="true">
          {FOODS.map((f) => (
            <span key={f}>{f}</span>
          ))}
        </div>
        <ul className="tags">
          <li>Vitaminas</li>
          <li>Proteínas</li>
          <li>Gorduras</li>
        </ul>
      </section>
      <section className="login-right">
        <h2>Bem-vindo(a)!</h2>
        <p>Faça login com GitHub para começar.</p>
        <a className="btn gh" href={loginUrl}>
          Entrar com GitHub
        </a>
      </section>
    </div>
  );
}
