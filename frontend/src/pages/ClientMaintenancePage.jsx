import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createClient, getClient, getInterests, updateClient } from "../api/localApi";
import AlertMessage from "../components/AlertMessage";
import { useAuth } from "../context/AuthContext";
import { toDateInputValue } from "../utils/date";
import { validateClientForm } from "../utils/validation";

const INITIAL_FORM = {
  nombre: "",
  apellidos: "",
  identificacion: "",
  telefonoCelular: "",
  otroTelefono: "",
  direccion: "",
  fNacimiento: "",
  fAfiliacion: "",
  sexo: "M",
  resenaPersonal: "",
  imagen: "",
  interesFK: "",
};

const FIELD_LABELS = {
  nombre: "Nombre",
  apellidos: "Apellidos",
  identificacion: "Identificacion",
  telefonoCelular: "Telefono celular",
  otroTelefono: "Otro telefono",
  direccion: "Direccion",
  fNacimiento: "Fecha de nacimiento",
  fAfiliacion: "Fecha de afiliacion",
  sexo: "Sexo",
  resenaPersonal: "Resena personal",
  imagen: "Imagen",
  interesFK: "Intereses",
};

function buildValidationSummary(fieldErrors) {
  const labels = Object.entries(fieldErrors)
    .filter(([, value]) => Boolean(value))
    .map(([field]) => FIELD_LABELS[field] ?? field);

  if (!labels.length) {
    return "Existen campos con validaciones pendientes.";
  }

  return `Revise estos campos: ${labels.join(", ")}.`;
}

function FieldError({ error }) {
  if (!error) {
    return null;
  }

  return <div className="invalid-feedback d-block">{error}</div>;
}

