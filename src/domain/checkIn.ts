import {
  EXPECTED_BOOKING,
  MISMATCH_ERROR,
  REQUIRED_ERRORS,
  STEP_FIELDS,
} from "../consts";
import type { CheckInData, CheckInErrors, CheckInStep } from "./types";

export type { CheckInData, CheckInErrors, CheckInStep } from "./types";

function normalizeName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleUpperCase("ru-RU")
    .replace(/Ё/g, "Е");
}

function normalizeField(field: keyof CheckInData, value: string): string {
  if (field === "lastName" || field === "firstName" || field === "middleName") {
    return normalizeName(value);
  }
  if (field === "flightNumber") return value.replace(/\s/g, "").toUpperCase();
  if (field === "bookingCode") return value.trim().toUpperCase();
  return value.trim();
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined)
    return false;
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  const daysInMonth = monthDays[month - 1];
  return daysInMonth !== undefined && day <= daysInMonth;
}

function validateField(
  field: keyof CheckInData,
  value: string,
): string | undefined {
  if (!value.trim()) return REQUIRED_ERRORS[field];
  const normalized = normalizeField(field, value);

  if (field === "lastName" || field === "firstName" || field === "middleName") {
    if (!/^[\p{L}]+(?:[ '-][\p{L}]+)*$/u.test(normalized)) {
      return "Используйте буквы, как в квитанции";
    }
  } else if (field === "birthDate" || field === "departureDate") {
    if (!isCalendarDate(normalized)) return "Укажите корректную дату";
  } else if (field === "flightNumber") {
    if (!/^[A-ZА-ЯЁ]{2,3}\d{3,4}$/.test(normalized))
      return "Формат номера рейса: AVA 303";
  } else if (field === "bookingCode") {
    if (!/^[A-Z0-9]{6}$/.test(normalized))
      return "Код брони: 6 латинских букв или цифр без пробелов";
  } else if (!/^\d{4}$/.test(normalized)) {
    return "Введите ровно 4 цифры";
  }

  const matchesFirstNameAlias =
    field === "firstName" &&
    normalized === normalizeName(EXPECTED_BOOKING.shortName);
  if (
    normalized !== normalizeField(field, EXPECTED_BOOKING[field]) &&
    !matchesFirstNameAlias
  )
    return MISMATCH_ERROR;
  return undefined;
}

/** Validate only the fields belonging to the current check-in block. */
export function validateStep(
  step: CheckInStep,
  data: CheckInData,
): CheckInErrors {
  const errors: CheckInErrors = {};
  for (const field of STEP_FIELDS[step]) {
    const error = validateField(field, data[field]);
    if (error) errors[field] = error;
  }
  return errors;
}

/** Completion requires every field to match the one configured booking. */
export function matchesBooking(data: CheckInData): boolean {
  return (Object.keys(STEP_FIELDS) as CheckInStep[]).every(
    (step) => Object.keys(validateStep(step, data)).length === 0,
  );
}
