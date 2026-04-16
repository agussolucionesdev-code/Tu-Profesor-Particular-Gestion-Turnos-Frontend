import { useCallback, useEffect, useRef } from "react";

export const useSmartScroll = ({ easing = "cubic-bezier(0.16, 1, 0.3, 1)", duration = 400, enableVoiceAnnouncement = false, voiceMessage = null } = {}) => {
  const scrollTimeoutRef = useRef(null);
  const lastIntentRef = useRef(null);
  const announcementQueueRef = useRef([]);

  const detectScrollIntent = useCallback((mouseEvent, scrollContainer) => {
    if (!mouseEvent || !scrollContainer) return null;
    const rect = scrollContainer.getBoundingClientRect();
    const mouseY = mouseEvent.clientY - rect.top;
    const intentZone = rect.height * 0.15;
    const intentThreshold = 0.7;
    let intent = null;
    let strength = 0;
    if (mouseY < intentZone) {
      strength = 1 - mouseY / intentZone;
      if (strength > intentThreshold) intent = "up";
    } else if (mouseY > rect.height - intentZone) {
      const distanceFromBottom = mouseY - (rect.height - intentZone);
      strength = distanceFromBottom / intentZone;
      if (strength > intentThreshold) intent = "down";
    }
    return intent && strength > intentThreshold ? { intent, strength } : null;
  }, []);

  const smoothScrollTo = useCallback((targetY, options = {}) => {
    const { offset = 0, focusElement = null, announceMessage = null, onComplete = null } = options;
    const scrollContainer = options.container || window;
    const startY = scrollContainer === window ? window.scrollY : scrollContainer.scrollTop;
    const targetPosition = targetY + offset;
    const distance = targetPosition - startY;
    if (distance === 0) {
      if (focusElement) focusElement.focus({ preventScroll: true });
      if (announceMessage && enableVoiceAnnouncement) { announcementQueueRef.current.push(announceMessage); processAnnouncements(); }
      onComplete?.();
      return;
    }
    const startTime = performance.now();
    const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);
      const currentPosition = startY + distance * easedProgress;
      if (scrollContainer === window) { window.scrollTo(0, currentPosition); } else { scrollContainer.scrollTop = currentPosition; }
      if (progress < 1) { requestAnimationFrame(animateScroll); } else {
        if (focusElement) setTimeout(() => { focusElement.focus({ preventScroll: true }); }, 50);
        if (announceMessage && enableVoiceAnnouncement) { announcementQueueRef.current.push(announceMessage); processAnnouncements(); }
        onComplete?.();
      }
    };
    requestAnimationFrame(animateScroll);
  }, [duration, enableVoiceAnnouncement]);

  const scrollToElement = useCallback((element, options = {}) => {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const targetY = rect.top + scrollTop;
    smoothScrollTo(targetY, { ...options, focusElement: element });
  }, [smoothScrollTo]);

  const scrollToSection = useCallback((sectionId, options = {}) => {
    const element = document.getElementById(sectionId);
    if (element) scrollToElement(element, options);
  }, [scrollToElement]);

  const processAnnouncements = useCallback(() => {
    if (!enableVoiceAnnouncement || !voiceMessage) return;
    const message = announcementQueueRef.current.shift();
    if (!message) return;
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.9; utterance.pitch = 1.05; utterance.lang = "es-AR";
      utterance.onend = () => { if (announcementQueueRef.current.length > 0) setTimeout(processAnnouncements, 300); };
      speechSynthesis.speak(utterance);
    }
  }, [enableVoiceAnnouncement, voiceMessage]);

  useEffect(() => { return () => { if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current); announcementQueueRef.current = []; }; }, []);

  return {
    smoothScrollTo, scrollToElement, scrollToSection, detectScrollIntent,
    announce: (message) => { if (enableVoiceAnnouncement && message) { announcementQueueRef.current.push(message); processAnnouncements(); } },
    cancelAnnouncements: () => { announcementQueueRef.current = []; if ("speechSynthesis" in window) speechSynthesis.cancel(); },
  };
};
export default useSmartScroll;
