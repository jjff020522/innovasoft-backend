import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function NotFoundPage() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="auth-wrap container-fluid">
      <article className="auth-card centered shadow-lg">
        <p className="eyebrow">404</p>
        <h1>Pagina no encontrada</h1>
        <p>La direccion que intenta abrir no existe dentro del sistema.</p>
        <Link className="btn btn-primary primary-btn inline-btn" to={isAuthenticated ? "/" : "/login"}>
          Volver al inicio
        </Link>
      </article>
    </section>
  );
}

export default NotFoundPage;
