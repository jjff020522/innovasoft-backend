import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import { useAuth } from "../context/AuthContext";
import { validateLoginForm } from "../utils/validation";

const REMEMBERED_USER_KEY = "innovasoft_remembered_user";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: "info", text: "" });
  const [loading, setLoading] = useState(false);

  const { signIn, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBERED_USER_KEY);
    if (remembered) {
      setUsername(remembered);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!location.state?.flashMessage) {
      return;
    }

    setMessage(location.state.flashMessage);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: "info", text: "" });

    const nextErrors = validateLoginForm({ username, password });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setMessage({
        type: "error",
        text: "Debe completar usuario y contrasena para iniciar sesion.",
      });
      return;
    }

    setLoading(true);

    try {
      await signIn(username.trim(), password);
      if (rememberMe) {
        localStorage.setItem(REMEMBERED_USER_KEY, username.trim());
      } else {
        localStorage.removeItem(REMEMBERED_USER_KEY);
      }
      navigate("/", { replace: true });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Se presento un inconveniente con la transaccion. Intente nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-wrap container-fluid">
      <article className="auth-card shadow-lg">
        <div className="auth-hero">
          <p className="eyebrow">Acceso seguro</p>
          <h1>Inicio de sesion</h1>
          <p>Administre clientes institucionales a traves de una experiencia corporativa y confiable.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <AlertMessage type={message.type} text={message.text} />

          <div>
            <label className="form-label fw-semibold" htmlFor="username">
              Usuario *
            </label>
            <input
              id="username"
              type="text"
              className={`form-control ${errors.username ? "is-invalid" : ""}`}
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setErrors((prev) => ({ ...prev, username: undefined }));
              }}
              autoComplete="username"
            />
            {errors.username ? <div className="invalid-feedback d-block">{errors.username}</div> : null}
          </div>

          <div>
            <label className="form-label fw-semibold" htmlFor="password">
              Contrasena *
            </label>
            <input
              id="password"
              type="password"
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              autoComplete="current-password"
            />
            {errors.password ? <div className="invalid-feedback d-block">{errors.password}</div> : null}
          </div>

          <div className="form-check">
            <input
              id="remember-me"
              type="checkbox"
              className="form-check-input"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            <label className="form-check-label" htmlFor="remember-me">
              Recuerdame
            </label>
          </div>

          <button className="btn btn-primary btn-lg primary-btn w-100" type="submit" disabled={loading}>
            {loading ? "Validando..." : "Iniciar sesion"}
          </button>

          <p className="inline-link text-center">
            No tiene una cuenta? <Link to="/registro">Registrese</Link>
          </p>
        </form>
      </article>
    </section>
  );
}

export default LoginPage;
