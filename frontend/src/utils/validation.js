const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{9,20}$/;
const PHONE_REGEX = /^[0-9()+\- ]+$/;
const IDENTIFICATION_REGEX = /^[A-Za-z0-9\- ]+$/;

function isBlank(value) {
  return !String(value ?? "").trim();
}

export function isValidEmail(value) {
  return EMAIL_REGEX.test(String(value ?? "").trim());
}

export function isValidPassword(value) {
  return PASSWORD_REGEX.test(String(value ?? ""));
}

export function validateLoginForm(form) {
  const errors = {};

  if (isBlank(form.username)) {
    errors.username = "El usuario es obligatorio.";
  }

  if (isBlank(form.password)) {
    errors.password = "La contrasena es obligatoria.";
  }

  return errors;
}

export function validateRegisterForm(form) {
  const errors = {};

  if (isBlank(form.username)) {
    errors.username = "El usuario es obligatorio.";
  } else if (String(form.username).trim().length < 3) {
    errors.username = "El usuario debe tener al menos 3 caracteres.";
  }

  if (isBlank(form.email)) {
    errors.email = "El correo electronico es obligatorio.";
  } else if (!isValidEmail(form.email)) {
    errors.email = "Debe ingresar un correo valido.";
  }

  if (isBlank(form.password)) {
    errors.password = "La contrasena es obligatoria.";
  } else if (!isValidPassword(form.password)) {
    errors.password =
      "La contrasena debe tener entre 9 y 20 caracteres, con numero, mayuscula y minuscula.";
  }

  if (isBlank(form.confirmPassword)) {
    errors.confirmPassword = "Debe confirmar la contrasena.";
  } else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = "Las contrasenas no coinciden.";
  }

  return errors;
}

export function validateClientForm(form) {
  const errors = {};

  const requiredFields = [
    "nombre",
    "apellidos",
    "identificacion",
    "telefonoCelular",
    "direccion",
    "fNacimiento",
    "fAfiliacion",
    "sexo",
    "resenaPersonal",
    "interesFK",
  ];

  requiredFields.forEach((field) => {
    if (isBlank(form[field])) {
      errors[field] = "Este campo es obligatorio.";
    }
  });

  if (!isBlank(form.nombre) && form.nombre.trim().length > 50) {
    errors.nombre = "Maximo 50 caracteres.";
  }
  if (!isBlank(form.apellidos) && form.apellidos.trim().length > 100) {
    errors.apellidos = "Maximo 100 caracteres.";
  }
  if (!isBlank(form.identificacion)) {
    if (form.identificacion.trim().length > 20) {
      errors.identificacion = "Maximo 20 caracteres.";
    } else if (!IDENTIFICATION_REGEX.test(form.identificacion.trim())) {
      errors.identificacion = "Solo se permiten letras, numeros, espacios y guiones.";
    }
  }
  if (!isBlank(form.telefonoCelular)) {
    if (form.telefonoCelular.trim().length > 20) {
      errors.telefonoCelular = "Maximo 20 caracteres.";
    } else if (!PHONE_REGEX.test(form.telefonoCelular.trim())) {
      errors.telefonoCelular = "Formato de telefono invalido.";
    }
  }
  if (!isBlank(form.otroTelefono)) {
    if (form.otroTelefono.trim().length > 20) {
      errors.otroTelefono = "Maximo 20 caracteres.";
    } else if (!PHONE_REGEX.test(form.otroTelefono.trim())) {
      errors.otroTelefono = "Formato de telefono invalido.";
    }
  }
  if (!isBlank(form.direccion) && form.direccion.trim().length > 200) {
    errors.direccion = "Maximo 200 caracteres.";
  }
  if (!isBlank(form.resenaPersonal) && form.resenaPersonal.trim().length > 200) {
    errors.resenaPersonal = "Maximo 200 caracteres.";
  }
  if (!isBlank(form.sexo) && !["M", "F"].includes(form.sexo)) {
    errors.sexo = "Debe seleccionar M o F.";
  }
  if (!isBlank(form.fNacimiento) && Number.isNaN(new Date(form.fNacimiento).getTime())) {
    errors.fNacimiento = "La fecha de nacimiento es invalida.";
  }
  if (!isBlank(form.fAfiliacion) && Number.isNaN(new Date(form.fAfiliacion).getTime())) {
    errors.fAfiliacion = "La fecha de afiliacion es invalida.";
  }
  if (!isBlank(form.fNacimiento) && !isBlank(form.fAfiliacion) && form.fAfiliacion < form.fNacimiento) {
    errors.fAfiliacion = "La fecha de afiliacion no puede ser menor a la de nacimiento.";
  }

  return errors;
}
