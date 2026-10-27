// ---------------------------------------------------------------------------
// SUDS Quito · Núcleo de cálculo hidrológico
// © 2026 Paulina Lima. Todos los derechos reservados.
//
// Métodos de dimensionamiento preliminar (anteproyecto) por volumen de
// captura. Unidades: lluvia en mm, áreas en m², volúmenes en L o m³,
// tiempos en horas, conductividad hidráulica en mm/h.
// ---------------------------------------------------------------------------

// Parámetros constructivos típicos (CIRIA C753 / EPA LID).
export const BIO = { pondingDepth: 0.20, mediaDepth: 0.45, mediaPorosity: 0.30, gravelDepth: 0.15 };
export const GRAVEL_VOID_RATIO = 0.35;
export const PAVEMENT = { minBase: 0.15, maxBase: 0.60, blockThickness: 0.14, maxAreaRatio: 2 };
export const CISTERN = { safetyFactor: 1.1, height: 1.5, marginHours: 4 };

// Infiltración: factor de seguridad sobre la tasa medida o tabulada, y
// umbrales de tiempo de vaciado (CIRIA C753: vaciar la mitad del volumen en
// ≤ 24 h; práctica EPA/estados de EE. UU.: vaciado total en 48–72 h).
export const INFILTRATION = { safetyFactor: 2, okHours: 48, maxHours: 72, minViableRate: 3.6 };

// --- Escorrentía ------------------------------------------------------------

/** Volumen (L) con coeficiente volumétrico: 1 mm sobre 1 m² = 1 L. */
export function runoffVolumeL(rainMm, areaM2, runoffCoef) {
  return rainMm * areaM2 * runoffCoef;
}

/** Lámina de escorrentía (mm) por número de curva NRCS (TR-55), Ia = 0.2·S. */
export function runoffDepthCN(rainMm, cn) {
  if (!(cn > 0) || cn > 100) return 0;
  const S = 25400 / cn - 254; // mm
  const Ia = 0.2 * S;
  if (rainMm <= Ia) return 0;
  return (rainMm - Ia) ** 2 / (rainMm - Ia + S);
}

/** Volumen de diseño (L) según el método elegido ("coef" | "cn"). */
export function designRunoff(method, rainMm, areaM2, surface) {
  if (method === "cn") {
    const depth = runoffDepthCN(rainMm, surface.cn);
    return { volL: depth * areaM2, depthMm: depth, ratio: rainMm > 0 ? depth / rainMm : 0 };
  }
  const volL = runoffVolumeL(rainMm, areaM2, surface.runoffCoef);
  return { volL, depthMm: rainMm * surface.runoffCoef, ratio: surface.runoffCoef };
}

// --- Dimensionamiento por tipo de SUDS --------------------------------------

/** Biorretención: A = V / (d_ponding + d_sustrato · n). */
export function sizeBioretention(volumeL, areaAportante) {
  const volumeM3 = volumeL / 1000;
  const { pondingDepth, mediaDepth, mediaPorosity, gravelDepth } = BIO;
  const effectiveDepth = pondingDepth + mediaDepth * mediaPorosity;
  const areaM2 = volumeM3 / effectiveDepth;
  return {
    areaM2,
    pondingDepth,
    mediaDepth,
    gravelDepth,
    effectiveDepth,
    pctOfAportante: (areaM2 / areaAportante) * 100,
    volumeM3,
  };
}

/**
 * Pavimento permeable: e_base = V / (A_pav · n), limitado a 0.15–0.60 m.
 * areaPavement es la superficie de pavimento permeable (por defecto igual al
 * área aportante); areaAportante sirve para revisar la relación de áreas.
 */
export function sizePermeablePavement(volumeL, areaPavement, areaAportante = areaPavement) {
  const volumeM3 = volumeL / 1000;
  const n = GRAVEL_VOID_RATIO;
  const rawDepth = volumeM3 / (areaPavement * n);
  const baseDepth = Math.min(Math.max(rawDepth, PAVEMENT.minBase), PAVEMENT.maxBase);
  const volumeProvided = areaPavement * baseDepth * n;
  const coverage = volumeM3 > 0 ? Math.min((volumeProvided / volumeM3) * 100, 100) : 100;
  const extraArea = Math.max(areaAportante - areaPavement, 0);
  return {
    baseDepth,
    rawDepth,
    volumeM3,
    volumeStoredM3: Math.min(volumeProvided, volumeM3),
    coverage,
    areaPavement,
    areaRatio: extraArea / areaPavement, // área impermeable extra que drena hacia el pavimento
    voidRatio: n,
  };
}

