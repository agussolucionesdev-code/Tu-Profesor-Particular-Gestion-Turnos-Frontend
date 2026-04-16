import {
  FaUserGraduate,
  FaWhatsapp,
  FaCheckCircle,
  FaUserCheck,
  FaIdCard,
  FaEnvelope,
} from "react-icons/fa";
import {
  RESPONSIBLE_RELATIONSHIP_OPTIONS,
  RESPONSIBLE_RELATIONSHIP_OTHER_VALUE,
} from "../../../utils/bookingFormatters";

const PersonalInfoStep = ({
  formData,
  isAdult,
  adultModeLocked,
  hasAttemptedNext,
  isValidField,
  getFieldStateClass,
  handleChange,
  toggleAdultMode,
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
            {hasAttemptedNext && !isValidField("studentName") && (
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
              aria-invalid={hasAttemptedNext && !isValidField("studentName")}
              aria-describedby="studentName-help"
              placeholder="Nombre y apellido del alumno"
            />
            {isValidField("studentName") && (
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
              Número de teléfono{" "}
              <span className="optional">(Sin 0 ni 15)</span>{" "}
              <span className="required">*</span>
            </label>
            {hasAttemptedNext && !isValidField("phone") && (
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
              aria-invalid={hasAttemptedNext && !isValidField("phone")}
              aria-describedby="phone-help"
              placeholder="+54 9 11-2222-3333"
            />
            {isValidField("phone") && <FaCheckCircle className="valid-icon" />}
          </div>
          <p id="phone-help" className="field-helper">
            Lo usamos para recordatorios, cambios y seguimiento rápido.
          </p>
        </div>
      </div>

      <div className="adult-mode-banner">
        <div className="adult-mode-copy">
          <span className="adult-mode-kicker">Quién reserva</span>
          <strong>
            {isAdult
              ? "Estás reservando para vos"
              : "Estás reservando para un menor"}
          </strong>
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
            aria-disabled={adultModeLocked}
            aria-label="Indicar que el alumno es mayor de edad"
            aria-describedby="adult-mode-help"
            disabled={adultModeLocked}
            onClick={toggleAdultMode}
          >
            <div className="toggle-text">
              <span
                className={`toggle-pill ${isAdult ? "active" : "inactive"}`}
              >
                {isAdult ? "Reserva directa" : "Con responsable"}
              </span>
              <span className="toggle-title">Soy alumno mayor de edad</span>
              <span className="toggle-subtitle">
                {isAdult
                  ? "Usaremos tus datos como contacto principal y podés cambiarlo cuando quieras."
                  : "Si el turno es para un menor, te pedimos un adulto responsable para acompañar el contacto."}
              </span>
            </div>
            <div className="toggle-control-shell" aria-hidden="true">
              <span
                className={`toggle-state-label ${
                  adultModeLocked ? "locked" : isAdult ? "active" : ""
                }`}
              >
                {adultModeLocked
                  ? "Bloqueado"
                  : isAdult
                    ? "Modo activo"
                    : "Activar"}
              </span>
              <div
                className={`neuro-toggle ${isAdult ? "active" : ""}`}
              ></div>
            </div>
          </button>
          <p
            id="adult-mode-help"
            className={`adult-mode-helper ${adultModeLocked ? "locked" : ""}`}
          >
            {adultModeLocked
              ? "Para volver a modo adulto, primero limpia los datos del adulto responsable."
              : "Podés cambiar esta opción cuando quieras antes de avanzar."}
          </p>
        </div>
      </div>

      <div
        className={`form-flex-adult ${isAdult ? "adult-self-mode" : ""}`}
      >
        {!isAdult ? (
          <>
            <div className="adult-field-container">
              <div className="neuro-input-group">
                <div className="label-row">
                  <label>
                    Adulto responsable{" "}
                    <span className="required">*</span>
                  </label>
                  {hasAttemptedNext && !isValidField("responsibleName") && (
                    <span className="error-text">Requerido</span>
                  )}
                </div>
                <div
                  className={`neuro-input-wrapper premium-input ${getFieldStateClass("responsibleName")}`}
                >
                  <FaUserCheck className="input-icon" />
                  <input
                    type="text"
                    name="responsibleName"
                    value={formData.responsibleName}
                    onChange={handleChange}
                    aria-invalid={
                      hasAttemptedNext && !isValidField("responsibleName")
                    }
                    aria-describedby="responsibleName-help"
                    placeholder="Nombre del adulto responsable"
                  />
                  {isValidField("responsibleName") && (
                    <FaCheckCircle className="valid-icon" />
                  )}
                </div>
                <p id="responsibleName-help" className="field-helper">
                  Puede ser madre, padre, abuelo, abuela o quien acompaña el
                  proceso.
                </p>
              </div>
            </div>

            <div className="adult-field-container">
              <div className="neuro-input-group">
                <div className="label-row">
                  <label>
                    Relación de parentesco{" "}
                    <span className="required">*</span>
                  </label>
                  {hasAttemptedNext &&
                    !isValidField("responsibleRelationship") && (
                      <span className="error-text">Requerido</span>
                    )}
                </div>
                <div
                  className={`neuro-input-wrapper premium-input select-input-wrapper ${getFieldStateClass("responsibleRelationship")}`}
                >
                  <FaIdCard className="input-icon" />
                  <select
                    name="responsibleRelationship"
                    value={formData.responsibleRelationship}
                    onChange={handleChange}
                    aria-invalid={
                      hasAttemptedNext &&
                      !isValidField("responsibleRelationship")
                    }
                    aria-describedby="responsibleRelationship-help"
                  >
                    <option value="">Seleccioná una opción</option>
                    {RESPONSIBLE_RELATIONSHIP_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {isValidField("responsibleRelationship") && (
                    <FaCheckCircle className="valid-icon" />
                  )}
                </div>
                <p
                  id="responsibleRelationship-help"
                  className="field-helper"
                >
                  Así sabrán, vos y el profesor, qué vínculo tiene quien está
                  gestionando el turno.
                </p>
              </div>
            </div>

            {formData.responsibleRelationship ===
              RESPONSIBLE_RELATIONSHIP_OTHER_VALUE && (
              <div className="adult-field-container adult-field-container-full">
                <div className="neuro-input-group">
                  <div className="label-row">
                    <label>
                      ¿Cuál es el vínculo?{" "}
                      <span className="required">*</span>
                    </label>
                    {hasAttemptedNext &&
                      !isValidField("responsibleRelationshipOther") && (
                        <span className="error-text">Requerido</span>
                      )}
                  </div>
                  <div
                    className={`neuro-input-wrapper premium-input ${getFieldStateClass("responsibleRelationshipOther")}`}
                  >
                    <FaUserCheck className="input-icon" />
                    <input
                      type="text"
                      name="responsibleRelationshipOther"
                      value={formData.responsibleRelationshipOther}
                      onChange={handleChange}
                      aria-invalid={
                        hasAttemptedNext &&
                        !isValidField("responsibleRelationshipOther")
                      }
                      aria-describedby="responsibleRelationshipOther-help"
                      placeholder="Ej.: Tutor legal, madrina, referente familiar"
                    />
                    {isValidField("responsibleRelationshipOther") && (
                      <FaCheckCircle className="valid-icon" />
                    )}
                  </div>
                  <p
                    id="responsibleRelationshipOther-help"
                    className="field-helper"
                  >
                    Escribilo tal como querés que figure en el resumen, en el
                    mail y en el panel del profesor.
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            className="adult-state-card"
            role="status"
            aria-live="polite"
          >
            <FaUserCheck />
            <div>
              <strong>Reserva directa</strong>
              <span>
                No hace falta completar un adulto responsable ni su
                parentesco.
              </span>
            </div>
          </div>
        )}

        <div className="adult-field-container">
          <div className="neuro-input-group" style={{ marginTop: "0" }}>
            <div className="label-row">
              <label>
                {isAdult ? "Email" : "Email de contacto"}{" "}
                <span className="optional">(Opcional)</span>
              </label>
              {hasAttemptedNext &&
                formData.email.trim() !== "" &&
                !isValidField("email") && (
                  <span className="error-text">Inválido</span>
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
                aria-invalid={
                  hasAttemptedNext &&
                  formData.email.trim() !== "" &&
                  !isValidField("email")
                }
                aria-describedby="email-help"
                placeholder="nombre@correo.com"
              />
              {formData.email.trim() !== "" && isValidField("email") && (
                <FaCheckCircle className="valid-icon" />
              )}
            </div>
            <p id="email-help" className="field-helper">
              {isAdult
                ? "Si lo completás, también te envío el código y el resumen por correo."
                : "Si lo dejás, el adulto responsable también recibe respaldo por correo."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoStep;
