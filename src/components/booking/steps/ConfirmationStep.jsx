import {
  FaCalendarCheck,
  FaClock,
  FaHourglassHalf,
  FaTicketAlt,
  FaCheckCircle,
  FaShieldAlt,
  FaArrowLeft,
  FaLightbulb,
} from "react-icons/fa";
import BookingConfirmationSummary from "../BookingConfirmationSummary";
import { formatDurationOptionLabel } from "../../../utils/bookingFormatters";

const ConfirmationStep = ({
  formData,
  isAdult,
  isTimeSelected,
  isConfirmationReady,
  confirmationDateLabel,
  confirmationDurationLabel,
  confirmationTimeRangeLabel,
  confirmationEducationLabel,
  responsibleRelationshipLabel,
  confirmationLookupHint,
  durationOptions,
  maxAllowedDuration,
  handleDurationSelect,
  handleSubmit,
  goToPrev,
  loading,
}) => {
  return (
    <>
      <div className="calendar-focus-container confirmation-stage">
        <div className="confirmation-stage-intro">
          <div className="confirmation-stage-copy">
            <span className="confirmation-stage-eyebrow">Paso 4 de 4</span>
            <h3
              className="section-title center-text confirmation-stage-title"
              tabIndex={-1}
            >
              <FaCalendarCheck /> Confirmación final
            </h3>
            <p className="step-empathy-note confirmation-stage-note">
              Ya tenés fecha y horario. Solo queda elegir la duración ideal y
              revisar el resumen con todo bien claro antes de confirmar.
            </p>
          </div>

          <div
            className={`confirmation-stage-badge ${isConfirmationReady ? "is-ready" : ""}`}
          >
            <span>
              {isConfirmationReady ? "Todo listo" : "Último detalle"}
            </span>
            <strong>
              {isConfirmationReady
                ? "Reserva preparada para confirmar"
                : "Elegí cuánto durará la clase"}
            </strong>
          </div>
        </div>

        <section className="confirmation-hero-panel">
          <article className="confirmation-hero-main">
            <span className="confirmation-hero-kicker">
              Tu reserva en una mirada
            </span>
            <h4>{confirmationDateLabel || "Aún falta definir el turno"}</h4>
            <p>
              {confirmationTimeRangeLabel
                ? "Este es el horario que va a quedar guardado. Ajustá la duración y confirmás en un último paso, sin vueltas."
                : "Cuando elijas un horario, acá te dejamos el resumen principal para cerrarlo con tranquilidad."}
            </p>

            <div className="confirmation-hero-facts">
              <div className="confirmation-hero-fact">
                <FaClock />
                <div>
                  <span>Horario</span>
                  <strong>
                    {confirmationTimeRangeLabel || "Pendiente"}
                  </strong>
                </div>
              </div>

              <div className="confirmation-hero-fact">
                <FaHourglassHalf />
                <div>
                  <span>Duración</span>
                  <strong>
                    {confirmationDurationLabel || "Aún sin elegir"}
                  </strong>
                </div>
              </div>

              <div className="confirmation-hero-fact">
                <FaTicketAlt />
                <div>
                  <span>Gestión</span>
                  <strong>Código al confirmar</strong>
                </div>
              </div>
            </div>
          </article>

          <aside className="confirmation-hero-side">
            <span className="confirmation-hero-side-kicker">
              Experiencia guiada
            </span>

            <div className="confirmation-hero-checks">
              <span className="confirmation-hero-check is-done">
                <FaCheckCircle /> Fecha elegida
              </span>
              <span
                className={`confirmation-hero-check ${isTimeSelected ? "is-done" : ""}`}
              >
                <FaCheckCircle /> Horario reservado
              </span>
              <span
                className={`confirmation-hero-check ${isConfirmationReady ? "is-done" : ""}`}
              >
                <FaShieldAlt /> Duración confirmada
              </span>
            </div>

            <p>
              {isConfirmationReady
                ? "Ya elegiste una opción compatible. Si todo te cierra, el botón final queda listo para confirmar."
                : `Te mostramos ${durationOptions.length} opciones compatibles con este horario para que elijas sin cruces ni confusiones.`}
            </p>
          </aside>
        </section>

        <section className="duration-selector duration-selector-premium">
          <div className="duration-selector-header">
            <div>
              <span className="duration-kicker">Duración de la clase</span>
              <h4>Elegí el tiempo ideal para este encuentro</h4>
              <p>
                Solo ves duraciones que entran dentro de ese horario, así todo
                queda prolijo, claro y sin superposiciones.
              </p>
            </div>

            <span className="duration-limit-badge">
              Hasta {formatDurationOptionLabel(maxAllowedDuration)}
            </span>
          </div>

          <div className="duration-selector-layout">
            <div
              className="duration-option-grid"
              role="list"
              aria-label="Opciones de duración"
            >
              {durationOptions.map((duration) => {
                const isSelected = Number(formData.duration) === duration;
                return (
                  <button
                    key={duration}
                    type="button"
                    className={`duration-chip ${isSelected ? "selected" : ""}`}
                    onClick={() => handleDurationSelect(duration)}
                    aria-pressed={isSelected}
                  >
                    {formatDurationOptionLabel(duration)}
                  </button>
                );
              })}
            </div>

            <aside
              className={`duration-summary-card ${isConfirmationReady ? "is-ready" : ""}`}
            >
              <span className="duration-summary-kicker">
                {isConfirmationReady ? "Duración elegida" : "Tu siguiente paso"}
              </span>
              <strong>
                {isConfirmationReady ? confirmationDurationLabel : "Marcá una opción"}
              </strong>
              <p>
                {formData.duration
                  ? `La clase quedará reservada por ${formatDurationOptionLabel(formData.duration)}.`
                  : "Tocá una tarjeta para definir cuánto tiempo querés reservar."}
              </p>

              <div className="duration-summary-meta">
                <span>
                  <FaShieldAlt /> Sin cruces
                </span>
                <span>
                  <FaCalendarCheck /> Revisar y confirmar
                </span>
              </div>
            </aside>
          </div>

          <div className="duration-footer">
            <p className="duration-current-selection">
              {formData.duration
                ? `Elegiste ${formatDurationOptionLabel(formData.duration)} para este turno.`
                : "Elegí cuánto tiempo querés reservar para continuar."}
            </p>
            <p className="duration-limit">
              Límite disponible para este turno:{" "}
              {formatDurationOptionLabel(maxAllowedDuration)}
            </p>
          </div>
        </section>

        <BookingConfirmationSummary
          dateLabel={confirmationDateLabel}
          durationLabel={confirmationDurationLabel}
          timeRangeLabel={confirmationTimeRangeLabel}
          studentName={formData.studentName}
          responsibleName={formData.responsibleName}
          responsibleRelationshipLabel={responsibleRelationshipLabel}
          isAdult={isAdult}
          educationLevel={confirmationEducationLabel}
          subject={formData.subject}
          school={formData.school}
          email={formData.email}
          phone={formData.phone}
          lookupHint={confirmationLookupHint}
        />
      </div>

      <div className="step-actions space-between confirmation-stage-actions">
        <button
          type="button"
          className="btn-neuro-secondary"
          onClick={goToPrev}
        >
          <FaArrowLeft /> Horario
        </button>
        <button
          type="submit"
          className={`btn-neuro-success ${formData.duration >= 0.5 ? "ready-to-pulse" : "btn-disabled"}`}
          onClick={handleSubmit}
          disabled={loading || !formData.duration || formData.duration < 0.5}
        >
          {loading ? "Procesando..." : "Confirmar Reserva"}
        </button>
      </div>
    </>
  );
};

export default ConfirmationStep;
