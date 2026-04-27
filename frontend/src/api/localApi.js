const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(message, status, payload = null, fieldErrors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
    this.fieldErrors = fieldErrors;
  }
}

const FIELD_NAME_MAP = {
  Apellidos: "apellidos",
  Celular: "telefonoCelular",
  Direccion: "direccion",
  FAfiliacion: "fAfiliacion",
  FNacimiento: "fNacimiento",
  Identificacion: "identificacion",
  Imagen: "imagen",
  InteresFK: "interesFK",
  Nombre: "nombre",
  OtroTelefono: "otroTelefono",
  ResenaPersonal: "resenaPersonal",
  ResennaPersonal: "resenaPersonal",
  Sexo: "sexo",
  apellidos: "apellidos",
  celular: "telefonoCelular",
  direccion: "direccion",
  fAfiliacion: "fAfiliacion",
  fNacimiento: "fNacimiento",
  identificacion: "identificacion",
  imagen: "imagen",
  interesFK: "interesFK",
  nombre: "nombre",
  otroTelefono: "otroTelefono",
  resenaPersonal: "resenaPersonal",
  resennaPersonal: "resenaPersonal",
  sexo: "sexo",
  telefonoCelular: "telefonoCelular",
};

function mapFieldName(fieldName) {
  return FIELD_NAME_MAP[fieldName] ?? fieldName;
}

function normalizeValidationMessage(message, issue = {}) {
  if (!message) {
    return "Valor invalido.";
  }

  if (message === "String should have at least 1 character" || message === "Field required") {
    return "Este campo es obligatorio.";
  }

  if (issue.type === "date_from_datetime_parsing" || issue.type === "date_parsing") {
    return "Debe ingresar una fecha valida.";
  }

  return message;
}

function extractFieldErrors(payload) {
  const fieldErrors = {};

  if (Array.isArray(payload?.detail)) {
    payload.detail.forEach((issue) => {
      const location = Array.isArray(issue?.loc) ? issue.loc : [];
      const fieldName = mapFieldName(location[location.length - 1]);
      if (!fieldName || fieldErrors[fieldName]) {
        return;
      }
      fieldErrors[fieldName] = normalizeValidationMessage(issue?.msg, issue);
    });
  }

  [payload?.errors, payload?.payload?.errors].forEach((source) => {
    if (!source || typeof source !== "object" || Array.isArray(source)) {
      return;
    }

    Object.entries(source).forEach(([fieldName, messages]) => {
      const mappedFieldName = mapFieldName(fieldName);
      if (!mappedFieldName || fieldErrors[mappedFieldName]) {
        return;
      }

      const message = Array.isArray(messages) ? messages.join(" ") : String(messages ?? "").trim();
      if (message) {
        fieldErrors[mappedFieldName] = message;
      }
    });
  });

  return fieldErrors;
}

function buildErrorMessage(payload, fieldErrors) {
  const fieldEntries = Object.entries(fieldErrors);
  if (fieldEntries.length > 0) {
    return fieldEntries.map(([field, message]) => `${field}: ${message}`).join(" | ");
  }

  if (typeof payload?.detail === "string" && payload.detail.trim()) {
    return payload.detail.trim();
  }

  return "Se presento un inconveniente con la transaccion. Intente nuevamente.";
}

async function request(path, { method = "GET", token, body } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const fieldErrors = extractFieldErrors(payload);
    const message = buildErrorMessage(payload, fieldErrors);
    throw new ApiError(message, response.status, payload, fieldErrors);
  }

  return payload;
}

export function loginUser(credentials) {
  return request("/api/auth/login", {
    method: "POST",
    body: credentials,
  });
}

export function registerUser(payload) {
  return request("/api/auth/register", {
    method: "POST",
    body: payload,
  });
}

export function logoutUser(token) {
  return request("/api/auth/logout", {
    method: "POST",
    token,
  });
}

export function getSession(token) {
  return request("/api/auth/session", {
    method: "GET",
    token,
  });
}

export function listClients(token, payload) {
  return request("/api/clientes/listado", {
    method: "POST",
    token,
    body: payload,
  });
}

export function getInterests(token) {
  return request("/api/clientes/intereses", {
    method: "GET",
    token,
  });
}

export function getClient(token, clientId) {
  return request(`/api/clientes/obtener/${clientId}`, {
    method: "GET",
    token,
  });
}

export function createClient(token, payload) {
  return request("/api/clientes/crear", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateClient(token, payload) {
  return request("/api/clientes/actualizar", {
    method: "POST",
    token,
    body: payload,
  });
}

export function deleteClient(token, clientId) {
  return request(`/api/clientes/eliminar/${clientId}`, {
    method: "DELETE",
    token,
  });
}
