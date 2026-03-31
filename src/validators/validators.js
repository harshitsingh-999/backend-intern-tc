export const isValidEmail = (email) => {
  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

export const toTrimmedString = (value) =>
  typeof value === "string" ? value.trim() : "";

export const normalizeOptionalString = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();
  return normalized ? normalized : null;
};

export const isPositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0;
};

export const parsePositiveInteger = (value) =>
  isPositiveInteger(value) ? Number(value) : null;

export const isValidDateInput = (value) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

export const toDateOnly = (value) => {
  if (!isValidDateInput(value)) return null;
  return new Date(value).toISOString().split("T")[0];
};

export const isDateOnOrAfter = (startDate, endDate) => {
  if (!isValidDateInput(startDate) || !isValidDateInput(endDate)) return false;

  return new Date(toDateOnly(endDate)) >= new Date(toDateOnly(startDate));
};

export const isNumberInRange = (value, min, max) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max;
};

export const isOneOf = (value, allowedValues = []) =>
  allowedValues.includes(value);

export const isValidYear = (value, { min = 2000, max = new Date().getFullYear() + 10 } = {}) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max;
};

export const parseBooleanFlag = (value) => {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value === 1 || value === "1") return 1;
  if (value === 0 || value === "0") return 0;

  const normalized = typeof value === "string" ? value.trim().toLowerCase() : value;
  if (["true", "yes", "active"].includes(normalized)) return 1;
  if (["false", "no", "inactive"].includes(normalized)) return 0;

  return null;
};

export const isValidPhone = (phone) => {
  if (!phone) return false;

  // Remove spaces, dashes
  const normalized = phone.toString().replace(/[\s-]/g, '');

  // Allow:
  // 10 digits
  // 91XXXXXXXXXX
  // +91XXXXXXXXXX
  const phoneRegex = /^(?:\+91|91)?[6-9][0-9]{9}$/;

  return phoneRegex.test(normalized);
};

export const isValidPassword = (password) => {
  return (
    /[a-z]/.test(password) &&   // small letter
    /[A-Z]/.test(password) &&   // capital letter
    /[0-9]/.test(password) &&   // number
    /[!@#$%^&*(),.?":{}|<>]/.test(password) && // special char
    password.length >= 8
  );
};


// export const isValidPassword = (password) => {
//   // Legacy minimum password rule used by the project.
//   return (
//     password.includes('a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w, x, y, z') &&
//     password.includes('A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z') &&
//     password.includes('0, 1, 2, 3, 4, 5, 6, 7, 8,9') &&
//     password.includes('')
//   );
// };
