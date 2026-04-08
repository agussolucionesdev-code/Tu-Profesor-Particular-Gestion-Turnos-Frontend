import { FaCheckCircle, FaEnvelope, FaExclamationCircle, FaWhatsapp } from "react-icons/fa";

const BookingSuccessModal = ({
  show,
  successData,
  whatsappConfirmText,
  onCopyCode,
  onClose,
}) => {
  if (!show) return null;

  return (
    <div className="neuro-modal-overlay">
      <div
        className="neuro-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-success-title"
      >
        <div className="modal-top-accent"></div>
        <div className="modal-header">
          <div className="success-check-animation">
            <FaCheckCircle />
          </div>
          <h2 id="booking-success-title">Reserva confirmada</h2>
          <p>Tu turno ya quedo guardado y listo para gestionar.</p>
        </div>
        <div className="modal-body">
          <div className="booking-code-box">
            <span>CODIGO DE TURNO</span>
            <h3>{successData?.bookingCode}</h3>
            <button type="button" className="btn-copy-code" onClick={onCopyCode}>
              Copiar codigo
            </button>
          </div>
          <div className="modal-summary-list">
            <div className="m-item">
              <span>Alumno</span>
              <strong>{successData?.cleanStudentName}</strong>
            </div>
            <div className="m-item">
              <span>Dia</span>
              <strong>{successData?.day}</strong>
            </div>
            <div className="m-item">
              <span>Horario</span>
              <strong>
                {successData?.startTime} a {successData?.endTime}
              </strong>
            </div>
          </div>
          <div className="success-next-steps">
            <div className="next-step-card">
              <strong>1. Guarda el codigo</strong>
              <span>Te sirve para reprogramar o cancelar sin vueltas.</span>
            </div>
            <div className="next-step-card">
              <strong>2. Tene a mano WhatsApp</strong>
              <span>Es el canal principal para avisos y seguimiento.</span>
            </div>
          </div>
          {!successData?.email || successData?.email === "No especificado" ? (
            <div className="modal-alert danger">
              <FaExclamationCircle /> Guarda tu codigo, no ingresaste email.
            </div>
          ) : (
            <div className="modal-alert success">
              <FaEnvelope /> Copia enviada a <strong>{successData.email}</strong>.
            </div>
          )}
        </div>
        <div className="modal-actions">
          <a
            href={`https://wa.me/5491164236675?text=${encodeURIComponent(whatsappConfirmText)}`}
            className="btn-ws-primary"
            target="_blank"
            rel="noreferrer"
          >
            <FaWhatsapp /> Enviar Comprobante
          </a>
          <button onClick={onClose} className="btn-close-text">
            Cerrar y Volver
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccessModal;
