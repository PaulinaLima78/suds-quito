// ---------------------------------------------------------------------------
// SUDS Quito · Buscador de SUDS por barrio
// © 2026 Paulina Lima. Todos los derechos reservados.
//
// DATOS DE LLUVIA — extraídos de Analisis_Lluvias_Quito_COMPLETO.xlsx
// hojas: Tabla_diseno_estacion + IDF_Gumbel + Hietograma_diseno
// Script de análisis de lluvias horarias 2020-2026 · 12 estaciones FONAG
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
//    TR2-5: alcantarillado domiciliario · TR10: colectores · TR25: infraestr.
//
// hietograma: lluvia de las 2 horas más intensas del evento P90 observado.
// climatologia / nino2023 / nino2024: lluvia mensual (mm), ene→dic.
//   Un 0.0 en nino2023/nino2024 suele indicar MES SIN REGISTRO, no lluvia nula
//   (ver monthsMissing en src/lib/climate.js).
//
// v2.0: corregidas las zonas de P03, P71 y P72 (están al norte de Quito,
// latitud > -0.14°; antes decían "Sur").
// ---------------------------------------------------------------------------
export const STATIONS = [
  { id: "rumihurco",      name: "Rumihurco - Machángara", code: "P03", zona: "Norte (cuenca Machángara)", lat: -0.130678, lon: -78.526703, elevationM: 3245, p90Duracion: 20.1, p95Extremos: 30.3, tr2_mm: 33.5,  tr5_mm: 38.3,  tr10_mm: 41.5,  tr25_mm: 45.5,  int_tr2: 16.8, int_tr5: 19.2, int_tr10: 20.7, int_tr25: 22.7, dryHours: 16, eventDurationH: 5, recomendacion: "SUDS robusto",   hietograma: [5.93, 6.43], mesLluvioso: "octubre", lluvia_mes_lluvioso: 182.3, mesSeco: "agosto",  lluvia_mes_seco: 30.6, climatologia: [88.7,106.5,162.1,173.2,114.7,53.0,31.2,30.6,61.1,182.3,76.6,120.8], nino2023: [198.9,85.4,198.8,167.8,144.7,23.1,76.8,32.1,63.2,175.8,15.7,0.0], nino2024: [0.0,0.0,0.0,166.0,70.1,34.9,2.7,1.4,43.7,109.0,20.6,307.7] },
  { id: "rumipamba",      name: "Rumipamba (Bodegas)",    code: "P08", zona: "Centro",                     lat: -0.180912, lon: -78.509943, elevationM: 3005, p90Duracion: 22.8, p95Extremos: 32.5, tr2_mm: 36.5,  tr5_mm: 42.2,  tr10_mm: 46.0,  tr25_mm: 50.8,  int_tr2: 18.2, int_tr5: 21.1, int_tr10: 23.0, int_tr25: 25.4, dryHours: 20, eventDurationH: 4, recomendacion: "SUDS robusto",   hietograma: [5.60, 8.19], mesLluvioso: "marzo",   lluvia_mes_lluvioso: 222.3, mesSeco: "julio",   lluvia_mes_seco: 32.5, climatologia: [132.5,149.4,222.3,203.7,91.8,68.6,32.6,37.3,57.4,172.9,108.0,160.6], nino2023: [259.0,109.6,283.0,291.3,69.0,39.3,37.9,53.6,48.7,199.4,108.8,264.1], nino2024: [39.9,213.9,151.8,279.2,121.3,81.9,16.6,13.5,37.1,96.9,20.9,237.7] },
  { id: "inaquito",       name: "Iñaquito (INAMHI)",      code: "P09", zona: "Centro-norte",               lat: -0.178354, lon: -78.487680, elevationM: 2804, p90Duracion: 18.3, p95Extremos: 26.8, tr2_mm: 30.8,  tr5_mm: 36.0,  tr10_mm: 39.5,  tr25_mm: 43.8,  int_tr2: 15.4, int_tr5: 18.0, int_tr10: 19.7, int_tr25: 21.9, dryHours: 17, eventDurationH: 4, recomendacion: "SUDS medio",     hietograma: [3.90, 7.80], mesLluvioso: "marzo",   lluvia_mes_lluvioso: 181.7, mesSeco: "julio",   lluvia_mes_seco: 27.9, climatologia: [96.7,105.9,181.7,106.3,75.9,56.3,27.8,30.2,43.2,138.3,77.9,110.4], nino2023: [179.3,83.2,207.3,80.0,74.1,28.0,41.3,40.1,27.5,145.6,78.5,201.2], nino2024: [27.8,147.3,133.7,211.4,87.2,63.0,13.4,14.4,0.2,97.7,23.7,140.6] },
  { id: "cumbaya",        name: "Cumbayá",                code: "P13", zona: "Valle de Cumbayá",           lat: -0.213443, lon: -78.429960, elevationM: 2339, p90Duracion: 19.7, p95Extremos: 28.4, tr2_mm: 37.4,  tr5_mm: 42.7,  tr10_mm: 46.2,  tr25_mm: 50.7,  int_tr2: 18.7, int_tr5: 21.4, int_tr10: 23.1, int_tr25: 25.3, dryHours: 23, eventDurationH: 3, recomendacion: "SUDS medio",     hietograma: [7.58, 5.38], mesLluvioso: "abril",   lluvia_mes_lluvioso: 165.8, mesSeco: "julio",   lluvia_mes_seco: 16.6, climatologia: [69.0,83.4,140.7,165.8,49.6,30.8,16.6,16.8,45.7,144.9,77.1,80.8], nino2023: [115.5,51.5,159.3,185.2,98.9,1.6,42.1,23.0,21.3,143.6,106.4,170.2], nino2024: [24.2,152.4,71.3,316.2,53.7,47.3,8.7,13.2,42.9,136.4,39.0,38.7] },
  { id: "izobamba",       name: "Izobamba",               code: "P16", zona: "Sur (rural)",                lat: -0.365945, lon: -78.555140, elevationM: 3046, p90Duracion: 17.9, p95Extremos: 24.8, tr2_mm: 35.9,  tr5_mm: 44.2,  tr10_mm: 49.7,  tr25_mm: 56.7,  int_tr2: 18.0, int_tr5: 22.1, int_tr10: 24.9, int_tr25: 28.3, dryHours: 15, eventDurationH: 4, recomendacion: "SUDS medio",     hietograma: [6.00, 5.80], mesLluvioso: "abril",   lluvia_mes_lluvioso: 194.1, mesSeco: "agosto",  lluvia_mes_seco: 40.5, climatologia: [92.0,130.3,186.4,194.1,111.1,63.1,41.8,40.5,64.4,144.3,125.2,176.8], nino2023: [43.7,72.9,184.2,239.8,99.3,25.0,75.3,39.2,55.1,152.2,131.2,225.5], nino2024: [71.9,187.9,142.3,122.5,0.0,0.0,0.0,7.4,40.3,107.6,56.9,275.1] },
  { id: "chillogallo",    name: "Chillogallo",            code: "P22", zona: "Sur",                        lat: -0.278181, lon: -78.585716, elevationM: 3202, p90Duracion: 12.3, p95Extremos: 16.8, tr2_mm: 29.4,  tr5_mm: 41.2,  tr10_mm: 49.1,  tr25_mm: 59.0,  int_tr2: 14.7, int_tr5: 20.6, int_tr10: 24.5, int_tr25: 29.5, dryHours: 16, eventDurationH: 4, recomendacion: "SUDS medio",     hietograma: [4.30, 3.50], mesLluvioso: "marzo",   lluvia_mes_lluvioso: 139.1, mesSeco: "agosto",  lluvia_mes_seco: 39.6, climatologia: [55.0,72.8,139.1,130.8,91.4,53.9,40.3,39.6,45.4,99.6,83.5,100.9], nino2023: [93.0,55.5,178.8,170.9,116.5,15.4,32.8,50.4,44.5,138.9,73.1,116.0], nino2024: [28.0,66.5,15.3,32.3,79.5,60.3,9.2,12.7,26.5,66.4,31.0,95.8] },
  { id: "atacazo",        name: "Atacazo",                code: "P23", zona: "Sur-occidente (ladera)",     lat: -0.318317, lon: -78.601764, elevationM: 3877, p90Duracion: 16.1, p95Extremos: 22.1, tr2_mm: 26.4,  tr5_mm: 31.9,  tr10_mm: 35.5,  tr25_mm: 40.1,  int_tr2: 13.2, int_tr5: 15.9, int_tr10: 17.7, int_tr25: 20.0, dryHours: 13, eventDurationH: 6, recomendacion: "SUDS medio",     hietograma: [1.10, 8.10], mesLluvioso: "marzo",   lluvia_mes_lluvioso: 194.4, mesSeco: "julio",   lluvia_mes_seco: 49.4, climatologia: [95.6,118.1,194.4,177.1,117.0,57.9,49.4,54.8,59.4,137.6,100.9,123.2], nino2023: [185.6,116.0,242.9,229.7,122.3,28.4,105.2,45.3,47.3,179.8,46.1,152.9], nino2024: [75.3,182.3,89.6,187.0,221.4,103.6,15.4,41.4,35.0,106.1,51.1,233.8] },
  { id: "san_francisco",  name: "San Francisco",          code: "P27", zona: "Centro histórico",           lat: -0.202191, lon: -78.539685, elevationM: 3551, p90Duracion: 24.1, p95Extremos: 35.1, tr2_mm: 33.7,  tr5_mm: 39.0,  tr10_mm: 42.5,  tr25_mm: 46.9,  int_tr2: 16.8, int_tr5: 19.5, int_tr10: 21.3, int_tr25: 23.5, dryHours: 14, eventDurationH: 5, recomendacion: "SUDS robusto",   hietograma: [2.30,12.30], mesLluvioso: "marzo",   lluvia_mes_lluvioso: 248.7, mesSeco: "julio",   lluvia_mes_seco: 45.5, climatologia: [175.9,203.8,248.7,240.7,142.4,95.1,45.5,52.2,95.6,221.6,119.1,199.2], nino2023: [292.9,125.0,244.4,217.6,145.0,24.4,40.2,60.6,65.8,200.7,147.8,330.2], nino2024: [92.2,291.9,154.8,479.2,221.5,80.7,29.5,4.3,35.6,190.3,42.4,253.6] },
  { id: "tanque_solanda", name: "Tanque - Solanda",       code: "P56", zona: "Sur",                        lat: -0.281734, lon: -78.530740, elevationM: 2916, p90Duracion: 16.9, p95Extremos: 22.5, tr2_mm: 30.1,  tr5_mm: 35.7,  tr10_mm: 39.4,  tr25_mm: 44.1,  int_tr2: 15.1, int_tr5: 17.9, int_tr10: 19.7, int_tr25: 22.0, dryHours: 18, eventDurationH: 4, recomendacion: "SUDS medio",     hietograma: [6.09, 5.20], mesLluvioso: "abril",   lluvia_mes_lluvioso: 137.5, mesSeco: "junio",   lluvia_mes_seco: 27.7, climatologia: [59.0,72.7,112.5,137.5,77.2,27.7,38.0,39.8,54.3,122.6,60.5,110.6], nino2023: [193.8,64.0,160.0,232.0,111.4,14.3,56.8,66.0,88.5,194.0,92.5,188.9], nino2024: [21.9,201.1,98.9,179.6,153.4,61.6,10.5,4.5,35.3,118.1,43.2,164.0] },
  { id: "cc_el_bosque",   name: "CC El Bosque",           code: "P70", zona: "Centro-norte",               lat: -0.161691, lon: -78.497363, elevationM: 2903, p90Duracion: 21.7, p95Extremos: 31.2, tr2_mm: 25.9,  tr5_mm: 28.0,  tr10_mm: 29.5,  tr25_mm: 31.3,  int_tr2: 12.9, int_tr5: 14.0, int_tr10: 14.7, int_tr25: 15.7, dryHours: 22, eventDurationH: 4, recomendacion: "SUDS robusto",   hietograma: [7.62, 5.21], mesLluvioso: "marzo",   lluvia_mes_lluvioso: 210.2, mesSeco: "julio",   lluvia_mes_seco: 22.8, climatologia: [109.0,125.6,210.2,170.6,75.4,42.1,22.8,25.9,50.1,142.1,94.6,138.8], nino2023: [220.2,102.4,275.3,235.6,68.3,15.3,43.8,32.4,47.1,160.1,91.7,197.9], nino2024: [12.8,146.6,139.5,286.4,62.8,44.5,10.5,11.2,31.3,100.6,13.9,247.4] },
  { id: "collaloma_medio",name: "Collaloma Medio",        code: "P71", zona: "Norte",                      lat: -0.122609, lon: -78.473210, elevationM: 2968, p90Duracion: 14.2, p95Extremos: 22.2, tr2_mm: 30.0,  tr5_mm: 34.2,  tr10_mm: 36.9,  tr25_mm: 40.4,  int_tr2: 15.0, int_tr5: 17.1, int_tr10: 18.5, int_tr25: 20.2, dryHours: 17, eventDurationH: 4, recomendacion: "SUDS medio",     hietograma: [6.99, 2.60], mesLluvioso: "marzo",   lluvia_mes_lluvioso:  79.6, mesSeco: "agosto",  lluvia_mes_seco: 14.7, climatologia: [32.6,40.0,79.6,66.4,30.5,31.0,19.0,14.7,15.6,50.7,22.7,42.8], nino2023: [0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0], nino2024: [0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0] },
  { id: "colinas_alto",   name: "Colinas del Alto",       code: "P72", zona: "Norte (ladera)",             lat: -0.102834, lon: -78.523052, elevationM: 3088, p90Duracion: 14.1, p95Extremos: 22.9, tr2_mm: 30.8,  tr5_mm: 39.7,  tr10_mm: 45.6,  tr25_mm: 53.1,  int_tr2: 15.4, int_tr5: 19.9, int_tr10: 22.8, int_tr25: 26.5, dryHours: 20, eventDurationH: 3, recomendacion: "SUDS medio",     hietograma: [1.30, 8.80], mesLluvioso: "marzo",   lluvia_mes_lluvioso:  80.5, mesSeco: "agosto",  lluvia_mes_seco:  9.2, climatologia: [31.8,48.0,80.5,43.7,38.8,28.8,10.2,9.2,24.1,46.4,19.8,27.1], nino2023: [131.5,48.5,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0], nino2024: [0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0] },
];

