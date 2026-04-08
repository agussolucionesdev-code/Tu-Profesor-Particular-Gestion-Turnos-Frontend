const BookingConfirmationSummary = ({
  dateLabel,
  durationLabel,
  timeRangeLabel,
  studentName,
  educationLevel,
  subject,
  school,
  lookupHint,
}) => (
  <div className="booking-summary-card">
    <div className="summary-top-row">
      <div>
        <span className="summary-kicker">Resumen del turno</span>
        <h4>{dateLabel || "Fecha pendiente"}</h4>
      </div>
      <span className="summary-duration-badge">
        {durationLabel || "Sin duracion"}
      </span>
    </div>

    <div className="summary-highlight-time">
      {timeRangeLabel || "Horario pendiente"}
    </div>

    <div className="summary-detail-grid">
      <div className="summary-detail-card">
        <span>Alumno</span>
        <strong>{studentName || "Sin completar"}</strong>
      </div>
      <div className="summary-detail-card">
        <span>Nivel</span>
        <strong>{educationLevel || "Sin completar"}</strong>
      </div>
      <div className="summary-detail-card">
        <span>Institucion</span>
        <strong>{school || "Sin completar"}</strong>
      </div>
      <div className="summary-detail-card">
        <span>Gestion</span>
        <strong>Mis Turnos</strong>
      </div>
      <div className="summary-detail-card full">
        <span>Materia</span>
        <strong>{subject || "Sin completar"}</strong>
      </div>
    </div>

    <div className="summary-support-row">
      <span className="summary-support-pill">Sin cruces de horario</span>
      <span className="summary-support-pill">Podes reprogramar despues</span>
      <span className="summary-support-pill">Codigo de gestion incluido</span>
    </div>

    <div className="summary-management-note">
      <span className="summary-note-kicker">Despues de confirmar</span>
      <p>
        {lookupHint ||
          "Te mostramos un codigo grande y despues puedes volver a encontrar tu reserva en Mis Turnos con ese codigo, tu email o tu WhatsApp."}
      </p>
    </div>
  </div>
);

export default BookingConfirmationSummary;
