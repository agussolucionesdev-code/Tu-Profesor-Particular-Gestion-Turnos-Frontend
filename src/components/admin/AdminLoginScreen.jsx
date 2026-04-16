import {
  FaCalendarCheck,
  FaInfoCircle,
  FaLock,
  FaSpinner,
  FaUsers,
  FaWhatsapp,
} from "react-icons/fa";

const AdminLoginScreen = ({
  username,
  password,
  loading,
  onUsernameChange,
  onPasswordChange,
  onLogin,
}) => {
  return (
    <div className="admin-login-shell">
      <div className="admin-login-layout">
        <section className="admin-login-intro" aria-label="Beneficios del panel">
          <span className="admin-login-kicker">Gestión interna</span>
          <h1>Un panel claro para decidir rápido y sin ruido</h1>
          <p>
            La idea es que, apenas entres, tengas agenda, alumnos y seguimiento
            en una interfaz legible, ordenada y fácil de recorrer incluso en
            jornadas largas.
          </p>

          <div className="admin-login-benefits">
            <article className="admin-login-benefit">
              <FaCalendarCheck />
              <strong>Agenda del día visible</strong>
              <p>Prioriza lo urgente y te deja ver rápido las próximas clases.</p>
            </article>

            <article className="admin-login-benefit">
              <FaUsers />
              <strong>Seguimiento por alumno</strong>
              <p>Encontrás responsables, historial y contexto sin perder foco.</p>
            </article>

            <article className="admin-login-benefit">
              <FaWhatsapp />
              <strong>Mensajes y acción rápida</strong>
              <p>
                Contactás y actualizás estados desde el mismo flujo de trabajo.
              </p>
            </article>
          </div>

          <div className="admin-login-trust">
            <FaInfoCircle />
            <p>
              Este acceso queda pensado solo para la gestión del profesor, con
              lectura reforzada, buen contraste y una jerarquía visual más
              descansada.
            </p>
          </div>
        </section>

        <div className="admin-login-card">
          <div className="admin-login-mark">
            <FaLock />
          </div>
          <span className="admin-login-eyebrow">Panel del profesor</span>
          <h2>Entrar al centro de control</h2>
          <p>
            Gestioná turnos, agenda, alumnos y seguimiento desde un solo lugar.
          </p>

          <label className="admin-field">
            <span>Usuario</span>
            <input
              className="admin-input"
              type="text"
              placeholder="Correo de acceso"
              value={username}
              onChange={onUsernameChange}
            />
          </label>

          <label className="admin-field">
            <span>Contraseña</span>
            <input
              className="admin-input"
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={onPasswordChange}
              onKeyDown={(event) => event.key === "Enter" && onLogin()}
            />
          </label>

          <button
            className="admin-primary-btn"
            onClick={onLogin}
            disabled={loading}
          >
            {loading ? <FaSpinner className="spinner" /> : "Ingresar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginScreen;
