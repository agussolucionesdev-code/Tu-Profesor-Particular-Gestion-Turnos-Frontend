import { useState } from "react";
import axios from "axios";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { setHours, setMinutes, addMinutes, isSameDay } from "date-fns";
import es from "date-fns/locale/es";
import {
  FaTimesCircle,
  FaHourglassHalf,
  FaCalendarCheck,
  FaExclamationTriangle,
  FaArrowRight,
  FaClock,
  FaCalendarAlt,
  FaCheckCircle,
  FaInfoCircle,
  FaSearch,
  FaWhatsapp,
} from "react-icons/fa";
import "../index.css";
import "./ClientPortal.css";
import BookingTicket from "./BookingTicket";

registerLocale("es", es);

const ClientPortal = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4100";

  // --- ESTADOS ---
  const [code, setCode] = useState("");
  const [bookingsList, setBookingsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // --- ESTADO ALERTAS DINAMICAS (TOAST) ---
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 4000);
  };

  // --- ESTADOS PARA MODALES ---
  const [editingBooking, setEditingBooking] = useState(null);
  const [cancelingBooking, setCancelingBooking] = useState(null);

  // Datos reprogramacion
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

  const newEndDate = new Date(
    newDate.getTime() + Number(newDuration || 0) * 60 * 60 * 1000,
  );

  // --- LOGICA DE FILTRADO ---
  const isBookingActive = (booking) => {
    const endTime = new Date(booking.endTime);
    const now = new Date();
    return endTime > now && booking.status !== "Cancelado";
  };

  const looksLikeBookingCode = (value) =>
    /^[A-Z0-9]{6,12}$/i.test(String(value || "").trim());

  const getNotificationFollowUp = (notifications) => {
    if (notifications?.client?.sent && notifications.client.recipient) {
      return ` Tambien enviamos el detalle a ${notifications.client.recipient}.`;
    }

    if (notifications?.client?.recipient) {
      return " La reserva ya quedo actualizada. Si el correo tarda, vuelve a entrar desde Mis Turnos con tu codigo, email o WhatsApp.";
    }

    return " Puedes volver a encontrarla desde Mis Turnos con tu codigo, email o WhatsApp.";
  };

  // --- 1. BUSCAR ---
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!code.trim()) {
      setMessage("Ingresa tu codigo, email o WhatsApp para buscar tus turnos.");
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
            ? "Ese codigo existe, pero hoy no tiene un turno activo para gestionar."
            : "Encontramos historial, pero no hay turnos activos para gestionar.",
        );
      } else if (activeResults.length === 0) {
        setMessage(
          "No encontramos reservas activas con ese dato. Prueba con el codigo exacto o con el email/WhatsApp cargados al reservar.",
        );
      }
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.message ||
          "No encontramos reservas. Prueba con tu codigo, email o WhatsApp.",
      );
    } finally {
      setLoading(false);
    }
  };

  // --- 2. PREPARAR EDICION ---
  const startEdit = (booking) => {
    setEditingBooking(booking);
    setNewDate(new Date(booking.timeSlot));
    setNewDuration(booking.duration);

    axios
      .get(`${API_URL}/api/bookings/availability`)
      .then((res) => {
        const active = res.data.data.filter(
          (b) => b.status !== "Cancelado" && b._id !== booking._id
        );
        setExistingBookingsForBlock(active);
      })
      .catch((error) => {
        console.error(error);
        showToast(
          "No pude actualizar la disponibilidad. Igual puedes volver a intentar desde Mis Turnos.",
          "warning",
        );
      });
  };

  // --- 3. HELPER HORARIOS ---
  const getExcludedTimes = (date) => {
    let excluded = [];
    const bookingsOnDay = existingBookingsForBlock.filter((b) =>
      isSameDay(new Date(b.timeSlot), date)
    );
    bookingsOnDay.forEach((b) => {
      let current = new Date(b.timeSlot);
      const end = new Date(b.endTime);
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

  // --- 4. REPROGRAMAR ---
  const handleReschedule = async () => {
    if (!newDate) return showToast("Selecciona una fecha valida", "error");

    const durationNumber = Number(newDuration);
    if (!Number.isFinite(durationNumber) || durationNumber < 0.5) {
      return showToast("La duracion minima es de 30 minutos.", "error");
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
        `Turno reprogramado con exito.${getNotificationFollowUp(response.data.notifications)}`,
        "success",
      );
      setEditingBooking(null);
      handleSearch();
    } catch (error) {
      showToast(
        error.response?.data?.message || "No se pudo reprogramar el turno.",
        "error",
      );
    }
  };

  // --- 5. CANCELAR (LOGICA SUAVE Y AUTOMATICA) ---
  const openCancelModal = (bookingCode) => {
    const bookingToCancel = bookingsList.find(
      (b) => b.bookingCode === bookingCode
    );
    setCancelingBooking(bookingToCancel);
  };

  const confirmCancel = async () => {
    if (!cancelingBooking) return;

    const codeToCancel = cancelingBooking.bookingCode;

    try {
      const response = await axios.post(`${API_URL}/api/bookings/cancel`, {
        bookingCode: codeToCancel,
      });

      setCancelingBooking(null);
      setBookingsList((prev) =>
        prev.map((b) =>
          b.bookingCode === codeToCancel ? { ...b, status: "Cancelado" } : b
        )
      );
      showToast(
        `Turno cancelado.${getNotificationFollowUp(response.data.notifications)}`,
        "success",
      );

    } catch (error) {
      console.error(error);
      showToast(
        error.response?.data?.message || "Error al cancelar el turno.",
        "error",
      );
    }
  };

  // --- 6. ELIMINAR MANUAL ---
  const handleDeleteForever = (id) => {
    setBookingsList((prev) => prev.filter((b) => b._id !== id));
    showToast(
      "Registro ocultado de tu vista. Si lo necesitas, puedes volver a buscarlo con el codigo, email o WhatsApp.",
      "success",
    );
  };

  const maxTime = setHours(setMinutes(new Date(), 0), 22);
  const activeVisibleBookings = bookingsList.filter(isBookingActive);
  const cancelledVisibleBookings = bookingsList.filter(
    (booking) => booking.status === "Cancelado",
  );
  const portalToastMeta = {
    success: {
      icon: <FaCheckCircle />,
      title: "Movimiento confirmado",
    },
    warning: {
      icon: <FaExclamationTriangle />,
      title: "Atencion",
    },
    error: {
      icon: <FaTimesCircle />,
      title: "No pude completarlo",
    },
    info: {
      icon: <FaInfoCircle />,
      title: "Informacion util",
    },
  }[toast.type || "info"];

  return (
    <div className="client-portal-wrapper">
      {/* TOAST FLOTANTE */}
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
            <strong>{portalToastMeta.title}</strong>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      <div className="portal-container">
        <div className="portal-header">
          <h1 className="portal-title">Mis Turnos</h1>
          <p className="portal-subtitle">Gestiona tus clases proximas.</p>
          <div className="header-decoration"></div>
        </div>

        <div className="portal-guidance" aria-label="Como gestionar tus turnos">
          <div className="guidance-card">
            <FaSearch />
            <strong>Empieza por el codigo</strong>
            <span>Si lo tienes, pegalο tal cual aparece en tu comprobante.</span>
          </div>
          <div className="guidance-card">
            <FaCalendarAlt />
            <strong>Tambien sirve tu contacto</strong>
            <span>Si no tienes el codigo a mano, usa email o WhatsApp.</span>
          </div>
          <div className="guidance-card">
            <FaWhatsapp />
            <strong>Gestiona sin vueltas</strong>
            <span>Desde aqui puedes revisar, reprogramar o cancelar.</span>
          </div>
        </div>

        <div className="portal-management-alert" role="note">
          <div className="portal-management-icon">
            <FaInfoCircle />
          </div>
          <div className="portal-management-copy">
            <strong>Tu codigo vive en Mis Turnos</strong>
            <p>
              Si tienes el codigo de reserva, pegalo tal cual aparece en el
              comprobante. Si no, tambien puedes usar el email o el WhatsApp
              que cargaste al reservar.
            </p>
            <div className="search-method-pills">
              <span>Codigo de reserva</span>
              <span>Email cargado</span>
              <span>WhatsApp cargado</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSearch} className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Ingresa tu codigo, email o WhatsApp"
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
          Si reservaste para un menor, tambien puedes buscar con el dato de
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

        {cancelledVisibleBookings.length > 0 && (
          <div className="portal-history-hint" role="status">
            <FaInfoCircle />
            <span>
              Los turnos cancelados quedan visibles un momento para que puedas
              revisarlos y despues ocultarlos de tu vista.
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
            <FaCalendarCheck
              style={{
                fontSize: "3rem",
                color: "#CBD5E1",
                marginBottom: "1rem",
              }}
            />
            <p>
              No hay turnos activos para mostrar. Prueba con tu codigo exacto,
              email o WhatsApp cargados al reservar.
            </p>
          </div>
        )}

        <div className="tickets-grid">
          {bookingsList.map((b) => (
            <div key={b._id} className="ticket-wrapper">
              <BookingTicket
                booking={b}
                onEdit={startEdit}
                onCancel={openCancelModal}
                onDelete={handleDeleteForever}
              />
            </div>
          ))}
        </div>
      </div>

      {/* --- MODAL REPROGRAMAR --- */}
      {editingBooking && (
        <div className="modal-overlay" onClick={() => setEditingBooking(null)}>
          <div
            className="modal-box premium-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reschedule-title"
          >
            <div className="modal-header-premium">
              <h3 id="reschedule-title">
                <FaCalendarAlt /> Reprogramar turno
              </h3>
              <p>
                Turno: <strong>#{editingBooking.bookingCode}</strong>
              </p>
            </div>

            <div className="modal-body">
              <div className="reschedule-comparison">
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
                  <span>Nuevo turno</span>
                  <strong>{formatDateLong(newDate)}</strong>
                  <small>
                    {formatTime(newDate)} - {formatTime(newEndDate)} hs
                  </small>
                </div>
              </div>

              <p className="change-preview">
                Vas a pasar de una clase de {editingBooking.duration} hs a una
                clase de {newDuration || "0"} hs. El cambio recien se guarda al
                confirmar.
              </p>

              <div className="input-group-modal">
                <label id="new-date-label">Selecciona nueva fecha y hora</label>
                <DatePicker
                  selected={newDate}
                  onChange={(date) => setNewDate(date)}
                  showTimeSelect
                  timeIntervals={30}
                  minTime={calculateMinTime(newDate)}
                  maxTime={maxTime}
                  minDate={new Date()}
                  excludeTimes={getExcludedTimes(newDate)}
                  dateFormat="dd 'de' MMMM - HH:mm 'hs'"
                  locale="es"
                  className="input-calendar-modal premium-input"
                  inline
                  ariaLabelledBy="new-date-label"
                />
              </div>

              <div className="input-group-modal duration-row">
                <label>
                  <FaClock /> Duracion (horas)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="5"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="input-duration-modal premium-input"
                  aria-label="Duracion del nuevo turno en horas"
                />
                <small className="duration-preview">
                  Horario final estimado: {formatTime(newEndDate)} hs.
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setEditingBooking(null)}
                className="btn-modal cancel"
              >
                Mantener Actual
              </button>
              <button
                onClick={handleReschedule}
                className="btn-modal confirm"
                disabled={!newDate || Number(newDuration) < 0.5}
              >
                Confirmar Cambio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CANCELAR SEGURO --- */}
      {cancelingBooking && (
        <div
          className="modal-overlay"
          onClick={() => setCancelingBooking(null)}
        >
          <div
            className="modal-box danger-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-title"
          >
            <div className="danger-icon">
              <FaExclamationTriangle />
            </div>
            <h3 id="cancel-title">¿Cancelar turno?</h3>
            <p className="danger-text">
              Vas a cancelar la clase de{" "}
              <strong>{cancelingBooking.studentName}</strong>.
            </p>

            <div className="cancel-detail-list">
              <span>{formatDateLong(cancelingBooking.timeSlot)}</span>
              <span>
                {formatTime(cancelingBooking.timeSlot)} -{" "}
                {formatTime(cancelingBooking.endTime)} hs
              </span>
              <span>Ese horario se libera para otras reservas.</span>
            </div>

            <div className="modal-footer danger-footer">
              <button
                onClick={() => setCancelingBooking(null)}
                className="btn-modal safe-return"
              >
                No, conservar turno
              </button>
              <button
                onClick={confirmCancel}
                className="btn-modal danger-confirm"
              >
                Si, Cancelar Turno
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;
