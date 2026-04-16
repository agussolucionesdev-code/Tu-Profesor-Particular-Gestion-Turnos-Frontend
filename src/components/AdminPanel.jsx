import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FaBell,
  FaBookOpen,
  FaCalendarAlt,
  FaCalendarCheck,
  FaChartLine,
  FaCheckCircle,
  FaClipboardList,
  FaEdit,
  FaExclamationTriangle,
  FaEye,
  FaFilter,
  FaIdCard,
  FaInfoCircle,
  FaLayerGroup,
  FaLightbulb,
  FaLock,
  FaMoneyBillWave,
  FaPlus,
  FaRegClock,
  FaSchool,
  FaSearch,
  FaSignOutAlt,
  FaSpinner,
  FaTrashAlt,
  FaUserTie,
  FaUsers,
  FaWhatsapp,
} from "react-icons/fa";
import {
  buildStudentKey as studentKey,
  formatCurrencyARS as money,
  formatDayLabel as formatDay,
  formatLongDateLabel as formatDate,
  formatShortDateLabel as formatShortDate,
  formatTimeLabel as formatTime,
  getBookingStatusBucket as bookingStatusBucket,
  getBookingStatusLabel as bookingStatusLabel,
  getResponsibleDisplay as responsibleLabel,
  getResponsibleRelationshipDisplay as responsibleRelationshipLabel,
  getResponsibleSummary as responsibleSummary,
  isSameCalendarDay as sameDay,
  normalizeText as norm,
  toSafeDate as toDate,
} from "../utils/bookingFormatters";
import "./AdminPanel.css";
import "../styles/theme-polish.css";
import "../styles/accessibility-system.css";

const STATUS_FILTERS = ["Todos", "Confirmado", "Cancelado"];
const VIEW_OPTIONS = [
  { id: "overview", label: "Resumen", icon: FaChartLine },
  { id: "agenda", label: "Agenda", icon: FaCalendarCheck },
  { id: "students", label: "Alumnos", icon: FaUsers },
  { id: "bookings", label: "Turnos", icon: FaClipboardList },
];

