import React, { useState, useMemo } from "react";
import { Droplets, CloudRain, Layers, Box, Info, ChevronRight, AlertTriangle } from "lucide-react";

// ---------------------------------------------------------------------------
// DATA REAL — extraída de Analisis_Lluvias_Quito_COMPLETO.xlsx
// hojas: Tabla_diseno_estacion + IDF_Gumbel + Hietograma_diseno
// Script análisis lluvias horarias 2020-2026 · 12 estaciones FONAG
// Autoría metodológica: Paulina Lima
//
// DOS OBJETIVOS DISTINTOS (metodología Paulina Lima):
//
// 1. SUDS para CAPTURA/RETENCIÓN (volumen a guardar):
//    p90Duracion / p95Extremos = percentiles del volumen total de eventos
//    completos de lluvia (P90/P95 de lluvia_evento_mm). Dimensionan el
//    TAMAÑO del SUDS. Ref: EPA Stormwater Capture / CIRIA SuDS Manual C753.
//
// 2. GESTIÓN DE RIESGOS / ALCANTARILLADO (intensidad pico):
//    tr2..tr25 = lluvia (mm) para período de retorno 2-25 años, duración 2h,
//    por ajuste de distribución de Gumbel a máximos anuales móviles.
//    int_tr2..int_tr25 = intensidad (mm/h). Dimensionan tuberías y colectores.
//    Ref: Gumbel (1958), Chow/Maidment/Mays — Applied Hydrology.
//    TR2-5: alcantarillado domiciliario · TR10: colectores · TR25: infraestr.
//
// hietograma: distribución horaria del evento P90 real observado (2h).
// ---------------------------------------------------------------------------
const STATIONS = [
  { id: "rumihurco",      name: "Rumihurco - Machángara", code: "P03", zona: "Sur (cuenca Machángara)",   lat: -0.130678, lon: -78.526703, elevationM: 3245, p90Duracion: 20.1, p95Extremos: 30.3, tr2_mm: 33.5,  tr5_mm: 38.3,  tr10_mm: 41.5,  tr25_mm: 45.5,  int_tr2: 16.8, int_tr5: 19.2, int_tr10: 20.7, int_tr25: 22.7, dryHours: 16, eventDurationH: 5, recomendacion: "SUDS robusto",   hietograma: [5.93, 6.43], mesLluvioso: "octubre", lluvia_mes_lluvioso: 182.3, mesSeco: "agosto",  lluvia_mes_seco: 30.6, climatologia: [88.7,106.5,162.1,173.2,114.7,53.0,31.2,30.6,61.1,182.3,76.6,120.8] },
  { id: "rumipamba",      name: "Rumipamba (Bodegas)",    code: "P08", zona: "Centro",                     lat: -0.180912, lon: -78.509943, elevationM: 3005, p90Duracion: 22.8, p95Extremos: 32.5, tr2_mm: 36.5,  tr5_mm: 42.2,  tr10_mm: 46.0,  tr25_mm: 50.8,  int_tr2: 18.2, int_tr5: 21.1, int_tr10: 23.0, int_tr25: 25.4, dryHours: 20, eventDurationH: 4, recomendacion: "SUDS robusto",   hietograma: [5.60, 8.19], mesLluvioso: "marzo",   lluvia_mes_lluvioso: 222.3, mesSeco: "julio",   lluvia_mes_seco: 32.5, climatologia: [132.5,149.4,222.3,203.7,91.8,68.6,32.6,37.3,57.4,172.9,108.0,160.6] },
  { id: "inaquito",       name: "Iñaquito (INAMHI)",      code: "P09", zona: "Centro-norte",               lat: -0.178354, lon: -78.487680, elevationM: 2804, p90Duracion: 18.3, p95Extremos: 26.8, tr2_mm: 30.8,  tr5_mm: 36.0,  tr10_mm: 39.5,  tr25_mm: 43.8,  int_tr2: 15.4, int_tr5: 18.0, int_tr10: 19.7, int_tr25: 21.9, dryHours: 17, eventDurationH: 4, recomendacion: "SUDS medio",     hietograma: [3.90, 7.80], mesLluvioso: "marzo",   lluvia_mes_lluvioso: 181.7, mesSeco: "julio",   lluvia_mes_seco: 27.9, climatologia: [96.7,105.9,181.7,106.3,75.9,56.3,27.8,30.2,43.2,138.3,77.9,110.4] },
  { id: "cumbaya",        name: "Cumbayá",                code: "P13", zona: "Valle de Cumbayá",           lat: -0.213443, lon: -78.429960, elevationM: 2339, p90Duracion: 19.7, p95Extremos: 28.4, tr2_mm: 37.4,  tr5_mm: 42.7,  tr10_mm: 46.2,  tr25_mm: 50.7,  int_tr2: 18.7, int_tr5: 21.4, int_tr10: 23.1, int_tr25: 25.3, dryHours: 23, eventDurationH: 3, recomendacion: "SUDS medio",     hietograma: [7.58, 5.38], mesLluvioso: "abril",   lluvia_mes_lluvioso: 165.8, mesSeco: "julio",   lluvia_mes_seco: 16.6, climatologia: [69.0,83.4,140.7,165.8,49.6,30.8,16.6,16.8,45.7,144.9,77.1,80.8] },
  { id: "izobamba",       name: "Izobamba",               code: "P16", zona: "Sur (rural)",                lat: -0.365945, lon: -78.555140, elevationM: 3046, p90Duracion: 17.9, p95Extremos: 24.8, tr2_mm: 35.9,  tr5_mm: 44.2,  tr10_mm: 49.7,  tr25_mm: 56.7,  int_tr2: 18.0, int_tr5: 22.1, int_tr10: 24.9, int_tr25: 28.3, dryHours: 15, eventDurationH: 4, recomendacion: "SUDS medio",     hietograma: [6.00, 5.80], mesLluvioso: "abril",   lluvia_mes_lluvioso: 194.1, mesSeco: "agosto",  lluvia_mes_seco: 40.5, climatologia: [92.0,130.3,186.4,194.1,111.1,63.1,41.8,40.5,64.4,144.3,125.2,176.8] },
  { id: "chillogallo",    name: "Chillogallo",            code: "P22", zona: "Sur",                        lat: -0.278181, lon: -78.585716, elevationM: 3202, p90Duracion: 12.3, p95Extremos: 16.8, tr2_mm: 29.4,  tr5_mm: 41.2,  tr10_mm: 49.1,  tr25_mm: 59.0,  int_tr2: 14.7, int_tr5: 20.6, int_tr10: 24.5, int_tr25: 29.5, dryHours: 16, eventDurationH: 4, recomendacion: "SUDS medio",     hietograma: [4.30, 3.50], mesLluvioso: "marzo",   lluvia_mes_lluvioso: 139.1, mesSeco: "agosto",  lluvia_mes_seco: 39.6, climatologia: [55.0,72.8,139.1,130.8,91.4,53.9,40.3,39.6,45.4,99.6,83.5,100.9] },
  { id: "atacazo",        name: "Atacazo",                code: "P23", zona: "Sur-occidente (ladera)",     lat: -0.318317, lon: -78.601764, elevationM: 3877, p90Duracion: 16.1, p95Extremos: 22.1, tr2_mm: 26.4,  tr5_mm: 31.9,  tr10_mm: 35.5,  tr25_mm: 40.1,  int_tr2: 13.2, int_tr5: 15.9, int_tr10: 17.7, int_tr25: 20.0, dryHours: 13, eventDurationH: 6, recomendacion: "SUDS medio",     hietograma: [1.10, 8.10], mesLluvioso: "marzo",   lluvia_mes_lluvioso: 194.4, mesSeco: "julio",   lluvia_mes_seco: 49.4, climatologia: [95.6,118.1,194.4,177.1,117.0,57.9,49.4,54.8,59.4,137.6,100.9,123.2] },
  { id: "san_francisco",  name: "San Francisco",          code: "P27", zona: "Centro histórico",           lat: -0.202191, lon: -78.539685, elevationM: 3551, p90Duracion: 24.1, p95Extremos: 35.1, tr2_mm: 33.7,  tr5_mm: 39.0,  tr10_mm: 42.5,  tr25_mm: 46.9,  int_tr2: 16.8, int_tr5: 19.5, int_tr10: 21.3, int_tr25: 23.5, dryHours: 14, eventDurationH: 5, recomendacion: "SUDS robusto",   hietograma: [2.30,12.30], mesLluvioso: "marzo",   lluvia_mes_lluvioso: 248.7, mesSeco: "julio",   lluvia_mes_seco: 45.5, climatologia: [175.9,203.8,248.7,240.7,142.4,95.1,45.5,52.2,95.6,221.6,119.1,199.2] },
  { id: "tanque_solanda", name: "Tanque - Solanda",       code: "P56", zona: "Sur",                        lat: -0.281734, lon: -78.530740, elevationM: 2916, p90Duracion: 16.9, p95Extremos: 22.5, tr2_mm: 30.1,  tr5_mm: 35.7,  tr10_mm: 39.4,  tr25_mm: 44.1,  int_tr2: 15.1, int_tr5: 17.9, int_tr10: 19.7, int_tr25: 22.0, dryHours: 18, eventDurationH: 4, recomendacion: "SUDS medio",     hietograma: [6.09, 5.20], mesLluvioso: "abril",   lluvia_mes_lluvioso: 137.5, mesSeco: "junio",   lluvia_mes_seco: 27.7, climatologia: [59.0,72.7,112.5,137.5,77.2,27.7,38.0,39.8,54.3,122.6,60.5,110.6] },
  { id: "cc_el_bosque",   name: "CC El Bosque",           code: "P70", zona: "Centro-norte",               lat: -0.161691, lon: -78.497363, elevationM: 2903, p90Duracion: 21.7, p95Extremos: 31.2, tr2_mm: 25.9,  tr5_mm: 28.0,  tr10_mm: 29.5,  tr25_mm: 31.3,  int_tr2: 12.9, int_tr5: 14.0, int_tr10: 14.7, int_tr25: 15.7, dryHours: 22, eventDurationH: 4, recomendacion: "SUDS robusto",   hietograma: [7.62, 5.21], mesLluvioso: "marzo",   lluvia_mes_lluvioso: 210.2, mesSeco: "julio",   lluvia_mes_seco: 22.8, climatologia: [109.0,125.6,210.2,170.6,75.4,42.1,22.8,25.9,50.1,142.1,94.6,138.8] },
  { id: "collaloma_medio",name: "Collaloma Medio",        code: "P71", zona: "Sur",                        lat: -0.122609, lon: -78.473210, elevationM: 2968, p90Duracion: 14.2, p95Extremos: 22.2, tr2_mm: 30.0,  tr5_mm: 34.2,  tr10_mm: 36.9,  tr25_mm: 40.4,  int_tr2: 15.0, int_tr5: 17.1, int_tr10: 18.5, int_tr25: 20.2, dryHours: 17, eventDurationH: 4, recomendacion: "SUDS medio",     hietograma: [6.99, 2.60], mesLluvioso: "marzo",   lluvia_mes_lluvioso:  79.6, mesSeco: "agosto",  lluvia_mes_seco: 14.7, climatologia: [32.6,40.0,79.6,66.4,30.5,31.0,19.0,14.7,15.6,50.7,22.7,42.8] },
  { id: "colinas_alto",   name: "Colinas del Alto",       code: "P72", zona: "Sur (ladera)",               lat: -0.102834, lon: -78.523052, elevationM: 3088, p90Duracion: 14.1, p95Extremos: 22.9, tr2_mm: 30.8,  tr5_mm: 39.7,  tr10_mm: 45.6,  tr25_mm: 53.1,  int_tr2: 15.4, int_tr5: 19.9, int_tr10: 22.8, int_tr25: 26.5, dryHours: 20, eventDurationH: 3, recomendacion: "SUDS medio",     hietograma: [1.30, 8.80], mesLluvioso: "marzo",   lluvia_mes_lluvioso:  80.5, mesSeco: "agosto",  lluvia_mes_seco:  9.2, climatologia: [31.8,48.0,80.5,43.7,38.8,28.8,10.2,9.2,24.1,46.4,19.8,27.1] },
];

