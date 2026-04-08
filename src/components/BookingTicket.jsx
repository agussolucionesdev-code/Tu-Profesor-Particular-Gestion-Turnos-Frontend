import React from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaHashtag,
  FaCheckCircle,
  FaHourglassHalf,
  FaEdit,
  FaTrashAlt,
  FaUserTie,
  FaUserGraduate,
  FaEnvelope,
  FaWhatsapp,
  FaBookOpen,
  FaTimesCircle,
  FaPhoneAlt,
} from "react-icons/fa";

const BookingTicket = ({ booking, onEdit, onCancel, onDelete }) => {
  // --- 1. LÃ“GICA DE FECHAS Y HORARIOS (RANGO) ---
  const dateObj = new Date(booking.timeSlot);

  // Calcular hora fin
  const endTimeObj = new Date(
    dateObj.getTime() + booking.duration * 60 * 60 * 1000,
  );

  const timeStart = !isNaN(dateObj)
    ? dateObj.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "--:--";

  const timeEnd = !isNaN(endTimeObj)
    ? endTimeObj.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "--:--";

  const dateStr = !isNaN(dateObj)
    ? dateObj.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Fecha invÃ¡lida";

  // --- 2. ICONOS DE ESTADO ---
  const getStatusIcon = (status) => {
    switch (status) {
      case "Confirmado":
        return <FaCheckCircle />;
      case "Pendiente":
        return <FaHourglassHalf />;
      case "Cancelado":
        return <FaTimesCircle />;
      default:
        return null;
    }
  };

  // LÃ³gica: Â¿Es Mayor de Edad?
  const isAdultStudent =
    booking.responsibleName === "Mayor de edad / Responsable";

  return (
    <div className={`ticket-card ${booking.status}`}>
      {/* HEADER */}
      <div className="ticket-header">
        <span className="ticket-code">
          <FaHashtag style={{ fontSize: "0.8em", marginRight: "4px" }} />
          {booking.bookingCode}
        </span>
        <div className={`status-badge ${booking.status}`}>
          {getStatusIcon(booking.status)} {booking.status}
        </div>
      </div>

      {/* BODY */}
      <div className="ticket-body">
        {/* COLUMNA 1: DATOS DEL ALUMNO (REGISTRADOS) */}
        <div className="info-section">
          {/* Tutor (Solo si corresponde) */}
          {!isAdultStudent && (
            <div className="info-block">
              <div className="label">
                <FaUserTie /> Adulto responsable
              </div>
              <div className="value-primary">{booking.responsibleName}</div>
            </div>
          )}

          <div className="info-block">
            <div className="label">
              <FaUserGraduate /> Alumno
            </div>
            <div className="value-secondary highlight-name">
              {booking.studentName}
            </div>

            {/* DATOS DE CONTACTO DEL ALUMNO (NUEVO LUGAR) */}
            <div className="student-contact-mini">
              {booking.phone && (
                <span title="Celular registrado">
                  <FaPhoneAlt /> {booking.phone}
                </span>
              )}
              {booking.email && (
                <span title="Email registrado">
                  <FaEnvelope /> {booking.email}
                </span>
              )}
            </div>
          </div>

          {booking.subject && (
            <div className="info-block" style={{ marginTop: "10px" }}>
              <div className="label">
                <FaBookOpen /> Materia / Tema
              </div>
              <div className="value-tertiary">{booking.subject}</div>
            </div>
          )}
        </div>

        {/* COLUMNA 2: AGENDA Y PROFESOR */}
        <div className="info-section">
          <div className="info-block">
            <div className="label">
              <FaCalendarAlt /> Fecha y Hora
            </div>
            <div className="value-primary date-highlight">{dateStr}</div>

            {/* RANGO HORARIO (NUEVO) */}
            <div className="value-secondary time-highlight">
              <FaClock /> {timeStart} - {timeEnd} hs
              <span className="duration-badge">{booking.duration} hs</span>
            </div>
          </div>

          {/* CONTACTO DEL PROFESOR (FIJO Y INSTITUCIONAL) */}
          <div className="info-block contact-signature">
            <div className="label">Contacto del Profesor</div>
            <div className="contact-list">
              <div className="contact-item">
                {/* Email Fijo con Rojo Gmail */}
                <FaEnvelope style={{ color: "#000" }} />
                agustinsosa.profe@gmail.com
              </div>

              <div className="contact-item">
                {/* TelÃ©fono Fijo con Verde WhatsApp */}
                <FaWhatsapp style={{ color: "#25D366", fontSize: "1.1em" }} />
                11-6423-6675
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER ACCIONES */}
      <div className="ticket-footer">
        {booking.status === "Cancelado" && (
          <div className="cancelled-note" role="status">
            Este turno ya fue cancelado. Lo podes ocultar cuando termines de
            revisarlo.
          </div>
        )}

        {booking.status !== "Cancelado" && (
          <>
            <button
              onClick={() => onEdit(booking)}
              className="btn-action btn-reschedule"
              aria-label={`Reprogramar turno de ${booking.studentName}`}
            >
              <FaEdit /> Reprogramar
            </button>
            <button
              onClick={() => onCancel(booking.bookingCode)}
              className="btn-action btn-cancel"
              aria-label={`Cancelar turno de ${booking.studentName}`}
            >
              <FaTimesCircle /> Cancelar Turno
            </button>
          </>
        )}

        {/* BotÃ³n eliminar manual (Por si falla el automÃ¡tico o historial viejo) */}
        {booking.status === "Cancelado" && (
          <button
            onClick={() => onDelete(booking._id)}
            className="btn-action btn-delete-forever"
            title="Eliminar de mi vista"
            aria-label={`Ocultar turno cancelado de ${booking.studentName}`}
          >
            <FaTrashAlt /> Eliminar Historial
          </button>
        )}
      </div>
    </div>
  );
};

export default BookingTicket;
