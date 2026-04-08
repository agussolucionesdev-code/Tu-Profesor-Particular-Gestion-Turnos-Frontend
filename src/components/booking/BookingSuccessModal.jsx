import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaCopy,
  FaEnvelope,
  FaExclamationCircle,
  FaInfoCircle,
  FaSearch,
  FaWhatsapp,
} from "react-icons/fa";

const getDeliveryAlert = (successData) => {
  const emailRecipient = successData?.notifications?.client?.recipient;
  const emailSent = successData?.notifications?.client?.sent;

  if (emailRecipient && emailSent) {
    return {
      type: "success",
      icon: <FaEnvelope />,
      title: "Comprobante enviado",
      body: `Tambien enviamos el detalle a ${emailRecipient}.`,
    };
  }

  if (successData?.email) {
    return {
      type: "warning",
      icon: <FaExclamationCircle />,
      title: "Guarda el codigo por las dudas",
      body:
        "La reserva quedo confirmada. Si el correo tarda en aparecer, puedes volver a encontrar el turno desde Mis Turnos con tu codigo, email o WhatsApp.",
    };
  }

  return {
    type: "info",
    icon: <FaInfoCircle />,
    title: "Gestion sin email",
    body:
      "No cargaste email, asi que el codigo de gestion pasa a ser tu referencia principal para volver a entrar desde Mis Turnos.",
  };
};

const BookingSuccessModal = ({
  show,
  successData,
  whatsappConfirmText,
  onCopyCode,
  onClose,
}) => {
  if (!show) return null;

  const deliveryAlert = getDeliveryAlert(successData);
  const managementMethods = successData?.managementMethods || [];

  return (
    <div className="neuro-modal-overlay">
      <div
        className="neuro-modal-card success-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-success-title"
      >
        <div className="modal-top-accent"></div>

        <div className="success-hero-band">
          <div className="success-check-animation">
            <FaCheckCircle />
          </div>
          <span className="success-eyebrow">Reserva confirmada</span>
          <h2 id="booking-success-title">Tu turno ya quedo listo para gestionar</h2>
          <p>
            Todo lo importante queda reunido aca: codigo, fecha, horario y la
            forma mas facil de volver a encontrar la reserva.
          </p>
        </div>

        <div className="modal-body success-modal-body">
          <section className="success-code-panel">
            <div>
              <span className="success-code-kicker">Codigo de gestion</span>
              <h3>{successData?.bookingCode}</h3>
              <p>
                Guardalo tal cual aparece. En{" "}
                <strong>Mis Turnos</strong> puedes usar este codigo para revisar,
                reprogramar o cancelar la reserva.
              </p>
            </div>

            <button
              type="button"
              className="btn-copy-code prominent"
              onClick={onCopyCode}
            >
              <FaCopy /> Copiar codigo
            </button>
          </section>

          <section className="success-summary-grid">
            <article className="success-summary-card">
              <span>
                <FaCalendarAlt /> Dia
              </span>
              <strong>{successData?.day}</strong>
            </article>
            <article className="success-summary-card">
              <span>
                <FaClock /> Horario
              </span>
              <strong>
                {successData?.startTime} a {successData?.endTime} hs
              </strong>
            </article>
            <article className="success-summary-card">
              <span>Alumno</span>
              <strong>{successData?.cleanStudentName}</strong>
            </article>
            <article className="success-summary-card">
              <span>Materia</span>
              <strong>{successData?.subject}</strong>
            </article>
            <article className="success-summary-card">
              <span>Nivel</span>
              <strong>{successData?.educationLevel}</strong>
            </article>
            <article className="success-summary-card">
              <span>Institucion</span>
              <strong>{successData?.school}</strong>
            </article>
          </section>

          <section className="success-management-card">
            <div className="success-management-head">
              <FaSearch />
              <div>
                <strong>Como volver a encontrar este turno</strong>
                <p>
                  En la seccion <strong>Mis Turnos</strong> puedes buscar con
                  cualquiera de estos datos:
                </p>
              </div>
            </div>

            <div className="success-management-grid">
              {managementMethods.map((method) => (
                <article key={method.label} className="success-management-pill">
                  <span>{method.label}</span>
                  <strong>{method.value}</strong>
                  <small>{method.helper}</small>
                </article>
              ))}
            </div>
          </section>

          <div className={`delivery-alert ${deliveryAlert.type}`}>
            <div className="delivery-alert-icon">{deliveryAlert.icon}</div>
            <div>
              <strong>{deliveryAlert.title}</strong>
              <span>{deliveryAlert.body}</span>
            </div>
          </div>

          <div className="delivery-alert info subdued">
            <div className="delivery-alert-icon">
              <FaInfoCircle />
            </div>
            <div>
              <strong>Donde usar el codigo</strong>
              <span>
                Ve a <strong>Mis Turnos</strong> cuando quieras gestionar la
                reserva. Si no tienes el codigo a mano, tambien sirven el email
                o el WhatsApp cargados.
              </span>
            </div>
          </div>
        </div>

        <div className="modal-actions success-modal-actions">
          <a href="/portal" className="btn-portal-primary">
            <FaSearch /> Ir a Mis Turnos
          </a>

          <div className="success-secondary-actions">
            <a
              href={`https://wa.me/5491164236675?text=${encodeURIComponent(whatsappConfirmText)}`}
              className="btn-ws-secondary"
              target="_blank"
              rel="noreferrer"
            >
              <FaWhatsapp /> Enviar comprobante
            </a>
            <button type="button" onClick={onClose} className="btn-close-text">
              Cerrar y volver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccessModal;