// ---------------------------------------------------------------------------
// IDW — Interpolación por distancia inversa (Inverse Distance Weighting).
// Adaptado de idwRainfall.js (script de R de Paulina Lima). Permite estimar
// la lluvia de diseño en cualquier punto de Quito a partir de las k
// estaciones más cercanas, ponderando por 1/distancia².
// ---------------------------------------------------------------------------
function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function idwRainfall(lat, lon, stations, field = "p90Duracion", k = 4, power = 2) {
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
    stations: valid.map((s) => ({ id: s.id, name: s.name, distanceKm: s.distanceKm, value: Number(s[field]) })),
  };
}

const SURFACES = [
  { id: "techo", label: "Techo / cubierta", runoffCoef: 0.9, cn: 98 },
  { id: "pavimento", label: "Pavimento / vereda existente", runoffCoef: 0.85, cn: 96 },
  { id: "patio_tierra", label: "Patio o jardín (suelo desnudo)", runoffCoef: 0.3, cn: 79 },
  { id: "patio_cesped", label: "Patio con césped", runoffCoef: 0.2, cn: 74 },
];

const SUDS_TYPES = [
  { id: "biorretencion", label: "Jardín de lluvia / Biorretención", icon: "leaf" },
  { id: "permeable", label: "Pavimento permeable", icon: "grid" },
  { id: "zanja", label: "Zanja de infiltración", icon: "minus" },
  { id: "deposito", label: "Depósito de infiltración (bajo parqueadero)", icon: "box" },
  { id: "cisterna", label: "Cisterna / tanque de detención", icon: "box" },
];

// ---------------------------------------------------------------------------
// PRECIOS UNITARIOS — Fuente: Lista de Rubros Municipio de Rumiñahui
// (precios referenciales, actualización junio 2026).
// Actualizar cada 6 meses según nueva versión del catálogo.
// ---------------------------------------------------------------------------
const UNIT_PRICES = {
  // Biorretención / Jardín de lluvia
  bio_excavacion:  8.92,   // m3 excavación a mano en tierra
  bio_abono:       0.41,   // Kg abono orgánico mezclado en sitio
  bio_arena:      23.63,   // m3 arena gruesa para filtros
  bio_grava:      20.11,   // m3 grava para drenaje
  bio_geotextil:   3.10,   // m2 geotextil 2000 NT no tejido
  bio_dren:        9.92,   // m tubería PVC perforada Ø 110mm
  bio_plantas:    17.83,   // m2 plantas ornamentales / jardinería
  bio_desalojo:   10.25,   // m3 desalojo material a 5km
  // Zanja de infiltración
  zanja_excavacion: 13.57, // m3 excavación de zanja a mano h=0-2m
  zanja_arena:    23.02,   // m3 arena en zanja de infiltración
  zanja_grava:    23.02,   // m3 grava en zanja de infiltración
  zanja_geotextil:  3.10,  // m2 geotextil 2000 NT no tejido
  zanja_desalojo: 10.25,   // m3 desalojo material a 5km
  // Pavimento permeable
  pav_adoquin:    31.25,   // m2 adoquín ecológico e=10cm f'c=400 inc. cama arena
  pav_base_grava: 20.11,   // m3 grava para drenaje (base)
  pav_geotextil:   3.10,   // m2 geotextil 2000 NT no tejido
  pav_excavacion:  8.92,   // m3 excavación a mano en tierra
  // Cisterna / tanque
  cist_excavacion: 16.27,  // m3 excavación a mano en pozo h=0-2m
  cist_hormigon: 155.34,   // m3 hormigón simple f'c=210 kg/cm2
  cist_impermeab:  14.63,  // m2 impermeabilización de cisterna
  cist_encofrado:   7.98,  // m2 encofrado/desencofrado
  cist_desalojo:   10.25,  // m3 desalojo material a 5km
  // Depósito de infiltración bajo parqueadero
  dep_excavacion:  16.27,  // m3 excavación a mano en pozo h=0-2m
  dep_grava:       23.02,  // m3 grava en zanja de infiltración
  dep_geotextil:    3.10,  // m2 geotextil 2000 NT no tejido
  dep_desalojo:    10.25,  // m3 desalojo material a 5km
};

// Funciones de presupuesto referencial por tipo de SUDS
// Los precios son referenciales para anteproyecto, no incluyen imprevistos
// ni utilidad del contratista. Factor de imprevistos sugerido: +20%.

function budgetBioretention(r) {
  const vol = r.volumeM3;
  const area = r.areaM2;
  const perimeter = 2 * (Math.sqrt(area) + Math.sqrt(area)); // estimado
  const items = [
    { desc: "Excavación a mano (tierra)",         qty: vol,           unit: "m³", p: UNIT_PRICES.bio_excavacion },
    { desc: "Arena gruesa para filtros",           qty: vol * 0.3,     unit: "m³", p: UNIT_PRICES.bio_arena },
    { desc: "Grava para drenaje",                  qty: vol * 0.5,     unit: "m³", p: UNIT_PRICES.bio_grava },
    { desc: "Abono orgánico (sustrato)",           qty: area * 40,     unit: "Kg", p: UNIT_PRICES.bio_abono },
    { desc: "Geotextil 2000 NT",                   qty: area + perimeter * r.pondingDepth, unit: "m²", p: UNIT_PRICES.bio_geotextil },
    { desc: "Tubería PVC perforada Ø110mm (dren)", qty: Math.sqrt(area), unit: "m",  p: UNIT_PRICES.bio_dren },
    { desc: "Plantas / jardinería",                qty: area,          unit: "m²", p: UNIT_PRICES.bio_plantas },
    { desc: "Desalojo de material (5 km)",         qty: vol,           unit: "m³", p: UNIT_PRICES.bio_desalojo },
  ];
  return calcBudget(items);
}

function budgetTrench(r) {
  const vol = r.width * r.depth * r.length;
  const perimGeotextil = 2 * (r.width + r.depth) * r.length;
  const items = [
    { desc: "Excavación de zanja a mano (h=0-2m)", qty: vol,            unit: "m³", p: UNIT_PRICES.zanja_excavacion },
    { desc: "Arena en zanja de infiltración",       qty: vol * 0.3,     unit: "m³", p: UNIT_PRICES.zanja_arena },
    { desc: "Grava en zanja de infiltración",       qty: vol * 0.7,     unit: "m³", p: UNIT_PRICES.zanja_grava },
    { desc: "Geotextil 2000 NT",                    qty: perimGeotextil, unit: "m²", p: UNIT_PRICES.zanja_geotextil },
    { desc: "Desalojo de material (5 km)",          qty: vol,            unit: "m³", p: UNIT_PRICES.zanja_desalojo },
  ];
  return calcBudget(items);
}

function budgetPermeable(r, areaDisp) {
  const baseVol = areaDisp * r.baseDepth;
  const items = [
    { desc: "Excavación a mano (tierra)",    qty: baseVol,    unit: "m³", p: UNIT_PRICES.pav_excavacion },
    { desc: "Adoquín ecológico e=10cm",      qty: areaDisp,   unit: "m²", p: UNIT_PRICES.pav_adoquin },
    { desc: "Base de grava para drenaje",    qty: baseVol,    unit: "m³", p: UNIT_PRICES.pav_base_grava },
    { desc: "Geotextil 2000 NT",             qty: areaDisp,   unit: "m²", p: UNIT_PRICES.pav_geotextil },
    { desc: "Desalojo de material (5 km)",   qty: baseVol,    unit: "m³", p: UNIT_PRICES.pav_desalojo || UNIT_PRICES.bio_desalojo },
  ];
  return calcBudget(items);
}

