import { useCallback, useEffect, useRef, useState } from "react";

const VOICE_STORAGE_KEY = "muted_alerts";
const VOICE_READY_EVENT = "neuro-voice-ready";
const VOICE_MUTED_EVENT = "neuro-voice-muted-changed";

const DEFAULT_TOAST_STATE = {
  show: false,
  type: "info",
  title: "",
  message: "",
  detail: "",
};

const DEFAULT_VOICE_BY_TYPE = {
  success: "Listo, quedó todo en orden. Podés respirar tranquilo: el paso importante ya está resuelto.",
  error: "Algo no pudo completarse ahora. Lo revisamos con calma; no tenés que empezar de cero.",
  warning: "Pausa breve. Hay un detalle para mirar antes de avanzar, así cuidamos que la reserva quede bien.",
  info: "Te acompaño con una guía breve, clara y sin apuro para que avances con seguridad.",
};

const FRIENDLY_TECHNICAL_MESSAGE =
  "No pudimos conectar con el sistema. Revisá tu conexión e intentá otra vez; tus datos siguen acá.";

const TECHNICAL_MESSAGE_PATTERN =
  /(localhost|127\.0\.0\.1|0\.0\.0\.0|ECONN|ENOTFOUND|ETIMEDOUT|Network Error|Failed to fetch|ERR_|http:\/\/|https:\/\/)/i;

let pendingSpeech = null;
let voicePrimed = false;
let unlockListenersBound = false;
let voicesChangedBound = false;
let unlockHandler = null;

const getSpeechApi = () => {
  if (typeof window === "undefined") return null;
  if (!("speechSynthesis" in window)) return null;
  return window.speechSynthesis;
};

const dispatchVoiceEvent = (eventName, detail = {}) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
};

const resolvePreferredVoice = (speechApi) => {
  const voices = speechApi?.getVoices?.() || [];

  return (
    voices.find((voice) => /es[-_]AR/i.test(voice.lang)) ||
    voices.find((voice) => /^es/i.test(voice.lang)) ||
    voices[0] ||
    null
  );
};

const speakNow = (text, options = {}) => {
  const speechApi = getSpeechApi();
  if (!speechApi) return false;

  const message = String(text ?? "").trim();
  if (!message) return false;

  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = options.lang || "es-AR";
  utterance.rate = options.rate ?? 0.9;
  utterance.pitch = options.pitch ?? 1.04;
  utterance.volume = options.volume ?? 1;

  const preferredVoice = resolvePreferredVoice(speechApi);
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  speechApi.cancel();
  speechApi.speak(utterance);
  return true;
};

const removeUnlockListeners = () => {
  if (typeof window === "undefined" || !unlockHandler) return;

  window.removeEventListener("pointerdown", unlockHandler, true);
  window.removeEventListener("keydown", unlockHandler, true);
  window.removeEventListener("touchstart", unlockHandler, true);
  unlockHandler = null;
  unlockListenersBound = false;
};

const flushPendingSpeech = () => {
  if (!voicePrimed || !pendingSpeech || isVoiceMuted()) return false;

  const { message, options } = pendingSpeech;
  pendingSpeech = null;
  return speakNow(message, options);
};

export const spellCodeForVoice = (code) =>
  String(code ?? "")
    .trim()
    .split("")
    .join(" ")
    .trim();

export const isVoiceMuted = () => {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(VOICE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

export const setVoiceMuted = (muted) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(VOICE_STORAGE_KEY, muted ? "true" : "false");
  } catch {
    // Ignore storage errors silently.
  }

  if (muted) {
    pendingSpeech = null;
    getSpeechApi()?.cancel();
  } else {
    bootNeuroVoice();
  }

  dispatchVoiceEvent(VOICE_MUTED_EVENT, { muted });
};

const sanitizeVisualMessage = (message, fallback) => {
  const raw = String(message ?? "").trim();

  if (!raw) return fallback;

  const looksUnsafe =
    raw.includes("<!DOCTYPE") ||
    raw.includes("<html") ||
    raw.includes("object Object") ||
    raw.includes("function");

  if (looksUnsafe || TECHNICAL_MESSAGE_PATTERN.test(raw)) {
    if (TECHNICAL_MESSAGE_PATTERN.test(raw)) {
      return FRIENDLY_TECHNICAL_MESSAGE;
    }

    return fallback;
  }

  return raw.replace(/\s+/g, " ").trim();
};

export const sanitizeForVoice = (message, fallbackVoice) => {
  const raw = String(message ?? "").trim();

  if (!raw) return fallbackVoice;

  const looksUnsafe =
    raw.includes("<!DOCTYPE") ||
    raw.includes("<html") ||
    raw.includes("object Object") ||
    raw.includes("function");

  if (looksUnsafe || raw.length > 320 || TECHNICAL_MESSAGE_PATTERN.test(raw)) {
    if (TECHNICAL_MESSAGE_PATTERN.test(raw)) {
      return FRIENDLY_TECHNICAL_MESSAGE;
    }

    return fallbackVoice;
  }

  const cleaned = raw
    .replace(/<[^>]*>/g, " ")
    .replace(/\$\s?([\d.,]+)\s?ARS/gi, "$1 pesos")
    .replace(/\$\s?([\d.,]+)/g, "$1 pesos")
    .replace(/\bARS\b/gi, "pesos")
    .replace(/\bhs\b/gi, "horas")
    .replace(/\bemail\b/gi, "correo")
    .replace(/\bwhatsapp\b/gi, "número de teléfono")
    .replace(/\btelefono\b/gi, "teléfono")
    .replace(/\bcodigo\b/gi, "código")
    .replace(/\bduracion\b/gi, "duración")
    .replace(/\bdia\b/gi, "día")
    .replace(/\bgestion\b/gi, "gestión")
    .replace(/\bmis turnos\b/gi, "Mis Turnos")
    .replace(/\b[A-Z0-9]{6,12}\b/g, (match) => spellCodeForVoice(match))
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || cleaned.length > 320) {
    return fallbackVoice;
  }

  return cleaned;
};

