// ---------------------------------------------------------------------------
// SUDS Quito · Estado compartible en la URL
// Permite copiar un enlace que reabre la app con los mismos datos.
// © 2026 Paulina Lima. Todos los derechos reservados.
// ---------------------------------------------------------------------------

// clave en el estado → parámetro corto en la URL
const KEYS = {
  stationId: "e",
  lat: "lat",
  lon: "lon",
  scenario: "esc",
  customRain: "mm",
  area: "a",
  surfaceId: "sup",
  sudsId: "suds",
  userLevel: "nivel",
  runoffMethod: "met",
  soilId: "suelo",
  soilK: "k",
  pavementArea: "ap",
  trenchWidth: "zw",
  trenchDepth: "zd",
  chamberLength: "dl",
  chamberWidth: "dw",
  chamberDepth: "dd",
  projectName: "proy",
  normImpFinal: "nif",
  normImpInitial: "nii",
  normCoverFinal: "ncf",
  normCoverInitial: "nci",
  normImpType: "nit",
  normOcupacion: "noc",
  normIdf: "nidf",
  normDuration: "ndur",
  normTret: "nret",
  normHeight: "nh",
  normPisos: "npis",
  normAreaUtil: "nau",
};

export function readUrlState(search = typeof window !== "undefined" ? window.location.search : "") {
  const params = new URLSearchParams(search);
  const out = {};
  Object.entries(KEYS).forEach(([key, p]) => {
    if (params.has(p)) out[key] = params.get(p);
  });
  return out;
}

export function buildQuery(state, defaults = {}) {
  const params = new URLSearchParams();
  Object.entries(KEYS).forEach(([key, p]) => {
    const v = state[key];
    if (v === undefined || v === null || v === "") return;
    if (defaults[key] !== undefined && String(defaults[key]) === String(v)) return;
    params.set(p, String(v));
  });
  const q = params.toString();
  return q ? `?${q}` : "";
}

export function writeUrlState(state, defaults) {
  if (typeof window === "undefined") return;
  const url = window.location.pathname + buildQuery(state, defaults) + window.location.hash;
  try {
    window.history.replaceState(null, "", url);
  } catch {
    /* algunos entornos (vista previa) no permiten cambiar la URL */
  }
}
