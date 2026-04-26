function AlertMessage({ type = "info", text }) {
  if (!text) {
    return null;
  }

  const bootstrapType = {
    info: "info",
    error: "danger",
    success: "success",
  }[type] || "secondary";

  return (
    <div className={`alert alert-${bootstrapType} shadow-sm border-0 ${type}`} role="alert">
      {text}
    </div>
  );
}

export default AlertMessage;