function budgetCistern(r) {
  const wallArea = 2 * Math.PI * (r.diameter / 2) * r.heightAssumed;
  const baseArea = Math.PI * (r.diameter / 2) ** 2;
  const concVol = (wallArea * 0.15) + (baseArea * 0.15); // e=15cm muros y fondo
  const items = [
    { desc: "Excavación en pozo (h=0-2m)",      qty: r.volumeM3,  unit: "m³", p: UNIT_PRICES.cist_excavacion },
    { desc: "Hormigón simple f'c=210 kg/cm2",   qty: concVol,     unit: "m³", p: UNIT_PRICES.cist_hormigon },
    { desc: "Impermeabilización de cisterna",   qty: wallArea + baseArea, unit: "m²", p: UNIT_PRICES.cist_impermeab },
    { desc: "Encofrado/desencofrado",           qty: wallArea,    unit: "m²", p: UNIT_PRICES.cist_encofrado },
    { desc: "Desalojo de material (5 km)",      qty: r.volumeM3,  unit: "m³", p: UNIT_PRICES.cist_desalojo },
  ];
  return calcBudget(items);
}

function budgetChamber(r) {
  const vol = r.grossVolumeM3;
  const perimGeotextil = 2 * ((parseFloat(r.length||5) + parseFloat(r.width||3)) * parseFloat(r.depth||2) + parseFloat(r.length||5) * parseFloat(r.width||3));
  const items = [
    { desc: "Excavación en pozo (h=0-2m)",    qty: vol,            unit: "m³", p: UNIT_PRICES.dep_excavacion },
    { desc: "Grava en zanja de infiltración", qty: vol,            unit: "m³", p: UNIT_PRICES.dep_grava },
    { desc: "Geotextil 2000 NT",              qty: perimGeotextil, unit: "m²", p: UNIT_PRICES.dep_geotextil },
    { desc: "Desalojo de material (5 km)",    qty: vol,            unit: "m³", p: UNIT_PRICES.dep_desalojo },
  ];
  return calcBudget(items);
}

function calcBudget(items) {
  const subtotal = items.reduce((s, i) => s + i.qty * i.p, 0);
  return { items, subtotal, total: subtotal * 1.20 }; // +20% imprevistos
}

// ---------------------------------------------------------------------------
// CALCULATION HELPERS
// Métodos estándar simplificados (NRCS / método del volumen de captura).
// ---------------------------------------------------------------------------

// Volumen de escorrentía de diseño (litros) = lámina(mm) * área(m2) * coef. escorrentía
function runoffVolumeL(rainMm, areaM2, runoffCoef) {
  return rainMm * areaM2 * runoffCoef; // 1mm sobre 1m2 = 1 litro
}

// Biorretención: área típica recomendada = 5-10% del área aportante (regla práctica EPA/SUDS)
// usamos volumen de captura / profundidad efectiva (ponding + medio filtrante con porosidad)
function sizeBioretention(volumeL, areaAportante) {
  const volumeM3 = volumeL / 1000;
  const pondingDepth = 0.20; // m, profundidad de almacenamiento superficial típica (15-30cm)
  const mediaDepth = 0.45; // m, profundidad de medio filtrante típico
  const mediaPorosity = 0.3; // porosidad efectiva del sustrato
  const effectiveDepth = pondingDepth + mediaDepth * mediaPorosity;
  const areaNeeded = volumeM3 / effectiveDepth;
  const pctOfAportante = (areaNeeded / areaAportante) * 100;
  return {
    areaM2: areaNeeded,
    pondingDepth,
    mediaDepth,
    pctOfAportante,
    volumeM3,
  };
}

// Pavimento permeable: dimensionado por capacidad de almacenamiento en base de grava
// espesor base = volumen de captura / (área de pavimento * porosidad de la base)
function sizePermeablePavement(volumeL, areaDisponible) {
  const volumeM3 = volumeL / 1000;
  const baseVoidRatio = 0.35; // porosidad típica de base de grava
  const baseDepth = volumeM3 / (areaDisponible * baseVoidRatio);
  const baseDepthCapped = Math.min(Math.max(baseDepth, 0.15), 0.6); // rango constructivo típico 15-60cm
  const volumeProvided = areaDisponible * baseDepthCapped * baseVoidRatio;
  const coverage = (volumeProvided / volumeM3) * 100;
  return {
    baseDepth: baseDepthCapped,
    rawDepth: baseDepth,
    volumeM3,
    coverage: Math.min(coverage, 100),
  };
}

// Cisterna: volumen de captura ajustado, y se sugiere tiempo de vaciado según
// el tiempo seco mediano entre eventos (debe vaciarse antes del próximo evento)
function sizeCistern(volumeL, dryHours) {
  const volumeM3 = volumeL / 1000;
  // factor de seguridad 1.1 por incertidumbre de lámina
  const designVolumeM3 = volumeM3 * 1.1;
  // diámetro sugerido si es cilíndrica vertical, altura típica 1.5m
  const heightAssumed = 1.5;
  const diameter = Math.sqrt((designVolumeM3 / heightAssumed) / (Math.PI / 4));
  return {
    volumeM3: designVolumeM3,
    heightAssumed,
    diameter,
    dryHours,
    emptyByHours: Math.max(dryHours - 4, 4), // recomendación: vaciar dejando margen de 4h
  };
}

// Zanja de infiltración: geometría lineal. Ancho y profundidad los define el
// usuario (limitados por espacio disponible y nivel freático); se despeja el
// largo necesario para alojar el volumen de captura dentro del relleno de grava.
function sizeInfiltrationTrench(volumeL, width, depth) {
  const volumeM3 = volumeL / 1000;
  const voidRatio = 0.35; // porosidad típica de relleno de grava
  const length = volumeM3 / (width * depth * voidRatio);
  return {
    volumeM3,
    width,
    depth,
    length,
    voidRatio,
  };
}

// Depósito / cámara de infiltración bajo pavimento (soakaway): el usuario fija
// las 3 dimensiones de la caja construida (p.ej. bajo un parqueadero) y se
// calcula cuánta agua puede captar ese volumen relleno de grava.
function checkInfiltrationChamber(volumeL, length, width, depth) {
  const volumeNeededM3 = volumeL / 1000;
  const voidRatio = 0.35; // porosidad típica de relleno de grava
  const grossVolumeM3 = length * width * depth;
  const captureVolumeM3 = grossVolumeM3 * voidRatio;
  const coveragePct = (captureVolumeM3 / volumeNeededM3) * 100;
  return {
    volumeNeededM3,
    grossVolumeM3,
    captureVolumeM3,
    coveragePct,
    voidRatio,
    sufficient: captureVolumeM3 >= volumeNeededM3,
  };
}

