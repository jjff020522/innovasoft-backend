# Solucion Prueba Tecnica Python - Innovasoft

Implementacion full stack basada en el PDF `Prueba_Tecnica_Desarrollador_Python_V3.pdf`.

Arquitectura aplicada:

`React JS -> API Local FastAPI -> API Innovasoft + MongoDB`

## Stack

- Python 3.10+
- FastAPI
- httpx asincrono
- MongoDB local
- React JS + Vite

## Lo implementado

- Login con validaciones y opcion `Recuerdame`
- Registro con validacion de correo y contrasena segura
- Home con navegacion a clientes
- Menu lateral y barra superior con usuario en sesion
- Logout
- Pagina 404
- Consulta de clientes con filtros
- Acciones de cliente: detalle, crear, editar y eliminar
- Confirmacion antes de eliminar
- Mantenimiento de clientes con imagen base64
- Carga de intereses antes del formulario
- API local obligatoria entre React y la API externa
- Sesiones almacenadas en MongoDB
- Bitacora de operaciones CRUD en MongoDB
- Configuracion por entorno con variables `LOCAL_API_*`

## Estructura

```text
backend/
frontend/
scripts/
README.md
docker-compose.yml
```

## Scripts de ayuda

Todos estan en `scripts/`.

- `Setup-Project.ps1`
  - crea `.env` si no existe
  - crea `.venv` si no existe
  - instala dependencias de backend y frontend
- `Start-Backend.ps1`
  - levanta FastAPI en `http://localhost:8000`
- `Start-Frontend.ps1`
  - levanta React en `http://localhost:5173`
- `Start-Project.ps1`
  - prepara el proyecto y abre backend y frontend en ventanas separadas

## Uso rapido en Windows

Desde la raiz del proyecto:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\Setup-Project.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\Start-Project.ps1
```

## Variables de entorno backend

Archivo: `backend\.env`

```env
LOCAL_API_ENV=development
LOCAL_API_DEBUG=true
LOCAL_API_HOST=0.0.0.0
LOCAL_API_PORT=8000
LOCAL_API_INNOVASOFT_API_BASE_URL=https://pruebareactjs.test-class.com/Api/
LOCAL_API_INNOVASOFT_TIMEOUT_SECONDS=30
LOCAL_API_MONGODB_URI=mongodb://localhost:27017
LOCAL_API_MONGODB_DB_NAME=innovasoft_local
LOCAL_API_CORS_ORIGINS=http://localhost:5173
```

## Variables de entorno frontend

Archivo: `frontend\.env`

```env
VITE_API_BASE_URL=http://localhost:8000
```

## MongoDB requerido por el PDF

Colecciones utilizadas:

- `sesiones`
  - `token`
  - `userid`
  - `username`
  - `user_data`
  - `login_timestamp`
- `operaciones`
  - `accion`
  - `usuario`
  - `cliente_id`
  - `timestamp`
  - `resultado`

## Verificaciones realizadas

- Frontend compilado con `npm run build`
- Backend validado con importacion real y `compileall`

## Pendiente para correr end-to-end

Es necesario tener MongoDB ejecutandose en `localhost:27017`.
