import { FaLock, FaSpinner } from "react-icons/fa";
import logoIcon from "../../assets/images/logo-icon-sin-fondo.png";

const AdminLoginScreen = ({
  username,
  password,
  loading,
  onUsernameChange,
  onPasswordChange,
  onLogin,
}) => {
  return (
    <div className="admin-login-shell admin-login-shell--minimal">
      <div className="admin-login-card admin-login-card--centered">
        <div className="admin-login-brand">
          <img
            src={logoIcon}
            alt="Tu Profesor Particular"
            className="admin-login-logo"
          />
          <span className="admin-login-eyebrow">Panel del profesor</span>
          <h2>Acceso privado</h2>
          <p className="admin-login-subtitle">
            Bienvenido, Agustín. Ingresá tus credenciales.
          </p>
        </div>

        <label className="admin-field">
          <span>Usuario</span>
          <input
            className="admin-input"
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={onUsernameChange}
            autoComplete="username"
            autoFocus
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
            autoComplete="current-password"
          />
        </label>

        <button
          className="admin-primary-btn"
          onClick={onLogin}
          disabled={loading}
        >
          {loading ? (
            <FaSpinner className="spinner" />
          ) : (
            <>
              <FaLock /> Ingresar
            </>
          )}
        </button>

        <p className="admin-login-foot">
          Esta sección es privada. Solo el profesor accede a los datos de los
          alumnos y la agenda.
        </p>
      </div>
    </div>
  );
};

export default AdminLoginScreen;
