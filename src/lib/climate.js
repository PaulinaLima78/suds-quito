// ---------------------------------------------------------------------------
// SUDS Quito · Lluvia de diseño, interpolación espacial y climatología
// © 2026 Paulina Lima. Todos los derechos reservados.
// ---------------------------------------------------------------------------
import { MONTHS_LONG, PARTIAL_RECORD_STATIONS } from "../data/stations.js";
import { SCENARIOS } from "../data/catalogs.js";

export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ---------------------------------------------------------------------------
// IDW — Interpolación por distancia inversa (Inverse Distance Weighting).
// Adaptado de idwRainfall.js (script de R de Paulina Lima). Estima la lluvia
// de diseño en cualquier punto de Quito a partir de las k estaciones más
// cercanas, ponderando por 1/distancia^power.
// ---------------------------------------------------------------------------
export function idwRainfall(lat, lon, stations, field = "p90Duracion", k = 4, power = 2) {
  const valid = stations
    .filter((s) => s[field] !== null && s[field] !== undefined && !Number.isNaN(Number(s[field])))
    .map((s) => ({ ...s, distanceKm: haversineKm(lat, lon, s.lat, s.lon) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, k);

  if (valid.length === 0) return null;

  if (valid[0].distanceKm < 0.05) {
    return { value: Number(valid[0][field]), method: "nearest_station", stations: [valid[0]] };
  }

  let numerator = 0;
  let denominator = 0;
  valid.forEach((s) => {
    const w = 1 / Math.pow(s.distanceKm, power);
    numerator += w * Number(s[field]);
    denominator += w;
  });

  return {
    value: numerator / denominator,
    method: "idw",
    field,
    k,
    power,
    stations: valid.map((s) => ({
      id: s.id,
      name: s.name,
      distanceKm: s.distanceKm,
      value: Number(s[field]),
      weight: 1 / Math.pow(s.distanceKm, power) / denominator,
    })),
  };
}

const SCALAR_FIELDS = [
  "p90Duracion", "p95Extremos",
  "tr2_mm", "tr5_mm", "tr10_mm", "tr25_mm",
  "int_tr2", "int_tr5", "int_tr10", "int_tr25",
  "dryHours", "eventDurationH", "elevationM",
];

/** Distancia máxima (km) a la estación más cercana para considerar fiable la interpolación. */
export const MAX_IDW_DISTANCE_KM = 8;

/**
 * Construye una "estación virtual" en (lat, lon) interpolando por IDW todos
 * los parámetros de diseño. La climatología se interpola solo con estaciones
 * de registro completo. Las series de El Niño no se interpolan.
 */
export function virtualStation(lat, lon, stations, k = 4, power = 2) {
  const out = {
    id: "punto",
    name: "Punto elegido en el mapa",
    code: "IDW",
    lat,
    lon,
    virtual: true,
  };
  let weights = null;
  SCALAR_FIELDS.forEach((f) => {
    const r = idwRainfall(lat, lon, stations, f, k, power);
    out[f] = r ? r.value : null;
    if (f === "p90Duracion" && r) weights = r.stations;
  });
  out.dryHours = Math.round(out.dryHours);
  out.eventDurationH = Math.max(1, Math.round(out.eventDurationH));
  out.elevationM = Math.round(out.elevationM);

  const complete = stations.filter((s) => !PARTIAL_RECORD_STATIONS.includes(s.id));
  out.climatologia = Array.from({ length: 12 }, (_, m) =>
    round1(idwRainfall(lat, lon, complete.map((s) => ({ ...s, v: s.climatologia[m] })), "v", k, power).value)
  );
  out.hietograma = [0, 1].map((h) =>
    round1(idwRainfall(lat, lon, stations.map((s) => ({ ...s, v: s.hietograma[h] })), "v", k, power).value)
  );
  Object.assign(out, monthlyExtremes(out.climatologia));
  out.nino2023 = null;
  out.nino2024 = null;
  out.interpolation = { k, power, stations: weights || [] };
  out.nearestKm = weights && weights.length ? weights[0].distanceKm : 0;
  out.zona = `Interpolado de ${weights ? weights.length : 0} estaciones`;
  out.reliable = out.nearestKm <= MAX_IDW_DISTANCE_KM;
  return out;
}

function round1(x) {
  return Math.round(x * 10) / 10;
}

/** Mes más lluvioso y más seco a partir de 12 valores mensuales. */
export function monthlyExtremes(clim) {
  let wet = 0;
  let dry = 0;
  clim.forEach((v, i) => {
    if (v > clim[wet]) wet = i;
    if (v < clim[dry]) dry = i;
  });
  return {
    mesLluvioso: MONTHS_LONG[wet],
    lluvia_mes_lluvioso: clim[wet],
    mesSeco: MONTHS_LONG[dry],
    lluvia_mes_seco: clim[dry],
  };
}

/** Meses con valor 0.0 en una serie mensual (normalmente, mes sin registro). */
export function monthsMissing(series) {
  if (!series) return 12;
  return series.filter((v) => v === 0).length;
}

/** Lluvia de diseño (mm) para el escenario elegido, o el valor personalizado. */
export function designRain(station, scenario, customRain) {
  if (!station) return 0;
  const custom = parseFloat(customRain);
  if (scenario === "custom" && custom > 0) return custom;
  const sc = SCENARIOS.find((s) => s.id === scenario) || SCENARIOS[0];
  return Number(station[sc.field]) || 0;
}

export function scenarioLabel(scenario) {
  if (scenario === "custom") return "Personalizado";
  const sc = SCENARIOS.find((s) => s.id === scenario);
  return sc ? sc.label : scenario;
}