function fmt(n, decimals = 1) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("es-EC", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function rainMm0(scenario, station) {
  if (!station) return 0;
  return scenario === "p90" ? station.p90Duracion : station.p95Extremos;
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------

export default function SudsApp() {
  const [stationId, setStationId] = useState("");
  const [scenario, setScenario] = useState("p90");
  const [area, setArea] = useState("");
  const [surfaceId, setSurfaceId] = useState("techo");
  const [sudsId, setSudsId] = useState("biorretencion");
  const [query, setQuery] = useState("");
  const [userLevel, setUserLevel] = useState("simple"); // "simple" | "tecnico"
  const [trenchWidth, setTrenchWidth] = useState("1");
  const [trenchDepth, setTrenchDepth] = useState("1.5");
  const [chamberLength, setChamberLength] = useState("5");
  const [chamberWidth, setChamberWidth] = useState("3");
  const [chamberDepth, setChamberDepth] = useState("2");
  const [riskTR, setRiskTR] = useState("tr10"); // selector TR para gestión de riesgos
  const [customRain, setCustomRain] = useState(""); // valor personalizado mm
  const [techTab, setTechTab] = useState("dimensionamiento"); // "dimensionamiento" | "lluvias" | "metodo"
  const [showAbout, setShowAbout] = useState(false);

  const station = STATIONS.find((s) => s.id === stationId);
  const surface = SURFACES.find((s) => s.id === surfaceId);
  const areaNum = parseFloat(area) || 0;

  const filteredStations = useMemo(() => {
    if (!query.trim()) return STATIONS;
    const q = query.toLowerCase();
    return STATIONS.filter(
      (s) => s.name.toLowerCase().includes(q) || s.zona.toLowerCase().includes(q)
    );
  }, [query]);

  // Lluvia de diseño activa según escenario seleccionado
  const rainMm = useMemo(() => {
    if (!station) return 0;
    if (customRain && parseFloat(customRain) > 0) return parseFloat(customRain);
    switch (scenario) {
      case "p90":   return station.p90Duracion;
      case "p95":   return station.p95Extremos;
      case "tr2":   return station.tr2_mm;
      case "tr5":   return station.tr5_mm;
      case "tr10":  return station.tr10_mm;
      case "tr25":  return station.tr25_mm;
      default:      return station.p90Duracion;
    }
  }, [station, scenario, customRain]);

  const results = useMemo(() => {
    if (!station || areaNum <= 0) return null;
    const volL = runoffVolumeL(rainMm, areaNum, surface.runoffCoef);
    const bio = sizeBioretention(volL, areaNum);
    const perm = sizePermeablePavement(volL, areaNum);
    const tWidth = parseFloat(trenchWidth) || 1;
    const tDepth = parseFloat(trenchDepth) || 1.5;
    const trench = sizeInfiltrationTrench(volL, tWidth, tDepth);
    const cLength = parseFloat(chamberLength) || 5;
    const cWidth = parseFloat(chamberWidth) || 3;
    const cDepth = parseFloat(chamberDepth) || 2;
    const chamber = checkInfiltrationChamber(volL, cLength, cWidth, cDepth);
    const cist = sizeCistern(volL, station.dryHours);
    // Presupuestos referenciales
    const budgets = {
      biorretencion: budgetBioretention(bio),
      permeable: budgetPermeable(perm, areaNum),
      zanja: budgetTrench(trench),
      deposito: budgetChamber({ ...chamber, length: cLength, width: cWidth, depth: cDepth }),
      cisterna: budgetCistern(cist),
    };
    return { volL, bio, perm, trench, chamber, cist, budgets };
  }, [station, areaNum, rainMm, surface, trenchWidth, trenchDepth, chamberLength, chamberWidth, chamberDepth]);

  return (
    <div className="min-h-screen bg-[#F6F4EE] text-[#1F2A24]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .rain-line { background: repeating-linear-gradient(180deg, transparent, transparent 3px, #2F6F5E22 3px, #2F6F5E22 4px); }
      `}</style>

      {/* Header */}
      <header className="border-b border-[#1F2A24]/10 bg-[#F6F4EE]/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-5 py-5 font-body">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-[#2F6F5E] font-semibold mb-1">
            <CloudRain size={14} strokeWidth={2.5} />
            Quito · Hidrología urbana
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold leading-tight text-[#1F2A24]">
            Buscador de SUDS por barrio
          </h1>
          <p className="text-sm text-[#1F2A24]/60 mt-1 max-w-xl">
            Dimensionamiento rápido de sistemas urbanos de drenaje sostenible a partir de la lluvia real de tu estación más cercana.
          </p>
          <p className="text-xs text-[#2F6F5E] font-medium mt-2">
            Por Paulina Lima · datos de lluvia FONAG
          </p>
          <button onClick={() => setShowAbout(v => !v)}
            className="mt-2 text-xs text-[#1F2A24]/50 underline underline-offset-2 hover:text-[#2F6F5E]">
            {showAbout ? "Cerrar guía de uso ↑" : "¿Qué es esta app y cómo usarla? →"}
          </button>
        </div>
      </header>

      {/* Selector de nivel */}
      <div className="max-w-5xl mx-auto px-5 pt-5 font-body">
        <div className="inline-flex rounded-full border border-[#1F2A24]/15 bg-white p-1">
          <button
            onClick={() => setUserLevel("simple")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              userLevel === "simple" ? "bg-[#1F2A24] text-[#F6F4EE]" : "text-[#1F2A24]/60"
            }`}
          >
            Explicación simple
          </button>
          <button
            onClick={() => setUserLevel("tecnico")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              userLevel === "tecnico" ? "bg-[#1F2A24] text-[#F6F4EE]" : "text-[#1F2A24]/60"
            }`}
          >
            Vista técnica
          </button>
        </div>
        <p className="text-xs text-[#1F2A24]/45 mt-2">
          {userLevel === "simple"
            ? "Resultados explicados en palabras simples, sin jerga de ingeniería."
            : "Resultados con las cifras y supuestos de cálculo completos."}
        </p>
      </div>

      {/* Panel Acerca de */}
      {showAbout && (
        <div className="max-w-5xl mx-auto px-5 py-6 font-body border-b border-[#1F2A24]/10">
          <div className="grid sm:grid-cols-2 gap-6">

            {/* Col 1: Qué es y cómo usar */}
            <div>
              <h3 className="font-display text-base font-semibold mb-3">¿Para qué sirve?</h3>
              <p className="text-sm text-[#1F2A24]/70 leading-relaxed mb-3">
                Permite estimar de forma rápida el tamaño inicial de un Sistema Urbano de Drenaje
                Sostenible (SUDS) para una zona de Quito. Usa datos de lluvia de 12 estaciones FONAG
                (2020-2026) y calcula volumen de escorrentía, dimensiones preliminares y presupuesto
                referencial para biorretención, pavimento permeable, zanjas, depósitos de infiltración
                y cisternas.
              </p>
              <div className="rounded-xl bg-amber-50 border border-amber-200/50 p-3 text-xs text-amber-900 mb-3">
                <strong>Importante:</strong> los resultados son para anteproyecto y comunicación técnica inicial.
                No sustituyen el diseño hidráulico definitivo ni la revisión de un profesional responsable.
              </div>

              <h3 className="font-display text-base font-semibold mb-2 mt-4">Flujo de uso</h3>
              <ol className="text-xs text-[#1F2A24]/70 space-y-1.5 leading-relaxed list-none">
                {[
                  ["01","Selecciona modo","Explicación simple para usuarios generales; Vista técnica para arquitectos e ingenieros."],
                  ["02","Elige tu zona","Busca la estación más cercana a tu sitio."],
                  ["03","Lluvia de diseño","P90 para manejo cotidiano; P95 para lluvia más fuerte; TR2–TR25 para análisis técnico."],
                  ["04","Área aportante","Superficie del techo, patio o lote que genera escorrentía."],
                  ["05","Tipo de superficie","Techo, pavimento, suelo o césped — cambia el coeficiente de escorrentía."],
                  ["06","Tipo de SUDS","Elige biorretención, pavimento permeable, zanja, depósito o cisterna."],
                  ["07","Lee los resultados","Volumen, dimensiones, presupuesto y advertencias técnicas."],
                ].map(([n, t, d]) => (
                  <li key={n} className="flex gap-2">
                    <span className="font-display text-[#2F6F5E] font-semibold shrink-0">{n}</span>
                    <span><strong>{t}:</strong> {d}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Col 2: Escenarios + El Niño + Metodología */}
            <div>
              <h3 className="font-display text-base font-semibold mb-3">Escenarios de lluvia</h3>
              <div className="overflow-x-auto rounded-xl border border-[#1F2A24]/10 bg-white mb-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#1F2A24]/10 bg-[#1F2A24]/3">
                      <th className="text-left px-3 py-2 font-medium text-[#1F2A24]/60">Escenario</th>
                      <th className="text-left px-3 py-2 font-medium text-[#1F2A24]/60">Uso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["P90","Control de volumen cotidiano (90% de eventos capturados)","bg-[#2F6F5E]/5"],
                      ["P95","Control ampliado, diseño conservador (95% de eventos)","bg-[#2F6F5E]/5"],
                      ["TR2–TR5","Alcantarillado domiciliario y secundario",""],
                      ["TR10","Colectores principales",""],
                      ["TR25","Infraestructura mayor y puentes",""],
                      ["Personalizado","Revisar con valor propio (ej. 60 mm/h)",""],
                    ].map(([sc, uso, bg]) => (
                      <tr key={sc} className={`border-b border-[#1F2A24]/5 ${bg}`}>
                        <td className="px-3 py-2 font-medium">{sc}</td>
                        <td className="px-3 py-2 text-[#1F2A24]/60">{uso}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Contexto El Niño */}
              <h3 className="font-display text-base font-semibold mb-2">Variabilidad climática · El Niño</h3>
              <div className="rounded-xl bg-white border border-[#1F2A24]/10 p-3 text-xs text-[#1F2A24]/70 leading-relaxed mb-3">
                <p className="mb-2">Los datos de esta app corresponden al período 2020-2026, que incluyó el evento <strong>El Niño 2023-2024</strong> (moderado-fuerte en Ecuador). En años de El Niño, la sierra ecuatoriana puede presentar anomalías significativas respecto al promedio histórico:</p>
                <div className="space-y-1">
                  {[
                    ["1997–1998","El Niño fuerte","Lluvias extremas en costa. En sierra: comportamiento irregular."],
                    ["2015–2016","El Niño moderado-fuerte","Afectó temporada lluviosa de sierra norte."],
                    ["2023–2024","El Niño moderado","Déficit marcado en sierra norte y Quito. Abril 2024 con muy poca lluvia."],
                  ].map(([años, tipo, efecto]) => (
                    <div key={años} className="flex gap-2 border-l-2 border-amber-400 pl-2">
                      <div>
                        <span className="font-semibold text-amber-700">{años} · {tipo}:</span>{" "}
                        <span>{efecto}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[#1F2A24]/50">Fuentes: INAMHI, ERFEN-Ecuador, Secretaría de Gestión de Riesgos.</p>
              </div>

              {/* Referencias y próximas mejoras */}
              <h3 className="font-display text-base font-semibold mb-2">Referencias principales</h3>
              <ul className="text-xs text-[#1F2A24]/60 space-y-0.5">
                <li>· CIRIA SuDS Manual C753</li>
                <li>· EPA Stormwater Capture / Green Infrastructure</li>
                <li>· NRCS TR-55 · Urban Hydrology for Small Watersheds</li>
                <li>· Chow, Maidment & Mays — Applied Hydrology</li>
                <li>· Gumbel (1958) — Statistics of Extremes</li>
                <li>· Datos: FONAG (acceso libre) · 12 estaciones · 2020-2026</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-5 py-8 font-body">
        {/* Step 1: Estación */}
        <Section number="01" title={userLevel === "simple" ? "¿Cuál es tu zona?" : "Tu estación más cercana"}>
          {userLevel === "simple" && (
            <p className="text-sm text-[#1F2A24]/60 mb-3">
              Elige la zona de Quito más cercana a tu casa o terreno. Usamos los datos de lluvia medidos ahí.
            </p>
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca por nombre de estación o zona…"
            className="w-full rounded-xl border border-[#1F2A24]/15 bg-white px-4 py-3 text-sm mb-3 outline-none focus:ring-2 focus:ring-[#2F6F5E] placeholder:text-[#1F2A24]/35"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
            {filteredStations.map((s) => (
              <button
                key={s.id}
                onClick={() => setStationId(s.id)}
                className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                  stationId === s.id
                    ? "border-[#2F6F5E] bg-[#2F6F5E]/10"
                    : "border-[#1F2A24]/10 bg-white hover:border-[#2F6F5E]/40"
                }`}
              >
                <div className="font-medium text-sm">{s.name}</div>
                <div className="text-xs text-[#1F2A24]/50 mt-0.5">{s.zona}</div>
              </button>
            ))}
            {filteredStations.length === 0 && (
              <div className="text-sm text-[#1F2A24]/50 col-span-full py-4 text-center">
                No se encontró ninguna estación con ese nombre.
              </div>
            )}
          </div>
        </Section>

        {/* Step 2: Escenario */}
        {station && (
          <Section number="02" title={userLevel === "simple" ? "¿Qué tan fuerte es la lluvia que quieres manejar?" : "Lluvia de diseño"}>
            {userLevel === "simple" ? (
              <div className="grid sm:grid-cols-2 gap-3">
                <ScenarioCard active={scenario === "p90"} onClick={() => { setScenario("p90"); setCustomRain(""); }}
                  label="Lluvia de todos los días"
                  desc="La lluvia común que cae seguido en tu zona. Útil para que el agua del día a día no se acumule."
                  value={`${fmt(station.p90Duracion, 0)} mm`} />
                <ScenarioCard active={scenario === "p95"} onClick={() => { setScenario("p95"); setCustomRain(""); }}
                  label="Lluvia fuerte (riesgo de inundación)"
                  desc="Una lluvia fuerte que no cae tan seguido, pero que puede causar inundaciones si no estás preparado."
                  value={`${fmt(station.p95Extremos, 0)} mm`} />
              </div>
            ) : (
              <div>
                {/* Grupo 1: SUDS */}
                <p className="text-xs font-semibold text-[#2F6F5E] uppercase tracking-wider mb-2">
                  Diseño SUDS — volumen a capturar (P90/P95 de eventos)
                </p>
                <div className="grid sm:grid-cols-2 gap-2 mb-4">
                  <ScenarioCard active={scenario === "p90"} onClick={() => { setScenario("p90"); setCustomRain(""); }}
                    label="P90 — Control de volumen (90% de eventos capturados)"
                    desc="Percentil 90 del volumen total de eventos completos. Dimensiona el tamaño del SUDS para manejo cotidiano. Ref: EPA Stormwater Capture / CIRIA SuDS Manual C753."
                    value={`${fmt(station.p90Duracion, 1)} mm`} />
                  <ScenarioCard active={scenario === "p95"} onClick={() => { setScenario("p95"); setCustomRain(""); }}
                    label="P95 — Control ampliado (95% de eventos capturados)"
                    desc="Percentil 95 del volumen total de eventos. Diseño conservador para zonas con mayor exposición."
                    value={`${fmt(station.p95Extremos, 1)} mm`} />
                </div>
                {/* Grupo 2: TR (Gumbel) */}
                <p className="text-xs font-semibold text-[#1F2A24]/50 uppercase tracking-wider mb-2">
                  Gestión de riesgos / alcantarillado — intensidad pico (Gumbel · duración 2h)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {[
                    { key: "tr2",  label: "TR 2 años",  mm: station.tr2_mm,  hint: "Alcant. domiciliario" },
                    { key: "tr5",  label: "TR 5 años",  mm: station.tr5_mm,  hint: "Alcant. secundario" },
                    { key: "tr10", label: "TR 10 años", mm: station.tr10_mm, hint: "Colectores" },
                    { key: "tr25", label: "TR 25 años", mm: station.tr25_mm, hint: "Infraestructura mayor" },
                  ].map(({ key, label, mm, hint }) => (
                    <button key={key} onClick={() => { setScenario(key); setCustomRain(""); }}
                      className={`text-left rounded-xl border p-3 transition-colors ${scenario === key ? "border-[#2F6F5E] bg-[#2F6F5E]/10" : "border-[#1F2A24]/10 bg-white hover:border-[#2F6F5E]/40"}`}>
                      <div className="font-medium text-xs">{label}</div>
                      <div className="font-display text-lg font-semibold text-[#2F6F5E]">{fmt(mm, 1)} mm</div>
                      <div className="text-xs text-[#1F2A24]/45">{hint}</div>
                    </button>
                  ))}
                </div>
                {/* Valor personalizado */}
                <div className="flex items-center gap-3 bg-[#1F2A24]/3 rounded-xl px-4 py-3">
                  <span className="text-xs text-[#1F2A24]/60 shrink-0">O ingresa tu propia lluvia de diseño:</span>
                  <input type="number" min="0" placeholder="ej. 60"
                    value={customRain}
                    onChange={(e) => { setCustomRain(e.target.value); if (e.target.value) setScenario("custom"); }}
                    className="w-24 rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#2F6F5E]" />
                  <span className="text-xs text-[#1F2A24]/50">mm</span>
                </div>
              </div>
            )}
            <p className="text-xs text-[#1F2A24]/45 mt-2 flex items-start gap-1.5">
              <Info size={13} className="mt-0.5 shrink-0" />
              {userLevel === "simple"
                ? "Calculado con datos reales de lluvia horaria 2020-2026 de tu estación, registrados por FONAG."
                : `Estación: ${station.name} (${station.code}) · Elevación: ${station.elevationM} m · Lluvia activa: ${fmt(rainMm, 1)} mm${customRain ? " (valor personalizado)" : ` (${scenario.toUpperCase()})`}`
              }
            </p>
          </Section>
        )}

        {/* Step 3: Área y superficie */}
        {station && (
          <Section number="03" title={userLevel === "simple" ? "¿Qué tan grande es tu espacio?" : "Tu lote o techo"}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#1F2A24]/60 mb-1.5 block">
                  {userLevel === "simple" ? "Tamaño de tu techo o patio (m²)" : "Área aportante (m²)"}
                </label>
                <input
                  type="number"
                  min="0"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Ej: 80"
                  className="w-full rounded-xl border border-[#1F2A24]/15 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2F6F5E]"
                />
                {userLevel === "simple" && (
                  <p className="text-xs text-[#1F2A24]/45 mt-1">
                    Es el área desde donde cae el agua de lluvia: tu techo, tu patio, o ambos.
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-[#1F2A24]/60 mb-1.5 block">Tipo de superficie</label>
                <select
                  value={surfaceId}
                  onChange={(e) => setSurfaceId(e.target.value)}
                  className="w-full rounded-xl border border-[#1F2A24]/15 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2F6F5E]"
                >
                  {SURFACES.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </Section>
        )}

        {/* Step 4: Tipo de SUDS */}
        {station && areaNum > 0 && (
          <Section number="04" title={userLevel === "simple" ? "¿Qué quieres construir?" : "Tipo de SUDS"}>
            <div className="flex flex-wrap gap-2">
              {SUDS_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSudsId(t.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                    sudsId === t.id
                      ? "bg-[#1F2A24] text-[#F6F4EE] border-[#1F2A24]"
                      : "bg-white border-[#1F2A24]/15 hover:border-[#1F2A24]/40"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {userLevel === "simple" && (
              <p className="text-xs text-[#1F2A24]/55 mt-2">
                {sudsId === "biorretencion" && "Un jardín hundido que deja que el agua se filtre lentamente al suelo, en vez de correr hacia la calle."}
                {sudsId === "permeable" && "Un piso especial que deja pasar el agua hacia abajo, en vez de que resbale por encima como en el cemento normal."}
                {sudsId === "zanja" && "Una zanja larga y angosta, rellena de piedra, que guarda el agua bajo tierra mientras se filtra poco a poco al suelo."}
                {sudsId === "deposito" && "Una caja enterrada bajo el parqueadero, rellena de piedra, que guarda agua de lluvia bajo el piso sin ocupar espacio en superficie."}
                {sudsId === "cisterna" && "Un tanque que guarda el agua de lluvia para usarla después, por ejemplo para regar o limpiar."}
              </p>
            )}

            {sudsId === "zanja" && (
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-xs font-medium text-[#1F2A24]/60 mb-1.5 block">Ancho de zanja (m)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={trenchWidth}
                    onChange={(e) => setTrenchWidth(e.target.value)}
                    className="w-full rounded-xl border border-[#1F2A24]/15 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2F6F5E]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#1F2A24]/60 mb-1.5 block">Profundidad de zanja (m)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={trenchDepth}
                    onChange={(e) => setTrenchDepth(e.target.value)}
                    className="w-full rounded-xl border border-[#1F2A24]/15 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2F6F5E]"
                  />
                </div>
              </div>
            )}

            {sudsId === "deposito" && (
              <div className="grid sm:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="text-xs font-medium text-[#1F2A24]/60 mb-1.5 block">Largo (m)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={chamberLength}
                    onChange={(e) => setChamberLength(e.target.value)}
                    className="w-full rounded-xl border border-[#1F2A24]/15 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2F6F5E]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#1F2A24]/60 mb-1.5 block">Ancho (m)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={chamberWidth}
                    onChange={(e) => setChamberWidth(e.target.value)}
                    className="w-full rounded-xl border border-[#1F2A24]/15 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2F6F5E]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#1F2A24]/60 mb-1.5 block">Profundidad (m)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={chamberDepth}
                    onChange={(e) => setChamberDepth(e.target.value)}
                    className="w-full rounded-xl border border-[#1F2A24]/15 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2F6F5E]"
                  />
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Results */}
        {results && (
          <Section number="05" title={userLevel === "simple" ? "Lo que necesitas construir" : "Dimensionamiento sugerido"}>
            <div className="rounded-2xl border border-[#2F6F5E]/25 bg-[#2F6F5E]/[0.06] p-5 mb-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[#2F6F5E] mb-1">
                <Droplets size={16} />
                {userLevel === "simple" ? "Cuánta agua tienes que manejar" : "Volumen de escorrentía de diseño"}
              </div>
              <div className="font-display text-3xl font-semibold">{fmt(results.volL, 0)} L</div>
              <div className="text-xs text-[#1F2A24]/55 mt-1">
                {userLevel === "simple"
                  ? `Es lo que cae en tu espacio de ${fmt(areaNum,0)} m² durante este tipo de lluvia.`
                  : `${fmt(rainMm,0)} mm × ${fmt(areaNum,0)} m² × coef. ${surface.runoffCoef} (${surface.label.toLowerCase()})`
                }
              </div>
            </div>

            {sudsId === "biorretencion" && <BioResult r={results.bio} areaAportante={areaNum} userLevel={userLevel} />}
            {sudsId === "permeable" && <PermeableResult r={results.perm} userLevel={userLevel} />}
            {sudsId === "zanja" && <TrenchResult r={results.trench} userLevel={userLevel} />}
            {sudsId === "deposito" && <ChamberResult r={results.chamber} userLevel={userLevel} />}
            {sudsId === "cisterna" && <CisternResult r={results.cist} userLevel={userLevel} />}

            {/* Presupuesto referencial */}
            <div className="mt-6 border-t border-[#1F2A24]/10 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-display font-semibold">Presupuesto referencial</span>
                <span className="text-xs text-[#1F2A24]/45 bg-[#1F2A24]/5 rounded-full px-2 py-0.5">Municipio Rumiñahui 2026</span>
              </div>
              <BudgetTable budget={results.budgets[sudsId]} userLevel={userLevel} />
            </div>

            <div className="mt-5 rounded-xl border border-amber-300/50 bg-amber-50 p-4 flex gap-2.5 text-xs text-amber-900">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <p>
                {userLevel === "simple"
                  ? "Este resultado es una guía inicial para conversar con un arquitecto o ingeniero, no un diseño final listo para construir."
                  : "Resultado orientativo con métodos estándar simplificados (NRCS / volumen de captura). No reemplaza un diseño hidráulico detallado ni la verificación de un ingeniero. Útil como punto de partida para anteproyecto."
                }
              </p>
            </div>
          </Section>
        )}
        {/* VISTA TÉCNICA AVANZADA */}
        {results && userLevel === "tecnico" && station && (
          <Section number="06" title="Análisis técnico">
            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-[#1F2A24]/5 rounded-xl p-1">
              {[
                { key: "lluvias",        label: "Tabla de lluvias" },
                { key: "estacionalidad", label: "Estacionalidad" },
                { key: "hietograma",     label: "Hietograma" },
                { key: "metodo",         label: "Método de cálculo" },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setTechTab(key)}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${techTab === key ? "bg-white shadow-sm text-[#1F2A24]" : "text-[#1F2A24]/50 hover:text-[#1F2A24]/80"}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Tab: Tabla de lluvias */}
            {techTab === "lluvias" && (
              <div>
                <p className="text-xs text-[#1F2A24]/50 mb-3">
                  Todos los escenarios para la estación <strong>{station.name}</strong> · Datos FONAG 2020-2026 · Distribución de Gumbel ajustada a máximos anuales (duración 2h)
                </p>
                <div className="overflow-x-auto rounded-xl border border-[#1F2A24]/10 bg-white">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#1F2A24]/10 bg-[#1F2A24]/3">
                        <th className="text-left px-4 py-2.5 font-medium text-[#1F2A24]/60">Escenario</th>
                        <th className="text-right px-4 py-2.5 font-medium text-[#1F2A24]/60">Lluvia (mm)</th>
                        <th className="text-right px-4 py-2.5 font-medium text-[#1F2A24]/60">Intensidad (mm/h)</th>
                        <th className="text-left px-4 py-2.5 font-medium text-[#1F2A24]/60">Uso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: "P90 eventos (frecuente SUDS)", mm: station.p90Duracion, inth: (station.p90Duracion/station.eventDurationH), uso: "Dimensionamiento SUDS — control de volumen cotidiano", cat: "suds" },
                        { label: "P95 eventos (conservador SUDS)", mm: station.p95Extremos, inth: (station.p95Extremos/station.eventDurationH), uso: "SUDS en zonas de mayor exposición", cat: "suds" },
                        { label: "TR 2 años (Gumbel · 2h)", mm: station.tr2_mm, inth: station.int_tr2, uso: "Alcantarillado domiciliario", cat: "tr" },
                        { label: "TR 5 años (Gumbel · 2h)", mm: station.tr5_mm, inth: station.int_tr5, uso: "Alcantarillado secundario", cat: "tr" },
                        { label: "TR 10 años (Gumbel · 2h)", mm: station.tr10_mm, inth: station.int_tr10, uso: "Colectores principales", cat: "tr" },
                        { label: "TR 25 años (Gumbel · 2h)", mm: station.tr25_mm, inth: station.int_tr25, uso: "Infraestructura mayor / puentes", cat: "tr" },
                      ].map((row, i) => (
                        <tr key={i} className={`border-b border-[#1F2A24]/5 ${row.cat === "suds" ? "bg-[#2F6F5E]/5" : ""}`}>
                          <td className="px-4 py-2.5">{row.label}</td>
                          <td className="px-4 py-2.5 text-right font-medium">{fmt(row.mm, 1)}</td>
                          <td className="px-4 py-2.5 text-right">{fmt(row.inth, 1)}</td>
                          <td className="px-4 py-2.5 text-[#1F2A24]/50">{row.uso}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-[#1F2A24]/40 mt-2">
                  Verde = escenarios SUDS (captura/retención). Blanco = períodos de retorno para diseño convencional (alcantarillado, puentes). Ref: Gumbel (1958), Chow/Maidment/Mays — Applied Hydrology.
                </p>
              </div>
            )}

            {/* Tab: Estacionalidad */}
            {techTab === "estacionalidad" && (
              <div>
                {/* Aviso crítico para cisternas */}
                {sudsId === "cisterna" && (
                  <div className="rounded-xl border border-amber-300/50 bg-amber-50 p-4 mb-4 flex gap-2.5 text-xs text-amber-900">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-1">⚠ Advertencia de estacionalidad para cisternas</p>
                      <p>En <strong>{station.mesSeco}</strong> llueve solo {fmt(station.lluvia_mes_seco, 0)} mm promedio — la cisterna puede no llenarse durante semanas. No des por sentado que siempre habrá agua disponible. El SUDS funciona en la temporada lluviosa ({station.mesLluvioso}: {fmt(station.lluvia_mes_lluvioso, 0)} mm), pero necesita un plan de uso para la época seca.</p>
                    </div>
                  </div>
                )}

                {/* Fichas rápidas */}
                <div className="grid sm:grid-cols-3 gap-3 mb-4">
                  <div className="rounded-xl bg-[#2F6F5E]/8 border border-[#2F6F5E]/20 p-4">
                    <div className="text-xs text-[#2F6F5E] font-semibold mb-1">Mes más lluvioso</div>
                    <div className="font-display text-xl font-semibold capitalize">{station.mesLluvioso}</div>
                    <div className="text-xs text-[#1F2A24]/55 mt-0.5">{fmt(station.lluvia_mes_lluvioso, 0)} mm promedio</div>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-200/50 p-4">
                    <div className="text-xs text-amber-700 font-semibold mb-1">Mes más seco</div>
                    <div className="font-display text-xl font-semibold capitalize">{station.mesSeco}</div>
                    <div className="text-xs text-[#1F2A24]/55 mt-0.5">{fmt(station.lluvia_mes_seco, 0)} mm promedio</div>
                  </div>
                  <div className="rounded-xl bg-white border border-[#1F2A24]/10 p-4">
                    <div className="text-xs text-[#1F2A24]/50 font-semibold mb-1">Relación lluv./seco</div>
                    <div className="font-display text-xl font-semibold">{fmt(station.lluvia_mes_lluvioso / station.lluvia_mes_seco, 1)}×</div>
                    <div className="text-xs text-[#1F2A24]/55 mt-0.5">más lluvia en {station.mesLluvioso}</div>
                  </div>
                </div>

                {/* Gráfico de barras mensual */}
                <p className="text-xs text-[#1F2A24]/50 mb-2">
                  Climatología mensual · {station.name} · Lluvia media 2020-2026 (FONAG)
                </p>
                <div className="rounded-xl bg-white border border-[#1F2A24]/10 p-4">
                  {(() => {
                    const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
                    const maxMm = Math.max(...station.climatologia);
                    const CHART_H = 120; // px altura máxima de barra
                    const secos = ["jun","jul","ago","sep"];
                    return (
                      <div>
                        <p className="text-xs text-[#1F2A24]/40 mb-3">Lluvia acumulada mensual promedio (mm/mes) · serie 2020-2026</p>
                        <div style={{display:"flex", alignItems:"flex-end", gap:"4px", height: CHART_H + 20 + "px", marginBottom:"4px"}}>
                          {station.climatologia.map((mm, i) => {
                            const barH = Math.max(Math.round((mm / maxMm) * CHART_H), 3);
                            const esSeco = secos.includes(meses[i].toLowerCase().slice(0,3));
                            return (
                              <div key={i} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"2px", justifyContent:"flex-end"}}>
                                <span style={{fontSize:"10px", fontWeight:600, color: esSeco ? "#b45309" : "#0F6E56"}}>{mm}</span>
                                <div style={{
                                  width:"100%",
                                  height: barH + "px",
                                  background: esSeco ? "#fbbf24" : "#1D9E75",
                                  borderRadius:"3px 3px 0 0",
                                  opacity: esSeco ? 0.85 : 0.9
                                }}/>
                              </div>
                            );
                          })}
                        </div>
                        <div style={{display:"flex", gap:"4px", borderTop:"1px solid #e5e7eb", paddingTop:"4px"}}>
                          {meses.map((m, i) => (
                            <div key={i} style={{flex:1, textAlign:"center", fontSize:"7px", color:"#9ca3af"}}>{m}</div>
                          ))}
                        </div>
                        <div style={{display:"flex", gap:"16px", marginTop:"10px", fontSize:"11px", color:"#6b7280"}}>
                          <span style={{display:"flex", alignItems:"center", gap:"4px"}}><span style={{width:"10px",height:"10px",borderRadius:"2px",background:"#1D9E75",display:"inline-block"}}/>Temporada lluviosa</span>
                          <span style={{display:"flex", alignItems:"center", gap:"4px"}}><span style={{width:"10px",height:"10px",borderRadius:"2px",background:"#fbbf24",display:"inline-block"}}/>Época seca (jun-sep)</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <p className="text-xs text-[#1F2A24]/40 mt-2">
                  La variación estacional es clave para el diseño de cisternas: el sistema acumula agua en la temporada lluviosa y la consume en la época seca. En años con El Niño o La Niña, los valores pueden diferir significativamente del promedio histórico.
                </p>
              </div>
            )}

            {/* Tab: Hietograma */}
            {techTab === "hietograma" && (
              <div>
                <p className="text-xs text-[#1F2A24]/50 mb-3">
                  Distribución horaria del evento P90 observado · duración 2h · {station.name} · Hietograma real construido a partir de eventos históricos FONAG 2020-2026
                </p>
                <div className="rounded-xl bg-white border border-[#1F2A24]/10 p-5">
                  {(() => {
                    const maxMm = Math.max(...station.hietograma);
                    const CHART_H = 120;
                    return (
                      <div>
                        <p className="text-xs text-[#1F2A24]/40 mb-3">
                          Lluvia por hora del evento P90 (mm/h) · duración {station.hietograma.length}h · total {fmt(station.p90Duracion, 1)} mm
                        </p>
                        <div style={{display:"flex", alignItems:"flex-end", gap:"8px", height: CHART_H + 24 + "px", marginBottom:"6px"}}>
                          {station.hietograma.map((mm, i) => {
                            const barH = Math.max(Math.round((mm / maxMm) * CHART_H), 4);
                            return (
                              <div key={i} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"4px", justifyContent:"flex-end"}}>
                                <span style={{fontSize:"11px", fontWeight:600, color:"#0F6E56"}}>{fmt(mm,1)}</span>
                                <div style={{
                                  width:"100%",
                                  height: barH + "px",
                                  background:"#1D9E75",
                                  borderRadius:"4px 4px 0 0"
                                }}/>
                              </div>
                            );
                          })}
                        </div>
                        <div style={{display:"flex", gap:"8px", borderTop:"1px solid #e5e7eb", paddingTop:"6px"}}>
                          {station.hietograma.map((_, i) => (
                            <div key={i} style={{flex:1, textAlign:"center", fontSize:"11px", color:"#9ca3af"}}>h{i+1}</div>
                          ))}
                        </div>
                        <p className="text-xs text-[#1F2A24]/40 mt-3 text-center">
                          Hietograma real observado (FONAG 2020-2026) · eje Y en mm/h
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Tab: Método de cálculo */}
            {techTab === "metodo" && (
              <div className="space-y-4 text-xs text-[#1F2A24]/70 leading-relaxed">
                <div className="rounded-xl bg-white border border-[#1F2A24]/10 p-4">
                  <p className="font-semibold text-[#1F2A24] mb-1">1. Volumen de escorrentía</p>
                  <p className="font-mono bg-[#1F2A24]/5 rounded px-3 py-2 mb-1">V (L) = P (mm) × A (m²) × C</p>
                  <p>Donde: P = lluvia de diseño seleccionada · A = área aportante · C = coeficiente de escorrentía ({surface.runoffCoef} para {surface.label.toLowerCase()}). Método racional simplificado (NRCS TR-55).</p>
                  <p className="mt-1 font-medium text-[#2F6F5E]">Resultado actual: {fmt(results.volL / 1000, 3)} m³ ({fmt(results.volL, 0)} L)</p>
                </div>
                <div className="rounded-xl bg-white border border-[#1F2A24]/10 p-4">
                  <p className="font-semibold text-[#1F2A24] mb-1">2. Biorretención — área requerida</p>
                  <p className="font-mono bg-[#1F2A24]/5 rounded px-3 py-2 mb-1">A_bio = V / (d_ponding + d_sustrato × n)</p>
                  <p>d_ponding = 0.20 m · d_sustrato = 0.45 m · n (porosidad) = 0.30 · Ref: EPA LID Manual / CIRIA SuDS Manual C753.</p>
                </div>
                <div className="rounded-xl bg-white border border-[#1F2A24]/10 p-4">
                  <p className="font-semibold text-[#1F2A24] mb-1">3. Zanja / depósito de infiltración</p>
                  <p className="font-mono bg-[#1F2A24]/5 rounded px-3 py-2 mb-1">L_zanja = V / (ancho × prof × n_grava)</p>
                  <p>n_grava = 0.35 (porosidad típica de grava). El depósito bajo parqueadero verifica: V_captura = L × A × prof × n ≥ V diseño.</p>
                </div>
                <div className="rounded-xl bg-white border border-[#1F2A24]/10 p-4">
                  <p className="font-semibold text-[#1F2A24] mb-1">4. Pavimento permeable</p>
                  <p className="font-mono bg-[#1F2A24]/5 rounded px-3 py-2 mb-1">e_base = V / (A_pavimento × n_base)</p>
                  <p>n_base = 0.35. El espesor calculado se limita al rango constructivo típico 0.15–0.60 m.</p>
                </div>
                <div className="rounded-xl bg-white border border-[#1F2A24]/10 p-4">
                  <p className="font-semibold text-[#1F2A24] mb-1">5. Cisterna / tanque de detención</p>
                  <p className="font-mono bg-[#1F2A24]/5 rounded px-3 py-2 mb-1">V_cisterna = V × 1.10 · D = √(4V / π·h)</p>
                  <p>Factor de seguridad 1.10. Ciclo de vaciado: la cisterna debe vaciarse antes del siguiente evento — se usa el tiempo seco mediano entre eventos ({station.dryHours} h para {station.name}).</p>
                </div>
                <div className="rounded-xl bg-white border border-[#1F2A24]/10 p-4">
                  <p className="font-semibold text-[#1F2A24] mb-1">6. Períodos de retorno (Gumbel)</p>
                  <p className="font-mono bg-[#1F2A24]/5 rounded px-3 py-2 mb-1">X_T = μ + β·y_T · donde y_T = -ln(-ln(1-1/T))</p>
                  <p>μ = media · β = σ√6/π · Ajustado a máximos anuales móviles (ventana 2h) de la serie 2020-2026. Ref: Gumbel (1958), Chow/Maidment/Mays — Applied Hydrology.</p>
                </div>
                <p className="text-[#1F2A24]/40 text-xs">
                  Resultados orientativos para anteproyecto. No reemplazan diseño hidráulico detallado ni verificación de ingeniero. Metodología: Paulina Lima · Datos: FONAG (acceso libre).
                </p>
              </div>
            )}
          </Section>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-5 pb-10 pt-6 font-body">
        <div className="border-t border-[#1F2A24]/10 pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[#1F2A24]">
              Idea y desarrollo: <span className="font-display">Paulina Lima</span>
            </p>
            <p className="text-xs text-[#1F2A24]/50 mt-0.5">Docente · contacto próximamente</p>
          </div>
          <div className="text-xs text-[#1F2A24]/45 sm:text-right">
            <p>Datos de lluvia: <strong className="text-[#1F2A24]/60">FONAG</strong> (Fondo para la Protección del Agua), acceso libre.</p>
            <p>Metodología de dimensionamiento y desarrollo de la herramienta: autoría propia.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function BudgetTable({ budget, userLevel }) {
  if (!budget) return null;
  const simple = userLevel === "simple";
  return (
    <div>
      {simple ? (
        <div className="rounded-xl bg-white border border-[#1F2A24]/10 p-5">
          <p className="text-sm leading-relaxed">
            El costo referencial de construcción es de aproximadamente{" "}
            <strong className="text-[#2F6F5E]">${fmt(budget.total, 0)} USD</strong>{" "}
            (incluye un 20% de margen para imprevistos). Este valor es solo una guía para planificación — el costo real depende del sitio y del contratista.
          </p>
        </div>
      ) : (
        <div>
          <div className="overflow-x-auto rounded-xl border border-[#1F2A24]/10 bg-white">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1F2A24]/10 bg-[#1F2A24]/3">
                  <th className="text-left px-4 py-2.5 font-medium text-[#1F2A24]/60">Rubro</th>
                  <th className="text-right px-4 py-2.5 font-medium text-[#1F2A24]/60">Cant.</th>
                  <th className="text-right px-4 py-2.5 font-medium text-[#1F2A24]/60">Unid.</th>
                  <th className="text-right px-4 py-2.5 font-medium text-[#1F2A24]/60">P.Unit. USD</th>
                  <th className="text-right px-4 py-2.5 font-medium text-[#1F2A24]/60">Total USD</th>
                </tr>
              </thead>
              <tbody>
                {budget.items.map((item, i) => (
                  <tr key={i} className="border-b border-[#1F2A24]/5">
                    <td className="px-4 py-2">{item.desc}</td>
                    <td className="px-4 py-2 text-right">{fmt(item.qty, 2)}</td>
                    <td className="px-4 py-2 text-right text-[#1F2A24]/50">{item.unit}</td>
                    <td className="px-4 py-2 text-right">{fmt(item.p, 2)}</td>
                    <td className="px-4 py-2 text-right font-medium">{fmt(item.qty * item.p, 2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#1F2A24]/15 bg-[#1F2A24]/3">
                  <td colSpan={4} className="px-4 py-2.5 text-right text-[#1F2A24]/60 text-xs">Subtotal (sin imprevistos)</td>
                  <td className="px-4 py-2.5 text-right font-medium">${fmt(budget.subtotal, 2)}</td>
                </tr>
                <tr className="bg-[#2F6F5E]/8">
                  <td colSpan={4} className="px-4 py-2.5 text-right font-semibold text-[#2F6F5E] text-xs">Total + 20% imprevistos</td>
                  <td className="px-4 py-2.5 text-right font-display font-semibold text-[#2F6F5E]">${fmt(budget.total, 2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-xs text-[#1F2A24]/40 mt-2">
            Precios referenciales: Lista de Rubros Municipio de Rumiñahui, junio 2026. No incluyen utilidad del contratista ni IVA. Actualizar cada 6 meses.
          </p>
        </div>
      )}
    </div>
  );
}

function Section({ number, title, children }) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <span className="font-display text-xs text-[#2F6F5E] font-semibold">{number}</span>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <div className="h-px flex-1 bg-[#1F2A24]/10" />
      </div>
      {children}
    </section>
  );
}

function ScenarioCard({ active, onClick, label, desc, value }) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl border p-4 transition-colors ${
        active ? "border-[#2F6F5E] bg-white shadow-sm" : "border-[#1F2A24]/10 bg-white/60 hover:border-[#2F6F5E]/40"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium text-sm">{label}</span>
        <span className="font-display text-xl font-semibold text-[#2F6F5E]">{value}</span>
      </div>
      <p className="text-xs text-[#1F2A24]/55 mt-1">{desc}</p>
    </button>
  );
}

function StatBlock({ label, value, sub }) {
  return (
    <div className="rounded-xl bg-white border border-[#1F2A24]/10 p-4">
      <div className="text-xs text-[#1F2A24]/50 mb-1">{label}</div>
      <div className="font-display text-2xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-[#1F2A24]/45 mt-0.5">{sub}</div>}
    </div>
  );
}

function BioResult({ r, areaAportante, userLevel }) {
  const tooSmall = r.pctOfAportante > 40;
  const simple = userLevel === "simple";
  return (
    <div>
      {simple ? (
        <div className="rounded-xl bg-white border border-[#1F2A24]/10 p-5">
          <p className="text-sm leading-relaxed">
            Necesitas un jardín hundido de aproximadamente <strong>{fmt(r.areaM2)} m²</strong> — eso es {fmt(r.pctOfAportante,0)}% del tamaño de tu techo o patio.
            Debe tener una hondura de unos <strong>{fmt(r.pondingDepth * 100, 0)} cm</strong> donde se junta el agua, sobre una capa de tierra especial de <strong>{fmt(r.mediaDepth * 100, 0)} cm</strong> que deja pasar el agua hacia el suelo.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-3">
          <StatBlock label="Área de biorretención" value={`${fmt(r.areaM2)} m²`} sub={`≈ ${fmt(r.pctOfAportante,0)}% del área aportante`} />
          <StatBlock label="Profundidad de ponding" value={`${fmt(r.pondingDepth * 100, 0)} cm`} sub="almacenamiento superficial" />
          <StatBlock label="Espesor de sustrato" value={`${fmt(r.mediaDepth * 100, 0)} cm`} sub="medio filtrante (suelo + arena)" />
        </div>
      )}
      {tooSmall && (
        <p className="text-xs text-[#1F2A24]/55 mt-2">
          {simple
            ? "Ese jardín ocuparía bastante espacio de tu lote. Podrías combinarlo con un piso permeable o una cisterna para repartir el agua entre los dos."
            : "El área requerida supera ~40% del lote aportante: considera combinarlo con pavimento permeable o una cisterna para repartir el volumen."
          }
        </p>
      )}
    </div>
  );
}

function PermeableResult({ r, userLevel }) {
  const simple = userLevel === "simple";
  if (simple) {
    return (
      <div className="rounded-xl bg-white border border-[#1F2A24]/10 p-5">
        <p className="text-sm leading-relaxed">
          Bajo el piso permeable necesitas una capa de grava de unos <strong>{fmt(r.baseDepth * 100, 0)} cm</strong> de espesor.
          Esa capa puede guardar aproximadamente el <strong>{fmt(r.coverage, 0)}%</strong> del agua que cae en ese espacio durante el evento elegido.
        </p>
      </div>
    );
  }
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      <StatBlock label="Espesor de base de grava" value={`${fmt(r.baseDepth * 100, 0)} cm`} sub="porosidad de base ≈ 35%" />
      <StatBlock label="Capacidad de captura" value={`${fmt(r.coverage, 0)}%`} sub="del volumen de diseño" />
      <StatBlock label="Volumen objetivo" value={`${fmt(r.volumeM3, 2)} m³`} />
    </div>
  );
}

function TrenchResult({ r, userLevel }) {
  const simple = userLevel === "simple";
  const tooLong = r.length > 30;
  if (simple) {
    return (
      <div>
        <div className="rounded-xl bg-white border border-[#1F2A24]/10 p-5">
          <p className="text-sm leading-relaxed">
            Necesitas una zanja de aproximadamente <strong>{fmt(r.length)} m</strong> de largo, por <strong>{fmt(r.width, 2)} m</strong> de ancho y <strong>{fmt(r.depth, 2)} m</strong> de profundidad, rellena de piedra (grava).
          </p>
        </div>
        {tooLong && (
          <p className="text-xs text-[#1F2A24]/55 mt-2">
            Esa zanja sería bastante larga para un lote pequeño. Podrías dividirla en varios tramos más cortos, o combinarla con otro tipo de SUDS.
          </p>
        )}
      </div>
    );
  }
  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-3">
        <StatBlock label="Largo de zanja" value={`${fmt(r.length)} m`} sub={`para ${fmt(r.volumeM3, 2)} m³ de captura`} />
        <StatBlock label="Ancho" value={`${fmt(r.width, 2)} m`} sub="definido por ti" />
        <StatBlock label="Profundidad" value={`${fmt(r.depth, 2)} m`} sub={`relleno con porosidad ≈ ${r.voidRatio * 100}%`} />
      </div>
      {tooLong && (
        <p className="text-xs text-[#1F2A24]/55 mt-2">
          El largo requerido supera ~30 m: considera dividir en varios tramos en paralelo o combinar con otro SUDS para repartir el volumen.
        </p>
      )}
    </div>
  );
}

function ChamberResult({ r, userLevel }) {
  const simple = userLevel === "simple";
  if (simple) {
    return (
      <div className="rounded-xl bg-white border border-[#1F2A24]/10 p-5">
        <p className="text-sm leading-relaxed">
          Esa caja rellena de piedra puede guardar aproximadamente <strong>{fmt(r.captureVolumeM3, 2)} m³</strong> de agua.
          {r.sufficient ? (
            <> Esto alcanza para el agua que necesitas captar — {fmt(r.coveragePct, 0)}% de lo necesario.</>
          ) : (
            <> Esto cubre el {fmt(r.coveragePct, 0)}% del agua que necesitas captar — todavía no es suficiente, conviene agrandar la caja o sumar otro SUDS.</>
          )}
        </p>
      </div>
    );
  }
  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-3">
        <StatBlock label="Volumen bruto de la caja" value={`${fmt(r.grossVolumeM3, 2)} m³`} sub="largo × ancho × profundidad" />
        <StatBlock label="Volumen de captura" value={`${fmt(r.captureVolumeM3, 2)} m³`} sub={`porosidad de relleno ≈ ${r.voidRatio * 100}%`} />
        <StatBlock label="Cobertura" value={`${fmt(r.coveragePct, 0)}%`} sub={`de ${fmt(r.volumeNeededM3, 2)} m³ requeridos`} />
      </div>
      {!r.sufficient && (
        <p className="text-xs text-[#1F2A24]/55 mt-2">
          La caja no alcanza a captar todo el volumen de diseño: considera ampliar sus dimensiones o combinarla con otro SUDS para repartir el volumen restante.
        </p>
      )}
    </div>
  );
}

function CisternResult({ r, userLevel }) {
  const simple = userLevel === "simple";
  if (simple) {
    return (
      <div className="rounded-xl bg-white border border-[#1F2A24]/10 p-5">
        <p className="text-sm leading-relaxed">
          Necesitas una cisterna de aproximadamente <strong>{fmt(r.volumeM3, 2)} m³</strong> (unos {fmt(r.volumeM3*1000,0)} litros).
          Si es cilíndrica y de {r.heightAssumed} m de alto, tendría cerca de <strong>{fmt(r.diameter, 2)} m</strong> de diámetro.
          Conviene vaciarla cada <strong>{r.emptyByHours} horas</strong> aproximadamente, para que esté lista antes de la siguiente lluvia.
        </p>
      </div>
    );
  }
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      <StatBlock label="Volumen de cisterna" value={`${fmt(r.volumeM3, 2)} m³`} sub="con 10% de seguridad" />
      <StatBlock label="Diámetro sugerido" value={`${fmt(r.diameter, 2)} m`} sub={`altura asumida ${r.heightAssumed} m`} />
      <StatBlock label="Vaciar antes de" value={`${r.emptyByHours} h`} sub={`tiempo seco mediano: ${r.dryHours} h`} />
    </div>
  );
}