const AdminPanel = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL
    ? `${import.meta.env.VITE_BACKEND_URL}/api/bookings`
    : "http://localhost:4100/api/bookings";
  const AUTH_URL = import.meta.env.VITE_BACKEND_URL
    ? `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`
    : "http://localhost:4100/api/auth/login";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [sentMessages, setSentMessages] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [activeView, setActiveView] = useState("overview");
  const [authToken, setAuthToken] = useState(() => sessionStorage.getItem("adminToken") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(sessionStorage.getItem("adminToken")),
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [viewBooking, setViewBooking] = useState(null);
  const [editNotes, setEditNotes] = useState("");
  const [editEvolution, setEditEvolution] = useState("");
  const [editEmotionalState, setEditEmotionalState] = useState("");
  const [draggedBooking, setDraggedBooking] = useState(null);
  const [quickActionMenu, setQuickActionMenu] = useState(null);
  const panelRef = useRef(null);

  const authConfig = useMemo(
    () => ({ headers: { Authorization: `Bearer ${authToken}` } }),
    [authToken],
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isAuthenticated) return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "n" || e.key === "N") {
          e.preventDefault();
          window.open("/", "_blank");
        }
        if (e.key === "r" || e.key === "R") {
          e.preventDefault();
          setDataLoading(true);
          axios.get(API_URL, authConfig)
            .then(res => setBookings(Array.isArray(res.data.data) ? res.data.data : []))
            .finally(() => setDataLoading(false));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthenticated, API_URL, authConfig]);

  useEffect(() => {
    const fetchBookings = async () => {
      setDataLoading(true);
      try {
        const response = await axios.get(API_URL, authConfig);
        setBookings(Array.isArray(response.data.data) ? response.data.data : []);
      } catch (error) {
        console.error("Error al cargar reservas:", error);
        if (error.response?.status === 401) {
          sessionStorage.removeItem("adminToken");
          setAuthToken("");
          setIsAuthenticated(false);
          setBookings([]);
          alert("Tu sesión expiró. Inicia sesión nuevamente.");
        }
      } finally {
        setDataLoading(false);
      }
    };

    if (isAuthenticated && authToken) fetchBookings();
  }, [API_URL, authConfig, authToken, isAuthenticated]);

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort((a, b) => {
        const first = toDate(a.timeSlot)?.getTime() ?? 0;
        const second = toDate(b.timeSlot)?.getTime() ?? 0;
        return first - second;
      }),
    [bookings],
  );

  const filteredBookings = useMemo(() => {
    const term = norm(searchTerm);
    return sortedBookings.filter((booking) => {
      const blob = norm(
        [
          booking.studentName,
          booking.responsibleName,
          booking.bookingCode,
          booking.phone,
          booking.email,
          booking.subject,
        ].join(" "),
      );
      const matchesSearch = !term || blob.includes(term);
      const matchesStatus =
        filterStatus === "Todos" ||
        bookingStatusBucket(booking.status) === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [filterStatus, searchTerm, sortedBookings]);

  const dashboard = useMemo(() => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const enriched = sortedBookings.map((booking) => ({
      ...booking,
      start: toDate(booking.timeSlot),
      end: toDate(booking.endTime),
    }));

    const stats = {
      total: enriched.length,
      pending: enriched.filter((booking) => booking.status === "Pendiente").length,
      confirmed: enriched.filter((booking) => bookingStatusBucket(booking.status) === "Confirmado").length,
      cancelled: enriched.filter((booking) => booking.status === "Cancelado").length,
      finalized: enriched.filter((booking) => booking.status === "Finalizado").length,
      income: enriched.reduce((sum, booking) => {
        return bookingStatusBucket(booking.status) === "Confirmado"
          ? sum + Number(booking.price || 0)
          : sum;
      }, 0),
    };

    return { now, today, next24h, enriched, stats };
  }, [sortedBookings]);

  const overviewData = useMemo(() => {
    const todayBookings = dashboard.enriched.filter(
      (booking) => booking.start && sameDay(booking.start, dashboard.today) && booking.status !== "Cancelado",
    );
    const upcomingBookings = dashboard.enriched.filter(
      (booking) => booking.start && booking.start >= dashboard.now && booking.status !== "Cancelado",
    );
    const upcoming24h = upcomingBookings.filter(
      (booking) => booking.start && booking.start <= dashboard.next24h,
    );
    const overduePending = dashboard.enriched.filter(
      (booking) => booking.status === "Pendiente" && booking.start && booking.start < dashboard.now,
    );
    const noPriceBookings = dashboard.enriched.filter(
      (booking) =>
        bookingStatusBucket(booking.status) === "Confirmado" &&
        Number(booking.price || 0) <= 0,
    );

    const weekFlow = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(dashboard.today);
      date.setDate(dashboard.today.getDate() + index);
      const count = dashboard.enriched.filter(
        (booking) => booking.start && sameDay(booking.start, date) && booking.status !== "Cancelado",
      ).length;
      return { label: formatDay(date), count };
    });

    const subjectsMap = new Map();
    dashboard.enriched.forEach((booking) => {
      const subject = String(booking.subject || "Sin materia").trim() || "Sin materia";
      subjectsMap.set(subject, (subjectsMap.get(subject) || 0) + 1);
    });
    const topSubjects = [...subjectsMap.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const studentsMap = new Map();
    dashboard.enriched.forEach((booking) => {
      const key = studentKey(booking);
      const existing = studentsMap.get(key);
      if (!existing) {
        studentsMap.set(key, {
          key,
          studentName: booking.studentName,
          responsibleName: responsibleLabel(booking),
          responsibleRelationship: responsibleRelationshipLabel(booking),
          responsibleSummary: responsibleSummary(booking),
          school: booking.school,
          educationLevel: booking.educationLevel,
          yearGrade: booking.yearGrade,
          phone: booking.phone,
          email: booking.email,
          totalBookings: 1,
          totalIncome:
            bookingStatusBucket(booking.status) === "Confirmado"
              ? Number(booking.price || 0)
              : 0,
          nextBooking:
            booking.start && booking.start >= dashboard.now && booking.status !== "Cancelado"
              ? booking.start
              : null,
          subjects: new Set([booking.subject].filter(Boolean)),
          searchBlob: norm(
            [
              booking.studentName,
              booking.responsibleName,
              responsibleRelationshipLabel(booking),
              booking.phone,
              booking.email,
              booking.subject,
              booking.school,
            ].join(" "),
          ),
        });
        return;
      }

      existing.totalBookings += 1;
      existing.totalIncome +=
        bookingStatusBucket(booking.status) === "Confirmado"
          ? Number(booking.price || 0)
          : 0;
      if (booking.subject) existing.subjects.add(booking.subject);
      if (
        booking.start &&
        booking.start >= dashboard.now &&
        booking.status !== "Cancelado" &&
        (!existing.nextBooking || booking.start < existing.nextBooking)
      ) {
        existing.nextBooking = booking.start;
      }
    });

    const students = [...studentsMap.values()]
      .map((student) => ({ ...student, subjects: [...student.subjects] }))
      .sort((a, b) => (a.nextBooking?.getTime() ?? Infinity) - (b.nextBooking?.getTime() ?? Infinity));

    const recentActivity = [...dashboard.enriched]
      .sort((a, b) => (toDate(b.updatedAt)?.getTime() ?? 0) - (toDate(a.updatedAt)?.getTime() ?? 0))
      .slice(0, 6);

    return {
      todayBookings,
      upcomingBookings,
      upcoming24h,
      overduePending,
      noPriceBookings,
      weekFlow,
      topSubjects,
      students,
      recentActivity,
    };
  }, [dashboard]);

  const filteredStudents = useMemo(() => {
    const term = norm(searchTerm);
    if (!term) return overviewData.students;
    return overviewData.students.filter((student) =>
      student.searchBlob.includes(term),
    );
  }, [overviewData.students, searchTerm]);

  const heroText = useMemo(() => {
    if (!dashboard.stats.total) return "Todavía no hay reservas cargadas.";
    if (dashboard.stats.pending > 0) {
      return `Tenés ${dashboard.stats.pending} registros heredados para normalizar y ${overviewData.todayBookings.length} clases en agenda para hoy.`;
    }
    if (overviewData.todayBookings.length > 0) {
      return `Hoy tenés ${overviewData.todayBookings.length} clases activas y ${overviewData.upcoming24h.length} movimientos en las próximas 24 horas.`;
    }
    return "No hay urgencias activas. Es un buen momento para revisar alumnos, agenda e ingresos.";
  }, [dashboard.stats.pending, dashboard.stats.total, overviewData.todayBookings.length, overviewData.upcoming24h.length]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.post(AUTH_URL, {
        username: username.trim(),
        password: password.trim(),
      });
      if (response.data.success && response.data.token) {
        sessionStorage.setItem("adminToken", response.data.token);
        setAuthToken(response.data.token);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error de autenticación:", error);
      alert("Credenciales incorrectas.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`${API_URL}/${id}`, { status: newStatus }, authConfig);
      setBookings((current) =>
        current.map((booking) => (booking._id === id ? { ...booking, status: newStatus } : booking)),
      );
    } catch {
      alert("No se pudo actualizar el estado.");
    }
  };

  const sendWhatsApp = (booking) => {
    if (!booking.phone) {
      alert("Este registro no tiene un teléfono válido para WhatsApp.");
      return;
    }

    let phone = String(booking.phone).replace(/\D/g, "");
    if (phone.length === 10) phone = `549${phone}`;
    const start = toDate(booking.timeSlot);
    const when = start ? `${formatDate(start)} a las ${formatTime(start)} hs` : "fecha pendiente";
    const name = booking.studentName || "Alumno";
    const message = `Hola ${name}, soy Agustín Sosa. Te escribo por tu turno de ${booking.subject} previsto para ${when}.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
    setSentMessages((current) => ({ ...current, [booking._id]: true }));
  };

  const handleUpdate = async () => {
    try {
      const payload = {
        status: selectedBooking.status,
        notes: editNotes,
        studentEvolution: editEvolution,
        emotionalState: editEmotionalState,
      };
      await axios.put(`${API_URL}/${selectedBooking._id}`, payload, authConfig);
      setBookings((current) =>
        current.map((booking) =>
          booking._id === selectedBooking._id ? { ...booking, ...payload } : booking,
        ),
      );
      setSelectedBooking(null);
    } catch {
      alert("No se pudieron guardar los cambios.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta reserva?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`, authConfig);
      setBookings((current) => current.filter((booking) => booking._id !== id));
    } catch {
      alert("Error al eliminar la reserva.");
    }
  };

  const handleDragStart = (e, booking) => {
    setDraggedBooking(booking);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", booking._id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, targetDate) => {
    e.preventDefault();
    if (!draggedBooking || !targetDate) return;
    
    const originalDate = new Date(draggedBooking.timeSlot);
    const newDate = new Date(targetDate);
    newDate.setHours(originalDate.getHours(), originalDate.getMinutes());
    
    try {
      await axios.put(
        `${API_URL}/${draggedBooking._id}`,
        { timeSlot: newDate.toISOString() },
        authConfig
      );
      setBookings((current) =>
        current.map((b) =>
          b._id === draggedBooking._id ? { ...b, timeSlot: newDate.toISOString() } : b
        )
      );
      setDraggedBooking(null);
    } catch {
      alert("No se pudo reprogramar el turno.");
    }
  };

  const openMercadoPago = (booking) => {
    const amount = booking.price || 0;
    const description = `Clase particular - ${booking.studentName} - ${booking.subject}`;
    const externalRef = booking.bookingCode;
    const mpUrl = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=PLACEHOLDER&external_reference=${externalRef}&description=${encodeURIComponent(description)}&back_url=${encodeURIComponent(process.env.FRONTEND_URL || window.location.origin)}`;
    window.open(mpUrl, "_blank", "noopener,noreferrer");
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Estás por borrar toda la base de reservas. ¿Continuar?")) return;
    const confirmation = prompt("Escribe ELIMINAR para confirmar:");
    if (confirmation !== "ELIMINAR") return;
    setDataLoading(true);
    try {
      await axios.delete(`${API_URL}/all`, authConfig);
      setBookings([]);
    } catch {
      alert("No se pudo limpiar la base.");
    } finally {
      setDataLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-shell">
        <div className="admin-login-layout">
          <section className="admin-login-intro" aria-label="Beneficios del panel">
            <span className="admin-login-kicker">Gestión interna</span>
            <h1>Un panel claro para decidir rápido y sin ruido</h1>
            <p>
              La idea es que, apenas entres, tengas agenda, alumnos y
              seguimiento en una interfaz legible, ordenada y fácil de recorrer
              incluso en jornadas largas.
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
                <p>Contactás y actualizás estados desde el mismo flujo de trabajo.</p>
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
          <p>Gestioná turnos, agenda, alumnos y seguimiento desde un solo lugar.</p>

          <label className="admin-field">
            <span>Usuario</span>
            <input
              className="admin-input"
              type="text"
              placeholder="Correo de acceso"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <label className="admin-field">
            <span>Contraseña</span>
            <input
              className="admin-input"
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleLogin()}
            />
          </label>

          <button className="admin-primary-btn" onClick={handleLogin} disabled={loading}>
            {loading ? <FaSpinner className="spinner" /> : "Ingresar"}
          </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar-shell">
        <div className="admin-brand-panel">
          <div className="admin-brand-badge">AS</div>
          <div>
            <strong>Agustín Sosa</strong>
            <span>Centro de control</span>
          </div>
        </div>

        <div className="admin-sidebar-card">
          <span className="sidebar-kicker">Hoy</span>
          <h3>{overviewData.todayBookings.length} clases activas</h3>
          <p>{heroText}</p>
          <div className="sidebar-inline-stats">
            <div>
              <strong>{dashboard.stats.pending}</strong>
              <span>Legado</span>
            </div>
            <div>
              <strong>{overviewData.students.length}</strong>
              <span>Alumnos</span>
            </div>
          </div>
        </div>

        <nav className="admin-nav-grid" aria-label="Vistas del panel">
          {VIEW_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                type="button"
                className={`admin-nav-btn ${activeView === option.id ? "is-active" : ""}`}
                onClick={() => setActiveView(option.id)}
              >
                <Icon />
                <span>{option.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-card compact">
          <span className="sidebar-kicker">Atajos</span>
          <div className="sidebar-alert-list">
            <div>
              <FaBell />
              <span>{overviewData.upcoming24h.length} avisos próximos</span>
            </div>
            <div>
              <FaMoneyBillWave />
              <span>{overviewData.noPriceBookings.length} cobros sin cargar</span>
            </div>
            <div>
              <FaUsers />
              <span>{overviewData.students.length} perfiles activos</span>
            </div>
          </div>
        </div>

        <button
          className="admin-logout-btn"
          onClick={() => {
            sessionStorage.removeItem("adminToken");
            setAuthToken("");
            setIsAuthenticated(false);
            setBookings([]);
          }}
        >
          <FaSignOutAlt />
          Cerrar sesión
        </button>
      </aside>

      <main className="admin-main-shell">
        <header className="admin-hero">
          <div>
            <span className="admin-eyebrow">Panel del profesor</span>
            <h1>Todo lo importante, claro y a tiempo</h1>
            <p>{heroText}</p>
          </div>

          <div className="admin-hero-actions">
            <Link to="/" className="admin-secondary-btn" target="_blank">
              <FaPlus />
              Simular reserva
            </Link>
            <button type="button" className="admin-primary-btn slim" onClick={() => setActiveView("bookings")}>
              <FaClipboardList />
              Ver gestor
            </button>
          </div>
        </header>

        <section className="admin-kpi-grid">
          <article className="admin-kpi-card">
            <div className="kpi-icon emerald">
              <FaMoneyBillWave />
            </div>
            <div>
              <span>Ingresos registrados</span>
              <strong>{money(dashboard.stats.income)}</strong>
              <small>{dashboard.stats.confirmed + dashboard.stats.finalized} turnos monetizados</small>
            </div>
          </article>
          <article className="admin-kpi-card">
            <div className="kpi-icon amber">
              <FaExclamationTriangle />
            </div>
            <div>
              <span>Agenda activa</span>
              <strong>{dashboard.stats.confirmed}</strong>
              <small>{overviewData.upcoming24h.length} próximas 24 hs</small>
            </div>
          </article>
          <article className="admin-kpi-card">
            <div className="kpi-icon blue">
              <FaUsers />
            </div>
            <div>
              <span>Alumnos activos</span>
              <strong>{overviewData.students.length}</strong>
              <small>{dashboard.stats.total} reservas registradas</small>
            </div>
          </article>
          <article className="admin-kpi-card">
            <div className="kpi-icon slate">
              <FaChartLine />
            </div>
            <div>
              <span>Conversión de agenda</span>
              <strong>
                {dashboard.stats.total
                  ? Math.round((dashboard.stats.confirmed / dashboard.stats.total) * 100)
                  : 0}
                %
              </strong>
              <small>{dashboard.stats.cancelled} cancelados</small>
            </div>
          </article>
        </section>

        {activeView === "overview" && (
          <>
            <section className="admin-content-grid two-columns">
              <article className="admin-card next-class-widget">
                <div className="admin-card-header">
                  <div>
                    <span className="card-kicker">Siguiente Clase</span>
                    <h3>Próximo Encuentro</h3>
                  </div>
                </div>
                <div className="next-class-details">
                  {overviewData.upcomingBookings.length === 0 ? (
                    <p className="empty-copy">No hay clases programadas próximamente.</p>
                  ) : (
                    <>
                      <div className="next-class-info">
                        <strong>{overviewData.upcomingBookings[0].studentName}</strong>
                        <span>{overviewData.upcomingBookings[0].subject}</span>
                        <div className="next-class-time">
                          <FaRegClock /> {overviewData.upcomingBookings[0].start ? `${formatDate(overviewData.upcomingBookings[0].start)} a las ${formatTime(overviewData.upcomingBookings[0].start)} hs` : "--"}
                        </div>
                      </div>
                      <button 
                        className="admin-primary-btn slim" 
                        onClick={() => sendWhatsApp(overviewData.upcomingBookings[0])}
                      >
                        <FaWhatsapp /> Contactar
                      </button>
                    </>
                  )}
                </div>
              </article>

              <article className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <span className="card-kicker">Pulso semanal</span>
                    <h3>Movimiento de los próximos 7 días</h3>
                    </div>
                </div>
                <div className="admin-bars-chart">
                  {overviewData.weekFlow.map((item) => (
                    <div key={item.label} className="admin-bar-column">
                      <span className="admin-bar-value">{item.count}</span>
                      <div className="admin-bar-track">
                        <div
                          className="admin-bar-fill"
                          style={{
                            height: `${Math.max(
                              (item.count / Math.max(...overviewData.weekFlow.map((day) => day.count), 1)) * 100,
                              item.count ? 14 : 4,
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="admin-bar-label">{item.label}</span>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="admin-content-grid two-columns">
              <article className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <span className="card-kicker">Demanda</span>
                    <h3>Materias más solicitadas</h3>
                  </div>
                </div>
                <div className="admin-progress-list">
                  {overviewData.topSubjects.length === 0 ? (
                    <p className="empty-copy">Todavía no hay materias registradas.</p>
                  ) : (
                    overviewData.topSubjects.map((subject) => (
                      <div key={subject.label} className="progress-row">
                        <div className="progress-copy">
                          <strong>{subject.label}</strong>
                          <span>{subject.count} reservas</span>
                        </div>
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${(subject.count / (overviewData.topSubjects[0]?.count || 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </article>
            </section>

            <section className="admin-content-grid three-columns">
              <article className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <span className="card-kicker">Prioridades</span>
                    <h3>Qué requiere tu atención</h3>
                  </div>
                </div>
                <div className="admin-priority-stack">
                  <div className="priority-card warning">
                    <strong>Reservas confirmadas</strong>
                    <span>{dashboard.stats.confirmed}</span>
                    <p>Aquí ves el volumen real de la agenda activa, sin depender de confirmaciones manuales.</p>
                  </div>
                  <div className="priority-card info">
                    <strong>Clases para hoy</strong>
                    <span>{overviewData.todayBookings.length}</span>
                    <p>Tu agenda diaria ya está resumida para abrir el panel y saber dónde estás parado.</p>
                  </div>
                  <div className="priority-card success">
                    <strong>Cobros a completar</strong>
                    <span>{overviewData.noPriceBookings.length}</span>
                    <p>Conviene cargar el valor apenas cerrás cada clase para no perder trazabilidad.</p>
                  </div>
                </div>
              </article>

              <article className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <span className="card-kicker">Agenda de hoy</span>
                    <h3>Turnos del día</h3>
                  </div>
                </div>
                <div className="admin-agenda-list">
                  {overviewData.todayBookings.length === 0 ? (
                    <p className="empty-copy">Hoy no hay clases activas cargadas.</p>
                  ) : (
                    overviewData.todayBookings.map((booking) => (
                      <button key={booking._id} type="button" className="agenda-item" onClick={() => setViewBooking(booking)}>
                        <div>
                          <strong>{booking.studentName}</strong>
                          <span>{booking.subject}</span>
                        </div>
                        <div className="agenda-time">
                          <span>{booking.start ? formatTime(booking.start) : "--:--"}</span>
                          <small>{booking.duration || 1} h</small>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </article>

              <article className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <span className="card-kicker">Actividad reciente</span>
                  <h3>Últimos movimientos</h3>
                  </div>
                </div>
                <div className="admin-activity-list">
                  {overviewData.recentActivity.length === 0 ? (
                    <p className="empty-copy">Todavía no hay actividad para mostrar.</p>
                  ) : (
                    overviewData.recentActivity.map((booking) => (
                      <button key={booking._id} type="button" className="activity-item" onClick={() => setViewBooking(booking)}>
                        <div className="activity-copy">
                          <strong>{booking.studentName}</strong>
                          <span>{booking.subject} · {bookingStatusLabel(booking.status)}</span>
                        </div>
                        <small>{booking.start ? `${formatShortDate(booking.start)} ${formatTime(booking.start)}` : "--"}</small>
                      </button>
                    ))
                  )}
                </div>
              </article>
            </section>
          </>
        )}

        {activeView === "agenda" && (
          <section className="admin-content-grid two-columns">
            <article className="admin-card">
              <div className="admin-card-header">
                <div>
                  <span className="card-kicker">Próximas 24 horas</span>
                  <h3>Seguimiento inmediato</h3>
                </div>
              </div>
              <div className="timeline-list">
                {overviewData.upcoming24h.length === 0 ? (
                  <p className="empty-copy">No hay clases ni recordatorios urgentes en las próximas 24 horas.</p>
                ) : (
                  overviewData.upcoming24h.map((booking) => (
                    <div key={booking._id} className="timeline-item">
                      <div className="timeline-copy">
                        <strong>{booking.studentName}</strong>
                        <span>{booking.start ? `${formatDate(booking.start)} · ${formatTime(booking.start)} hs` : "--"}</span>
                        <small>{booking.subject}</small>
                      </div>
                      <button type="button" className="inline-action" onClick={() => sendWhatsApp(booking)}>
                        <FaWhatsapp />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="admin-card">
              <div className="admin-card-header">
                <div>
                  <span className="card-kicker">Estados heredados</span>
                  <h3>Registros para normalizar</h3>
                </div>
              </div>
              <div className="timeline-list">
                {overviewData.overduePending.length === 0 ? (
                  <p className="empty-copy">No hay registros pendientes heredados.</p>
                ) : (
                  overviewData.overduePending.map((booking) => (
                    <div key={booking._id} className="timeline-item urgent">
                      <div className="timeline-copy">
                        <strong>{booking.studentName}</strong>
                        <span>{booking.start ? `${formatShortDate(booking.start)} · ${formatTime(booking.start)} hs` : "--"}</span>
                        <small>{booking.subject}</small>
                      </div>
                      <div className="timeline-actions">
                        <button type="button" className="inline-action success" onClick={() => handleQuickStatusChange(booking._id, "Confirmado")}>
                          <FaCheckCircle />
                        </button>
                        <button type="button" className="inline-action danger" onClick={() => handleQuickStatusChange(booking._id, "Cancelado")}>
                          <FaTrashAlt />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>
          </section>
        )}

        {activeView === "students" && (
          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="card-kicker">Registro</span>
                <h3>Seguimiento de alumnos y responsables</h3>
              </div>
            </div>
            <div className="students-grid">
              {filteredStudents.length === 0 ? (
                  <p className="empty-copy">No hay alumnos que coincidan con la búsqueda actual.</p>
              ) : (
                filteredStudents.map((student) => (
                  <article key={student.key} className="student-card">
                    <div className="student-card-top">
                      <div>
                        <strong>{student.studentName}</strong>
                        <span>{student.responsibleSummary}</span>
                      </div>
                      <span className="student-metric">{student.totalBookings} turnos</span>
                    </div>
                    <div className="student-meta-list">
                      <div><FaIdCard /><span>{student.responsibleRelationship || "Vínculo sin cargar"}</span></div>
                      <div><FaSchool /><span>{student.school || "Institución sin cargar"}</span></div>
                      <div><FaLayerGroup /><span>{student.educationLevel || "Nivel"} · {student.yearGrade || "Año"}</span></div>
                      <div><FaBookOpen /><span>{student.subjects.join(", ") || "Materia sin definir"}</span></div>
                      <div><FaCalendarAlt /><span>{student.nextBooking ? `Próximo: ${formatShortDate(student.nextBooking)} ${formatTime(student.nextBooking)} hs` : "Sin próximo turno"}</span></div>
                    </div>
                    <div className="student-card-footer">
                      <div>
                        <small>Ingresos</small>
                        <strong>{money(student.totalIncome)}</strong>
                      </div>
                      <button
                        type="button"
                        className="inline-link-btn"
                        onClick={() => {
                          const match = sortedBookings.find((booking) => studentKey(booking) === student.key);
                          if (match) setViewBooking(match);
                        }}
                      >
                        Ver ficha
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {activeView === "bookings" && (
          <section className="admin-card">
            <div className="admin-card-header spread">
              <div>
                <span className="card-kicker">Gestor</span>
                <h3>Control detallado de turnos</h3>
              </div>
              {bookings.length > 0 && (
                <button type="button" className="admin-danger-btn" onClick={handleDeleteAll} disabled={dataLoading}>
                  <FaTrashAlt />
                  Limpiar base
                </button>
              )}
            </div>

            <div className="admin-toolbar">
              <label className="admin-search-box">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Buscar alumno, código, responsable, parentesco o contacto..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>
              <div className="status-filter-row">
                <span><FaFilter /> Filtrar</span>
                {STATUS_FILTERS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`status-filter-chip ${filterStatus === status ? "is-active" : ""}`}
                    onClick={() => setFilterStatus(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {dataLoading ? (
              <div className="admin-loading-state">
                <FaSpinner className="spinner giant" />
                <p>Sincronizando turnos...</p>
              </div>
            ) : (
              <div className="admin-table-shell">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Estado</th>
                      <th>Código</th>
                      <th>Alumno</th>
                      <th>Horario</th>
                      <th>Contacto</th>
                      <th>Valor</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="empty-table-state">No se encontraron reservas con esos filtros.</td>
                      </tr>
                    ) : (
                      filteredBookings.map((booking) => (
                        <tr key={booking._id} className={booking.status === "Cancelado" ? "row-cancelled" : ""}>
                          <td><span className={`status-pill ${bookingStatusLabel(booking.status)}`}>{bookingStatusLabel(booking.status)}</span></td>
                          <td><span className="code-mono">{booking.bookingCode}</span></td>
                          <td><div className="table-student"><strong>{booking.studentName}</strong><span>{responsibleRelationshipLabel(booking)} · {booking.subject}</span></div></td>
                          <td><div className="table-date"><span><FaCalendarAlt />{booking.timeSlot ? formatShortDate(toDate(booking.timeSlot)) : "--"}</span><span><FaRegClock />{booking.timeSlot ? `${formatTime(toDate(booking.timeSlot))} hs` : "--"}</span></div></td>
                          <td>
                            <button type="button" onClick={() => sendWhatsApp(booking)} className={`admin-whatsapp-btn ${sentMessages[booking._id] ? "sent" : ""}`}>
                              <FaWhatsapp />
                              {sentMessages[booking._id] ? "Enviado" : "WhatsApp"}
                            </button>
                          </td>
                          <td><strong className="table-price">{money(booking.price || 0)}</strong></td>
                          <td>
                            <div className="table-actions">
                              {booking.status === "Pendiente" && (
                                <button type="button" className="icon-action success" title="Confirmar" onClick={() => handleQuickStatusChange(booking._id, "Confirmado")}>
                                  <FaCheckCircle />
                                </button>
                              )}
                              <button type="button" className="icon-action neutral" title="Ver ficha" onClick={() => setViewBooking(booking)}><FaEye /></button>
                              <button type="button" className="icon-action info" title="Editar" onClick={() => { setSelectedBooking(booking); setEditNotes(booking.notes || ""); setEditEvolution(booking.studentEvolution || ""); setEditEmotionalState(booking.emotionalState || ""); }}><FaEdit /></button>
                              <button type="button" className="icon-action danger" title="Eliminar" onClick={() => handleDelete(booking._id)}><FaTrashAlt /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      {selectedBooking && (
        <div className="admin-modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="admin-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <span className="card-kicker">Ajustes de la reserva</span>
                <h3>{selectedBooking.studentName}</h3>
              </div>
              <span className="code-mono">{selectedBooking.bookingCode}</span>
            </div>

<div className="admin-modal-body">
  <label className="admin-field">
    <span>Estado</span>
    <select
      className="admin-input"
      value={bookingStatusLabel(selectedBooking.status)}
      onChange={(event) =>
        setSelectedBooking({ ...selectedBooking, status: event.target.value })
      }
    >
      <option value="Confirmado">Confirmado</option>
      <option value="Cancelado">Cancelado</option>
    </select>
  </label>

  <label className="admin-field">
    <span>Notas privadas</span>
    <textarea
      className="admin-input admin-textarea"
      rows="4"
      value={editNotes}
      onChange={(event) => setEditNotes(event.target.value)}
      placeholder="Seguimiento, forma de pago, temas a reforzar..."
    />
  </label>

  <label className="admin-field">
    <span>Evolución del alumno</span>
    <textarea
      className="admin-input admin-textarea"
      rows="5"
      value={editEvolution}
      onChange={(event) => setEditEvolution(event.target.value)}
      placeholder="¿Qué avances ha tenido? Temas superados, dificultades actuales..."
    />
  </label>

  <label className="admin-field">
    <span>Estado emocional y actitudinal</span>
    <textarea
      className="admin-input admin-textarea"
      rows="3"
      value={editEmotionalState}
      onChange={(event) => setEditEmotionalState(event.target.value)}
      placeholder="¿Cómo se siente el alumno? Motivación, estrés, actitud ante el estudio..."
    />
  </label>
</div>

            <div className="admin-modal-footer">
              <button type="button" className="admin-secondary-btn" onClick={() => setSelectedBooking(null)}>
                Cancelar
              </button>
              <button type="button" className="admin-primary-btn slim" onClick={handleUpdate}>
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {viewBooking && (
        <div className="admin-modal-overlay" onClick={() => setViewBooking(null)}>
          <div className="admin-modal-card large" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header highlight">
              <div className="modal-student-title">
                <div className="modal-icon-shell">
                  <FaUserTie />
                </div>
                <div>
                  <span className="card-kicker">Ficha completa</span>
                  <h3>{viewBooking.studentName}</h3>
                </div>
              </div>
              <span className={`status-pill ${bookingStatusLabel(viewBooking.status)}`}>{bookingStatusLabel(viewBooking.status)}</span>
            </div>

<div className="admin-modal-body">
  <div className="admin-detail-grid">
    <article className="detail-card">
      <h4><FaInfoCircle />Contacto</h4>
      <p><strong>Responsable</strong><span>{responsibleLabel(viewBooking)}</span></p>
      <p><strong>Parentesco</strong><span>{responsibleRelationshipLabel(viewBooking)}</span></p>
      <p><strong>Teléfono</strong><span>{viewBooking.phone || "No informado"}</span></p>
      <p><strong>Email</strong><span>{viewBooking.email || "No informado"}</span></p>
    </article>

    <article className="detail-card">
      <h4><FaSchool />Perfil académico</h4>
      <p><strong>Institución</strong><span>{viewBooking.school || "No especificada"}</span></p>
      <p><strong>Nivel</strong><span>{viewBooking.educationLevel || "Sin dato"}</span></p>
      <p><strong>Año / grado</strong><span>{viewBooking.yearGrade || "Sin dato"}</span></p>
      <p><strong>Materia</strong><span>{viewBooking.subject || "Sin materia"}</span></p>
    </article>
  </div>

  <article className="detail-card full">
    <h4><FaCalendarAlt />Turno agendado</h4>
    <p><strong>Fecha</strong><span>{viewBooking.timeSlot ? formatDate(toDate(viewBooking.timeSlot)) : "No disponible"}</span></p>
    <p><strong>Horario</strong><span>{viewBooking.timeSlot ? `${formatTime(toDate(viewBooking.timeSlot))} hs` : "--"}</span></p>
      <p><strong>Duración</strong><span>{viewBooking.duration || 1} hora(s)</span></p>
    <p><strong>Valor</strong><span>{money(viewBooking.price || 0)}</span></p>
  </article>

  <article className="detail-card full note">
    <h4><FaLightbulb />Contexto del alumno</h4>
    <p className="stacked">{viewBooking.academicSituation || "No dejó comentarios adicionales en el momento de reservar."}</p>
  </article>

  <article className="detail-card full">
    <h4><FaChartLine /> Evolución Pedagógica</h4>
    <p className="stacked">{viewBooking.studentEvolution || "Sin registros de evolución aún."}</p>
  </article>

  <article className="detail-card full">
    <h4><FaUserTie /> Estado Emocional y Actitudinal</h4>
    <p className="stacked">{viewBooking.emotionalState || "Sin registros sobre el estado emocional."}</p>
  </article>

  {viewBooking.notes && (
    <article className="detail-card full private">
      <h4><FaLock />Notas privadas</h4>
      <p className="stacked">{viewBooking.notes}</p>
    </article>
  )}
</div>

            <div className="admin-modal-footer">
              <button type="button" className="admin-secondary-btn" onClick={() => setViewBooking(null)}>
                Cerrar
              </button>
              <button type="button" className="admin-primary-btn slim" onClick={() => sendWhatsApp(viewBooking)}>
                <FaWhatsapp />
                Contactar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
