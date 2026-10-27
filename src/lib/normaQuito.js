// ---------------------------------------------------------------------------
// SUDS Quito · Tanque de retención según el estándar municipal de agua lluvia
// (apéndice del PUGS-DMQ). © 2026 Paulina Lima. Todos los derechos reservados.
//
//   V  = (Cu − Co) · I · A / 6 · T_RET          [m³; I mm/h, A ha, T_RET min]
//   C  = (A1·C1 + A2·C2) / (A1 + A2)            coeficiente ponderado
//   Qv = Cd · A_tubo · √(2 g H) ;  T = 2 V / Qv  vaciado por orificio
// ---------------------------------------------------------------------------
import {
  TABLA1, TABLA1_MAX_AREA, MIN_VOLUME, IDF_STATIONS, IDF_LIMITS, MIN_DURATION,
  C_IMPERMEABLE, C_PERMEABLE, DEAD_HEIGHT, FREEBOARD, CD, G, DIAMETROS, REUSO, OCUPACIONES,
} from "../data/normaQuito.js";
import { haversineKm } from "./climate.js";
import { calcBudget } from "./budget.js";
import { UNIT_PRICES as P } from "../data/prices.js";

/** Intensidad (mm/h) de la ecuación IDF EMAAP-Q de una estación. */
export function idfIntensity(st, tr, tMin) {
  return (st.a * tr ** st.b * Math.log(tMin + 3) ** st.c * Math.log(tr) ** st.d) / tMin ** st.e;
}

