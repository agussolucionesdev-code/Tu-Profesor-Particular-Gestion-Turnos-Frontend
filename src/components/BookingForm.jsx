import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  setHours,
  setMinutes,
  addMinutes,
  format,
  isSameDay,
  differenceInMinutes,
  startOfDay,
} from "date-fns";
import es from "date-fns/locale/es";
import {
  FaUserGraduate,
  FaEnvelope,
  FaWhatsapp,
  FaCalendarAlt,
  FaClock,
  FaBookOpen,
  FaCheckCircle,
  FaInfoCircle,
  FaExclamationCircle,
  FaSchool,
  FaLayerGroup,
  FaSortNumericDown,
  FaLightbulb,
  FaCalendarCheck,
  FaArrowRight,
  FaArrowLeft,
  FaUserCheck,
  FaTimesCircle,
  FaIdCard,
  FaGraduationCap,
  FaUserLock,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
} from "react-icons/fa";
import BookingConfirmationSummary from "./booking/BookingConfirmationSummary";
import BookingSuccessModal from "./booking/BookingSuccessModal";
import { BOOKING_SUPPORT_PILLS, WIZARD_STEPS } from "../constants/bookingWizard";
import {
  formatDurationOptionLabel,
  formatPhoneMaskAr,
  getBookingApiMessage,
  sanitizePersonNameAr,
} from "../utils/bookingFormatters";
import "../index.css";
import "./BookingForm.css";

registerLocale("es", es);

// --- SONIDOS UX ---
const stepSound = new Audio(
  "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3",
);
const successSound = new Audio(
  "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3",
);
const unlockSound = new Audio(
  "https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3",
);

