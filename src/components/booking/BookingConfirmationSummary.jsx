const BookingConfirmationSummary = ({
  dateLabel,
  durationLabel,
  timeRangeLabel,
  studentName,
  educationLevel,
  subject,
}) => (
  <div className="booking-summary-card">
    <div className="summary-top-row">
      <div>
        <span className="summary-kicker">Resumen del turno</span>
        <h4>{dateLabel || "Fecha pendiente"}</h4>
      </div>
      <span className="summary-duration-badge">{durationLabel || "Sin duracion"}</span>
    </div>

    <div className="summary-highlight-time">{timeRangeLabel || "Horario pendiente"}</div>

    <div className="summary-detail-grid">
      <div className="summary-detail-card">
        <span>Alumno</span>
        <strong>{studentName || "Sin completar"}</strong>
      </div>
      <div className="summary-detail-card">
        <span>Nivel</span>
        <strong>{educationLevel || "Sin completar"}</strong>
      </div>
      <div className="summary-detail-card full">
        <span>Materia</span>
        <strong>{subject || "Sin completar"}</strong>
      </div>
    </div>

    <div className="summary-support-row">
      <span className="summary-support-pill">Sin cruces de horario</span>
      <span className="summary-support-pill">Podes reprogramar despues</span>
    </div>
  </div>
);

export default BookingConfirmationSummary;