function ClientMaintenancePage() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const { session } = useAuth();

  const isEditMode = Boolean(clientId);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState({ type: "info", text: "" });

  const imagePreview = form.imagen
    ? form.imagen.startsWith("data:")
      ? form.imagen
      : `data:image/jpeg;base64,${form.imagen}`
    : null;

  useEffect(() => {
    const loadScreenData = async () => {
      setInitialLoading(true);
      setMessage({ type: "info", text: "" });

      try {
        const loadedInterests = await getInterests(session.token);
        setInterests(loadedInterests);

        if (isEditMode && clientId) {
          const clientData = await getClient(session.token, clientId);
          setForm({
            nombre: clientData.nombre ?? "",
            apellidos: clientData.apellidos ?? "",
            identificacion: clientData.identificacion ?? "",
            telefonoCelular: clientData.telefonoCelular ?? clientData.celular ?? "",
            otroTelefono: clientData.otroTelefono ?? "",
            direccion: clientData.direccion ?? "",
            fNacimiento: toDateInputValue(clientData.fNacimiento),
            fAfiliacion: toDateInputValue(clientData.fAfiliacion),
            sexo: clientData.sexo ?? "M",
            resenaPersonal: clientData.resenaPersonal ?? clientData.resennaPersonal ?? "",
            imagen: clientData.imagen ?? "",
            interesFK: clientData.interesesId ?? clientData.interesFK ?? "",
          });
        }
      } catch (error) {
        setMessage({
          type: "error",
          text: error.message || "Se presento un inconveniente con la transaccion. Intente nuevamente.",
        });
      } finally {
        setInitialLoading(false);
      }
    };

    loadScreenData();
  }, [clientId, isEditMode, session.token]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, imagen: "Debe seleccionar un archivo de imagen valido." }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64Value = result.includes(",") ? result.split(",")[1] : result;
      updateField("imagen", base64Value);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: "info", text: "" });

    const validationErrors = validateClientForm(form);
    if (!isEditMode && !form.imagen) {
      validationErrors.imagen = "Para crear un cliente, debe cargar una imagen.";
    }
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setMessage({
        type: "error",
        text: buildValidationSummary(validationErrors),
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        usuarioId: session.userid,
        imagen: form.imagen || null,
      };

      if (isEditMode && clientId) {
        await updateClient(session.token, { ...payload, id: clientId });
      } else {
        await createClient(session.token, payload);
      }

      navigate("/clientes", {
        replace: true,
        state: {
          flashMessage: {
            type: "success",
            text: isEditMode ? "Cliente actualizado correctamente." : "Cliente creado correctamente.",
          },
        },
      });
    } catch (error) {
      if (error?.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...error.fieldErrors }));
        setMessage({
          type: "error",
          text: buildValidationSummary(error.fieldErrors),
        });
        return;
      }

      setMessage({
        type: "error",
        text: error.message || "Se presento un inconveniente con la transaccion. Intente nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <section className="panel">
        <div className="panel-header">
          <h2>Cargando mantenimiento de clientes...</h2>
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-header split gap-3">
        <div>
          <p className="eyebrow">Mantenimiento</p>
          <h2>{isEditMode ? "Actualizar cliente" : "Mantenimiento de clientes"}</h2>
          <p>
            Todos los campos con * son obligatorios.
            {!isEditMode ? " Para crear un cliente, cargue tambien una imagen." : ""}
          </p>
        </div>

        <div className="avatar-upload">
          <div className="avatar-preview">
            {imagePreview ? <img src={imagePreview} alt="Cliente" /> : <span>Sin imagen</span>}
          </div>
          <label className="btn btn-outline-secondary secondary-btn" htmlFor="client-image">
            Cargar imagen
          </label>
          <input id="client-image" type="file" accept="image/*" onChange={handleImageChange} hidden />
          <FieldError error={errors.imagen} />
        </div>
      </div>

      <AlertMessage type={message.type} text={message.text} />

      <form className="row g-3" onSubmit={handleSubmit} noValidate>
        <div className="col-md-6">
          <label className="form-label fw-semibold">Nombre *</label>
          <input
            type="text"
            className={`form-control ${errors.nombre ? "is-invalid" : ""}`}
            value={form.nombre}
            maxLength={50}
            onChange={(event) => updateField("nombre", event.target.value)}
          />
          <FieldError error={errors.nombre} />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Apellidos *</label>
          <input
            type="text"
            className={`form-control ${errors.apellidos ? "is-invalid" : ""}`}
            value={form.apellidos}
            maxLength={100}
            onChange={(event) => updateField("apellidos", event.target.value)}
          />
          <FieldError error={errors.apellidos} />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Identificacion *</label>
          <input
            type="text"
            className={`form-control ${errors.identificacion ? "is-invalid" : ""}`}
            value={form.identificacion}
            maxLength={20}
            onChange={(event) => updateField("identificacion", event.target.value)}
          />
          <FieldError error={errors.identificacion} />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Telefono celular *</label>
          <input
            type="text"
            className={`form-control ${errors.telefonoCelular ? "is-invalid" : ""}`}
            value={form.telefonoCelular}
            maxLength={20}
            onChange={(event) => updateField("telefonoCelular", event.target.value)}
          />
          <FieldError error={errors.telefonoCelular} />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Otro telefono *</label>
          <input
            type="text"
            className={`form-control ${errors.otroTelefono ? "is-invalid" : ""}`}
            value={form.otroTelefono}
            maxLength={20}
            onChange={(event) => updateField("otroTelefono", event.target.value)}
          />
          <FieldError error={errors.otroTelefono} />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Direccion *</label>
          <input
            type="text"
            className={`form-control ${errors.direccion ? "is-invalid" : ""}`}
            value={form.direccion}
            maxLength={200}
            onChange={(event) => updateField("direccion", event.target.value)}
          />
          <FieldError error={errors.direccion} />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Fecha de nacimiento *</label>
          <input
            type="date"
            className={`form-control ${errors.fNacimiento ? "is-invalid" : ""}`}
            value={form.fNacimiento}
            onChange={(event) => updateField("fNacimiento", event.target.value)}
          />
          <FieldError error={errors.fNacimiento} />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Fecha de afiliacion *</label>
          <input
            type="date"
            className={`form-control ${errors.fAfiliacion ? "is-invalid" : ""}`}
            value={form.fAfiliacion}
            onChange={(event) => updateField("fAfiliacion", event.target.value)}
          />
          <FieldError error={errors.fAfiliacion} />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Sexo *</label>
          <select
            className={`form-select ${errors.sexo ? "is-invalid" : ""}`}
            value={form.sexo}
            onChange={(event) => updateField("sexo", event.target.value)}
          >
            <option value="M">Masculino (M)</option>
            <option value="F">Femenino (F)</option>
          </select>
          <FieldError error={errors.sexo} />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Intereses *</label>
          <select
            className={`form-select ${errors.interesFK ? "is-invalid" : ""}`}
            value={form.interesFK}
            onChange={(event) => updateField("interesFK", event.target.value)}
          >
            <option value="">Seleccione un interes</option>
            {interests.map((item) => (
              <option key={item.id} value={item.id}>
                {item.descripcion}
              </option>
            ))}
          </select>
          <FieldError error={errors.interesFK} />
        </div>

        <div className="col-12">
          <label className="form-label fw-semibold">Resena personal *</label>
          <textarea
            className={`form-control ${errors.resenaPersonal ? "is-invalid" : ""}`}
            value={form.resenaPersonal}
            rows={4}
            maxLength={200}
            onChange={(event) => updateField("resenaPersonal", event.target.value)}
          />
          <FieldError error={errors.resenaPersonal} />
        </div>

        <div className="col-12 d-flex flex-column flex-md-row gap-2 justify-content-between">
          <button type="button" className="btn btn-outline-secondary ghost-btn" onClick={() => navigate("/clientes")}>
            Regresar
          </button>
          <button type="submit" className="btn btn-primary primary-btn" disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default ClientMaintenancePage;
