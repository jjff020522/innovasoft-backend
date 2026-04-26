import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { deleteClient, getClient, getInterests, listClients } from "../api/localApi";
import AlertMessage from "../components/AlertMessage";
import ClientDetailModal from "../components/ClientDetailModal";
import ConfirmModal from "../components/ConfirmModal";
import { useAuth } from "../context/AuthContext";

function normalizeSearchValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

function filterClientsBySearch(clients, filters) {
  const identificationFilter = normalizeSearchValue(filters.identificacion);
  const nameFilter = normalizeSearchValue(filters.nombre);

  return clients.filter((client) => {
    const identification = normalizeSearchValue(client.identificacion);
    const firstName = normalizeSearchValue(client.nombre);
    const lastName = normalizeSearchValue(client.apellidos);
    const fullName = `${firstName} ${lastName}`.trim();

    const matchesIdentification = !identificationFilter || identification.includes(identificationFilter);
    const matchesName =
      !nameFilter ||
      firstName.includes(nameFilter) ||
      lastName.includes(nameFilter) ||
      fullName.includes(nameFilter);

    return matchesIdentification && matchesName;
  });
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10.5 3a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm7.6 11.2L22 20.1 20.1 22l-3.9-3.8 1.9-2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5c5.9 0 9.8 5.8 10 6.1l.3.4-.3.4C21.8 12.2 17.9 18 12 18S2.2 12.2 2 11.9l-.3-.4.3-.4C2.2 10.8 6.1 5 12 5Zm0 2C8.3 7 5.4 10 4.1 11.5 5.4 13 8.3 16 12 16s6.6-3 7.9-4.5C18.6 10 15.7 7 12 7Zm0 1.8A2.7 2.7 0 1 1 12 14a2.7 2.7 0 0 1 0-5.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m15.8 3.7 4.5 4.5-11 11L4.8 20l.8-4.5 10.2-11ZM3 21h18v-2H3v2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM6 9h2v9H6V9Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ClientListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  const [filters, setFilters] = useState({ identificacion: "", nombre: "" });
  const [allClients, setAllClients] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [detailClient, setDetailClient] = useState(null);
  const [detailLoadingId, setDetailLoadingId] = useState(null);
  const [message, setMessage] = useState({ type: "info", text: "" });

  const fetchClients = async ({ clearMessage = true } = {}) => {
    setLoading(true);
    if (clearMessage) {
      setMessage({ type: "info", text: "" });
    }

    try {
      const data = await listClients(session.token, {
        identificacion: null,
        nombre: null,
        usuarioId: session.userid,
      });
      setAllClients(data);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Se presento un inconveniente con la transaccion. Intente nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setClients(filterClientsBySearch(allClients, filters));
  }, [allClients, filters]);

  useEffect(() => {
    const hasFlashMessage = Boolean(location.state?.flashMessage);
    if (hasFlashMessage) {
      setMessage(location.state.flashMessage);
      navigate(location.pathname, { replace: true, state: null });
    }

    fetchClients({
      clearMessage: !hasFlashMessage,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    fetchClients({ clearMessage: false });
  };

  const handleViewDetail = async (clientId) => {
    setDetailLoadingId(clientId);
    setMessage({ type: "info", text: "" });

    try {
      const [clientDetail, interests] = await Promise.all([
        getClient(session.token, clientId),
        getInterests(session.token),
      ]);
      const interestId = clientDetail.interesesId || clientDetail.interesFK;
      const relatedInterest = interests.find((interest) => interest.id === interestId);
      setDetailClient({
        ...clientDetail,
        interesDescripcion: relatedInterest?.descripcion || interestId || "",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Se presento un inconveniente con la transaccion. Intente nuevamente.",
      });
    } finally {
      setDetailLoadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedClient) {
      return;
    }

    setDeleteLoading(true);

    try {
      await deleteClient(session.token, selectedClient.id);
      await fetchClients({ clearMessage: false });
      setMessage({ type: "success", text: "Cliente eliminado correctamente." });
      setSelectedClient(null);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Se presento un inconveniente con la transaccion. Intente nuevamente.",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <p className="eyebrow">Consulta</p>
        <h2>Consulta de clientes</h2>
        <p>Use filtros para buscar clientes y administre las operaciones de mantenimiento.</p>
      </div>

      <AlertMessage type={message.type} text={message.text} />

      <form className="row g-3 align-items-end" onSubmit={handleSearch}>
        <div className="col-md-4">
          <label className="form-label fw-semibold">Identificacion</label>
          <input
            type="text"
            className="form-control"
            value={filters.identificacion}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                identificacion: event.target.value,
              }))
            }
          />
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold">Nombre</label>
          <input
            type="text"
            className="form-control"
            value={filters.nombre}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                nombre: event.target.value,
              }))
            }
          />
        </div>

        <div className="col-md-4">
          <div className="d-flex flex-wrap gap-2 justify-content-md-end">
            <button type="submit" className="btn btn-primary primary-btn icon-btn" disabled={loading}>
              <SearchIcon />
              {loading ? "Buscando..." : "Buscar"}
            </button>
            <button
              type="button"
              className="btn btn-outline-primary secondary-btn"
              onClick={() => navigate("/clientes/nuevo")}
            >
              Agregar
            </button>
          </div>
        </div>
      </form>

      <div className="table-wrap table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Identificacion</th>
              <th>Nombre</th>
              <th>Apellidos</th>
              <th className="actions-col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!clients.length ? (
              <tr>
                <td colSpan={4} className="empty-state">
                  {loading ? "Consultando..." : "No hay registros para mostrar."}
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id}>
                  <td>{client.identificacion}</td>
                  <td>{client.nombre}</td>
                  <td>{client.apellidos}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="icon-action"
                        title="Detalle del cliente"
                        onClick={() => handleViewDetail(client.id)}
                        disabled={detailLoadingId === client.id}
                      >
                        <EyeIcon />
                      </button>
                      <button
                        type="button"
                        className="icon-action"
                        title="Editar cliente"
                        onClick={() => navigate(`/clientes/${client.id}`)}
                      >
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        className="icon-action danger"
                        title="Eliminar cliente"
                        onClick={() => setSelectedClient(client)}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={Boolean(selectedClient)}
        title="Confirmar eliminacion"
        message={`Desea eliminar el cliente ${selectedClient?.nombre ?? ""} ${selectedClient?.apellidos ?? ""}?`}
        onCancel={() => setSelectedClient(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />

      <ClientDetailModal
        isOpen={Boolean(detailClient)}
        client={detailClient}
        onClose={() => setDetailClient(null)}
      />
    </section>
  );
}

export default ClientListPage;
