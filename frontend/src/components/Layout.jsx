import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login", {
      replace: true,
      state: {
        flashMessage: {
          type: "success",
          text: "La sesion se cerro correctamente.",
        },
      },
    });
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <p className="eyebrow">Plataforma</p>
          <h1>Innovasoft</h1>
          <p>Gestion de clientes</p>
        </div>

        <nav className="menu">
          <NavLink to="/" onClick={() => setIsSidebarOpen(false)}>
            Inicio
          </NavLink>
          <NavLink to="/clientes" onClick={() => setIsSidebarOpen(false)}>
            Cuentas clientes
          </NavLink>
        </nav>
      </aside>

      <div
        className={`sidebar-overlay ${isSidebarOpen ? "visible" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <div className="main-panel">
        <header className="topbar">
          <button
            type="button"
            className="btn btn-outline-secondary ghost-btn mobile-only"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
          >
            Menu
          </button>

          <div className="topbar-user">
            <span>{session?.username}</span>
            <button type="button" className="btn btn-outline-danger danger-outline-btn" onClick={handleLogout}>
              Cerrar sesion
            </button>
          </div>
        </header>

        <main className="content container-fluid">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
