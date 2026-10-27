// SUDS Quito · utilidades de formato · © 2026 Paulina Lima.
export function fmt(n, decimals = 1) {
  if (n === null || n === undefined || !isFinite(n)) return "—";
  return Number(n).toLocaleString("es-EC", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Convierte un texto de input numérico a número positivo, o al valor por defecto. */
export function positive(value, fallback) {
  const n = parseFloat(String(value).replace(",", "."));
  return n > 0 && isFinite(n) ? n : fallback;
}

export function fmtHours(h) {
  if (!isFinite(h)) return "nunca (suelo impermeable)";
  if (h < 1) return `${fmt(h * 60, 0)} min`;
  if (h < 48) return `${fmt(h, h < 10 ? 1 : 0)} h`;
  return `${fmt(h / 24, 1)} días`;
}