/** Cisterna: V × 1.10; cilindro de 1.5 m de alto; vaciado antes del siguiente evento. */
export function sizeCistern(volumeL, dryHours) {
  const designVolumeM3 = (volumeL / 1000) * CISTERN.safetyFactor;
  const h = CISTERN.height;
  const diameter = Math.sqrt(designVolumeM3 / h / (Math.PI / 4));
  return {
    volumeM3: designVolumeM3,
    heightAssumed: h,
    diameter,
    dryHours,
    emptyByHours: Math.max(dryHours - CISTERN.marginHours, 4),
  };
}

/** Zanja: L = V / (ancho · prof · n). */
export function sizeInfiltrationTrench(volumeL, width, depth) {
  const volumeM3 = volumeL / 1000;
  const voidRatio = GRAVEL_VOID_RATIO;
  return { volumeM3, width, depth, length: volumeM3 / (width * depth * voidRatio), voidRatio };
}

/** Depósito bajo parqueadero: verifica V_captura = L·A·prof·n ≥ V diseño. */
export function checkInfiltrationChamber(volumeL, length, width, depth) {
  const volumeNeededM3 = volumeL / 1000;
  const voidRatio = GRAVEL_VOID_RATIO;
  const grossVolumeM3 = length * width * depth;
  const captureVolumeM3 = grossVolumeM3 * voidRatio;
  return {
    volumeNeededM3,
    grossVolumeM3,
    captureVolumeM3,
    coveragePct: volumeNeededM3 > 0 ? (captureVolumeM3 / volumeNeededM3) * 100 : 100,
    voidRatio,
    length,
    width,
    depth,
    sufficient: captureVolumeM3 >= volumeNeededM3,
  };
}

// --- Infiltración / tiempo de vaciado ---------------------------------------

/**
 * Tiempo de vaciado (h) de un volumen almacenado que se infiltra por un área.
 * Se aplica un factor de seguridad a la tasa del suelo.
 */
export function drawdownHours(storedM3, infiltrationAreaM2, kMmH, safetyFactor = INFILTRATION.safetyFactor) {
  if (!(kMmH > 0) || !(infiltrationAreaM2 > 0)) return Infinity;
  const kDesign = kMmH / 1000 / safetyFactor; // m/h
  return storedM3 / (kDesign * infiltrationAreaM2);
}

/**
 * Área efectiva de infiltración por tipo de SUDS (m²).
 * Zanjas y depósitos: fondo + paredes hasta la mitad de la altura (criterio
 * BRE 365 / CIRIA C753). Biorretención y pavimento: solo el fondo.
 */
export function infiltrationArea(sudsId, r) {
  switch (sudsId) {
    case "biorretencion":
      return { area: r.areaM2, stored: r.volumeM3 };
    case "permeable":
      return { area: r.areaPavement, stored: r.volumeStoredM3 };
    case "zanja":
      return { area: r.length * r.width + 2 * r.length * (r.depth / 2), stored: r.volumeM3 };
    case "deposito":
      return {
        area: r.length * r.width + 2 * (r.length + r.width) * (r.depth / 2),
        stored: Math.min(r.captureVolumeM3, r.volumeNeededM3),
      };
    default:
      return null;
  }
}

/** Clasifica el tiempo de vaciado frente a los umbrales y al tiempo seco local. */
export function assessDrawdown(hours, kMmH, dryHours) {
  const lowRate = kMmH < INFILTRATION.minViableRate;
  let level = "ok";
  if (!isFinite(hours) || hours > INFILTRATION.maxHours) level = "malo";
  else if (hours > INFILTRATION.okHours) level = "limite";
  return {
    hours,
    level,
    lowRate,
    beforeNextEvent: isFinite(hours) && hours <= dryHours,
  };
}

// --- Gumbel -----------------------------------------------------------------

/** Variable reducida de Gumbel para período de retorno T (años). */
export function gumbelReducedVariate(T) {
  return -Math.log(-Math.log(1 - 1 / T));
}

/**
 * Recupera los parámetros de Gumbel (u = ubicación, β = escala) a partir de
 * dos cuantiles publicados, p. ej. TR2 y TR5. Útil para verificar la tabla.
 */
export function gumbelFromQuantiles(x1, T1, x2, T2) {
  const y1 = gumbelReducedVariate(T1);
  const y2 = gumbelReducedVariate(T2);
  const beta = (x2 - x1) / (y2 - y1);
  const u = x1 - beta * y1;
  return { u, beta, mean: u + 0.5772 * beta };
}
