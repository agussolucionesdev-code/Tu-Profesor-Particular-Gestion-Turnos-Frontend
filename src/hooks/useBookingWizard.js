import { useState, useCallback, useMemo, useEffect } from "react";
import { WIZARD_STEPS } from "../constants/bookingWizard";
import {
  ADULT_RELATIONSHIP_VALUE,
  RESPONSIBLE_RELATIONSHIP_OTHER_VALUE,
  sanitizePersonNameAr,
  sanitizeRelationshipOtherAr,
  formatPhoneMaskAr,
} from "../utils/bookingFormatters";

const INITIAL_FORM_DATA = {
  responsibleName: "",
  responsibleRelationship: "",
  responsibleRelationshipOther: "",
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
};

export const useBookingWizard = (showToast) => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isAdult, setIsAdult] = useState(false);
  const [hasAttemptedNext, setHasAttemptedNext] = useState(false);
  const [hasUnlockedAcademic, setHasUnlockedAcademic] = useState(false);
  const [hasUnlockedComments, setHasUnlockedComments] = useState(false);

  const regexName = /^[A-Za-zÀ-ÿ\u00f1\u00d1\s']{3,60}$/;
  const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const isValidField = useCallback(
    (field) => {
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
        case "responsibleRelationship":
          return isAdult
            ? true
            : formData.responsibleRelationship !== "";
        case "responsibleRelationshipOther":
          return formData.responsibleRelationship !== RESPONSIBLE_RELATIONSHIP_OTHER_VALUE
            ? true
            : regexName.test(formData.responsibleRelationshipOther.trim());
        case "email":
          // Email shows "is-valid" only when non-empty AND correctly formatted.
          // An empty email is acceptable (optional field) but not "valid" for visual purposes.
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
    },
    [formData, isAdult]
  );

  // Email is optional: empty is acceptable, filled-in must be valid format
  const isEmailAcceptable = useMemo(
    () => formData.email.trim() === "" || regexEmail.test(formData.email.trim()),
    [formData.email]
  );

  const isPersonalInfoComplete = useMemo(() => {
    return (
      isValidField("studentName") &&
      isValidField("phone") &&
      (isAdult
        ? true
        : isValidField("responsibleName") &&
          isValidField("responsibleRelationship") &&
          isValidField("responsibleRelationshipOther")) &&
      isEmailAcceptable
    );
  }, [isValidField, isAdult, isEmailAcceptable]);

  const isAcademicInfoComplete = useMemo(() => {
    return (
      isValidField("educationLevel") &&
      isValidField("yearGrade") &&
      isValidField("subject") &&
      isValidField("school")
    );
  }, [isValidField]);

  const canProceedToStep2 = useMemo(() => {
    return isPersonalInfoComplete && isAcademicInfoComplete;
  }, [isPersonalInfoComplete, isAcademicInfoComplete]);

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      let finalValue = value;

      if (name === "studentName" || name === "responsibleName") {
        finalValue = sanitizePersonNameAr(value);
      }
      if (name === "responsibleRelationshipOther") {
        finalValue = sanitizeRelationshipOtherAr(value);
      }
      if (name === "phone") finalValue = formatPhoneMaskAr(value);
      if (name === "email") finalValue = value.trimStart().toLowerCase();

      setFormData((prev) => {
        const newData = { ...prev, [name]: finalValue };
        if (name === "educationLevel") newData.yearGrade = "";
        if (
          name === "responsibleRelationship" &&
          value !== RESPONSIBLE_RELATIONSHIP_OTHER_VALUE
        ) {
          newData.responsibleRelationshipOther = "";
        }
        return newData;
      });
    },
    []
  );

  const toggleAdultMode = useCallback(() => {
    const adultModeLocked =
      !isAdult &&
      [
        formData.responsibleName,
        formData.responsibleRelationship,
        formData.responsibleRelationshipOther,
      ].some((value) => String(value ?? "").trim().length > 0);

    if (adultModeLocked) {
      showToast?.(
        "Para pasar a alumno mayor de edad, primero limpia los datos del adulto responsable.",
        "info",
        {
          title: "Opción momentáneamente bloqueada",
          speak:
            "Si querés pasar a alumno mayor de edad, primero quitá los datos del adulto responsable que ya cargaste.",
        }
      );
      return;
    }

    setIsAdult((current) => {
      const next = !current;
      if (next) {
        setFormData((prev) => ({
          ...prev,
          responsibleName: "",
          responsibleRelationship: "",
          responsibleRelationshipOther: "",
        }));
      }
      return next;
    });
  }, [isAdult, formData, showToast]);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setIsAdult(false);
    setHasAttemptedNext(false);
    setHasUnlockedAcademic(false);
    setHasUnlockedComments(false);
  }, []);

  const getFieldStateClass = useCallback(
    (field, isOptional = false) => {
      if (isValidField(field)) return "is-valid";
      if (isOptional && formData[field]?.trim() === "") return "";
      const value = String(formData[field] ?? "").trim();
      const hasStartedTyping =
        field === "phone"
          ? formData.phone.replace(/\D/g, "").length >= 4
          : value.length > 0;
      return hasAttemptedNext || hasStartedTyping ? "error" : "";
    },
    [isValidField, formData, hasAttemptedNext]
  );

  const stepProgress = useMemo(() => {
    // Step progress is driven by the parent component's currentStep.
    // This is a helper for external consumers that manage their own currentStep.
    return 0;
  }, []);

  const requiredChecks = useMemo(() => {
    return [
      isValidField("studentName"),
      isValidField("phone"),
      isAdult ? true : isValidField("responsibleName"),
      isAdult ? true : isValidField("responsibleRelationship"),
      isValidField("educationLevel"),
      isValidField("yearGrade"),
      isValidField("subject"),
      isValidField("school"),
    ];
  }, [isValidField, isAdult]);

  const completionPercent = useMemo(() => {
    const completed = requiredChecks.filter(Boolean).length;
    return Math.round((completed / requiredChecks.length) * 100);
  }, [requiredChecks]);

  // Track unlock transitions so callers can react (e.g. play sounds)
  useEffect(() => {
    if (isPersonalInfoComplete && !hasUnlockedAcademic) {
      setHasUnlockedAcademic(true);
    } else if (!isPersonalInfoComplete && hasUnlockedAcademic) {
      setHasUnlockedAcademic(false);
    }
  }, [isPersonalInfoComplete, hasUnlockedAcademic]);

  useEffect(() => {
    if (isAcademicInfoComplete && !hasUnlockedComments) {
      setHasUnlockedComments(true);
    } else if (!isAcademicInfoComplete && hasUnlockedComments) {
      setHasUnlockedComments(false);
    }
  }, [isAcademicInfoComplete, hasUnlockedComments]);

  return {
    // Form state
    formData,
    setFormData,
    isAdult,
    setIsAdult,
    hasAttemptedNext,
    setHasAttemptedNext,
    hasUnlockedAcademic,
    hasUnlockedComments,

    // Validation
    isValidField,
    isEmailAcceptable,
    isPersonalInfoComplete,
    isAcademicInfoComplete,
    canProceedToStep2,

    // Handlers
    handleChange,
    toggleAdultMode,
    resetForm,
    getFieldStateClass,

    // UI helpers
    completionPercent,
    requiredChecks,
    WIZARD_STEPS,
  };
};
