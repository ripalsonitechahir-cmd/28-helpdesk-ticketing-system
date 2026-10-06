import { EMAIL_RE } from './constants';

// Each rule returns an error message or undefined. Mirrors the server-side zod schemas.
export const rules = {
  required: (label) => (v) => (String(v ?? '').trim() ? undefined : `${label} is required`),
  email: (v) => (EMAIL_RE.test(String(v ?? '').trim()) ? undefined : 'Enter a valid email'),
  maxLength: (label, n) => (v) => (String(v ?? '').length > n ? `${label} is too long` : undefined),
  positiveInt: (label) => (v) => (/^[1-9]\d*$/.test(String(v ?? '').trim()) ? undefined : `${label} must be a number`),
};

// validate({ field: [rule, ...] }) -> returns a function(values) => { field: message }
export const makeValidator = (spec) => (values) => {
  const errors = {};
  for (const [field, fieldRules] of Object.entries(spec)) {
    const message = fieldRules.map((rule) => rule(values[field])).find(Boolean);
    if (message) errors[field] = message;
  }
  return errors;
};
