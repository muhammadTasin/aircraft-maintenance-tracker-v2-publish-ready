export function normalizeEmail(value = '') {
  return value.trim().toLowerCase();
}

export function normalizeRegistration(value = '') {
  return value.trim().toUpperCase();
}

export function safeTrim(value, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }
  return value.trim();
}

export function parseOptionalDate(value, fieldLabel = 'Date') {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`${fieldLabel} is invalid.`);
  }

  return parsedDate;
}

export function parseRequiredDate(value, fieldLabel = 'Date') {
  const parsedDate = parseOptionalDate(value, fieldLabel);
  if (!parsedDate) {
    throw new Error(`${fieldLabel} is required.`);
  }
  return parsedDate;
}

export function parseOptionalNonNegativeNumber(value, fieldLabel = 'Value') {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw new Error(`${fieldLabel} must be a non-negative number.`);
  }

  return parsedValue;
}

export function parseNonNegativeNumberOrDefault(value, defaultValue, fieldLabel = 'Value') {
  if (value === '' || value === null || value === undefined) {
    return defaultValue;
  }

  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw new Error(`${fieldLabel} must be a non-negative number.`);
  }

  return parsedValue;
}

export function toBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return Boolean(value);
}
