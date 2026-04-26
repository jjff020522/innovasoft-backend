import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/localApi";
import AlertMessage from "../components/AlertMessage";
import { validateRegisterForm } from "../utils/validation";

function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "info", text: "" });
  const navigate = useNavigate();

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const nextErrors = { ...prev, [field]: undefined };

      if (field === "password" || field === "confirmPassword") {
        nextErrors.password = undefined;
        nextErrors.confirmPassword = undefined;
      }

      return nextErrors;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateRegisterForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setMessage({ type: "error", text: "Revise los campos obligatorios del formulario." });
      return;
    }

    setLoading(true);
    setMessage({ type: "info", text: "" });

    try {
      await registerUser({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate("/login", {
        replace: true,
        state: {
          flashMessage: {
            type: "success",
            text: "Usuario creado correctamente.",
          },
        },
      });
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
          <p className="eyebrow">Nuevo acceso</p>
          <h1>Registro de usuario</h1>
          <p>Complete los datos para crear su cuenta en el sistema.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <AlertMessage type={message.type} text={message.text} />

          <div>
            <label className="form-label fw-semibold" htmlFor="register-username">
              Usuario *
            </label>
            <input
              id="register-username"
              type="text"
              className={`form-control ${errors.username ? "is-invalid" : ""}`}
              value={form.username}
              onChange={(event) => updateField("username", event.target.value)}
            />
            {errors.username ? <div className="invalid-feedback d-block">{errors.username}</div> : null}
          </div>

          <div>
            <label className="form-label fw-semibold" htmlFor="register-email">
              Correo electronico *
            </label>
            <input
              id="register-email"
              type="email"
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
            />
            {errors.email ? <div className="invalid-feedback d-block">{errors.email}</div> : null}
          </div>

          <div>
            <label className="form-label fw-semibold" htmlFor="register-password">
              Contrasena *
            </label>
            <input
              id="register-password"
              type="password"
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
            />
            {errors.password ? <div className="invalid-feedback d-block">{errors.password}</div> : null}
          </div>

          <div>
            <label className="form-label fw-semibold" htmlFor="register-confirm-password">
              Confirmar contrasena *
            </label>
            <input
              id="register-confirm-password"
              type="password"
              className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
              value={form.confirmPassword}
              onChange={(event) => updateField("confirmPassword", event.target.value)}
            />
            {errors.confirmPassword ? (
              <div className="invalid-feedback d-block">{errors.confirmPassword}</div>
            ) : null}
          </div>

          <button className="btn btn-primary btn-lg primary-btn w-100" type="submit" disabled={loading}>
            {loading ? "Registrando..." : "Registrarse"}
          </button>

          <p className="inline-link text-center">
            Ya tiene una cuenta? <Link to="/login">Inicie sesion</Link>
          </p>
        </form>
      </article>
    </section>
  );
}

export default RegisterPage;
