function formatDate(value) {
  if (!value) {
    return "No disponible";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString("es-ES");
}

function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value || "No disponible"}</strong>
    </div>
  );
}

function ClientDetailModal({ isOpen, client, onClose }) {
  if (!isOpen || !client) {
    return null;
  }

  const imagePreview = client.imagen
    ? client.imagen.startsWith("data:")
      ? client.imagen
      : `data:image/jpeg;base64,${client.imagen}`
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card detail-modal" onClick={(event) => event.stopPropagation()}>
        <div className="detail-header">
          <div>
            <h3>Detalle del cliente</h3>
            <p>Visualizacion completa de la informacion del registro seleccionado.</p>
          </div>
          <button type="button" className="btn btn-outline-secondary ghost-btn" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="detail-layout">
          <div className="avatar-preview detail-avatar">
            {imagePreview ? <img src={imagePreview} alt="Cliente" /> : <span>Sin imagen</span>}
          </div>

          <div className="detail-grid">
            <DetailItem label="Nombre" value={client.nombre} />
            <DetailItem label="Apellidos" value={client.apellidos} />
            <DetailItem label="Identificacion" value={client.identificacion} />
            <DetailItem label="Telefono celular" value={client.telefonoCelular} />
            <DetailItem label="Otro telefono" value={client.otroTelefono} />
            <DetailItem label="Direccion" value={client.direccion} />
            <DetailItem label="Fecha de nacimiento" value={formatDate(client.fNacimiento)} />
            <DetailItem label="Fecha de afiliacion" value={formatDate(client.fAfiliacion)} />
            <DetailItem
              label="Sexo"
              value={client.sexo === "F" ? "Femenino" : client.sexo === "M" ? "Masculino" : client.sexo}
            />
            <DetailItem label="Interes" value={client.interesDescripcion || client.interesesId} />
          </div>
        </div>

        <div className="detail-notes">
          <span>Resena personal</span>
          <p>{client.resenaPersonal || "No disponible"}</p>
        </div>
      </div>
    </div>
  );
}

export default ClientDetailModal;
