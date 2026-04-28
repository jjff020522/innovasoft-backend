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


    </section>
  );
}

export default HomePage;
