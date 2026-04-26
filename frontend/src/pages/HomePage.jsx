import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function HomePage() {
  const { session } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="panel">
      <div className="panel-header">
        <p className="eyebrow">Inicio</p>
        <h2>Bienvenido, {session?.username}</h2>
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <article className="feature-card h-100">
            <div className="d-flex">
              <button
                type="button"
                className="btn btn-primary primary-btn"
                onClick={() => navigate("/clientes")}
              >
                Ir a consulta de clientes
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export default HomePage;
