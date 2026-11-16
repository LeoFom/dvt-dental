export function normalizePhone(value) {
  if (typeof value !== 'string' || value.length > 40) return null;
  const compact = value.trim().replace(/[\s().-]/g, '');
  if (/^0\d{9}$/.test(compact)) return `+38${compact}`;
  if (/^380\d{9}$/.test(compact)) return `+${compact}`;
  if (compact.startsWith('+380')) return /^\+380\d{9}$/.test(compact) ? compact : null;
  return /^\+[1-9]\d{7,14}$/.test(compact) ? compact : null;
}
