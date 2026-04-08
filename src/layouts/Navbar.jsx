import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
// Tu logo full (el CSS se encargará de borrarle el fondo blanco)
import logoFull from "../assets/images/logo-full-sin-fondo.png";
import {
  FaBars,
  FaTimes,
  FaCalendarAlt,
  FaClipboardList,
  FaUserCog,
  FaMoon,
  FaSun,
} from "react-icons/fa";
import "./Navbar.css";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });
  const location = useLocation();

  // --- EFECTO DE SCROLL: Shrink (Achicamiento) y Sombra ---
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  // --- MENÚ PRINCIPAL ---
  const navLinks = [
    { title: "Reservar", path: "/reservar", icon: <FaCalendarAlt /> },
    { title: "Mis Turnos", path: "/portal", icon: <FaClipboardList /> },
    { title: "Administrador", path: "/admin", icon: <FaUserCog /> },
  ];

  return (
    <nav className={`navbar-elite ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-container">
        {/* =========================================
            IZQUIERDA: LOGO PURO (Sin cajas)
            ========================================= */}
        <Link
          to="/reservar"
          className="navbar-brand-logo"
          onClick={() => setIsOpen(false)}
        >
          <img
            src={logoFull}
            alt="Agustín Elías Sosa - Tu Profesor Particular"
            className="logo-img-horizontal"
          />
        </Link>

        {/* =========================================
            CENTRO: BOTÓN LUNA (Minimalista)
            ========================================= */}
        <div className="navbar-center-zone">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={
              theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
            }
            aria-label={
              theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
            }
          >
            {theme === "dark" ? (
              <FaSun className="icon-sun" />
            ) : (
              <FaMoon className="icon-moon" />
            )}
          </button>
        </div>

        {/* =========================================
            DERECHA: HAMBURGUESA (Móvil)
            ========================================= */}
        <div className="menu-toggle-icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </div>

        {/* =========================================
            DERECHA: MENÚ NAVEGACIÓN (Desktop)
            ========================================= */}
        <ul className={`nav-menu-list ${isOpen ? "active" : ""}`}>
          {navLinks.map((link, index) => {
            const isActive =
              location.pathname === link.path ||
              (link.path === "/reservar" && location.pathname === "/");

            return (
              <li key={index} className="nav-item">
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
      </div>
    </nav>
  );
};

export default Navbar;
