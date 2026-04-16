import { FaUserGraduate, FaWhatsapp, FaIdCard, FaCheckCircle, FaUserCheck } from "react-icons/fa";
import { ADULT_RELATIONSHIP_VALUE, RESPONSIBLE_RELATIONSHIP_OTHER_VALUE, RESPONSIBLE_RELATIONSHIP_OPTIONS } from "../../../utils/bookingFormatters";

export const PersonalInfoStep = ({
  formData,
  isAdult,
  hasAttemptedNext,
  getFieldStateClass,
  handleChange,
  toggleAdultMode,
  adultModeLocked,
}) => {
  return (
    <div className="form-section-block">
      <h3 className="section-title" tabIndex={-1}>
        <FaIdCard /> Información personal
      </h3>
      <div className="form-grid-2">
        <div className="neuro-input-group">
          <div className="label-row">
            <label>
              Nombre del Alumno <span className="required">*</span>
            </label>
            {hasAttemptedNext && !getFieldStateClass("studentName").includes("is-valid") && (
              <span className="error-text">Requerido</span>
            )}
          </div>
          <div
            className={`neuro-input-wrapper premium-input ${getFieldStateClass("studentName")}`}
          >
            <FaUserGraduate className="input-icon" />
            <input
              type="text"
              name="studentName"
              value={formData.studentName}
              onChange={handleChange}
              aria-invalid={hasAttemptedNext && !getFieldStateClass("studentName").includes("is-valid")}
              aria-describedby="studentName-help"
              placeholder="Nombre y apellido del alumno"
            />
            {getFieldStateClass("studentName").includes("is-valid") && (
              <FaCheckCircle className="valid-icon" />
            )}
          </div>
          <p id="studentName-help" className="field-helper">
            Escribilo como te gustaría verlo en el comprobante y en los avisos.
          </p>
        </div>
        <div className="neuro-input-group">
          <div className="label-row">
            <label>
              Número de teléfono <span className="optional">(Sin 0 ni 15)</span>{" "}
              <span className="required">*</span>
            </label>
            {hasAttemptedNext && !getFieldStateClass("phone").includes("is-valid") && (
              <span className="error-text">Requerido</span>
            )}
          </div>
          <div
            className={`neuro-input-wrapper premium-input ${getFieldStateClass("phone")}`}
          >
            <FaWhatsapp className="input-icon" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              inputMode="tel"
              aria-invalid={hasAttemptedNext && !getFieldStateClass("phone").includes("is-valid")}
              aria-describedby="phone-help"
              placeholder="+54 9 11-2222-3333"
            />
            {getFieldStateClass("phone").includes("is-valid") && (
              <FaCheckCircle className="valid-icon" />
            )}
          </div>
          <p id="phone-help" className="field-helper">
            Lo usamos para recordatorios, cambios y seguimiento rápido.
          </p>
        </div>
      </div>

      <div className="adult-mode-banner">
        <div className="adult-mode-copy">
          <span className="adult-mode-kicker">Quién reserva</span>
          <strong>{isAdult ? "Estás reservando para vos" : "Estás reservando para un menor"}</strong>
          <small>
            {isAdult
              ? "Mantenemos esta opción siempre visible para que puedas cambiarla sin perderte."
              : "Si el turno es para un menor, pedimos un adulto responsable para acompañar el contacto."}
          </small>
        </div>
        <div className="neuro-toggle-animator adult-mode-toggle">
          <button
            type="button"
            className={`neuro-toggle-wrapper premium-input ${isAdult ? "active-box" : ""} ${adultModeLocked ? "is-disabled" : ""}`}
            role="switch"
            aria-checked={isAdult}
            aria-label="Indicar que el alumno es mayor de edad"
            disabled={adultModeLocked}
            onClick={toggleAdultMode}
          >
            <div className="toggle-text">
              <span className={`toggle-pill ${isAdult ? "active" : "inactive"}`}>
                {isAdult ? "Reserva directa" : "Con responsable"}
              </span>
              <span className="toggle-title">Soy alumno mayor de edad</span>
              <span className="toggle-subtitle">
                {isAdult
                  ? "Usaremos tus datos como contacto principal y podés cambiarlo cuando quieras."
                  : "Si el turno es para un menor, te pedimos un adulto responsable para acompañar el contacto."}
              </span>
            </div>
            <div className={`toggle-switch ${isAdult ? "active" : ""}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {!isAdult && (
        <div className="form-grid-2">
          <div className="neuro-input-group">
            <div className="label-row">
              <label>
                Nombre del Responsable <span className="required">*</span>
              </label>
              {hasAttemptedNext && !getFieldStateClass("responsibleName").includes("is-valid") && (
                <span className="error-text">Requerido</span>
              )}
            </div>
            <div
              className={`neuro-input-wrapper premium-input ${getFieldStateClass("responsibleName")}`}
            >
              <FaUserGraduate className="input-icon" />
              <input
                type="text"
                name="responsibleName"
                value={formData.responsibleName}
                onChange={handleChange}
                aria-invalid={hasAttemptedNext && !getFieldStateClass("responsibleName").includes("is-valid")}
                aria-describedby="responsibleName-help"
                placeholder="Nombre y apellido del adulto responsable"
              />
              {getFieldStateClass("responsibleName").includes("is-valid") && (
                <FaCheckCircle className="valid-icon" />
              )}
            </div>
            <p id="responsibleName-help" className="field-helper">
              Persona de contacto para emergencias o cambios de último momento.
            </p>
          </div>
          <div className="neuro-input-group">
            <div className="label-row">
              <label>
                Vínculo con el alumno <span className="required">*</span>
              </label>
              {hasAttemptedNext && !getFieldStateClass("responsibleRelationship").includes("is-valid") && (
                <span className="error-text">Requerido</span>
              )}
            </div>
            <div
              className={`neuro-input-wrapper premium-input ${getFieldStateClass("responsibleRelationship")}`}
            >
              <select
                name="responsibleRelationship"
                value={formData.responsibleRelationship}
                onChange={handleChange}
                aria-invalid={hasAttemptedNext && !getFieldStateClass("responsibleRelationship").includes("is-valid")}
                aria-describedby="responsibleRelationship-help"
              >
                <option value="">Seleccionar vínculo...</option>
                {RESPONSIBLE_RELATIONSHIP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {getFieldStateClass("responsibleRelationship").includes("is-valid") && (
                <FaCheckCircle className="valid-icon" />
              )}
            </div>
            <p id="responsibleRelationship-help" className="field-helper">
              Elegí la relación que tenés con el alumno para personalizar la comunicación.
            </p>
          </div>
        </div>
      )}

      {formData.responsibleRelationship === RESPONSIBLE_RELATIONSHIP_OTHER_VALUE && (
        <div className="neuro-input-group">
          <div className="label-row">
            <label>
              Especificar vínculo <span className="required">*</span>
            </label>
            {hasAttemptedNext && !getFieldStateClass("responsibleRelationshipOther").includes("is-valid") && (
              <span className="error-text">Requerido</span>
            )}
          </div>
          <div
            className={`neuro-input-wrapper premium-input ${getFieldStateClass("responsibleRelationshipOther")}`}
          >
            <input
              type="text"
              name="responsibleRelationshipOther"
              value={formData.responsibleRelationshipOther}
              onChange={handleChange}
              aria-invalid={hasAttemptedNext && !getFieldStateClass("responsibleRelationshipOther").includes("is-valid")}
              aria-describedby="responsibleRelationshipOther-help"
              placeholder="Ej: Tío, Abuelo, Tutor legal..."
            />
            {getFieldStateClass("responsibleRelationshipOther").includes("is-valid") && (
              <FaCheckCircle className="valid-icon" />
            )}
          </div>
          <p id="responsibleRelationshipOther-help" className="field-helper">
            Describí brevemente tu relación con el alumno.
          </p>
        </div>
      )}

      <div className="neuro-input-group">
        <div className="label-row">
          <label>
            Email de contacto <span className="optional">(Opcional)</span>
          </label>
          {hasAttemptedNext && formData.email.trim() !== "" && !getFieldStateClass("email").includes("is-valid") && (
            <span className="error-text">Formato inválido</span>
          )}
        </div>
        <div
          className={`neuro-input-wrapper premium-input ${getFieldStateClass("email", true)}`}
        >
          <FaEnvelope className="input-icon" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            aria-invalid={hasAttemptedNext && formData.email.trim() !== "" && !getFieldStateClass("email").includes("is-valid")}
            aria-describedby="email-help"
            placeholder="tu@email.com"
          />
          {formData.email.trim() !== "" && getFieldStateClass("email").includes("is-valid") && (
            <FaCheckCircle className="valid-icon" />
          )}
        </div>
        <p id="email-help" className="field-helper">
          Te enviaremos confirmación y recordatorios. Podés dejarlo vacío si preferís solo WhatsApp.
        </p>
      </div>
    </div>
  );
};

export default PersonalInfoStep;
