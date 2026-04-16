import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaArrowUp,
  FaBrain,
  FaCalendarAlt,
  FaEnvelope,
  FaFacebookF,
  FaGlobe,
  FaInstagram,
  FaLinkedinIn,
  FaMapMarkerAlt,
  FaUserCheck,
  FaUserCog,
  FaUserLock,
  FaWhatsapp,
} from "react-icons/fa";
import logoIcon from "../assets/images/logo-icon-sin-fondo.png";
import "./Footer.css";

const FOOTER_LINKS = [
  {
    to: "/reservar",
    label: "Reservar tu turno",
    icon: <FaCalendarAlt />,
  },
  {
    to: "/portal",
    label: "Ver mis turnos",
    icon: <FaUserLock />,
  },
  {
    to: "/admin",
    label: "Panel del profesor",
    icon: <FaUserCog />,
  },
];

const SOCIAL_LINKS = [
  {
    href: "https://instagram.com",
    label: "Instagram",
    icon: <FaInstagram />,
    className: "social-bubble insta",
  },
  {
    href: "https://facebook.com",
    label: "Facebook",
    icon: <FaFacebookF />,
    className: "social-bubble fb",
  },
  {
    href: "https://linkedin.com",
    label: "LinkedIn",
    icon: <FaLinkedinIn />,
    className: "social-bubble in",
  },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowTopBtn(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      <footer className="footer-elite">
        <div className="footer-ambient-glow"></div>

        <div className="footer-grid-container">
          <div className="footer-brand-col">
            <div className="footer-header-brand">
              <div className="logo-premium-wrapper">
                <img
                  src={logoIcon}
                  alt="Logo de Agustín Elías Sosa"
                  className="logo-img-transparent"
                />
              </div>

              <div className="brand-titles">
                <h3>Agustín Elías Sosa</h3>
                <span>Tu profesor particular</span>
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

          <div className="footer-nav-col">
            <h4 className="footer-section-title">Explorar</h4>
            <nav aria-label="Navegación del pie de página">
              <ul className="footer-links-list">
                {FOOTER_LINKS.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="footer-link-item">
                      <div className="link-icon-box">{item.icon}</div>
                      <span className="link-text">{item.label}</span>
                      <FaArrowRight className="link-arrow" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="footer-contact-col">
            <h4 className="footer-section-title">Hablemos</h4>
            <address className="footer-contact-address">
              <a
                href="https://wa.me/5491164236675?text=Hola%20Agust%C3%ADn,%20vengo%20desde%20tu%20sitio%20web%20y%20me%20gustar%C3%ADa%20consultar%20por%20clases."
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
                  <span className="contact-label">Consultas por email</span>
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
                  <span className="contact-label">Ubicación presencial</span>
                  <span className="contact-value">Temperley, Bs. As.</span>
                </div>
              </a>
            </address>
          </div>
        </div>

        <div className="footer-bottom-panel">
          <div className="bottom-panel-container">
            <div className="copyright-area">
              <p>
                &copy; {currentYear} <strong>Agustín Elías Sosa</strong>. Todos
                los derechos reservados.
              </p>
              <span className="copyright-sub">
                Experiencia digital diseñada para reservar, gestionar y volver
                con claridad.
              </span>
            </div>

            <div className="social-area" aria-label="Redes sociales">
              {SOCIAL_LINKS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className={item.className}
                  aria-label={item.label}
                  title={item.label}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

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
