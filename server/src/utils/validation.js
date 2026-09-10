export function requireFields(body, fields) {
  const missing = fields.filter(field => body[field] === undefined || body[field] === null || body[field] === '');
  return missing;
}

export const isEmail = value => /^\S+@\S+\.\S+$/.test(String(value || ''));
export const isCoordinate = value => Number.isFinite(Number(value));
