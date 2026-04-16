import { useEffect, useMemo, useState } from "react";
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
  FaLayerGroup,
  FaPlus,
  FaRegClock,
  FaSchool,
  FaSearch,
  FaSignOutAlt,
  FaSpinner,
  FaTrashAlt,
  FaUsers,
  FaWhatsapp,
} from "react-icons/fa";
import {
  buildStudentKey as studentKey,
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
import {
  fetchAllBookings,
  updateBooking,
  deleteBooking,
  deleteAllBookings,
} from "../api/bookingApi";
import { useAdminAuth } from "../hooks/useAdminAuth";
import AdminLoginScreen from "./admin/AdminLoginScreen";
import BookingEditModal from "./admin/BookingEditModal";
import BookingDetailModal from "./admin/BookingDetailModal";
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
  const {
    authConfig,
    isAuthenticated,
    username,
    password,
    loading,
    setUsername,
    setPassword,
    handleLogin,
    handleLogout,
  } = useAdminAuth();

  const [bookings, setBookings] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [sentMessages, setSentMessages] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [activeView, setActiveView] = useState("overview");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [viewBooking, setViewBooking] = useState(null);
  const [editNotes, setEditNotes] = useState("");
  const [editEvolution, setEditEvolution] = useState("");
  const [editEmotionalState, setEditEmotionalState] = useState("");

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
          fetchAllBookings(authConfig)
            .then((res) =>
              setBookings(Array.isArray(res.data.data) ? res.data.data : []),
            )
            .finally(() => setDataLoading(false));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthenticated, authConfig]);

  useEffect(() => {
    const loadBookings = async () => {
      setDataLoading(true);
      try {
        const response = await fetchAllBookings(authConfig);
        setBookings(Array.isArray(response.data.data) ? response.data.data : []);
      } catch (error) {
        console.error("Error al cargar reservas:", error);
        if (error.response?.status === 401) {
          handleLogout();
          setBookings([]);
          alert("Tu sesión expiró. Inicia sesión nuevamente.");
        }
      } finally {
        setDataLoading(false);
      }
    };

    if (isAuthenticated) loadBookings();
  }, [authConfig, isAuthenticated, handleLogout]);

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

  const handleQuickStatusChange = async (id, newStatus) => {
    try {
      await updateBooking(id, { status: newStatus }, authConfig);
      setBookings((current) =>
        current.map((booking) =>
          booking._id === id ? { ...booking, status: newStatus } : booking,
        ),
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
      await updateBooking(selectedBooking._id, payload, authConfig);
      setBookings((current) =>
        current.map((booking) =>
          booking._id === selectedBooking._id
            ? { ...booking, ...payload }
            : booking,
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
      await deleteBooking(id, authConfig);
      setBookings((current) => current.filter((booking) => booking._id !== id));
    } catch {
      alert("Error al eliminar la reserva.");
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Estás por borrar toda la base de reservas. ¿Continuar?"))
      return;
    const confirmation = prompt("Escribe ELIMINAR para confirmar:");
    if (confirmation !== "ELIMINAR") return;
    setDataLoading(true);
    try {
      await deleteAllBookings(authConfig);
      setBookings([]);
    } catch {
      alert("No se pudo limpiar la base.");
    } finally {
      setDataLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <AdminLoginScreen
        username={username}
        password={password}
        loading={loading}
        onUsernameChange={(e) => setUsername(e.target.value)}
        onPasswordChange={(e) => setPassword(e.target.value)}
        onLogin={handleLogin}
      />
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
              <FaExclamationTriangle />
              <span>{dashboard.stats.cancelled} cancelaciones registradas</span>
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
            handleLogout();
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
              <FaCalendarCheck />
            </div>
            <div>
              <span>Próximas clases</span>
              <strong>{overviewData.upcomingBookings.length}</strong>
              <small>{overviewData.upcoming24h.length} dentro de las próximas 24 hs</small>
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
                    <strong>Seguimiento pedagógico</strong>
                    <span>{overviewData.students.length}</span>
                    <p>Perfiles, materias y próximos encuentros listos para preparar cada clase con contexto.</p>
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
                        <small>Próximo paso</small>
                        <strong>{student.nextBooking ? "Preparar clase" : "Sin turno"}</strong>
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
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="empty-table-state">No se encontraron reservas con esos filtros.</td>
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
            {bookings.length > 0 && (
              <div className="admin-danger-zone">
                <div>
                  <strong>Zona de resguardo</strong>
                  <p>Usá esta acción solo para limpiar datos de prueba. No afecta la navegación ni la agenda hasta que confirmes dos veces.</p>
                </div>
                <button type="button" className="admin-danger-btn" onClick={handleDeleteAll} disabled={dataLoading}>
                  <FaTrashAlt />
                  Limpiar base de prueba
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      {selectedBooking && (
        <BookingEditModal
          booking={selectedBooking}
          editNotes={editNotes}
          editEvolution={editEvolution}
          editEmotionalState={editEmotionalState}
          onClose={() => setSelectedBooking(null)}
          onNotesChange={(e) => setEditNotes(e.target.value)}
          onEvolutionChange={(e) => setEditEvolution(e.target.value)}
          onEmotionalStateChange={(e) => setEditEmotionalState(e.target.value)}
          onStatusChange={(e) =>
            setSelectedBooking({ ...selectedBooking, status: e.target.value })
          }
          onSave={handleUpdate}
        />
      )}

      {viewBooking && (
        <BookingDetailModal
          booking={viewBooking}
          onClose={() => setViewBooking(null)}
          onContactWhatsApp={sendWhatsApp}
        />
      )}
    </div>
  );
};

export default AdminPanel;
