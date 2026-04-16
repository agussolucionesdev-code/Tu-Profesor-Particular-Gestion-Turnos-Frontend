import { useEffect, useState } from "react";
import axios from "axios";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { addMinutes, format, isSameDay, setHours, setMinutes } from "date-fns";
import es from "date-fns/locale/es";
import {
  FaArrowRight,
  FaCalendarAlt,
  FaCalendarCheck,
  FaChevronLeft,
  FaChevronRight,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaHourglassHalf,
  FaInfoCircle,
  FaSearch,
  FaTimesCircle,
  FaWhatsapp,
} from "react-icons/fa";
import "../index.css";
import "./ClientPortal.css";
import "../styles/theme-polish.css";
import "../styles/accessibility-system.css";
import BookingTicket from "./BookingTicket";
import {
  formatDurationVoiceLabel,
  getBookingApiMessage,
  getResponsibleRelationshipDisplay,
} from "../utils/bookingFormatters";
import {
  primeVoicePlayback,
  speakAlert,
  spellCodeForVoice,
  useNeuroToast,
} from "../utils/neuroToast";

registerLocale("es", es);

const PORTAL_VOICE_OPTIONS = {
  rate: 0.9,
  pitch: 1.05,
  volume: 1,
};

const ClientPortal = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4100";

  const [code, setCode] = useState("");
  const [bookingsList, setBookingsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const { toast, showToast } = useNeuroToast({ duration: 4000 });
  const [editingBooking, setEditingBooking] = useState(null);
  const [cancelingBooking, setCancelingBooking] = useState(null);
  const [newDate, setNewDate] = useState(new Date());
  const [newDuration, setNewDuration] = useState(1);
  const [existingBookingsForBlock, setExistingBookingsForBlock] = useState([]);

  const formatDateLong = (value) =>
    new Date(value).toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatTime = (value) =>
    new Date(value).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const formatDurationLabel = (value) => {
    const hours = Number(value);
    if (!Number.isFinite(hours) || hours <= 0) return "--";
    const totalMinutes = Math.round(hours * 60);
    const wholeHours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (wholeHours > 0 && minutes > 0) return `${wholeHours} h ${minutes} min`;
    if (wholeHours > 0) return `${wholeHours} h`;
    return `${minutes} min`;
  };

  const formatDateTimeForVoice = (value) =>
    format(new Date(value), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es });

  const speakPortalGuidance = (guidance) => {
    if (!guidance) return;

    const didStartVoice = primeVoicePlayback({
      message: guidance,
      voiceOptions: PORTAL_VOICE_OPTIONS,
    });

    if (!didStartVoice) {
      speakAlert(guidance, PORTAL_VOICE_OPTIONS);
    }
  };

  const newEndDate = new Date(
    newDate.getTime() + Number(newDuration || 0) * 60 * 60 * 1000,
  );
  const currentSlotDate = editingBooking ? new Date(editingBooking.timeSlot) : null;
  const hasValidDuration =
    Number.isFinite(Number(newDuration)) && Number(newDuration) >= 0.5;
  const hasRescheduleChanges = editingBooking
    ? currentSlotDate?.getTime() !== newDate.getTime() ||
      Number(editingBooking.duration) !== Number(newDuration)
    : false;
  const durationQuickOptions = Array.from(
    new Set([0.5, 1, 1.5, 2, 3, 4, Number(editingBooking?.duration), Number(newDuration)]),
  )
    .filter((value) => Number.isFinite(value) && value >= 0.5 && value <= 5)
    .sort((a, b) => a - b);
  const rescheduleChangeTitle = !editingBooking
    ? ""
    : !hasRescheduleChanges
      ? "Todavía no cambiaste el turno."
      : isSameDay(currentSlotDate, newDate)
        ? "Mantenés el mismo día y estás ajustando el horario."
        : "Estás moviendo la clase a otro día con una nueva franja horaria.";
  const rescheduleChangeCopy = !editingBooking
    ? ""
    : !hasRescheduleChanges
      ? "La propuesta nueva replica el turno actual. Cambiá fecha, hora o duración para habilitar la confirmación."
      : `Pasarías de ${formatTime(editingBooking.timeSlot)} a ${formatTime(newDate)} hs, con una duración final de ${formatDurationLabel(newDuration)}. El cambio solo se guarda cuando confirmás.`;

  const isBookingActive = (booking) => {
    const endTime = new Date(booking.endTime);
    const now = new Date();
    return endTime > now && booking.status !== "Cancelado";
  };

  const looksLikeBookingCode = (value) =>
    /^[A-Z0-9]{6,12}$/i.test(String(value || "").trim());

  const getNotificationFollowUp = (notifications) => {
    const clientSent =
      notifications?.client?.sent ?? notifications?.clientEmailSent ?? false;
    const clientRecipient =
      notifications?.client?.recipient || notifications?.clientRecipient || "";

    if (clientSent && clientRecipient) {
      return ` También enviamos el detalle a ${clientRecipient}.`;
    }

    if (clientRecipient) {
      return " La reserva ya quedó actualizada. Si el correo tarda, vuelve a entrar desde Mis Turnos con tu código, email o número de teléfono.";
    }

    return " Podés volver a encontrarla desde Mis Turnos con tu código, email o número de teléfono.";
  };

  useEffect(() => {
    if (!message) return;
    speakAlert(message, PORTAL_VOICE_OPTIONS);
  }, [message]);

  const handleSearch = async (e, options = {}) => {
    if (e) e.preventDefault();
    const silent = options.silent === true;

    if (!silent) {
      primeVoicePlayback();
    }

    if (!code.trim()) {
      setMessage("Ingresá tu código, email o número de teléfono para buscar tus turnos.");
      return;
    }

    const trimmedCode = code.trim();
    const searchedByCode = looksLikeBookingCode(trimmedCode);

    setLoading(true);
    setMessage("");
    setBookingsList([]);
    setHasSearched(true);

    try {
      const res = await axios.get(`${API_URL}/api/bookings/${trimmedCode}`);
      let results = [];

      if (res.data && Array.isArray(res.data.data)) {
        results = res.data.data;
      } else if (res.data && res.data.data) {
        results = [res.data.data];
      }

      const activeResults = results.filter(isBookingActive);
      setBookingsList(activeResults);

      if (results.length > 0 && activeResults.length === 0) {
        setMessage(
          searchedByCode
            ? "Ese código existe, pero hoy no tiene un turno activo para gestionar."
            : "Encontramos historial, pero no hay turnos activos para gestionar.",
        );
      } else if (activeResults.length === 0) {
        setMessage(
          "No encontramos reservas activas con ese dato. Probá con el código exacto o con el email o el número de teléfono cargados al reservar.",
        );
      } else {
        if (!silent) {
          speakAlert(
            activeResults.length === 1
              ? "Ya encontré tu turno activo. Desde acá podés revisarlo, reprogramarlo o cancelarlo con tranquilidad."
              : `Ya encontré ${activeResults.length} turnos activos para gestionar. Podés resolverlos desde esta misma pantalla.`,
            PORTAL_VOICE_OPTIONS,
          );
        }
      }
    } catch (error) {
      console.error(error);
      setMessage(getBookingApiMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (booking) => {
    primeVoicePlayback();
    setEditingBooking(booking);
    setNewDate(new Date(booking.timeSlot));
    setNewDuration(booking.duration);
    speakPortalGuidance(
      `Abrimos la reprogramación del turno de ${booking.studentName}. Primero mirá el horario actual: ${formatDateTimeForVoice(booking.timeSlot)}. Después elegí una nueva propuesta con calma; nada se cambia hasta que confirmes.`,
    );

    axios
      .get(`${API_URL}/api/bookings/availability`)
      .then((res) => {
        const active = res.data.data.filter(
          (bookingItem) =>
            bookingItem.status !== "Cancelado" && bookingItem._id !== booking._id,
        );
        setExistingBookingsForBlock(active);
      })
      .catch((error) => {
        console.error(error);
        showToast(
          getBookingApiMessage(error),
          "warning",
          {
            title: "Disponibilidad pendiente",
            speak:
              "No pude actualizar la disponibilidad ahora mismo. Probá de nuevo en unos segundos; si ya estabas gestionando el turno, no perdiste el avance.",
            voiceOptions: PORTAL_VOICE_OPTIONS,
          },
        );
      });
  };

  const getExcludedTimes = (date) => {
    let excluded = [];
    const bookingsOnDay = existingBookingsForBlock.filter((booking) =>
      isSameDay(new Date(booking.timeSlot), date),
    );

    bookingsOnDay.forEach((booking) => {
      let current = new Date(booking.timeSlot);
      const end = new Date(booking.endTime);
      while (current < end) {
        excluded.push(new Date(current));
        current = addMinutes(current, 30);
      }
    });

    return excluded;
  };

  const calculateMinTime = (date) => {
    const now = new Date();
    const openingTime = setHours(setMinutes(date, 0), 7);
    if (isSameDay(date, now)) {
      const buffer = addMinutes(now, 60);
      return buffer > openingTime ? buffer : openingTime;
    }
    return openingTime;
  };

  const handleRescheduleDateChange = (date) => {
    if (!date) return;

    const selectedTime = date.getTime();
    const currentTime = newDate?.getTime?.();

    if (editingBooking && currentTime === selectedTime) {
      const originalDate = new Date(editingBooking.timeSlot);
      setNewDate(originalDate);
      speakPortalGuidance(
        `Volvimos al horario actual: ${formatDateTimeForVoice(originalDate)}. Todo sigue como estaba. Si querés moverlo, tocá otra fecha u otra hora disponible.`,
      );
      return;
    }

    setNewDate(date);
    speakPortalGuidance(
      `Nueva propuesta: ${formatDateTimeForVoice(date)}. Bien, ya la estoy comparando con tu turno actual. Ahora revisá la duración y confirmá solo si el cambio te queda cómodo.`,
    );
  };

  const handleDurationQuickToggle = (duration) => {
    const currentDuration = Number(newDuration);
    const originalDuration = Number(editingBooking?.duration);
    const nextDuration =
      currentDuration === duration && originalDuration !== duration
        ? originalDuration || 1
        : duration;

    setNewDuration(nextDuration);
    speakPortalGuidance(
      `Duración propuesta: ${formatDurationVoiceLabel(nextDuration)}. Abajo te muestro cómo queda el horario final para que decidas con tranquilidad.`,
    );
  };

  const handleReschedule = async () => {
    primeVoicePlayback();
    if (!newDate) return showToast("Seleccioná una fecha válida", "error");

    const durationNumber = Number(newDuration);
    if (!Number.isFinite(durationNumber) || durationNumber < 0.5) {
      return showToast("La duración mínima es de 30 minutos.", "error");
    }

    const day = String(newDate.getDate()).padStart(2, "0");
    const month = String(newDate.getMonth() + 1).padStart(2, "0");
    const year = newDate.getFullYear();
    const hours = String(newDate.getHours()).padStart(2, "0");
    const minutes = String(newDate.getMinutes()).padStart(2, "0");
    const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;

    try {
      const response = await axios.post(`${API_URL}/api/bookings/reschedule`, {
        bookingCode: editingBooking.bookingCode,
        newTimeSlot: formattedDate,
        newDuration: durationNumber,
      });

      showToast(
        `Turno reprogramado con éxito.${getNotificationFollowUp(response.data.notifications)}`,
        "success",
        {
          title: "Reprogramación confirmada",
          detail:
            "La nueva fecha se guardó y el turno ya queda listo para volver a gestionarse desde Mis Turnos.",
          speak: `Listo. El turno fue reprogramado con éxito para ${formatDateTimeForVoice(newDate)}, con una duración de ${formatDurationVoiceLabel(durationNumber)}. Quedó guardado y vas a poder gestionarlo desde Mis Turnos cuando lo necesites.`,
          voiceOptions: PORTAL_VOICE_OPTIONS,
        },
      );
      setEditingBooking(null);
      handleSearch(null, { silent: true });
    } catch (error) {
      showToast(
        getBookingApiMessage(error),
        "error",
        {
          title: "No se pudo reprogramar",
          speak:
            "No pude guardar la reprogramación en este momento. Revisá tu conexión e intentá nuevamente; el turno actual no se modifica hasta que confirmemos el cambio.",
          voiceOptions: PORTAL_VOICE_OPTIONS,
        },
      );
    }
  };

  const openCancelModal = (bookingCode) => {
    const bookingToCancel = bookingsList.find(
      (booking) => booking.bookingCode === bookingCode,
    );
    setCancelingBooking(bookingToCancel);

    if (bookingToCancel) {
      speakPortalGuidance(
        `Abrimos la confirmación para cancelar el turno código ${spellCodeForVoice(bookingToCancel.bookingCode)}, de ${bookingToCancel.studentName}, el ${formatDateTimeForVoice(bookingToCancel.timeSlot)}. Tomate un segundo para revisar los datos; solo se libera si confirmás la cancelación.`,
      );
    }
  };

  const confirmCancel = async () => {
    if (!cancelingBooking) return;
    primeVoicePlayback();

    const codeToCancel = cancelingBooking.bookingCode;

    try {
      const response = await axios.post(`${API_URL}/api/bookings/cancel`, {
        bookingCode: codeToCancel,
      });

      setCancelingBooking(null);
      const updatedBookings = bookingsList.filter(
        (booking) => booking.bookingCode !== codeToCancel,
      );
      setBookingsList(updatedBookings);
      setMessage(
        updatedBookings.length > 0
          ? "El turno cancelado ya no aparece entre tus reservas activas."
          : "El turno se canceló correctamente y ya no aparece en Mis Turnos.",
      );

      showToast(
        `Turno cancelado.${getNotificationFollowUp(response.data.notifications)}`,
        "success",
        {
          title: "Cancelación confirmada",
          detail:
            "La reserva deja de mostrarse en tu vista activa y el horario vuelve a quedar disponible.",
          speak:
            "Listo. El turno fue cancelado correctamente y ese horario volvió a quedar disponible. Si más adelante necesitás otra reserva, te acompaño de nuevo paso a paso.",
          voiceOptions: PORTAL_VOICE_OPTIONS,
        },
      );
    } catch (error) {
      console.error(error);
      showToast(
        getBookingApiMessage(error),
        "error",
        {
          title: "No se pudo cancelar",
          speak:
            "No pude cancelar el turno en este momento. Revisá la conexión e intentá nuevamente; hasta que se confirme, el turno sigue activo.",
          voiceOptions: PORTAL_VOICE_OPTIONS,
        },
      );
    }
  };

  const handleDeleteForever = (id) => {
    setBookingsList((prev) => prev.filter((booking) => booking._id !== id));
    showToast(
      "Registro ocultado de tu vista. Si lo necesitás, podés volver a buscarlo con el código, email o número de teléfono.",
      "success",
    );
  };

  const maxTime = setHours(setMinutes(new Date(), 0), 22);
  const activeVisibleBookings = bookingsList.filter(isBookingActive);
  const portalToastMeta = {
    success: {
      icon: <FaCheckCircle />,
      title: "Movimiento confirmado",
    },
    warning: {
      icon: <FaExclamationTriangle />,
      title: "Atención",
    },
    error: {
      icon: <FaTimesCircle />,
      title: "No pude completarlo",
    },
    info: {
      icon: <FaInfoCircle />,
      title: "Información útil",
    },
  }[toast.type || "info"];

  return (
    <div className="client-portal-wrapper">
      {toast.show && (
        <div
          className={`portal-toast ${toast.type}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className={`portal-toast-icon ${toast.type || "info"}`}>
            {portalToastMeta.icon}
          </div>
          <div className="portal-toast-copy">
            <strong>{toast.title || portalToastMeta.title}</strong>
            <span>{toast.message}</span>
            {toast.detail ? <small>{toast.detail}</small> : null}
          </div>
        </div>
      )}

      <div className="portal-container">
        <div className="portal-header">
          <h1 className="portal-title">Mis Turnos</h1>
          <p className="portal-subtitle">Gestioná tus clases próximas.</p>
          <div className="header-decoration"></div>
        </div>

        <div className="portal-guidance" aria-label="Cómo gestionar tus turnos">
          <div className="guidance-card">
            <FaSearch />
            <strong>Empieza por el código</strong>
            <span>Si lo tienes, pégalo tal cual aparece en tu comprobante.</span>
          </div>
          <div className="guidance-card">
            <FaCalendarAlt />
            <strong>También sirve tu contacto</strong>
            <span>Si no tienes el código a mano, usa email o número de teléfono.</span>
          </div>
          <div className="guidance-card">
            <FaWhatsapp />
            <strong>Gestioná sin vueltas</strong>
            <span>Desde acá podés revisar, reprogramar o cancelar.</span>
          </div>
        </div>

        <div className="portal-management-alert" role="note">
          <div className="portal-management-icon">
            <FaInfoCircle />
          </div>
          <div className="portal-management-copy">
            <strong>Tu código vive en Mis Turnos</strong>
            <p>
              Si tienes el código de reserva, pégalo tal cual aparece en el
              comprobante. Si no, también podés usar el email o el número de
              teléfono que cargaste al reservar.
            </p>
            <div className="search-method-pills">
              <span>Código de reserva</span>
              <span>Email cargado</span>
              <span>Teléfono cargado</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSearch} className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Ingresá tu código, email o número de teléfono"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-describedby="portal-search-help"
            required
          />
          <button
            type="submit"
            className="btn-search"
            disabled={loading}
            aria-label="Buscar mis turnos"
          >
            {loading ? <FaHourglassHalf className="spin" /> : "Ver Mis Turnos"}
          </button>
        </form>

        <p id="portal-search-help" className="search-helper">
          Si reservaste para un menor, también podés buscar con el dato de
          contacto del adulto responsable.
        </p>

        {hasSearched && activeVisibleBookings.length > 0 && (
          <div className="portal-results-summary" role="status">
            <FaInfoCircle />
            <span>
              Encontramos {activeVisibleBookings.length} turno
              {activeVisibleBookings.length === 1 ? "" : "s"} activo
              {activeVisibleBookings.length === 1 ? "" : "s"} para gestionar.
            </span>
          </div>
        )}

        {message && (
          <div className="message-error" role="alert">
            <FaTimesCircle /> {message}
          </div>
        )}

        {hasSearched && !loading && bookingsList.length === 0 && !message && (
          <div className="empty-state">
            <FaCalendarCheck className="empty-state-icon" />
            <p>
              No hay turnos activos para mostrar. Prueba con tu código exacto,
              email o número de teléfono cargados al reservar.
            </p>
          </div>
        )}

        <div className="tickets-grid">
          {bookingsList.map((booking) => (
            <div key={booking._id} className="ticket-wrapper">
              <BookingTicket
                booking={booking}
                onEdit={startEdit}
                onCancel={openCancelModal}
                onDelete={handleDeleteForever}
              />
            </div>
          ))}
        </div>

        <section
          className="portal-support-strip"
          aria-label="Ayuda extra para gestionar turnos"
        >
          <article className="portal-support-card">
            <FaCalendarCheck />
            <strong>Revisá antes de salir</strong>
            <p>
              Si reprogramás o cancelás, la confirmación queda guardada al
              instante y vuelve a aparecer en esta misma vista.
            </p>
          </article>

          <article className="portal-support-card">
            <FaInfoCircle />
            <strong>Si no encontrás el turno, no adivines</strong>
            <p>
              Probá con el código, el email o el teléfono del responsable que
              cargaste al reservar.
            </p>
          </article>

          <a
            className="portal-support-card portal-support-cta"
            href="https://wa.me/5491164236675?text=Hola%20Agustin,%20necesito%20ayuda%20para%20gestionar%20un%20turno."
            target="_blank"
            rel="noreferrer"
          >
            <FaWhatsapp />
            <strong>Si algo no aparece, te ayudamos por WhatsApp</strong>
            <p>
              Podés seguir el proceso con acompañamiento humano sin salir del
              circuito de reserva.
            </p>
            <span>Abrir WhatsApp</span>
          </a>
        </section>
      </div>

      {editingBooking && (
        <div
          className="modal-overlay reschedule-overlay"
          onClick={() => setEditingBooking(null)}
        >
          <div
            className="modal-box premium-modal reschedule-modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reschedule-title"
          >
            <div className="modal-header-premium reschedule-header">
              <div className="reschedule-header-copy">
                <span className="modal-kicker">Mover clase con la misma claridad</span>
                <h3 id="reschedule-title">
                  <FaCalendarAlt /> Reprogramar turno
                </h3>
                <p>
                  Te guiamos para comparar el turno actual con una nueva
                  propuesta y confirmar solo cuando el cambio te quede realmente
                  cómodo.
                </p>
              </div>

              <div className="reschedule-steps-strip" aria-label="Pasos para reprogramar">
                <span className="reschedule-step-chip active">1. Compará</span>
                <span className="reschedule-step-chip active">2. Elegí día y hora</span>
                <span className="reschedule-step-chip active">3. Ajustá duración</span>
              </div>
            </div>

            <div className="modal-body reschedule-modal-body">
              <div className="reschedule-modal-grid">
                <section className="reschedule-overview-panel">
                  <div className="reschedule-panel-intro">
                    <span className="reschedule-panel-kicker">Tu punto de partida</span>
                    <strong>Ves antes y después sin tener que interpretar nada.</strong>
                    <p>
                      Si todavía no elegiste un cambio, la propuesta nueva
                      replica el turno actual para que compares con claridad.
                    </p>
                  </div>

                  <div className="reschedule-comparison reschedule-comparison-modern">
                    <div className="date-box old">
                      <span>Actual</span>
                      <strong>{formatDateLong(editingBooking.timeSlot)}</strong>
                      <small>
                        {formatTime(editingBooking.timeSlot)} -{" "}
                        {formatTime(editingBooking.endTime)} hs
                      </small>
                    </div>

                    <div className="arrow-box">
                      <FaArrowRight />
                    </div>

                    <div className="date-box new">
                      <span>Propuesta nueva</span>
                      <strong>{formatDateLong(newDate)}</strong>
                      <small>
                        {formatTime(newDate)} - {formatTime(newEndDate)} hs
                      </small>
                    </div>
                  </div>

                  <div className="change-preview change-preview-rich">
                    <span className="reschedule-panel-kicker">Qué va a pasar si confirmás</span>
                    <strong>{rescheduleChangeTitle}</strong>
                    <span>{rescheduleChangeCopy}</span>
                  </div>

                  <div className="reschedule-mini-facts reschedule-status-grid">
                    <article>
                      <span>Código</span>
                      <strong>#{editingBooking.bookingCode}</strong>
                    </article>
                    <article>
                      <span>Alumno</span>
                      <strong>{editingBooking.studentName}</strong>
                    </article>
                    <article>
                      <span>Parentesco</span>
                      <strong>{getResponsibleRelationshipDisplay(editingBooking)}</strong>
                    </article>
                    <article>
                      <span>Duración actual</span>
                      <strong>{formatDurationLabel(editingBooking.duration)}</strong>
                    </article>
                    <article>
                      <span>Duración nueva</span>
                      <strong>{formatDurationLabel(newDuration)}</strong>
                    </article>
                  </div>
                </section>

                <section className="reschedule-editor-panel">
                  <div className="reschedule-editor-head">
                    <span className="reschedule-panel-kicker">Agenda disponible</span>
                    <strong>Seleccioná un nuevo día, una nueva hora y revisá cómo queda.</strong>
                    <p>
                      Los horarios ocupados o ya pasados quedan bloqueados para
                      que no tengas que adivinar.
                    </p>
                  </div>

                  <div className="reschedule-selection-strip">
                    <article className="reschedule-selection-pill">
                      <span>Día elegido</span>
                      <strong>{formatDateLong(newDate)}</strong>
                    </article>
                    <article className="reschedule-selection-pill">
                      <span>Horario elegido</span>
                      <strong>{formatTime(newDate)} hs</strong>
                    </article>
                    <article className="reschedule-selection-pill accent">
                      <span>Finaliza</span>
                      <strong>{formatTime(newEndDate)} hs</strong>
                    </article>
                  </div>

                  <div className="input-group-modal calendar-panel calendar-panel-premium">
                    <div className="calendar-panel-head">
                      <label id="new-date-label">Agenda disponible</label>
                      <span className="calendar-panel-helper">
                        1. Elegí el día. 2. Elegí la hora. Si volvés a tocar exactamente la misma selección, recuperás el horario actual.
                      </span>
                    </div>
                    <DatePicker
                      selected={newDate}
                      onChange={handleRescheduleDateChange}
                      showTimeSelect
                      timeCaption="Hora"
                      timeIntervals={30}
                      minTime={calculateMinTime(newDate)}
                      maxTime={maxTime}
                      minDate={new Date()}
                      excludeTimes={getExcludedTimes(newDate)}
                      dateFormat="dd 'de' MMMM - HH:mm 'hs'"
                      formatWeekDay={(nameOfDay) => nameOfDay.slice(0, 2)}
                      calendarClassName="reschedule-datepicker"
                      renderCustomHeader={({
                        date,
                        decreaseMonth,
                        increaseMonth,
                        prevMonthButtonDisabled,
                        nextMonthButtonDisabled,
                      }) => (
                        <div className="reschedule-datepicker-header">
                          <button
                            type="button"
                            className="reschedule-month-nav"
                            onClick={decreaseMonth}
                            disabled={prevMonthButtonDisabled}
                            aria-label="Mes anterior"
                          >
                            <FaChevronLeft />
                          </button>
                          <strong>{format(date, "MMMM yyyy", { locale: es })}</strong>
                          <button
                            type="button"
                            className="reschedule-month-nav"
                            onClick={increaseMonth}
                            disabled={nextMonthButtonDisabled}
                            aria-label="Mes siguiente"
                          >
                            <FaChevronRight />
                          </button>
                        </div>
                      )}
                      locale="es"
                      className="input-calendar-modal premium-input"
                      inline
                      ariaLabelledBy="new-date-label"
                    />
                  </div>

                  <div className="input-group-modal duration-row duration-panel duration-panel-premium">
                    <div className="duration-panel-head">
                      <label>
                        <FaClock /> Duración de la clase
                      </label>
                      <span>Podés elegir bloques de 30 minutos y volver al valor actual tocando otra vez la opción activa.</span>
                    </div>

                    <div className="duration-quick-grid" role="list" aria-label="Duraciones sugeridas">
                      {durationQuickOptions.map((duration) => {
                        const isSelected = Number(newDuration) === duration;
                        return (
                          <button
                            key={duration}
                            type="button"
                            className={`duration-quick-btn ${isSelected ? "selected" : ""}`}
                            onClick={() => handleDurationQuickToggle(duration)}
                            aria-pressed={isSelected}
                          >
                            {formatDurationLabel(duration)}
                          </button>
                        );
                      })}
                    </div>

                    <div className="duration-manual-row">
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="5"
                        value={newDuration}
                        onChange={(e) => setNewDuration(e.target.value)}
                        className="input-duration-modal premium-input"
                        aria-label="Duración del nuevo turno en horas"
                      />

                      <div className="duration-preview-card">
                        <span>Horario final</span>
                        <strong>{formatTime(newEndDate)} hs</strong>
                      </div>
                    </div>

                    <small className="duration-preview">
                      El cambio solo se guarda cuando confirmás. Si preferís
                      dejarlo igual, podés mantener el turno actual.
                    </small>
                  </div>
                </section>
              </div>
            </div>

            <div className="modal-footer reschedule-footer">
              <div className="reschedule-footer-note">
                {hasRescheduleChanges
                  ? "La nueva propuesta ya está lista para confirmarse."
                  : "Hacé un cambio en la fecha, la hora o la duración para habilitar la confirmación."}
              </div>
              <button
                onClick={() => setEditingBooking(null)}
                className="btn-modal cancel"
              >
                Mantener actual
              </button>
              <button
                onClick={handleReschedule}
                className="btn-modal confirm"
                disabled={!newDate || !hasValidDuration || !hasRescheduleChanges}
              >
                Confirmar cambio
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelingBooking && (
        <div
          className="modal-overlay cancel-overlay"
          onClick={() => setCancelingBooking(null)}
        >
          <div
            className="modal-box danger-modal cancel-soft-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-title"
          >
            <div className="cancel-soft-header">
              <div className="danger-icon soft">
                <FaExclamationTriangle />
              </div>
              <div>
                <span className="modal-kicker">Cancelar con claridad</span>
                <h3 id="cancel-title">¿Querés liberar este horario?</h3>
                <p className="danger-text">
                  Si confirmás, este turno deja de aparecer en Mis Turnos y el
                  horario vuelve a quedar disponible sin dejarte ruido visual.
                </p>
              </div>
            </div>

            <div className="cancel-soft-summary">
              <article>
                <span>Código</span>
                <strong>#{cancelingBooking.bookingCode}</strong>
              </article>
              <article>
                <span>Alumno</span>
                <strong>{cancelingBooking.studentName}</strong>
              </article>
              <article>
                <span>Adulto responsable</span>
                <strong>{cancelingBooking.responsibleName || "No informado"}</strong>
              </article>
              <article>
                <span>Parentesco</span>
                <strong>{getResponsibleRelationshipDisplay(cancelingBooking)}</strong>
              </article>
              <article>
                <span>Fecha</span>
                <strong>{formatDateLong(cancelingBooking.timeSlot)}</strong>
              </article>
              <article>
                <span>Horario</span>
                <strong>
                  {formatTime(cancelingBooking.timeSlot)} -{" "}
                  {formatTime(cancelingBooking.endTime)} hs
                </strong>
              </article>
            </div>

            <div className="cancel-soft-note">
              <FaInfoCircle />
              <span>
                Si más adelante necesitás otra clase, podés volver a reservar
                normalmente. Este turno cancelado ya no seguirá visible en tu
                lista activa.
              </span>
            </div>

            <div className="modal-footer danger-footer cancel-soft-footer">
              <button
                onClick={() => setCancelingBooking(null)}
                className="btn-modal safe-return"
              >
                No, mantenerlo
              </button>
              <button
                onClick={confirmCancel}
                className="btn-modal danger-confirm"
              >
                Sí, liberar horario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;
