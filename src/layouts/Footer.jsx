import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaWhatsapp,
  FaEnvelope,
  FaMapMarkerAlt,
  FaArrowRight,
  FaHome,
  FaCalendarAlt,
  FaUserLock,
  FaUserCog,
  FaInstagram,
  FaFacebookF,
  FaLinkedinIn,
  FaArrowUp,
  FaBrain,
  FaUserCheck,
  FaGlobe,
} from "react-icons/fa";

import logoIcon from "../assets/images/logo-icon-sin-fondo.png";
import "./Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // --- ESTADO PARA CONTROLAR LA FLECHA FLOTANTE ---
  const [showTopBtn, setShowTopBtn] = useState(false);

  // --- EFECTO DE SCROLL (Detección para mostrar/ocultar) ---
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowTopBtn(true);
      } else {
        setShowTopBtn(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // =================================================================
  // ALGORITMO VIP DE SCROLL (Ease-Out Quartic - Suavidad Extrema)
  // =================================================================
  const scrollToTop = () => {
    const startPosition = window.scrollY;
    if (startPosition === 0) return;

    const duration = 500; // 0.5 segundos tiempo de inicio de animación
    let startTime = null;

    // Matemática "Ease Out Quart": Inicia sin demora, frena con una delicadeza absoluta.
    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 8);

    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;

      // Progreso de la animación de 0 a 1
      const progress = Math.min(timeElapsed / duration, 500);

      // Aplicamos la curva de suavidad al progreso
      const ease = easeOutQuart(progress);

      // Calculamos el píxel exacto donde debe estar la cámara en este milisegundo
      const currentPosition = startPosition - startPosition * ease;

      window.scrollTo(0, currentPosition);

      // Si no terminó el tiempo, pedimos el siguiente frame gráfico
      if (progress < 1) {
        window.requestAnimationFrame(animation);
      } else {
        window.scrollTo(0, 0); // Aseguramos el freno milimétrico final
      }
    };

    // Iniciamos el motor de animación
    window.requestAnimationFrame(animation);
  };

  return (
    <>
      <footer className="footer-elite">
        <div className="footer-ambient-glow"></div>

        <div className="footer-grid-container">
          {/* =========================================
              COLUMNA 1: IDENTIDAD, NEUROCIENCIA Y AUTORIDAD
              ========================================= */}
          <div className="footer-brand-col">
            <div className="footer-header-brand">
              {/* === LOGO TRANSPARENTE CON SPOTLIGHT === */}
              <div className="logo-premium-wrapper">
                <img
                  src={logoIcon}
                  alt="Logo Agustín Elías Sosa"
                  className="logo-img-transparent"
                />
              </div>

              <div className="brand-titles">
                <h3>Agustín Elías Sosa</h3>
                <span>Tu Profesor Particular</span>
              </div>
            </div>

            <div className="brand-philosophy">
              <h4 className="neuro-hook">Desbloqueá tu verdadero potencial.</h4>
              <p className="neuro-copy">
                Un enfoque integral que fusiona neurociencia, psicología y
                empatía. No se trata de memorizar, sino de dominar el
                conocimiento de manera dinámica y adaptada a vos.
              </p>
            </div>

            <div className="footer-value-tags">
              <span className="value-tag">
                <FaUserCheck /> ATENCIÓN PERSONALIZADA
              </span>
              <span className="value-tag">
                <FaBrain /> MÉTODO NEUROCOGNITIVO
              </span>
              <span className="value-tag">
                <FaGlobe /> APRENDIZAJE INTEGRAL
              </span>
            </div>
          </div>

          {/* =========================================
              COLUMNA 2: NAVEGACIÓN (EXPLORAR)
              ========================================= */}
          <div className="footer-nav-col">
            <h4 className="footer-section-title">Explorar</h4>
            <nav aria-label="Navegación del pie de página">
              <ul className="footer-links-list">
                <li>
                  <Link to="/" className="footer-link-item">
                    <div className="link-icon-box">
                      <FaHome />
                    </div>
                    <span className="link-text">Página de Inicio</span>
                    <FaArrowRight className="link-arrow" />
                  </Link>
                </li>
                <li>
                  <Link to="/reservar" className="footer-link-item">
                    <div className="link-icon-box">
                      <FaCalendarAlt />
                    </div>
                    <span className="link-text">Agendar tu Clase</span>
                    <FaArrowRight className="link-arrow" />
                  </Link>
                </li>
                <li>
                  <Link to="/portal" className="footer-link-item">
                    <div className="link-icon-box">
                      <FaUserLock />
                    </div>
                    <span className="link-text">Portal de Alumnos</span>
                    <FaArrowRight className="link-arrow" />
                  </Link>
                </li>
                <li>
                  <Link to="/admin" className="footer-link-item">
                    <div className="link-icon-box">
                      <FaUserCog />
                    </div>
                    <span className="link-text">Gestión Administrativa</span>
                    <FaArrowRight className="link-arrow" />
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* =========================================
              COLUMNA 3: CONTACTO ACCESIBLE
              ========================================= */}
          <div className="footer-contact-col">
            <h4 className="footer-section-title">Hablemos</h4>
            <address className="footer-contact-address">
              <a
                href="https://wa.me/5491164236675?text=Hola%20Agust%C3%ADn!%20Vengo%20desde%20tu%20sitio%20web%20y%20me%20gustar%C3%ADa%20consultar%20por%20clases."
                target="_blank"
                rel="noreferrer"
                className="contact-card wp-card"
              >
                <div className="contact-icon">
                  <FaWhatsapp />
                </div>
                <div className="contact-details">
                  <span className="contact-label">
                    Asesoramiento vía WhatsApp
                  </span>
                  <span className="contact-value">+54 9 11 6423-6675</span>
                </div>
              </a>

              <a
                href="mailto:agustinsosa.profe@gmail.com"
                className="contact-card email-card"
              >
                <div className="contact-icon">
                  <FaEnvelope />
                </div>
                <div className="contact-details">
                  <span className="contact-label">Consultas por Email</span>
                  <span className="contact-value">
                    agustinsosa.profe@gmail.com
                  </span>
                </div>
              </a>

              <a
                href="https://maps.google.com/?q=Jujuy+414,Temperley,Buenos+Aires"
                target="_blank"
                rel="noreferrer"
                className="contact-card location-card"
              >
                <div className="contact-icon">
                  <FaMapMarkerAlt />
                </div>
                <div className="contact-details">
                  <span className="contact-label">Ubicación Presencial</span>
                  <span className="contact-value">Temperley, Bs. As.</span>
                </div>
              </a>
            </address>
          </div>
        </div>

        {/* =========================================
            BARRA INFERIOR: LIMPIA Y CON ZONA SEGURA
            ========================================= */}
        <div className="footer-bottom-panel">
          <div className="bottom-panel-container">
            {/* Izquierda: Copyright Detallado */}
            <div className="copyright-area">
              <p>
                © {currentYear} <strong>Agustín Elías Sosa</strong>. Todos los
                derechos reservados.
              </p>
              <span className="copyright-sub">
                Desarrollado con altos estándares de calidad y neuro-diseño.
              </span>
            </div>

            {/* Derecha: Redes Sociales */}
            <div className="social-area">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="social-bubble insta"
                aria-label="Seguime en Instagram"
              >
                <FaInstagram />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="social-bubble fb"
                aria-label="Seguime en Facebook"
              >
                <FaFacebookF />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="social-bubble in"
                aria-label="Conectemos en LinkedIn"
              >
                <FaLinkedinIn />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* =========================================
          BOTÓN FLOTANTE DINÁMICO
          ========================================= */}
      <button
        className={`btn-up-floating ${showTopBtn ? "visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Volver al inicio de la página"
      >
        <FaArrowUp />
      </button>
    </>
  );
};

export default Footer;
