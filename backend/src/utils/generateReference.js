export function generateReference(prefix) {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, '')
    .slice(2, 14);
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();

  return `${prefix}-${timestamp}-${random}`;
}
