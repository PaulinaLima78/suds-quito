// ---------------------------------------------------------------------------
// SUDS Quito · Estándar municipal "Recolección y reutilización de agua lluvia"
// (apéndice del PUGS del DMQ; EPMAPS / Municipio de Quito, versión del
// expediente de reforma PMDOT-PUGS, 14-04-2023). Concordante con la
// Ordenanza Metropolitana 060-2023 de Infraestructura Verde-Azul, Art. 26.
//
// Los valores de esta hoja se transcriben del estándar; la referencia de cada
// tabla se indica en el comentario. © 2026 Paulina Lima (implementación).
// ---------------------------------------------------------------------------

export const NORMA_REF = "Estándar de recolección y reutilización de agua lluvia (PUGS-DMQ, EPMAPS)";
export const NORMA_SHORT = "Estándar municipal de agua lluvia (PUGS)";

// Tabla 1 — Volumen mínimo de retención (TR 5 años) según área de aporte del
// lote (≤ 2500 m²). Valores tal como constan en el estándar.
export const TABLA1 = [
  { max: 500, vol: 5 },
  { max: 1000, vol: 10 },
  { max: 1500, vol: 10 },
  { max: 2000, vol: 15 },
  { max: 2500, vol: 20 },
];
export const MIN_VOLUME = 5; // m³, almacenamiento mínimo
export const TABLA1_MAX_AREA = 2500; // m²; por encima, memoria de cálculo

// Tabla 2 — Período de retorno por tipo de ocupación.
export const OCUPACIONES = [
  { id: "residencial", label: "Residencial", tr: 5 },
  { id: "comercio", label: "Comercio barrial/sectorial/zonal u oficinas", tr: 5 },
  { id: "equip_barrial", label: "Equipamiento barrial o sectorial", tr: 5 },
  { id: "centro_comercial", label: "Centro comercial", tr: 10 },
  { id: "patrimonial", label: "Patrimonial, gubernamental o equipamiento zonal/metropolitano", tr: 10 },
  { id: "aeropuerto", label: "Aeropuerto", tr: 10 },
];

// Tabla 3 — Ecuaciones IDF de la EMAAP-Q:
//   I (mm/h) = a · Tr^b · [ln(t + 3)]^c · (ln Tr)^d / t^e   (t en min)
// Válidas para 2 ≤ Tr ≤ 50 años y 5 ≤ t ≤ 360 min.
// Coordenadas convertidas de grados-minutos-segundos (sur y oeste negativos).
export const IDF_STATIONS = [
  { id: "izobamba", name: "Izobamba", lat: -0.3625, lon: -78.5531, alt: 3058, a: 74.714, b: 0.0888, c: 3.8202, d: 0.1892, e: 1.6079,
    uso: "Sur de Quito, faldas orientales del Atacazo" },
  { id: "observatorio", name: "Quito-Observatorio", lat: -0.2111, lon: -78.5, alt: 2820, a: 48.657, b: 0.0896, c: 5.234, d: 0.2138, e: 1.9654,
    uso: "Centro de la ciudad" },
  { id: "inaquito", name: "Iñaquito-INAMHI", lat: -0.1667, lon: -78.4833, alt: 2789, a: 76.8002, b: 0.0818, c: 3.7343, d: 0.2784, e: 1.5847,
    uso: "Sin recomendación específica en el estándar (centro-norte)" },
  { id: "aeropuerto", name: "DAC-Aeropuerto", lat: -0.14, lon: -78.485, alt: 2794, a: 55.6656, b: 0.0922, c: 4.1647, d: 0.0985, e: 1.6567,
    uso: "Norte del antiguo aeropuerto (parque Bicentenario)" },
  { id: "chorrera", name: "La Chorrera", lat: -0.2017, lon: -78.535, alt: 3165, a: 44.2595, b: 0.0973, c: 4.4013, d: 0.0317, e: 1.6591,
    uso: "Sin recomendación específica en el estándar (ladera del Pichincha)" },
  { id: "la_tola", name: "La Tola", lat: -0.2294, lon: -78.3667, alt: 2480, a: 39.9, b: 0.09, c: 5.38, d: 0.11, e: 1.93,
    uso: "Parroquias nororientales" },
];
export const IDF_LIMITS = { trMin: 2, trMax: 50, tMin: 5, tMax: 360 };
export const MIN_DURATION = 30; // min, duración mínima de la lluvia de diseño

