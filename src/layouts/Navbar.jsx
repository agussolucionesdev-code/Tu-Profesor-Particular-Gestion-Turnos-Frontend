import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import {
  FaBars,
  FaCalendarAlt,
  FaClipboardList,
  FaMoon,
  FaSun,
  FaTimes,
  FaUserCog,
  FaVolumeMute,
  FaVolumeUp,
} from "react-icons/fa";
import { useUISettings } from "../components/accessibility/UISettingsContext";
import logoFull from "../assets/images/logo-full-sin-fondo.png";
import {
  isVoiceMuted,
  primeVoicePlayback,
  setVoiceMuted,
} from "../utils/neuroToast";
import "./Navbar.css";

const VOICE_HINT_KEY = "voice_hint_seen";
const VOICE_MUTED_EVENT = "neuro-voice-muted-changed";
const NAVBAR_VOICE_OPTIONS = {
  rate: 0.86,
  pitch: 0.98,
  volume: 0.9,
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [voiceMuted, setVoiceMutedState] = useState(() => isVoiceMuted());
  const [showVoiceHint, setShowVoiceHint] = useState(() => {
    try {
      return window.localStorage.getItem(VOICE_HINT_KEY) !== "true";
    } catch {
      return true;
    }
  });
  const themeTransitionTimerRef = useRef(null);
  const location = useLocation();
  const { effectiveTheme, setThemePreference } = useUISettings();

  useEffect(() => {
    const handleScroll = () => {
      const isPastThreshold = window.scrollY > 20;
      setScrolled(isPastThreshold);

      if (isPastThreshold) {
        setShowVoiceHint((currentValue) => {
          if (!currentValue) return currentValue;

          try {
            window.localStorage.setItem(VOICE_HINT_KEY, "true");
          } catch {
            // Ignore storage errors silently.
          }

          return false;
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!showVoiceHint) return undefined;

    const timeoutId = window.setTimeout(() => {
      setShowVoiceHint(false);
      try {
        window.localStorage.setItem(VOICE_HINT_KEY, "true");
      } catch {
        // Ignore storage errors silently.
      }
    }, 6500);

    return () => window.clearTimeout(timeoutId);
  }, [showVoiceHint]);

  useEffect(
    () => () => {
      if (themeTransitionTimerRef.current) {
        window.clearTimeout(themeTransitionTimerRef.current);
      }
      document.documentElement.classList.remove("theme-transitioning");
    },
    [],
  );

  useEffect(() => {
    const syncVoiceState = (event) => {
      setVoiceMutedState(
        typeof event.detail?.muted === "boolean"
          ? event.detail.muted
          : isVoiceMuted(),
      );
    };

    window.addEventListener(VOICE_MUTED_EVENT, syncVoiceState);
    return () => window.removeEventListener(VOICE_MUTED_EVENT, syncVoiceState);
  }, []);

  const dismissVoiceHint = () => {
    setShowVoiceHint(false);

    try {
      window.localStorage.setItem(VOICE_HINT_KEY, "true");
    } catch {
      // Ignore storage errors silently.
    }
  };

  const applyTheme = (nextTheme) => {
    document.documentElement.classList.add("theme-transitioning");

    if (themeTransitionTimerRef.current) {
      window.clearTimeout(themeTransitionTimerRef.current);
    }

    setThemePreference(nextTheme);

    themeTransitionTimerRef.current = window.setTimeout(() => {
      document.documentElement.classList.remove("theme-transitioning");
    }, 420);
  };

  const toggleTheme = () => {
    const nextTheme = effectiveTheme === "dark" ? "light" : "dark";
    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    )?.matches;

    if (
      !prefersReducedMotion &&
      typeof document.startViewTransition === "function"
    ) {
      document.startViewTransition(() => {
        flushSync(() => {
          applyTheme(nextTheme);
        });
      });
      return;
    }

    applyTheme(nextTheme);
  };

  const toggleVoice = () => {
    const nextMuted = !voiceMuted;
    setVoiceMuted(nextMuted);
    setVoiceMutedState(nextMuted);
    dismissVoiceHint();

    if (!nextMuted) {
      primeVoicePlayback({
        message:
          "Guía por voz activada. Te acompaño con mensajes suaves, claros y breves para que reserves o gestiones tu turno con tranquilidad.",
        voiceOptions: NAVBAR_VOICE_OPTIONS,
      });
      return;
    }

    window.speechSynthesis?.cancel?.();
  };

  const navLinks = [
    { title: "Reservar", path: "/reservar", icon: <FaCalendarAlt /> },
    { title: "Mis Turnos", path: "/portal", icon: <FaClipboardList /> },
    { title: "Administrador", path: "/admin", icon: <FaUserCog /> },
  ];

  return (
    <nav className={`navbar-elite ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-container">
        <Link
          to="/reservar"
          className="navbar-brand-logo"
          onClick={() => setIsOpen(false)}
          aria-label="Ir al inicio de reservas"
        >
          <span className="navbar-brand-media" aria-hidden="true">
            <span className="navbar-brand-halo"></span>
            <img src={logoFull} alt="" className="logo-img-horizontal" />
          </span>
          <span className="navbar-brand-copy">
            <strong>Tu Profesor Particular</strong>
            <small>Turnos guiados</small>
          </span>
        </Link>

        <div className="navbar-right-zone">
          <ul className={`nav-menu-list ${isOpen ? "active" : ""}`}>
            {navLinks.map((link) => {
              const isActive =
                location.pathname === link.path ||
                (link.path === "/reservar" && location.pathname === "/");

              return (
                <li key={link.path} className="nav-item">
                  <Link
                    to={link.path}
                    className={`nav-link-btn ${isActive ? "active" : ""}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="nav-icon">{link.icon}</span>
                    <span className="nav-text">{link.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div
            className="navbar-utility-cluster"
            aria-label="Preferencias visuales y de voz"
          >
            <div className="voice-toggle-shell">
              {showVoiceHint && (
                <button
                  type="button"
                  className="voice-hint-bubble"
                  onClick={toggleVoice}
                >
                  Activá la guía por voz
                </button>
              )}

              <button
                type="button"
                className={`nav-utility-btn nav-utility-pill voice-toggle-btn ${voiceMuted ? "muted" : "active"}`}
                onClick={toggleVoice}
                onBlur={dismissVoiceHint}
                title={
                  voiceMuted
                    ? "Activar guía por voz"
                    : "Pausar guía por voz"
                }
                aria-label={
                  voiceMuted
                    ? "Activar guía por voz"
                    : "Pausar guía por voz"
                }
                aria-pressed={!voiceMuted}
              >
                <span className="nav-utility-icon" aria-hidden="true">
                  {voiceMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                </span>
                <span className="nav-utility-copy">
                  <strong>Guía por voz</strong>
                  <small>{voiceMuted ? "Pausada" : "Activa y suave"}</small>
                </span>
              </button>
            </div>

            <button
              type="button"
              className="nav-utility-btn nav-utility-pill theme-toggle-btn"
              onClick={toggleTheme}
              title={
                effectiveTheme === "dark"
                  ? "Cambiar a modo claro"
                  : "Cambiar a modo oscuro"
              }
              aria-label={
                effectiveTheme === "dark"
                  ? "Cambiar a modo claro"
                  : "Cambiar a modo oscuro"
              }
            >
              <span className="nav-utility-icon" aria-hidden="true">
                {effectiveTheme === "dark" ? (
                  <FaSun className="icon-sun" />
                ) : (
                  <FaMoon className="icon-moon" />
                )}
              </span>
              <span className="nav-utility-copy">
                <strong>
                  {effectiveTheme === "dark" ? "Modo claro" : "Modo oscuro"}
                </strong>
                <small>
                  {effectiveTheme === "dark" ? "Iluminar vista" : "Bajar brillo"}
                </small>
              </span>
            </button>
          </div>

          <button
            type="button"
            className="menu-toggle-icon"
            onClick={() => setIsOpen((currentState) => !currentState)}
            aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isOpen}
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