export const primeVoicePlayback = (options = {}) => {
  const speechApi = getSpeechApi();
  if (!speechApi || isVoiceMuted()) return false;

  if (voicePrimed && !options.message) {
    return true;
  }

  const primeUtterance = new SpeechSynthesisUtterance(".");
  primeUtterance.lang = options.lang || "es-AR";
  primeUtterance.volume = 0.01;
  primeUtterance.rate = 1;
  primeUtterance.pitch = 1;

  const preferredVoice = resolvePreferredVoice(speechApi);
  if (preferredVoice) {
    primeUtterance.voice = preferredVoice;
  }

  try {
    speechApi.cancel();
    speechApi.speak(primeUtterance);
    voicePrimed = true;
    removeUnlockListeners();
    dispatchVoiceEvent(VOICE_READY_EVENT, { primed: true });

    window.setTimeout(() => {
      speechApi.cancel();

      if (options.message) {
        speakNow(options.message, options.voiceOptions || {});
        return;
      }

      flushPendingSpeech();
    }, 45);

    return true;
  } catch {
    return false;
  }
};

const bindUnlockListeners = () => {
  if (typeof window === "undefined" || unlockListenersBound || isVoiceMuted()) {
    return;
  }

  unlockHandler = () => {
    primeVoicePlayback();
  };

  window.addEventListener("pointerdown", unlockHandler, true);
  window.addEventListener("keydown", unlockHandler, true);
  window.addEventListener("touchstart", unlockHandler, true);
  unlockListenersBound = true;
};

export const bootNeuroVoice = () => {
  const speechApi = getSpeechApi();
  if (!speechApi) return false;

  speechApi.getVoices?.();

  if (!voicesChangedBound && speechApi.addEventListener) {
    speechApi.addEventListener("voiceschanged", () => {
      speechApi.getVoices?.();
      flushPendingSpeech();
    });
    voicesChangedBound = true;
  }

  bindUnlockListeners();
  return true;
};

export const speakAlert = (message, options = {}) => {
  if (typeof window === "undefined") return false;
  if (options.enabled === false) return false;
  if (isVoiceMuted()) return false;

  const speechApi = getSpeechApi();
  if (!speechApi) return false;

  const text = String(message ?? "").trim();
  if (!text) return false;

  if (!voicePrimed) {
    pendingSpeech = { message: text, options };
    bootNeuroVoice();
    return false;
  }

  return speakNow(text, options);
};

export const buildNeuroToastPayload = (
  message,
  type = "info",
  options = {},
) => {
  const safeType = DEFAULT_VOICE_BY_TYPE[type] ? type : "info";
  const fallbackVoice = DEFAULT_VOICE_BY_TYPE[safeType];
  const visualFallback =
    safeType === "error"
      ? "Hubo un problema al comunicarnos con el sistema."
      : fallbackVoice;

  const visualMessage = sanitizeVisualMessage(message, visualFallback);
  const detail = String(options.detail ?? "").trim();
  const voiceSource = options.speak || detail || visualMessage;

  return {
    show: true,
    type: safeType,
    title: String(options.title ?? "").trim(),
    message: visualMessage,
    detail,
    duration: options.duration ?? 4500,
    voiceMessage: sanitizeForVoice(voiceSource, fallbackVoice),
    voiceOptions: options.voiceOptions || {},
    voiceEnabled: options.voice !== false,
  };
};

export const useNeuroToast = (config = {}) => {
  const [toast, setToast] = useState(DEFAULT_TOAST_STATE);
  const timeoutRef = useRef(null);

  const dismissToast = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setToast(DEFAULT_TOAST_STATE);
  }, []);

  const showToast = useCallback(
    (message, type = "info", options = {}) => {
      const payload = buildNeuroToastPayload(message, type, {
        duration: config.duration ?? 4500,
        ...options,
      });

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      setToast({
        show: true,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        detail: payload.detail,
      });

      if (payload.voiceEnabled) {
        speakAlert(payload.voiceMessage, payload.voiceOptions);
      }

      timeoutRef.current = window.setTimeout(() => {
        setToast(DEFAULT_TOAST_STATE);
        timeoutRef.current = null;
      }, payload.duration);
    },
    [config.duration],
  );

  useEffect(() => {
    bootNeuroVoice();
    return dismissToast;
  }, [dismissToast]);

  return {
    toast,
    showToast,
    dismissToast,
    setToast,
  };
};
