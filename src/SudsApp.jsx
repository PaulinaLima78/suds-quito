import React, { useState, useMemo } from "react";
import { Droplets, CloudRain, Layers, Box, Info, ChevronRight, AlertTriangle } from "lucide-react";

// ---------------------------------------------------------------------------
// DATA REAL — extraída de Analisis_Lluvias_Quito_COMPLETO.xlsx, hoja
// Tabla_diseno_estacion + IDF_Gumbel, generado por el script de análisis
// de lluvias horarias 2020-2026 (12 estaciones FONAG).
//
// p90Duracion: lluvia_p90_evento_mm — percentil 90 del tamaño de eventos
//   completos de lluvia. Escenario "frecuente": control de calidad y volumen,
//   método EPA Stormwater Capture / CIRIA SuDS Manual (C753).
// p95Extremos: lluvia_p95_evento_mm — percentil 95 del tamaño de eventos
//   completos. Escenario "extremo/riesgo": diseño conservador.
// tr10_2h_mm / tr25_2h_mm: lluvia de período de retorno 10 y 25 años para
//   duración de 2h, por ajuste de Gumbel a máximos anuales (Chow, Maidment &
//   Mays — Applied Hydrology). Disponible como referencia adicional en vista
//   técnica para diseño ante inundación.
// dryHours: tiempo seco mediano entre eventos (h) — usado para ciclo de
//   vaciado de cisternas.
// recomendacion: clasificación de robustez de SUDS según el script
//   (lluvia_p90_evento_mm: ≤10 liviano, ≤20 medio, ≤35 robusto, >35 crítico).
// ---------------------------------------------------------------------------
const STATIONS = [
  { id: "rumihurco", name: "Rumihurco - Machángara", code: "P03", zona: "Sur (cuenca Machángara)", lat: -0.130678, lon: -78.526703, elevationM: 3245, p90Duracion: 20.1, p95Extremos: 30.3, tr10_2h_mm: 41.5, tr25_2h_mm: 45.5, dryHours: 16, eventDurationH: 5, recomendacion: "SUDS robusto" },
  { id: "rumipamba", name: "Rumipamba (Bodegas)", code: "P08", zona: "Centro", lat: -0.180912, lon: -78.509943, elevationM: 3005, p90Duracion: 22.8, p95Extremos: 32.5, tr10_2h_mm: 46.0, tr25_2h_mm: 50.8, dryHours: 20, eventDurationH: 4, recomendacion: "SUDS robusto" },
  { id: "inaquito", name: "Iñaquito (INAMHI)", code: "P09", zona: "Centro-norte", lat: -0.178354, lon: -78.487680, elevationM: 2804, p90Duracion: 18.3, p95Extremos: 26.8, tr10_2h_mm: 39.5, tr25_2h_mm: 43.8, dryHours: 17, eventDurationH: 4, recomendacion: "SUDS medio" },
  { id: "cumbaya", name: "Cumbayá", code: "P13", zona: "Valle de Cumbayá", lat: -0.213443, lon: -78.429960, elevationM: 2339, p90Duracion: 19.7, p95Extremos: 28.4, tr10_2h_mm: 46.2, tr25_2h_mm: 50.7, dryHours: 23, eventDurationH: 3, recomendacion: "SUDS medio" },
  { id: "izobamba", name: "Izobamba", code: "P16", zona: "Sur (rural)", lat: -0.365945, lon: -78.555140, elevationM: 3046, p90Duracion: 17.9, p95Extremos: 24.8, tr10_2h_mm: 49.7, tr25_2h_mm: 56.7, dryHours: 15, eventDurationH: 4, recomendacion: "SUDS medio" },
  { id: "chillogallo", name: "Chillogallo", code: "P22", zona: "Sur", lat: -0.278181, lon: -78.585716, elevationM: 3202, p90Duracion: 12.3, p95Extremos: 16.8, tr10_2h_mm: 49.1, tr25_2h_mm: 59.0, dryHours: 16, eventDurationH: 4, recomendacion: "SUDS medio" },
  { id: "atacazo", name: "Atacazo", code: "P23", zona: "Sur-occidente (ladera)", lat: -0.318317, lon: -78.601764, elevationM: 3877, p90Duracion: 16.1, p95Extremos: 22.1, tr10_2h_mm: 35.5, tr25_2h_mm: 40.1, dryHours: 13, eventDurationH: 6, recomendacion: "SUDS medio" },
  { id: "san_francisco", name: "San Francisco", code: "P27", zona: "Centro histórico", lat: -0.202191, lon: -78.539685, elevationM: 3551, p90Duracion: 24.1, p95Extremos: 35.1, tr10_2h_mm: 42.5, tr25_2h_mm: 46.9, dryHours: 14, eventDurationH: 5, recomendacion: "SUDS robusto" },
  { id: "tanque_solanda", name: "Tanque - Solanda", code: "P56", zona: "Sur", lat: -0.281734, lon: -78.530740, elevationM: 2916, p90Duracion: 16.9, p95Extremos: 22.5, tr10_2h_mm: 39.4, tr25_2h_mm: 44.1, dryHours: 18, eventDurationH: 4, recomendacion: "SUDS medio" },
  { id: "cc_el_bosque", name: "CC El Bosque", code: "P70", zona: "Centro-norte", lat: -0.161691, lon: -78.497363, elevationM: 2903, p90Duracion: 21.7, p95Extremos: 31.2, tr10_2h_mm: 29.5, tr25_2h_mm: 31.3, dryHours: 22, eventDurationH: 4, recomendacion: "SUDS robusto" },
  { id: "collaloma_medio", name: "Collaloma Medio", code: "P71", zona: "Sur", lat: -0.122609, lon: -78.473210, elevationM: 2968, p90Duracion: 14.2, p95Extremos: 22.2, tr10_2h_mm: 36.9, tr25_2h_mm: 40.4, dryHours: 17, eventDurationH: 4, recomendacion: "SUDS medio" },
  { id: "colinas_alto", name: "Colinas del Alto", code: "P72", zona: "Sur (ladera)", lat: -0.102834, lon: -78.523052, elevationM: 3088, p90Duracion: 14.1, p95Extremos: 22.9, tr10_2h_mm: 45.6, tr25_2h_mm: 53.1, dryHours: 20, eventDurationH: 3, recomendacion: "SUDS medio" },
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

  // Datos reales del análisis de lluvias horarias 2020-2026 (FONAG), procesados
  // por Paulina Lima: P90 = curva de duración (frecuente), P95 = eventos
  // extremos (riesgo). Ver Analisis_Lluvias_Quito_COMPLETO.xlsx.
  const rainMm = station ? (scenario === "p90" ? station.p90Duracion : station.p95Extremos) : 0;

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
    return { volL, bio, perm, trench, chamber, cist };
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
          <Section number="02" title={userLevel === "simple" ? "¿Qué tan fuerte es la lluvia que quieres manejar?" : "Escenario de lluvia"}>
            <div className="grid sm:grid-cols-2 gap-3">
              <ScenarioCard
                active={scenario === "p90"}
                onClick={() => setScenario("p90")}
                label={userLevel === "simple" ? "Lluvia de todos los días" : "Lluvia frecuente (P90 de eventos)"}
                desc={
                  userLevel === "simple"
                    ? "La lluvia común que cae seguido en tu zona. Útil para que el agua del día a día no se acumule."
                    : "Percentil 90 del tamaño de los eventos de lluvia completos (no del máximo anual). Control de calidad y volumen — método EPA Stormwater Capture / CIRIA SuDS Manual."
                }
                value={`${fmt(rainMm0("p90", station), 0)} mm`}
              />
              <ScenarioCard
                active={scenario === "p95"}
                onClick={() => setScenario("p95")}
                label={userLevel === "simple" ? "Lluvia fuerte (riesgo de inundación)" : "Lluvia intensa de riesgo (P95 de eventos)"}
                desc={
                  userLevel === "simple"
                    ? "Una lluvia fuerte que no cae tan seguido, pero que puede causar inundaciones si no estás preparado."
                    : "Percentil 95 del tamaño de los eventos de lluvia completos. Diseño conservador para protección ante inundación."
                }
                value={`${fmt(rainMm0("p95", station), 0)} mm`}
              />
            </div>
            <p className="text-xs text-[#1F2A24]/45 mt-2 flex items-start gap-1.5">
              <Info size={13} className="mt-0.5 shrink-0" />
              {userLevel === "simple" ? (
                <>Calculado con datos reales de lluvia horaria 2020-2026 de tu estación, registrados por FONAG.</>
              ) : (
                <>
                  Datos: serie horaria 2020-2026, estación {station.name} ({station.code}), elevación {station.elevationM} m — FONAG. Duración mediana de evento: {station.eventDurationH} h.
                  {station.tr10_2h_mm && (
                    <> Referencia adicional (período de retorno, ajuste de Gumbel a 2h): TR10 = {fmt(station.tr10_2h_mm,0)} mm, TR25 = {fmt(station.tr25_2h_mm,0)} mm.</>
                  )}
                </>
              )}
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