// Tabla 4 — Coeficientes de escorrentía (columnas TR 5 y TR 10 años).
export const C_IMPERMEABLE = [
  { id: "techo", label: "Concreto / techo impermeable", c5: 0.80, c10: 0.83 },
  { id: "asfalto", label: "Asfalto impermeable", c5: 0.77, c10: 0.81 },
];
export const C_PERMEABLE = [
  { id: "pasto50_plano", label: "Zona verde, pasto ≤ 50% · plano (0-2%)", c5: 0.34, c10: 0.37 },
  { id: "pasto50_media", label: "Zona verde, pasto ≤ 50% · pendiente media (2-7%)", c5: 0.40, c10: 0.43 },
  { id: "pasto50_fuerte", label: "Zona verde, pasto ≤ 50% · pendiente fuerte (> 7%)", c5: 0.43, c10: 0.45 },
  { id: "pasto75_plano", label: "Zona verde, pasto 50-75% · plano", c5: 0.28, c10: 0.30 },
  { id: "pasto75_media", label: "Zona verde, pasto 50-75% · pendiente media", c5: 0.36, c10: 0.38 },
  { id: "pasto75_fuerte", label: "Zona verde, pasto 50-75% · pendiente fuerte", c5: 0.40, c10: 0.42 },
  { id: "pasto100_plano", label: "Zona verde, pasto > 75% · plano", c5: 0.23, c10: 0.25 },
  { id: "pasto100_media", label: "Zona verde, pasto > 75% · pendiente media", c5: 0.32, c10: 0.35 },
  { id: "pasto100_fuerte", label: "Zona verde, pasto > 75% · pendiente fuerte", c5: 0.37, c10: 0.40 },
  { id: "cultivo_plano", label: "Cultivos · plano", c5: 0.34, c10: 0.36 },
  { id: "cultivo_media", label: "Cultivos · pendiente media", c5: 0.36, c10: 0.38 },
  { id: "cultivo_fuerte", label: "Cultivos · pendiente fuerte", c5: 0.42, c10: 0.44 },
  { id: "pastizal_plano", label: "Pastizal · plano", c5: 0.28, c10: 0.30 },
  { id: "pastizal_media", label: "Pastizal · pendiente media", c5: 0.36, c10: 0.38 },
  { id: "pastizal_fuerte", label: "Pastizal · pendiente fuerte", c5: 0.40, c10: 0.42 },
  { id: "bosque_plano", label: "Bosque · plano", c5: 0.25, c10: 0.28 },
  { id: "bosque_media", label: "Bosque · pendiente media", c5: 0.34, c10: 0.36 },
  { id: "bosque_fuerte", label: "Bosque · pendiente fuerte", c5: 0.39, c10: 0.41 },
];

// Alturas fijas del tanque (m): volumen muerto para sedimentos y borde libre.
export const DEAD_HEIGHT = 0.40;
export const FREEBOARD = 0.50;

// Vaciado por orificio.
export const CD = 0.60;
export const G = 9.77; // m/s², valor del estándar para Quito

// Tablas 5 y 6 — Diámetros nominales (mm) para lotes ≤ 2500 m².
export const DIAMETROS = [
  { vol: 5, descarga: 50, desborde: 63 },
  { vol: 10, descarga: 50, desborde: 63 },
  { vol: 15, descarga: 50, desborde: 63 },
  { vol: 20, descarga: 63, desborde: 90 },
];

// Reúso obligatorio de agua lluvia.
export const REUSO = { pisos: 12, areaUtil: 2500 };
