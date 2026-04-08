export const formatCurrencyARS = (value) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const normalizeText = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export const toSafeDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const isSameCalendarDay = (first, second) =>
  !!first &&
  !!second &&
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

export const formatDayLabel = (value) =>
  value.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit" });

export const formatLongDateLabel = (value) =>
  value.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

export const formatShortDateLabel = (value) =>
  value.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });

export const formatTimeLabel = (value) =>
  value.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

export const formatDurationOptionLabel = (duration) => {
  const totalMinutes = Math.round(Number(duration) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours} h ${minutes} min`;
  }

  if (hours > 0) {
    return `${hours} h`;
  }

  return `${minutes} min`;
};

export const formatPhoneMaskAr = (value) => {
  let digits = String(value ?? "").replace(/\D/g, "");

  if (digits.startsWith("549")) digits = digits.substring(3);
  else if (digits.startsWith("54")) digits = digits.substring(2);
  else if (digits.startsWith("9")) digits = digits.substring(1);

  if (digits.startsWith("0")) digits = digits.substring(1);

  digits = digits.substring(0, 10);

  if (!digits.length) return "";

  let result = "+54 9 ";
  if (digits.length > 0) result += digits.substring(0, 2);
  if (digits.length >= 3) result += `-${digits.substring(2, 6)}`;
  if (digits.length >= 7) result += `-${digits.substring(6, 10)}`;
  return result;
};

export const sanitizePersonNameAr = (value) =>
  String(value ?? "")
    .replace(/[^a-zA-ZÀ-ÿñÑ\s']/g, "")
    .replace(/\s{2,}/g, " ")
    .trimStart();

export const formatDniMaskAr = (value) => {
  const digits = String(value ?? "")
    .replace(/\D/g, "")
    .substring(0, 8);

  if (!digits) return "";

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const formatCuitMaskAr = (value) => {
  const digits = String(value ?? "")
    .replace(/\D/g, "")
    .substring(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 10) return `${digits.substring(0, 2)}-${digits.substring(2)}`;
  return `${digits.substring(0, 2)}-${digits.substring(2, 10)}-${digits.substring(10)}`;
};

export const getBookingApiMessage = (error, apiBaseUrl = "http://localhost:4100") => {
  if (!error?.response) {
    return `No pude conectar con el servidor de turnos. Verifica que el backend este corriendo en ${apiBaseUrl}.`;
  }

  return error.response?.data?.message || "No se pudo procesar la solicitud.";
};

export const getResponsibleDisplay = (booking) => {
  const student = normalizeText(booking.studentName);
  const responsible = normalizeText(booking.responsibleName);

  if (!booking.responsibleName || student === responsible) {
    return "Alumno mayor de edad";
  }

  return booking.responsibleName;
};

export const buildStudentKey = (booking) =>
  [
    normalizeText(booking.studentName),
    String(booking.phone ?? "").replace(/\D/g, ""),
    normalizeText(booking.responsibleName),
  ].join("|");
