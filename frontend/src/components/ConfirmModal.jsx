function ConfirmModal({ isOpen, title, message, onCancel, onConfirm, loading = false }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-outline-secondary ghost-btn" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-danger danger-btn"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