const BookingForm = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4100";
  const supportPillIcons = [FaCheckCircle, FaWhatsapp, FaUserLock];
  const sliderWindowRef = useRef(null);
  const slideRefs = useRef({});

  const [currentStep, setCurrentStep] = useState(1);
  const [isAdult, setIsAdult] = useState(false);
  const [formData, setFormData] = useState({
    responsibleName: "",
    studentName: "",
    email: "",
    phone: "",
    school: "",
    educationLevel: "",
    yearGrade: "",
    subject: "",
    academicSituation: "",
    timeSlot: null,
    duration: "",
  });

  const [loading, setLoading] = useState(false);
  const [existingBookings, setExistingBookings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [sliderHeight, setSliderHeight] = useState(0);

  const [hasAttemptedNext, setHasAttemptedNext] = useState(false);

  const formCardRef = useRef(null);
  const textareaRef = useRef(null);
  const [hasUnlockedAcademic, setHasUnlockedAcademic] = useState(false);
  const [hasUnlockedComments, setHasUnlockedComments] = useState(false);

  const playStepSound = () => {
    stepSound.volume = 0.15;
    stepSound.play().catch(() => {});
  };
  const playUnlockSound = () => {
    unlockSound.volume = 0.3;
    unlockSound.play().catch(() => {});
  };

  const showToast = (message, type = "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4500);
  };

  const syncSliderHeight = useCallback(() => {
    const activePanel = slideRefs.current[currentStep];
    if (!activePanel) return;

    const nextHeight = activePanel.scrollHeight;
    if (nextHeight) {
      setSliderHeight(nextHeight);
    }
  }, [currentStep]);

  const smoothScrollToTop = () => {
    setTimeout(() => {
      window.scrollTo({
        top: window.innerWidth < 768 ? 50 : 120,
        behavior: "smooth",
      });
    }, 100);
  };

  useEffect(() => {
    const activeTitle = formCardRef.current?.querySelector(
      ".active-panel .section-title",
    );
    activeTitle?.focus({ preventScroll: true });
  }, [currentStep]);

  useEffect(() => {
    syncSliderHeight();

    const activePanel = slideRefs.current[currentStep];
    if (!activePanel) return undefined;

    const rafId = window.requestAnimationFrame(syncSliderHeight);
    let observer;

    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => syncSliderHeight());
      observer.observe(activePanel);
    }

    window.addEventListener("resize", syncSliderHeight);

    return () => {
      window.cancelAnimationFrame(rafId);
      observer?.disconnect();
      window.removeEventListener("resize", syncSliderHeight);
    };
  }, [
    currentStep,
    isAdult,
    formData.educationLevel,
    formData.yearGrade,
    formData.subject,
    formData.school,
    formData.email,
    formData.academicSituation,
    formData.timeSlot,
    formData.duration,
    availableSlots.length,
    syncSliderHeight,
  ]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [formData.academicSituation]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/bookings/availability`);
        setExistingBookings(
          res.data.data.filter((b) => b.status !== "Cancelado"),
        );
      } catch (error) {
        console.error("Error fetching bookings", error);
        showToast(getBookingApiMessage(error, API_URL), "warning");
      }
    };
    fetchBookings();
  }, [API_URL]);

  useEffect(() => {
    if (!formData.timeSlot) return;
    const selectedDate = startOfDay(formData.timeSlot);
    const now = new Date();
    const isToday = isSameDay(selectedDate, now);

    let startTime = setHours(setMinutes(selectedDate, 0), 7);
    const endTime = setHours(setMinutes(selectedDate, 0), 22);

    const slots = [];
    while (startTime < endTime) {
      const isOccupiedByBooking = existingBookings.some((booking) => {
        const bookStart = new Date(booking.timeSlot);
        const bookEnd = new Date(booking.endTime);
        return startTime >= bookStart && startTime < bookEnd;
      });

      const isPast = isToday && startTime <= addMinutes(now, 60);
      const status = isPast
        ? "past"
        : isOccupiedByBooking
          ? "occupied"
          : "available";

      slots.push({
        timeObj: new Date(startTime),
        isOccupied: isOccupiedByBooking || isPast,
        status,
      });

      startTime = addMinutes(startTime, 30);
    }
    setAvailableSlots(slots);
  }, [formData.timeSlot, existingBookings]);

  const isValidField = (field) => {
    const regexName = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s']{3,60}$/;
    const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    switch (field) {
      case "studentName":
        return (
          formData.studentName.trim().length > 0 &&
          regexName.test(formData.studentName.trim())
        );
      case "responsibleName":
        return (
          formData.responsibleName.trim().length > 0 &&
          regexName.test(formData.responsibleName.trim())
        );
      case "email":
        return (
          formData.email.trim().length > 0 &&
          regexEmail.test(formData.email.trim())
        );
      case "phone":
        return formData.phone.replace(/\D/g, "").length === 13;
      case "educationLevel":
        return formData.educationLevel !== "";
      case "yearGrade":
        return formData.yearGrade.trim().length > 0;
      case "subject":
        return formData.subject.trim().length > 0;
      case "school":
        return formData.school.trim().length > 0;
      case "academicSituation":
        return true;
      default:
        return false;
    }
  };

  const isEmailValidOrEmpty =
    formData.email.trim() === "" || isValidField("email");
  const isPersonalInfoComplete =
    isValidField("studentName") &&
    isValidField("phone") &&
    (isAdult ? true : isValidField("responsibleName")) &&
    isEmailValidOrEmpty;
  const isAcademicInfoComplete =
    isValidField("educationLevel") &&
    isValidField("yearGrade") &&
    isValidField("subject") &&
    isValidField("school");
  const canProceedToStep2 = isPersonalInfoComplete && isAcademicInfoComplete;
  const currentStepInfo = WIZARD_STEPS.find((step) => step.id === currentStep);
  const nextStepInfo = WIZARD_STEPS.find((step) => step.id === currentStep + 1);
  const requiredChecks = [
    isValidField("studentName"),
    isValidField("phone"),
    isAdult ? true : isValidField("responsibleName"),
    isValidField("educationLevel"),
    isValidField("yearGrade"),
    isValidField("subject"),
    isValidField("school"),
  ];
  const completedRequiredFields = requiredChecks.filter(Boolean).length;
  const completionPercent = Math.round(
    (completedRequiredFields / requiredChecks.length) * 100,
  );
  const confirmationDateLabel =
    formData.timeSlot && formData.timeSlot.getHours() > 0
      ? format(formData.timeSlot, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
      : "";
  const confirmationDurationLabel = formData.duration
    ? formatDurationOptionLabel(formData.duration)
    : "";
  const confirmationTimeRangeLabel =
    formData.timeSlot && formData.timeSlot.getHours() > 0
      ? `${format(formData.timeSlot, "HH:mm")} a ${
          formData.duration
            ? format(
                addMinutes(formData.timeSlot, Number(formData.duration) * 60),
                "HH:mm",
              )
            : "--:--"
        } hs`
      : "";

  const getFieldStateClass = (field, isOptional = false) => {
    if (isValidField(field)) return "is-valid";
    if (isOptional && formData[field]?.trim() === "") return "";
    const value = String(formData[field] ?? "").trim();
    const hasStartedTyping =
      field === "phone" ? formData.phone.replace(/\D/g, "").length >= 4 : value.length > 0;
    return hasAttemptedNext || hasStartedTyping ? "error" : "";
  };

  useEffect(() => {
    if (isPersonalInfoComplete && !hasUnlockedAcademic) {
      playUnlockSound();
      setHasUnlockedAcademic(true);
    } else if (!isPersonalInfoComplete && hasUnlockedAcademic)
      setHasUnlockedAcademic(false);
  }, [isPersonalInfoComplete, hasUnlockedAcademic]);

  useEffect(() => {
    if (isAcademicInfoComplete && !hasUnlockedComments) {
      playUnlockSound();
      setHasUnlockedComments(true);
    } else if (!isAcademicInfoComplete && hasUnlockedComments)
      setHasUnlockedComments(false);
  }, [isAcademicInfoComplete, hasUnlockedComments]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === "studentName" || name === "responsibleName") {
      finalValue = sanitizePersonNameAr(value);
    }
    if (name === "phone") finalValue = formatPhoneMaskAr(value);
    if (name === "email") finalValue = value.trimStart().toLowerCase();
    setFormData((prev) => {
      const newData = { ...prev, [name]: finalValue };
      if (name === "educationLevel") newData.yearGrade = "";
      return newData;
    });
  };

  const toggleAdultMode = () => {
    setIsAdult((current) => {
      const next = !current;
      if (next) {
        setFormData((prev) => ({ ...prev, responsibleName: "" }));
      }
      return next;
    });
  };

  const getYearGradeOptions = () => {
    const level = formData.educationLevel;
    if (level === "Primaria")
      return [
        "1er grado",
        "2do grado",
        "3er grado",
        "4to grado",
        "5to grado",
        "6to grado",
      ];
    if (level === "Secundaria" || level === "Secundaria Técnica")
      return [
        "1er año",
        "2do año",
        "3er año",
        "4to año",
        "5to año",
        "6to año",
        level === "Secundaria Técnica" ? "7mo año" : null,
      ].filter(Boolean);
    if (level === "Terciario" || level === "Universitario")
      return [
        "1er año",
        "2do año",
        "3er año",
        "4to año",
        "5to año",
        "6to año",
        "Avanzado",
      ];
    return [];
  };

  const validateStep = (step) => {
    if (step === 1 && !canProceedToStep2) {
      setHasAttemptedNext(true);
      showToast(
        "Faltan algunos datos. Revisá los campos resaltados para continuar. ✍️",
        "error",
      );
      return false;
    }
    if (step === 2 && !formData.timeSlot) {
      showToast(
        "Elegí una fecha en el calendario para descubrir los horarios libres. 📅",
        "warning",
      );
      return false;
    }
    if (
      step === 3 &&
      (!formData.timeSlot || formData.timeSlot.getHours() === 0)
    ) {
      showToast(
        "Seleccioná el horario que mejor se adapte a vos para continuar. ⏰",
        "warning",
      );
      return false;
    }
    return true;
  };

  const handleStepClick = (targetStep) => {
    if (targetStep === currentStep) return;
    if (targetStep < currentStep) {
      playStepSound();
      setCurrentStep(targetStep);
      smoothScrollToTop();
    } else if (targetStep > currentStep) {
      if (targetStep - currentStep > 1) {
        showToast("Avanzá paso a paso por favor.", "warning");
        return;
      }
      if (validateStep(currentStep)) {
        playStepSound();
        setCurrentStep(targetStep);
        smoothScrollToTop();
      }
    }
  };

  const goToNext = () => {
    if (validateStep(currentStep)) {
      playStepSound();
      setCurrentStep((prev) => prev + 1);
      setHasAttemptedNext(false);
      smoothScrollToTop();
    }
  };

  const goToPrev = () => {
    playStepSound();
    setCurrentStep((prev) => prev - 1);
    smoothScrollToTop();
  };

  const handleDateSelect = (date) => {
    if (formData.timeSlot && isSameDay(date, formData.timeSlot)) {
      setFormData({ ...formData, timeSlot: null });
      playStepSound();
    } else {
      setFormData({ ...formData, timeSlot: startOfDay(date) });
      playUnlockSound();
    }
  };

  const clearDateSelection = () => {
    setFormData({ ...formData, timeSlot: null });
    playStepSound();
  };

  const handleTimeSelect = (timeObj) => {
    if (
      formData.timeSlot &&
      formData.timeSlot.getTime() === timeObj.getTime()
    ) {
      setFormData({ ...formData, timeSlot: startOfDay(formData.timeSlot) });
      playStepSound();
    } else {
      setFormData({ ...formData, timeSlot: timeObj });
      playUnlockSound();
    }
  };

  const clearTimeSelection = () => {
    setFormData({ ...formData, timeSlot: startOfDay(formData.timeSlot) });
    playStepSound();
  };

  const getDayClassName = (date) => {
    const today = new Date();
    if (isSameDay(date, today)) return " custom-today ";
    return "";
  };

  const maxAllowedDuration = useMemo(() => {
    if (!formData.timeSlot || formData.timeSlot.getHours() === 0) return 10;
    const bookingsSameDay = existingBookings
      .filter((b) => isSameDay(new Date(b.timeSlot), formData.timeSlot))
      .map((b) => ({ start: new Date(b.timeSlot) }))
      .filter((b) => b.start > formData.timeSlot)
      .sort((a, b) => a.start - b.start);

    const closingTime = setHours(setMinutes(formData.timeSlot, 0), 22);
    const nextLimit =
      bookingsSameDay.length > 0 ? bookingsSameDay[0].start : closingTime;
    const diffMinutes = differenceInMinutes(nextLimit, formData.timeSlot);
    return Math.floor(Math.max(0.5, Math.min(diffMinutes / 60, 10)) * 10) / 10;
  }, [formData.timeSlot, existingBookings]);

  const selectedDayOnly = useMemo(() => {
    if (!formData.timeSlot) return null;
    return startOfDay(formData.timeSlot);
  }, [formData.timeSlot]);

  const availableSlotCount = useMemo(
    () => availableSlots.filter((slot) => !slot.isOccupied).length,
    [availableSlots],
  );

  const nextFreeSlot = useMemo(
    () => availableSlots.find((slot) => !slot.isOccupied)?.timeObj ?? null,
    [availableSlots],
  );

  const slotSections = useMemo(() => {
    const sections = [
      {
        id: "morning",
        label: "Manana",
        helper: "07:00 a 11:30",
        match: (hour) => hour < 12,
      },
      {
        id: "afternoon",
        label: "Tarde",
        helper: "12:00 a 16:30",
        match: (hour) => hour >= 12 && hour < 17,
      },
      {
        id: "evening",
        label: "Tarde noche",
        helper: "17:00 a 21:30",
        match: (hour) => hour >= 17,
      },
    ];

    return sections
      .map((section) => ({
        ...section,
        slots: availableSlots.filter((slot) => section.match(slot.timeObj.getHours())),
      }))
      .filter((section) => section.slots.length > 0);
  }, [availableSlots]);

  const durationOptions = useMemo(() => {
    const options = [];
    for (let current = 0.5; current <= maxAllowedDuration; current += 0.5) {
      options.push(Number(current.toFixed(1)));
    }
    return options;
  }, [maxAllowedDuration]);

  useEffect(() => {
    if (formData.duration !== "" && formData.duration > maxAllowedDuration) {
      setFormData((prev) => ({ ...prev, duration: maxAllowedDuration }));
    }
  }, [maxAllowedDuration, formData.timeSlot, formData.duration]);

  const handleDurationSelect = (duration) => {
    if (duration > maxAllowedDuration) {
      showToast(
        `El límite para este turno es ${formatDurationOptionLabel(maxAllowedDuration)}.`,
        "warning",
      );
      return;
    }
    setFormData((prev) => ({ ...prev, duration }));
  };

  const resetFormAfterSuccess = () => {
    setShowModal(false);
    setFormData({
      responsibleName: "",
      studentName: "",
      email: "",
      phone: "",
      school: "",
      educationLevel: "",
      yearGrade: "",
      subject: "",
      academicSituation: "",
      timeSlot: null,
      duration: "",
    });
    setIsAdult(false);
    setCurrentStep(1);
    setHasAttemptedNext(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dateObj = formData.timeSlot;
      const formattedDate = `${String(dateObj.getDate()).padStart(2, "0")}/${String(dateObj.getMonth() + 1).padStart(2, "0")}/${dateObj.getFullYear()} ${String(dateObj.getHours()).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`;
      const finalResponsibleName = isAdult
        ? "Mayor de edad / Responsable"
        : formData.responsibleName;
      const safeEmail = formData.email.trim() !== "" ? formData.email.trim() : "";

      const response = await axios.post(`${API_URL}/api/bookings/reserve`, {
        ...formData,
        email: safeEmail,
        responsibleName: finalResponsibleName,
        timeSlot: formattedDate,
        duration: Number(formData.duration),
        tutorName: "Agustín",
      });

      successSound.play().catch(() => {});

      const end = addMinutes(dateObj, Number(formData.duration) * 60);
      setSuccessData({
        bookingCode: response.data.data.bookingCode,
        day: format(dateObj, "EEEE d 'de' MMMM 'de' yyyy", { locale: es }),
        startTime: format(dateObj, "HH:mm"),
        endTime: format(end, "HH:mm"),
        actualDuration: formData.duration,
        cleanStudentName: formData.studentName,
        email: safeEmail,
      });
      setShowModal(true);
    } catch (error) {
      console.log("Error al reservar:", error);
      showToast(getBookingApiMessage(error, API_URL), "error");
    } finally {
      setLoading(false);
    }
  };

  const copyBookingCode = async () => {
    if (!successData?.bookingCode) return;
    try {
      await navigator.clipboard.writeText(successData.bookingCode);
      showToast("Codigo copiado. Ya podes guardarlo o compartirlo.", "success");
    } catch {
      showToast(
        "No pude copiarlo automaticamente. Seleccionalo manualmente.",
        "warning",
      );
    }
  };

  const whatsappConfirmText = successData
    ? `Hola Prof. Agustín! Acabo de reservar un turno.\n\n👤 Alumno: ${successData.cleanStudentName}\n📅 Fecha: ${successData.day}\n⏰ Horario: ${successData.startTime} a ${successData.endTime} hs (${successData.actualDuration} hs)\n🎫 Código: ${successData.bookingCode}\n\n¡Gracias!`
    : "";

  return (
    <div className="booking-page-wrapper">
      <div
        className={`neuro-toast ${toast.show ? "show" : ""} ${toast.type}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {toast.type === "error" ? <FaExclamationCircle /> : <FaInfoCircle />}
        <span>{toast.message}</span>
      </div>

      <div className="form-card-elevation" ref={formCardRef}>
        <div className="card-top-actions">
          <Link to="/portal" className="manage-booking-link">
            <FaUserLock /> Acceso Alumnos
          </Link>
        </div>

        <div className="form-header-neuro">
          <span className="form-supertitle">SISTEMA DE GESTIÓN DE TURNOS</span>
          <h2 className="form-main-title">Asegurá tu Clase</h2>
          <p className="form-subtitle">
            Completá tus datos y elegí el momento ideal para aprender.
          </p>
          <div className="form-support-strip" aria-label="Beneficios del sistema de reserva">
            {BOOKING_SUPPORT_PILLS.map((pill, index) => {
              const Icon = supportPillIcons[index];
              return (
                <div key={pill} className="support-pill">
                  <Icon />
                  <span>{pill}</span>
                </div>
              );
            })}
          </div>
        </div>

        <section
          className="journey-compass"
          aria-labelledby="journey-step-title"
          aria-live="polite"
        >
          <div className="journey-copy">
            <span className="journey-kicker">
              Paso {currentStep} de {WIZARD_STEPS.length}
            </span>
            <div className="journey-heading-row">
              <h3 id="journey-step-title">{currentStepInfo?.title}</h3>
              {nextStepInfo && (
                <span className="journey-next-pill">Sigue: {nextStepInfo.label}</span>
              )}
            </div>
            <p className="journey-one-line">{currentStepInfo?.message}</p>
            <div className="journey-chip-row" aria-label="Claves del paso actual">
              {currentStepInfo?.chips?.map((chip) => (
                <span key={chip} className="journey-mini-chip">
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <div className="journey-meter" aria-label="Datos requeridos completos">
            <span>{completionPercent}%</span>
            <div className="journey-meter-track">
              <div style={{ width: `${completionPercent}%` }}></div>
            </div>
            <small className="journey-meter-copy">
              {completedRequiredFields} de {requiredChecks.length} datos clave
            </small>
          </div>
        </section>

        <div
          className="neuro-stepper"
          role="progressbar"
          aria-label="Progreso de reserva"
          aria-valuemin="1"
          aria-valuemax={WIZARD_STEPS.length}
          aria-valuenow={currentStep}
        >
          <div className="stepper-progress-bar">
            <div
              className="stepper-progress-fill"
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            ></div>
          </div>
          {WIZARD_STEPS.map((step) => (
            <button
              type="button"
              key={step.id}
              className="stepper-item"
              onClick={() => handleStepClick(step.id)}
              aria-current={currentStep === step.id ? "step" : undefined}
              aria-label={`Ir a ${step.label}`}
            >
              <div
                className={`step-circle ${currentStep > step.id ? "completed" : ""} ${currentStep === step.id ? "current" : ""}`}
              >
                {currentStep > step.id ? (
                  <FaCheckCircle className="check-icon" />
                ) : (
                  step.id
                )}
              </div>
              <span
                className={`step-label ${currentStep >= step.id ? "active-label" : ""}`}
              >
                {step.label}
              </span>
            </button>
          ))}
        </div>

        <div
          ref={sliderWindowRef}
          className="form-slider-window"
          style={{ height: sliderHeight ? `${sliderHeight}px` : "auto" }}
        >
          <div
            className="form-slider-track"
            style={{ transform: `translateX(-${(currentStep - 1) * 100}%)` }}
          >
            {/* =======================================
                PASO 1: DATOS (DISEÑO PREMIUM SaaS)
                ======================================= */}
            <div
              ref={(element) => {
                slideRefs.current[1] = element;
              }}
              className={`form-slide-panel ${currentStep === 1 ? "active-panel" : ""}`}
            >
              <div className="form-section-block">
                <h3 className="section-title" tabIndex={-1}>
                  <FaIdCard /> Información Personal
                </h3>
                <div className="form-grid-2">
                  <div className="neuro-input-group">
                    <div className="label-row">
                      <label>
                        Nombre del Alumno <span className="required">*</span>
                      </label>
                      {hasAttemptedNext && !isValidField("studentName") && (
                        <span className="error-text">Requerido</span>
                      )}
                    </div>
                    <div
                      className={`neuro-input-wrapper premium-input ${getFieldStateClass("studentName")}`}
                    >
                      <FaUserGraduate className="input-icon" />
                      <input
                        type="text"
                        name="studentName"
                        value={formData.studentName}
                        onChange={handleChange}
                        aria-invalid={
                          hasAttemptedNext && !isValidField("studentName")
                        }
                        aria-describedby="studentName-help"
                        placeholder="Nombre y apellido del alumno"
                      />
                      {isValidField("studentName") && (
                        <FaCheckCircle className="valid-icon" />
                      )}
                    </div>
                    <p id="studentName-help" className="field-helper">
                      Escribilo como te gustaria verlo en el comprobante y en los avisos.
                    </p>
                  </div>
                  <div className="neuro-input-group">
                    <div className="label-row">
                      <label>
                        WhatsApp <span className="optional">(Sin 0 ni 15)</span>{" "}
                        <span className="required">*</span>
                      </label>
                      {hasAttemptedNext && !isValidField("phone") && (
                        <span className="error-text">Requerido</span>
                      )}
                    </div>
                    <div
                      className={`neuro-input-wrapper premium-input ${getFieldStateClass("phone")}`}
                    >
                      <FaWhatsapp className="input-icon" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        inputMode="tel"
                        aria-invalid={hasAttemptedNext && !isValidField("phone")}
                        aria-describedby="phone-help"
                        placeholder="+54 9 11-2222-3333"
                      />
                      {isValidField("phone") && (
                        <FaCheckCircle className="valid-icon" />
                      )}
                    </div>
                    <p id="phone-help" className="field-helper">
                      Lo usamos para recordatorios, cambios y seguimiento rapido.
                    </p>
                  </div>
                </div>

                <div className="adult-mode-banner">
                  <div className="adult-mode-copy">
                    <span className="adult-mode-kicker">Quien reserva</span>
                    <strong>{isAdult ? "Estas reservando para vos" : "Estas reservando para un menor"}</strong>
                    <small>
                      {isAdult
                        ? "Mantenemos esta opcion siempre visible para que puedas cambiarla sin perderte."
                        : "Si el turno es para un menor, pedimos un adulto responsable para acompa�ar el contacto."}
                    </small>
                  </div>
                  <div className="neuro-toggle-animator adult-mode-toggle">
                    <div
                      className={`neuro-toggle-wrapper premium-input ${isAdult ? "active-box" : ""}`}
                      role="switch"
                      tabIndex={0}
                      aria-checked={isAdult}
                      aria-label="Indicar que el alumno es mayor de edad"
                      onClick={toggleAdultMode}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleAdultMode();
                        }
                      }}
                    >
                      <div className="toggle-text">
                        <span className="toggle-title">Soy alumno mayor de edad</span>
                        <span className="toggle-subtitle">No estoy reservando para un menor</span>
                      </div>
                      <div className={`neuro-toggle ${isAdult ? "active" : ""}`}></div>
                    </div>
                  </div>
                </div>

                <div className={`form-flex-adult ${isAdult ? "adult-self-mode" : ""}`}>
                  {!isAdult ? (
                    <div className="adult-field-container">
                      <div className="neuro-input-group">
                        <div className="label-row">
                          <label>
                            Adulto Responsable <span className="required">*</span>
                          </label>
                          {hasAttemptedNext &&
                            !isValidField("responsibleName") && (
                              <span className="error-text">Requerido</span>
                            )}
                        </div>
                        <div
                          className={`neuro-input-wrapper premium-input ${getFieldStateClass("responsibleName")}`}
                        >
                          <FaUserCheck className="input-icon" />
                          <input
                            type="text"
                            name="responsibleName"
                            value={formData.responsibleName}
                            onChange={handleChange}
                            aria-invalid={
                              hasAttemptedNext &&
                              !isValidField("responsibleName")
                            }
                            aria-describedby="responsibleName-help"
                            placeholder="Nombre del adulto responsable"
                          />
                          {isValidField("responsibleName") && (
                            <FaCheckCircle className="valid-icon" />
                          )}
                        </div>
                        <p id="responsibleName-help" className="field-helper">
                          Puede ser madre, padre, abuelo, abuela o quien acompane el proceso.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="adult-state-card" role="status" aria-live="polite">
                      <FaUserCheck />
                      <div>
                        <strong>Reserva directa</strong>
                        <span>No hace falta completar un adulto responsable.</span>
                      </div>
                    </div>
                  )}

                  <div className="adult-field-container">
                    <div className="neuro-input-group" style={{ marginTop: "0" }}>
                      <div className="label-row">
                        <label>
                          {isAdult ? "Email" : "Email de Contacto"} <span className="optional">(Opcional)</span>
                        </label>
                        {hasAttemptedNext &&
                          formData.email.trim() !== "" &&
                          !isValidField("email") && (
                            <span className="error-text">Inválido</span>
                          )}
                      </div>
                      <div
                        className={`neuro-input-wrapper premium-input ${getFieldStateClass("email", true)}`}
                      >
                        <FaEnvelope className="input-icon" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          aria-invalid={
                            hasAttemptedNext &&
                            formData.email.trim() !== "" &&
                            !isValidField("email")
                          }
                          aria-describedby="email-help"
                          placeholder="nombre@correo.com"
                        />
                        {formData.email.trim() !== "" && isValidField("email") && (
                          <FaCheckCircle className="valid-icon" />
                        )}
                      </div>
                      <p id="email-help" className="field-helper">
                        {isAdult
                          ? "Si lo completas, tambien te envio el codigo y el resumen por correo."
                          : "Si lo dejas, el adulto responsable tambien recibe respaldo por correo."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`progressive-disclosure-grid ${isPersonalInfoComplete ? "is-active" : ""}`}
              >
                <div className="progressive-inner">
                  <hr className="section-divider-soft" />
                  <h3 className="section-title" tabIndex={-1}>
                    <FaGraduationCap /> Perfil Académico
                  </h3>
                  <div className="form-grid-2">
                    <div className="neuro-input-group">
                      <div className="label-row">
                        <label>
                          Nivel Educativo <span className="required">*</span>
                        </label>
                        {hasAttemptedNext &&
                          !isValidField("educationLevel") && (
                            <span className="error-text">Requerido</span>
                          )}
                      </div>
                      <div
                        className={`neuro-input-wrapper premium-input ${getFieldStateClass("educationLevel")}`}
                      >
                        <FaLayerGroup className="input-icon" />
                        <select
                          name="educationLevel"
                          value={formData.educationLevel}
                          onChange={handleChange}
                          aria-invalid={
                            hasAttemptedNext && !isValidField("educationLevel")
                          }
                        >
                          <option value="">Elegi el nivel educativo</option>
                          <option value="Primaria">Primaria</option>
                          <option value="Secundaria">Secundaria</option>
                          <option value="Secundaria Técnica">
                            Secundaria Técnica
                          </option>
                          <option value="Terciario">Terciario / Superior</option>
                          <option value="Universitario">Universitario</option>
                        </select>
                        {isValidField("educationLevel") && (
                          <FaCheckCircle className="valid-icon select-valid" />
                        )}
                      </div>
                    </div>
                    <div className="neuro-input-group">
                      <div className="label-row">
                        <label>
                          Año / Grado <span className="required">*</span>
                        </label>
                        {hasAttemptedNext && !isValidField("yearGrade") && (
                          <span className="error-text">Requerido</span>
                        )}
                      </div>
                      <div
                        className={`neuro-input-wrapper premium-input ${getFieldStateClass("yearGrade")}`}
                      >
                        <FaSortNumericDown className="input-icon" />
                        <select
                          name="yearGrade"
                          value={formData.yearGrade}
                          onChange={handleChange}
                          disabled={!formData.educationLevel}
                          aria-invalid={
                            hasAttemptedNext && !isValidField("yearGrade")
                          }
                        >
                          {!formData.educationLevel && (
                            <option value="">Elegi el nivel primero</option>
                          )}
                          {formData.educationLevel && (
                            <option value="">Elegi curso, año o grado</option>
                          )}
                          {getYearGradeOptions().map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        {isValidField("yearGrade") && (
                          <FaCheckCircle className="valid-icon select-valid" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="form-grid-2">
                    <div className="neuro-input-group">
                      <div className="label-row">
                        <label>
                          Materia a Preparar <span className="required">*</span>
                        </label>
                        {hasAttemptedNext && !isValidField("subject") && (
                          <span className="error-text">Requerido</span>
                        )}
                      </div>
                      <div
                        className={`neuro-input-wrapper premium-input ${getFieldStateClass("subject")}`}
                      >
                        <FaBookOpen className="input-icon" />
                        <input
                          type="text"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          aria-invalid={
                            hasAttemptedNext && !isValidField("subject")
                          }
                          placeholder="Materia, tema o examen a preparar"
                        />
                        {isValidField("subject") && (
                          <FaCheckCircle className="valid-icon" />
                        )}
                      </div>
                    </div>
                    <div className="neuro-input-group">
                      <div className="label-row">
                        <label>
                          Institución / Colegio <span className="required">*</span>
                        </label>
                        {hasAttemptedNext && !isValidField("school") && (
                          <span className="error-text">Requerido</span>
                        )}
                      </div>
                      <div
                        className={`neuro-input-wrapper premium-input ${getFieldStateClass("school")}`}
                      >
                        <FaSchool className="input-icon" />
                        <input
                          type="text"
                          name="school"
                          value={formData.school}
                          onChange={handleChange}
                          aria-invalid={
                            hasAttemptedNext && !isValidField("school")
                          }
                          placeholder="Escuela, facultad o institucion"
                        />
                        {isValidField("school") && (
                          <FaCheckCircle className="valid-icon" />
                        )}
                      </div>
                    </div>
                  </div>
                  </div>
                </div>

              <div
                className={`progressive-disclosure-grid ${isAcademicInfoComplete ? "is-active" : ""}`}
              >
                <div className="progressive-inner">
                  <div
                    className="neuro-input-group"
                    style={{ marginTop: "1.5rem" }}
                  >
                    <div className="label-row">
                      <label>
                        Situación / Comentarios{" "}
                        <span className="optional">
                          (Opcional pero recomendado)
                        </span>
                      </label>
                    </div>
                    <div className="neuro-textarea-wrapper premium-input">
                      <FaLightbulb className="input-icon" />
                      <textarea
                        ref={textareaRef}
                        rows={1}
                        name="academicSituation"
                        value={formData.academicSituation}
                        onChange={handleChange}
                        placeholder={
                          !isAdult
                            ? "Ej: Necesita reforzar base, practicar ejercicios y llegar con mas seguridad al examen."
                            : "Ej: Quiero ordenar temas, practicar ejercicios y llegar mejor preparado al parcial."
                        }
                        lang="es"
                      />
                      {formData.academicSituation.trim().length > 0 && (
                        <FaCheckCircle className="valid-icon" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="step-actions right-align"
                style={{ marginTop: "2.5rem" }}
              >
                <button
                  type="button"
                  className={`btn-neuro-primary ${!canProceedToStep2 ? "btn-disabled" : "btn-ready"}`}
                  onClick={goToNext}
                >
                  Continuar <FaArrowRight />
                </button>
              </div>
            </div>

            {/* =======================================
                PASO 2: CALENDARIO
                ======================================= */}
            <div
              ref={(element) => {
                slideRefs.current[2] = element;
              }}
              className={`form-slide-panel ${currentStep === 2 ? "active-panel" : ""}`}
            >
              <div className="step-content-with-arrows">
                <div className="side-nav-group left">
                  <button
                    type="button"
                    className="side-nav-arrow"
                    onClick={goToPrev}
                  >
                    <FaChevronLeft />
                  </button>
                  <span className="side-nav-label">
                    Ir al paso
                    <br />
                    anterior
                  </span>
                </div>

                <div className="calendar-focus-container relative-interaction">
                  <h3 className="section-title center-text" tabIndex={-1}>
                    <FaCalendarAlt /> Elegí un Día
                  </h3>
                  <p className="step-empathy-note">
                    Si estas organizando a un menor, elegi un dia que tambien le
                    de margen para descansar y llegar tranquilo.
                  </p>

                  <div className="calendar-legend">
                    <div className="legend-item">
                      <span className="legend-icon disabled"></span> Ocupado
                    </div>
                    <div className="legend-item">
                      <span className="legend-icon today"></span> Hoy
                    </div>
                    <div className="legend-item">
                      <span className="legend-icon available"></span> Disponible
                    </div>
                    <div className="legend-item">
                      <span className="legend-icon selected"></span>{" "}
                      Seleccionado
                    </div>
                  </div>

                  <div
                    className={`minimal-chip-wrapper ${formData.timeSlot ? "visible" : ""}`}
                  >
                    <div className="minimal-chip">
                      <FaCalendarCheck className="chip-icon" />
                      <span>
                        {formData.timeSlot
                          ? format(
                              formData.timeSlot,
                              "EEEE d 'de' MMMM, yyyy",
                              { locale: es },
                            )
                          : ""}
                      </span>
                      <button
                        type="button"
                        className="btn-chip-clear"
                        onClick={clearDateSelection}
                        title="Desmarcar"
                      >
                        <FaTimes /> Desmarcar
                      </button>
                    </div>
                  </div>

                  <div className="selection-insight-panel">
                    <article className="selection-insight-card">
                      <span className="insight-label">Dia elegido</span>
                      <strong>
                        {selectedDayOnly
                          ? format(selectedDayOnly, "EEEE d 'de' MMMM", {
                              locale: es,
                            })
                          : "Todavia sin fecha"}
                      </strong>
                      <small>
                        {selectedDayOnly
                          ? "Si cambias el dia, los horarios se actualizan solos."
                          : "Primero elegi un dia y despues vemos los horarios libres."}
                      </small>
                    </article>

                    <article className="selection-insight-card">
                      <span className="insight-label">Horarios libres</span>
                      <strong>
                        {selectedDayOnly ? `${availableSlotCount} opciones` : "--"}
                      </strong>
                      <small>
                        {selectedDayOnly
                          ? availableSlotCount > 0
                            ? "Mostramos solo bloques disponibles para evitar cruces."
                            : "Ese dia ya no tiene espacios disponibles."
                          : "Los bloques libres aparecen cuando confirmas una fecha."}
                      </small>
                    </article>

                    <article className="selection-insight-card accent">
                      <span className="insight-label">Primer horario libre</span>
                      <strong>
                        {nextFreeSlot ? `${format(nextFreeSlot, "HH:mm")} hs` : "--"}
                      </strong>
                      <small>
                        {nextFreeSlot
                          ? "Ideal si queres resolver rapido sin revisar toda la grilla."
                          : "Cuando haya cupos te lo vamos a marcar aca."}
                      </small>
                    </article>
                  </div>

                  <div className="calendar-glass-box">
                    <DatePicker
                      selected={formData.timeSlot}
                      onChange={handleDateSelect}
                      minDate={new Date()}
                      inline
                      locale="es"
                      calendarClassName="neuro-calendar"
                      dayClassName={getDayClassName}
                    />
                  </div>
                </div>

                <div className="side-nav-group right">
                  <button
                    type="button"
                    className={`side-nav-arrow ${formData.timeSlot ? "ready" : "locked"}`}
                    onClick={() => {
                      if (!formData.timeSlot) {
                        showToast(
                          "Elegí una fecha en el calendario para descubrir los horarios libres. 📅",
                          "warning",
                        );
                      } else {
                        goToNext();
                      }
                    }}
                  >
                    <FaChevronRight />
                  </button>
                  <span className="side-nav-label">
                    Ir al paso
                    <br />
                    siguiente
                  </span>
                </div>
              </div>
            </div>

            {/* =======================================
                PASO 3: HORARIOS
                ======================================= */}
            <div
              ref={(element) => {
                slideRefs.current[3] = element;
              }}
              className={`form-slide-panel ${currentStep === 3 ? "active-panel" : ""}`}
            >
              <div className="step-content-with-arrows">
                <div className="side-nav-group left">
                  <button
                    type="button"
                    className="side-nav-arrow"
                    onClick={goToPrev}
                  >
                    <FaChevronLeft />
                  </button>
                  <span className="side-nav-label">
                    Ir al paso
                    <br />
                    anterior
                  </span>
                </div>

                <div className="calendar-focus-container relative-interaction">
                  <h3 className="section-title center-text" tabIndex={-1}>
                    <FaClock /> Turnos Disponibles
                  </h3>
                  <p className="step-empathy-note">
                    Cada boton es un horario posible. Los horarios ocupados se
                    muestran bloqueados para evitar confusiones.
                  </p>

                  <div className="calendar-legend">
                    <div className="legend-item">
                      <span className="legend-icon disabled"></span> Ocupado
                    </div>
                    <div className="legend-item">
                      <span className="legend-icon available"></span> Disponible
                    </div>
                    <div className="legend-item">
                      <span className="legend-icon selected"></span>{" "}
                      Seleccionado
                    </div>
                  </div>

                  <div
                    className={`minimal-chip-wrapper ${formData.timeSlot && formData.timeSlot.getHours() !== 0 ? "visible" : ""}`}
                  >
                    <div className="minimal-chip">
                      <FaClock className="chip-icon" />
                      <span>
                        {formData.timeSlot && formData.timeSlot.getHours() !== 0
                          ? format(formData.timeSlot, "HH:mm")
                          : ""}{" "}
                        hs
                      </span>
                      <button
                        type="button"
                        className="btn-chip-clear"
                        onClick={clearTimeSelection}
                        title="Desmarcar horario"
                      >
                        <FaTimes /> Desmarcar
                      </button>
                    </div>
                  </div>

                  <div className="selection-insight-panel slots-insight-panel">
                    <article className="selection-insight-card">
                      <span className="insight-label">Dia en foco</span>
                      <strong>
                        {selectedDayOnly
                          ? format(selectedDayOnly, "EEEE d 'de' MMMM", {
                              locale: es,
                            })
                          : "Sin fecha"}
                      </strong>
                      <small>
                        {selectedDayOnly
                          ? "Asi ordenas mejor tu semana antes de confirmar."
                          : "Volve al paso anterior para elegir la fecha."}
                      </small>
                    </article>

                    <article className="selection-insight-card">
                      <span className="insight-label">Disponibilidad real</span>
                      <strong>{availableSlotCount} bloques libres</strong>
                      <small>
                        {availableSlotCount > 0
                          ? "Los horarios bloqueados ya estan ocupados o pasaron."
                          : "No quedan bloques libres para este dia."}
                      </small>
                    </article>

                    <article className="selection-insight-card accent">
                      <span className="insight-label">Siguiente sugerencia</span>
                      <strong>
                        {nextFreeSlot ? `${format(nextFreeSlot, "HH:mm")} hs` : "--"}
                      </strong>
                      <small>
                        {nextFreeSlot
                          ? "Empezar por el primer hueco libre suele ser lo mas rapido."
                          : "Si este dia no sirve, podes volver y elegir otro."}
                      </small>
                    </article>
                  </div>

                  <div className="calendar-glass-box panoramic">
                    <div className="slots-container">
                      {availableSlots.length > 0 ? (
                        <div className="slot-sections">
                          {slotSections.map((section) => (
                            <section key={section.id} className="slot-section">
                              <div className="slot-section-header">
                                <div>
                                  <h4>{section.label}</h4>
                                  <p>{section.helper}</p>
                                </div>
                                <span>
                                  {
                                    section.slots.filter((slot) => !slot.isOccupied)
                                      .length
                                  }{" "}
                                  libres
                                </span>
                              </div>

                              <div className="slots-grid">
                                {section.slots.map((slot, index) => {
                                  const isSelected =
                                    formData.timeSlot?.getTime() ===
                                    slot.timeObj.getTime();
                                  const slotStateLabel = slot.isOccupied
                                    ? slot.status === "past"
                                      ? "No disponible"
                                      : "Ocupado"
                                    : isSelected
                                      ? "Elegido"
                                      : "Libre";

                                  return (
                                    <button
                                      key={`${section.id}-${index}`}
                                      type="button"
                                      disabled={slot.isOccupied}
                                      className={`slot-btn ${slot.isOccupied ? "disabled" : ""} ${isSelected ? "selected" : ""}`}
                                      onClick={() => handleTimeSelect(slot.timeObj)}
                                      aria-label={`${format(slot.timeObj, "HH:mm")} ${slotStateLabel}`}
                                    >
                                      <span className="slot-main-label">
                                        {format(slot.timeObj, "HH:mm")}
                                      </span>
                                      <span className="slot-sub-label">
                                        {slotStateLabel}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </section>
                          ))}
                        </div>
                      ) : (
                        <div className="no-slots-box">
                          <FaTimesCircle />
                          <p>Cargando agenda...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="side-nav-group right">
                  <button
                    type="button"
                    className={`side-nav-arrow ${formData.timeSlot && formData.timeSlot.getHours() !== 0 ? "ready" : "locked"}`}
                    onClick={() => {
                      if (
                        !formData.timeSlot ||
                        formData.timeSlot.getHours() === 0
                      ) {
                        showToast(
                          "Seleccioná el horario que mejor se adapte a vos para continuar. ⏰",
                          "warning",
                        );
                      } else {
                        goToNext();
                      }
                    }}
                  >
                    <FaChevronRight />
                  </button>
                  <span className="side-nav-label">
                    Ir al paso
                    <br />
                    siguiente
                  </span>
                </div>
              </div>
            </div>

            {/* =======================================
                PASO 4: CONFIRMACIÓN
                ======================================= */}
            <div
              ref={(element) => {
                slideRefs.current[4] = element;
              }}
              className={`form-slide-panel ${currentStep === 4 ? "active-panel" : ""}`}
            >
              <div className="calendar-focus-container">
                <h3 className="section-title center-text" tabIndex={-1}>
                  <FaCalendarCheck /> Confirmación Final
                </h3>
                <p className="step-empathy-note">
                  Revisa duracion, dia y horario. Si algo no coincide, volve al
                  paso anterior antes de confirmar.
                </p>

                <div className="duration-selector">
                  <label>Duración de la clase</label>
                  <div className="duration-option-grid" role="list" aria-label="Opciones de duración">
                    {durationOptions.map((duration) => {
                      const isSelected = Number(formData.duration) === duration;
                      return (
                        <button
                          key={duration}
                          type="button"
                          className={`duration-chip ${isSelected ? "selected" : ""}`}
                          onClick={() => handleDurationSelect(duration)}
                          aria-pressed={isSelected}
                        >
                          {formatDurationOptionLabel(duration)}
                        </button>
                      );
                    })}
                  </div>
                  <p className="duration-current-selection">
                    {formData.duration
                      ? `Elegiste ${formatDurationOptionLabel(formData.duration)} para este turno.`
                      : "Elegí cuánto tiempo querés reservar para continuar."}
                  </p>
                  <p className="duration-limit">
                    Límite disponible para este turno: {formatDurationOptionLabel(maxAllowedDuration)}
                  </p>
                </div>

                <BookingConfirmationSummary
                  dateLabel={confirmationDateLabel}
                  durationLabel={confirmationDurationLabel}
                  timeRangeLabel={confirmationTimeRangeLabel}
                  studentName={formData.studentName}
                  educationLevel={formData.educationLevel}
                  subject={formData.subject}
                />
              </div>

              <div
                className="step-actions space-between"
                style={{ marginTop: "2rem" }}
              >
                <button
                  type="button"
                  className="btn-neuro-secondary"
                  onClick={goToPrev}
                >
                  <FaArrowLeft /> Horario
                </button>
                <button
                  type="submit"
                  className={`btn-neuro-success ${formData.duration >= 0.5 ? "ready-to-pulse" : "btn-disabled"}`}
                  onClick={handleSubmit}
                  disabled={
                    loading || !formData.duration || formData.duration < 0.5
                  }
                >
                  {loading ? "Procesando..." : "Confirmar Reserva"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BookingSuccessModal
        show={showModal}
        successData={successData}
        whatsappConfirmText={whatsappConfirmText}
        onCopyCode={copyBookingCode}
        onClose={resetFormAfterSuccess}
      />
    </div>
  );
};

export default BookingForm;