/** Estación IDF más cercana a un punto, por distancia geodésica. */
export function nearestIdfStation(lat, lon) {
  return IDF_STATIONS.map((s) => ({ ...s, distanceKm: haversineKm(lat, lon, s.lat, s.lon) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0];
}

/**
 * Ecuación IDF sugerida según las recomendaciones del estándar:
 * sur de Quito → Izobamba; parroquias nororientales y valles → La Tola;
 * norte del antiguo aeropuerto → DAC-Aeropuerto; centro → Quito-Observatorio.
 * Fuera de esas zonas, la más cercana. El proyectista justifica la elección.
 */
export function suggestIdfStation(lat, lon) {
  const id = (sid) => IDF_STATIONS.find((s) => s.id === sid);
  if (lat < -0.25) return id("izobamba");
  if (lon > -78.45) return id("la_tola");
  if (lat > -0.13) return id("aeropuerto");
  if (lat <= -0.17) return id("observatorio");
  return nearestIdfStation(lat, lon);
}

/** Coeficiente de escorrentía ponderado por áreas. */
export function weightedC(areaPerm, cPerm, areaImp, cImp) {
  const total = areaPerm + areaImp;
  return total > 0 ? (areaPerm * cPerm + areaImp * cImp) / total : 0;
}

/** Volumen mínimo de la Tabla 1 (null si el lote supera 2500 m²). */
export function tabla1Volume(areaM2) {
  if (areaM2 > TABLA1_MAX_AREA) return null;
  return TABLA1.find((r) => areaM2 <= r.max).vol;
}

/** V útil (m³) = (Cu − Co)·I·A/6·T_RET, con A en ha. */
export function retentionVolume(cu, co, intensity, areaM2, tretMin) {
  return Math.max(cu - co, 0) * intensity * (areaM2 / 10000) / 6 * tretMin;
}

export function diametersFor(volM3) {
  return DIAMETROS.find((d) => volM3 <= d.vol + 1e-9) || null;
}

/** Caudal (m³/s) y tiempo (min) de vaciado por un orificio de diámetro dMm con carga H. */
export function emptying(volM3, dMm, headM) {
  const area = Math.PI * (dMm / 1000) ** 2 / 4;
  const qv = CD * area * Math.sqrt(2 * G * headM);
  return { qv, minutes: qv > 0 ? (2 * volM3) / qv / 60 : Infinity };
}

/**
 * Dimensionamiento completo del tanque de retención normativo.
 * @param {object} i
 *  area        área de aporte del lote (m²)
 *  impFinal    área impermeable con proyecto (m²)
 *  impInitial  área impermeable en condición inicial (m²)
 *  coverFinal / coverInitial   id de cobertura permeable (Tabla 4)
 *  imperviousType  id de C_IMPERMEABLE
 *  ocupacion   id de OCUPACIONES (define TR)
 *  idfId       id de estación IDF
 *  duration    duración de la lluvia (min, ≥ 30)
 *  tret        tiempo de retención (min)
 *  usefulHeight altura útil del agua (m)
 *  pisos, areaUtil  para verificar reúso obligatorio
 */
export function sizeNormTank(i) {
  const occ = OCUPACIONES.find((o) => o.id === i.ocupacion) || OCUPACIONES[0];
  const tr = occ.tr;
  const key = tr >= 10 ? "c10" : "c5";
  const imp = C_IMPERMEABLE.find((c) => c.id === i.imperviousType) || C_IMPERMEABLE[0];
  const covF = C_PERMEABLE.find((c) => c.id === i.coverFinal) || C_PERMEABLE[0];
  const covI = C_PERMEABLE.find((c) => c.id === i.coverInitial) || covF;
  const station = IDF_STATIONS.find((s) => s.id === i.idfId) || IDF_STATIONS[0];

  const area = i.area;
  const impFinal = Math.min(Math.max(i.impFinal, 0), area);
  const impInitial = Math.min(Math.max(i.impInitial, 0), area);
  const cu = weightedC(area - impFinal, covF[key], impFinal, imp[key]);
  const co = weightedC(area - impInitial, covI[key], impInitial, imp[key]);

  const warnings = [];
  let duration = i.duration;
  if (duration < MIN_DURATION) {
    warnings.push(`La duración de la lluvia de diseño no puede ser menor a ${MIN_DURATION} min; se usó ${MIN_DURATION} min.`);
    duration = MIN_DURATION;
  }
  if (duration > IDF_LIMITS.tMax) warnings.push(`Las ecuaciones IDF solo son válidas hasta ${IDF_LIMITS.tMax} min.`);
  const intensity = idfIntensity(station, tr, duration);
  const tret = i.tret > 0 ? i.tret : duration;

  const vCalc = retentionVolume(cu, co, intensity, area, tret);
  const vTable = tabla1Volume(area);
  const bigLot = vTable === null;
  const vDesign = Math.max(vCalc, vTable ?? 0, MIN_VOLUME);
  if (bigLot) {
    warnings.push(`Lote mayor a ${TABLA1_MAX_AREA} m²: el estándar exige memoria de cálculo del volumen y del diámetro de conexión, con tiempo de retención mayor a 30 min.`);
    if (tret <= 30) warnings.push("Para lotes mayores a 2500 m² el tiempo de retención debe ser mayor a 30 min.");
  }

  const h = i.usefulHeight > 0 ? i.usefulHeight : 1;
  const planArea = vDesign / h;
  const side = Math.sqrt(planArea);
  const totalHeight = DEAD_HEIGHT + h + FREEBOARD;
  const diam = bigLot ? null : diametersFor(vDesign);
  const vac = diam ? emptying(vDesign, diam.descarga, h) : null;

  const reusoObligatorio = (i.pisos || 0) > REUSO.pisos || (i.areaUtil || 0) > REUSO.areaUtil;

  return {
    tr, occupation: occ, station, duration, intensity, tret,
    cu, co, deltaC: cu - co, cImp: imp[key], cPermFinal: covF[key], cPermInitial: covI[key],
    impFinal, impInitial, area,
    vCalc, vTable, vDesign, governedBy: vTable !== null && vTable >= vCalc ? "tabla" : "calculo",
    usefulHeight: h, planArea, side, totalHeight, grossVolume: planArea * totalHeight,
    deadVolume: planArea * DEAD_HEIGHT,
    diam, vac, bigLot, reusoObligatorio, warnings,
    // Compatibilidad con el resto de la app
    volumeM3: vDesign,
  };
}

/** Presupuesto referencial de un tanque rectangular de hormigón (planta cuadrada). */
export function budgetNormTank(r) {
  const wall = 0.15;
  const s = r.side;
  const H = r.totalHeight;
  const wallArea = 4 * s * H;
  const baseArea = s * s;
  const concVol = (wallArea + 2 * baseArea) * wall; // muros, fondo y losa de tapa
  const excavation = (s + 2 * wall + 0.6) ** 2 * (H + wall);
  return calcBudget([
    { desc: "Excavación en pozo (h=0-2m)", qty: excavation, unit: "m³", p: P.cist_excavacion },
    { desc: "Hormigón simple f'c=210 kg/cm2 (muros, fondo y tapa)", qty: concVol, unit: "m³", p: P.cist_hormigon },
    { desc: "Impermeabilización interior", qty: wallArea + baseArea, unit: "m²", p: P.cist_impermeab },
    { desc: "Encofrado/desencofrado", qty: wallArea * 2 + baseArea, unit: "m²", p: P.cist_encofrado },
    { desc: "Desalojo de material (5 km)", qty: excavation, unit: "m³", p: P.cist_desalojo },
  ]);
}