// Estaciones cuyo registro 2020-2026 tiene vacíos importantes (climatología
// anual < 50 % de la media del resto). Se muestran con aviso en la app.
// Fecha del análisis de lluvias de la autora y su vigencia. El análisis se
// actualiza una vez al año con los registros nuevos de las estaciones;
// al actualizar, cambiar estas tres constantes y los datos de STATIONS.
export const ANALYSIS = {
  date: "2026-06-20",          // primera publicación con estos resultados
  label: "junio de 2026",
  period: "2020-2026",
  nextUpdate: "2027-06-30",
  nextLabel: "junio de 2027",
};

/** true si ya pasó la fecha prevista de actualización anual del análisis. */
export function analysisOutdated(today = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  const iso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  return iso > ANALYSIS.nextUpdate;
}

export const PARTIAL_RECORD_STATIONS = ["collaloma_medio", "colinas_alto"];

// Lluvia anual acumulada (mm) — tabla comparativa El Niño 2023-2024.
// "prom" = promedio histórico sobre años con datos completos (≥10 meses),
// calculado en el análisis original. v23/v24 = acumulado del año.
export const NINO_TABLE = [
  { id: "rumihurco",      prom: 1317, v23: 1182, v24: 756  },
  { id: "rumipamba",      prom: 1582, v23: 1764, v24: 1311 },
  { id: "inaquito",       prom: 1154, v23: 1186, v24: 960  },
  { id: "cumbaya",        prom: 1011, v23: 1119, v24: 944  },
  { id: "izobamba",       prom: 1500, v23: 1343, v24: 1012 },
  { id: "chillogallo",    prom: 1043, v23: 1086, v24: 524  },
  { id: "atacazo",        prom: 1412, v23: 1502, v24: 1342 },
  { id: "san_francisco",  prom: 1900, v23: 1895, v24: 1876 },
  { id: "tanque_solanda", prom: 994,  v23: 1462, v24: 1092 },
  { id: "cc_el_bosque",   prom: 1329, v23: 1490, v24: 1108 },
];

export const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
export const MONTHS_LONG = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
