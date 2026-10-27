// ---------------------------------------------------------------------------
// SUDS Quito · Buscador de SUDS por barrio
// Aplicación web para el dimensionamiento preliminar de Sistemas Urbanos de
// Drenaje Sostenible (SUDS) a partir de datos reales de lluvia en Quito.
//
// © 2026 Paulina Lima. Todos los derechos reservados.
// Idea, metodología y desarrollo: Paulina Lima.
//
// Estructura del código:
//   src/data/        datos de estaciones, catálogos y precios unitarios
//   src/lib/         cálculos (hidrología, presupuesto, clima, URL)
//   src/components/  componentes de interfaz
// ---------------------------------------------------------------------------
import React, { useEffect, useMemo, useState } from "react";
import { CloudRain, Droplets, Link2, Printer, Check } from "lucide-react";
import { STATIONS } from "./data/stations.js";
import { SURFACES, SUDS_TYPES, SOILS, RUNOFF_METHODS } from "./data/catalogs.js";
import { PRICE_SOURCE } from "./data/prices.js";
import { designRain, virtualStation } from "./lib/climate.js";
import { computeCase } from "./lib/compute.js";
import { fmt, positive } from "./lib/format.js";
import { readUrlState, writeUrlState } from "./lib/urlState.js";
import { Section, ScenarioCard, NumberField, Notice, Toggle, inputCls } from "./components/ui.jsx";
import StationPicker from "./components/StationPicker.jsx";
import { SudsResult, DrawdownPanel, BudgetTable } from "./components/Results.jsx";
import TechnicalAnalysis from "./components/TechnicalAnalysis.jsx";
import AboutPanel from "./components/AboutPanel.jsx";
import Report from "./components/Report.jsx";
import { NormInputs, NormResult } from "./components/NormTank.jsx";
import { suggestIdfStation } from "./lib/normaQuito.js";
import { NORMA_SHORT } from "./data/normaQuito.js";
import { APP_VERSION } from "./version.js";

const DEFAULTS = {
  stationId: "",
  lat: "",
  lon: "",
  scenario: "p90",
  customRain: "",
  area: "",
  surfaceId: "techo",
  sudsId: "biorretencion",
  userLevel: "simple",
  runoffMethod: "coef",
  soilId: "desconocido",
  soilK: "",
  pavementArea: "",
  trenchWidth: "1",
  trenchDepth: "1.5",
  chamberLength: "5",
  chamberWidth: "3",
  chamberDepth: "2",
  projectName: "",
  normImpFinal: "",
  normImpInitial: "0",
  normCoverFinal: "pasto100_plano",
  normCoverInitial: "pasto100_plano",
  normImpType: "techo",
  normOcupacion: "residencial",
  normIdf: "",
  normDuration: "30",
  normTret: "30",
  normHeight: "1",
  normPisos: "",
  normAreaUtil: "",
};

function initialState() {
  const fromUrl = readUrlState();
  const s = { ...DEFAULTS, ...fromUrl };
  // Validar valores que vienen de la URL
  if (s.stationId && !STATIONS.some((x) => x.id === s.stationId)) s.stationId = "";
  if (!SURFACES.some((x) => x.id === s.surfaceId)) s.surfaceId = DEFAULTS.surfaceId;
  if (!SUDS_TYPES.some((x) => x.id === s.sudsId)) s.sudsId = DEFAULTS.sudsId;
  if (!SOILS.some((x) => x.id === s.soilId)) s.soilId = DEFAULTS.soilId;
  if (!["simple", "tecnico"].includes(s.userLevel)) s.userLevel = DEFAULTS.userLevel;
  if (!RUNOFF_METHODS.some((x) => x.id === s.runoffMethod)) s.runoffMethod = DEFAULTS.runoffMethod;
  return s;
}

export default function SudsApp() {
  const [st, setSt] = useState(initialState);
  const [showAbout, setShowAbout] = useState(false);
  const [copied, setCopied] = useState(false);
  const set = (patch) => setSt((prev) => ({ ...prev, ...patch }));

  useEffect(() => writeUrlState(st, DEFAULTS), [st]);

  const simple = st.userLevel === "simple";
  const lat = parseFloat(st.lat);
  const lon = parseFloat(st.lon);
  const point = useMemo(
    () => (isFinite(lat) && isFinite(lon) ? virtualStation(lat, lon, STATIONS) : null),
    [lat, lon]
  );
  const station = point || STATIONS.find((s) => s.id === st.stationId) || null;
  const surface = SURFACES.find((s) => s.id === st.surfaceId);
  const soil = SOILS.find((s) => s.id === st.soilId);
  const soilK = soil.k ?? positive(st.soilK, null);
  const sudsType = SUDS_TYPES.find((t) => t.id === st.sudsId);
  const areaNum = positive(st.area, 0);
  const rainMm = designRain(station, st.scenario, st.customRain);
  const isNorma = st.sudsId === "retencion_norma";
  const suggestedIdf = station ? suggestIdfStation(station.lat, station.lon).id : "inaquito";
  const norma = useMemo(() => ({
    impFinal: st.normImpFinal === "" ? areaNum * 0.8 : Math.max(parseFloat(st.normImpFinal) || 0, 0),
    impInitial: Math.max(parseFloat(st.normImpInitial) || 0, 0),
    coverFinal: st.normCoverFinal,
    coverInitial: st.normCoverInitial,
    imperviousType: st.normImpType,
    ocupacion: st.normOcupacion,
    idfId: st.normIdf || suggestedIdf,
    duration: positive(st.normDuration, 30),
    tret: positive(st.normTret, 30),
    usefulHeight: positive(st.normHeight, 1),
    pisos: parseFloat(st.normPisos) || 0,
    areaUtil: parseFloat(st.normAreaUtil) || 0,
  }), [st.normImpFinal, st.normImpInitial, st.normCoverFinal, st.normCoverInitial, st.normImpType, st.normOcupacion,
       st.normIdf, st.normDuration, st.normTret, st.normHeight, st.normPisos, st.normAreaUtil, suggestedIdf, areaNum]);

  const results = useMemo(
    () =>
      computeCase({
        station,
        rainMm,
        area: areaNum,
        surface,
        method: st.runoffMethod,
        pavementArea: positive(st.pavementArea, areaNum),
        trench: { width: positive(st.trenchWidth, 1), depth: positive(st.trenchDepth, 1.5) },
        chamber: {
          length: positive(st.chamberLength, 5),
          width: positive(st.chamberWidth, 3),
          depth: positive(st.chamberDepth, 2),
        },
        soilK,
        norma,
      }),
    [station, rainMm, areaNum, surface, st.runoffMethod, st.pavementArea, st.trenchWidth, st.trenchDepth, st.chamberLength, st.chamberWidth, st.chamberDepth, soilK, norma]
  );

  const pickScenario = (id) => set({ scenario: id, customRain: "" });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copia este enlace:", window.location.href);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F4EE] text-[#1F2A24] print:bg-white">
      <div className="print:hidden">
        {/* Encabezado */}
        <header className="border-b border-[#1F2A24]/10 bg-[#F6F4EE]/95 backdrop-blur sticky top-0 z-20">
          <div className="max-w-5xl mx-auto px-5 py-5 font-body flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-[#2F6F5E] font-semibold mb-1">
                <CloudRain size={14} strokeWidth={2.5} />
                Quito · Hidrología urbana
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-semibold leading-tight text-[#1F2A24]">
                Buscador de SUDS por barrio
              </h1>
              <p className="text-sm text-[#1F2A24]/60 mt-1 max-w-xl">
                Dimensionamiento rápido de sistemas urbanos de drenaje sostenible a partir de la lluvia real de tu zona.
              </p>
              <p className="text-xs text-[#2F6F5E] font-medium mt-2">Por Paulina Lima · datos de lluvia FONAG</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAbout((v) => !v)}
              aria-expanded={showAbout}
              className="shrink-0 mt-1 px-3 py-2 rounded-xl border border-[#1F2A24]/15 bg-white text-xs font-medium text-[#1F2A24]/70 hover:border-[#2F6F5E] hover:text-[#2F6F5E] transition-colors"
            >
              {showAbout ? "✕ Cerrar guía" : "ℹ Acerca de"}
            </button>
          </div>
        </header>

        {/* Selector de nivel */}
        <div className="max-w-5xl mx-auto px-5 pt-5 font-body">
          <Toggle
            value={st.userLevel}
            onChange={(v) => set({ userLevel: v })}
            options={[
              { id: "simple", label: "Explicación simple" },
              { id: "tecnico", label: "Vista técnica" },
            ]}
          />
          <p className="text-xs text-[#1F2A24]/45 mt-2">
            {simple
              ? "Resultados explicados en palabras simples, sin jerga de ingeniería."
              : "Resultados con las cifras y supuestos de cálculo completos."}
          </p>
        </div>

        {showAbout && <AboutPanel />}

        <main className="max-w-5xl mx-auto px-5 py-8 font-body">
          {/* 01 · Ubicación */}
          <Section number="01" title={simple ? "¿Dónde está tu terreno?" : "Ubicación y estación de lluvia"}>
            <StationPicker
              stations={STATIONS}
              stationId={st.stationId}
              onSelectStation={(id) => set({ stationId: id, lat: "", lon: "" })}
              point={point}
              onPickPoint={(la, lo) => set({ lat: la.toFixed(6), lon: lo.toFixed(6), stationId: "" })}
              onClearPoint={() => set({ lat: "", lon: "" })}
              scenario={st.scenario}
              simple={simple}
            />
          </Section>

          {/* 02 · Lluvia */}
          {station && (
            <Section number="02" title={simple ? "¿Qué tan fuerte es la lluvia que quieres manejar?" : "Lluvia de diseño"}>
              {simple ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  <ScenarioCard active={st.scenario === "p90"} onClick={() => pickScenario("p90")}
                    label="Lluvia de todos los días"
                    desc="La lluvia común que cae seguido en tu zona. Útil para que el agua del día a día no se acumule."
                    value={`${fmt(station.p90Duracion, 0)} mm`} />
                  <ScenarioCard active={st.scenario === "p95"} onClick={() => pickScenario("p95")}
                    label="Lluvia fuerte (riesgo de inundación)"
                    desc="Una lluvia fuerte que no cae tan seguido, pero que puede causar inundaciones si no estás preparado."
                    value={`${fmt(station.p95Extremos, 0)} mm`} />
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-[#2F6F5E] uppercase tracking-wider mb-2">
                    Diseño SUDS — volumen a capturar (P90/P95 de eventos)
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2 mb-4">
                    <ScenarioCard active={st.scenario === "p90"} onClick={() => pickScenario("p90")}
                      label="P90 — Control de volumen (90% de eventos capturados)"
                      desc="Percentil 90 del volumen total de eventos completos. Dimensiona el SUDS para manejo cotidiano. Ref: EPA Stormwater Capture / CIRIA C753."
                      value={`${fmt(station.p90Duracion, 1)} mm`} />
                    <ScenarioCard active={st.scenario === "p95"} onClick={() => pickScenario("p95")}
                      label="P95 — Control ampliado (95% de eventos capturados)"
                      desc="Percentil 95 del volumen total de eventos. Diseño conservador para zonas con mayor exposición."
                      value={`${fmt(station.p95Extremos, 1)} mm`} />
                  </div>
                  <p className="text-xs font-semibold text-[#1F2A24]/50 uppercase tracking-wider mb-2">
                    Gestión de riesgos / alcantarillado — lluvia de 2 h (Gumbel)
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {[
                      { key: "tr2", label: "TR 2 años", mm: station.tr2_mm, hint: "Alcant. domiciliario" },
                      { key: "tr5", label: "TR 5 años", mm: station.tr5_mm, hint: "Alcant. secundario" },
                      { key: "tr10", label: "TR 10 años", mm: station.tr10_mm, hint: "Colectores" },
                      { key: "tr25", label: "TR 25 años", mm: station.tr25_mm, hint: "Infraestructura mayor" },
                    ].map(({ key, label, mm, hint }) => (
                      <button key={key} type="button" onClick={() => pickScenario(key)} aria-pressed={st.scenario === key}
                        className={`text-left rounded-xl border p-3 transition-colors ${st.scenario === key ? "border-[#2F6F5E] bg-[#2F6F5E]/10" : "border-[#1F2A24]/10 bg-white hover:border-[#2F6F5E]/40"}`}>
                        <div className="font-medium text-xs">{label}</div>
                        <div className="font-display text-lg font-semibold text-[#2F6F5E]">{fmt(mm, 1)} mm</div>
                        <div className="text-xs text-[#1F2A24]/45">{hint}</div>
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 bg-[#1F2A24]/[0.03] rounded-xl px-4 py-3">
                    <label htmlFor="custom-rain" className="text-xs text-[#1F2A24]/60 shrink-0">O ingresa tu propia lámina de lluvia de diseño:</label>
                    <input id="custom-rain" type="number" min="0" inputMode="decimal" placeholder="ej. 60"
                      value={st.customRain}
                      onChange={(e) => set({ customRain: e.target.value, scenario: e.target.value ? "custom" : "p90" })}
                      className="w-24 rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#2F6F5E]" />
                    <span className="text-xs text-[#1F2A24]/50">mm</span>
                  </div>
                </div>
              )}
              {simple && st.scenario !== "p90" && st.scenario !== "p95" && (
                <p className="text-xs text-[#2F6F5E] mt-2">
                  Estás usando un escenario técnico ({st.scenario === "custom" ? `${fmt(rainMm, 1)} mm personalizado` : st.scenario.toUpperCase()}).
                  Elige una de las tarjetas para volver a los escenarios simples.
                </p>
              )}
              {isNorma && (
                <p className="text-xs text-[#2F6F5E] mt-2">
                  Para el tanque de retención normativo no se usan estos escenarios: la norma exige la lluvia de diseño de las curvas IDF de la EMAAP-Q (paso 04).
                </p>
              )}
              <p className="text-xs text-[#1F2A24]/45 mt-2">
                {simple
                  ? "Calculado con datos reales de lluvia horaria 2020-2026 registrados por FONAG."
                  : `${station.virtual ? "Punto interpolado" : `Estación: ${station.name} (${station.code})`} · Elevación: ${fmt(station.elevationM, 0)} m · Lluvia activa: ${fmt(rainMm, 1)} mm (${st.scenario === "custom" ? "valor personalizado" : st.scenario.toUpperCase()})`}
              </p>
            </Section>
          )}

          {/* 03 · Área */}
          {station && (
            <Section number="03" title={simple ? "¿Qué tan grande es tu espacio?" : "Área aportante y superficie"}>
              <div className="grid sm:grid-cols-2 gap-4">
                <NumberField
                  id="area"
                  label={isNorma ? (simple ? "Tamaño total de tu lote (m²)" : "Área de aporte del lote (m²)") : simple ? "Tamaño de tu techo o patio (m²)" : "Área aportante (m²)"}
                  value={st.area}
                  onChange={(v) => set({ area: v })}
                  step="1"
                  placeholder="Ej: 80"
                  hint={isNorma ? "Para la norma se usa el área total del lote (permeable + impermeable)." : simple ? "Es el área desde donde cae el agua de lluvia: tu techo, tu patio, o ambos." : undefined}
                />
                {!isNorma && <div>
                  <label htmlFor="surface" className="text-xs font-medium text-[#1F2A24]/60 mb-1.5 block">Tipo de superficie</label>
                  <select id="surface" value={st.surfaceId} onChange={(e) => set({ surfaceId: e.target.value })} className={inputCls}>
                    {SURFACES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}{simple ? "" : ` · C = ${s.runoffCoef} · CN = ${s.cn}`}
                      </option>
                    ))}
                  </select>
                </div>}
              </div>
              {!simple && !isNorma && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="text-xs text-[#1F2A24]/60">Método de escorrentía:</span>
                  <Toggle small value={st.runoffMethod} onChange={(v) => set({ runoffMethod: v })} options={RUNOFF_METHODS} />
                </div>
              )}
              {st.area !== "" && areaNum <= 0 && (
                <p className="text-xs text-red-700 mt-2">Ingresa un área mayor que cero.</p>
              )}
            </Section>
          )}

          {/* 04 · Tipo de SUDS y suelo */}
          {station && areaNum > 0 && (
            <Section number="04" title={simple ? "¿Qué quieres construir?" : "Tipo de SUDS y suelo"}>
              <div className="flex flex-wrap gap-2">
                {SUDS_TYPES.map((t) => (
                  <button key={t.id} type="button" onClick={() => set({ sudsId: t.id })} aria-pressed={st.sudsId === t.id}
                    className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                      st.sudsId === t.id ? "bg-[#1F2A24] text-[#F6F4EE] border-[#1F2A24]" : "bg-white border-[#1F2A24]/15 hover:border-[#1F2A24]/40"
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
              {simple && (
                <p className="text-xs text-[#1F2A24]/55 mt-2">
                  {{
                    biorretencion: "Un jardín hundido que deja que el agua se filtre lentamente al suelo, en vez de correr hacia la calle.",
                    permeable: "Un piso especial que deja pasar el agua hacia abajo, en vez de que resbale por encima como en el cemento normal.",
                    zanja: "Una zanja larga y angosta, rellena de piedra, que guarda el agua bajo tierra mientras se filtra poco a poco al suelo.",
                    deposito: "Una caja enterrada bajo el parqueadero, rellena de piedra, que guarda agua de lluvia bajo el piso sin ocupar espacio en superficie.",
                    cisterna: "Un tanque que guarda el agua de lluvia para usarla después, por ejemplo para regar o limpiar.",
                    retencion_norma: "El tanque que la Municipalidad exige en toda construcción nueva para retener el agua lluvia del lote antes de soltarla a la calle.",
                  }[st.sudsId]}
                </p>
              )}

              {st.sudsId === "permeable" && (
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <NumberField id="pav-area" label="Área de pavimento permeable (m²)" value={st.pavementArea}
                    onChange={(v) => set({ pavementArea: v })} step="1" placeholder={`${fmt(areaNum, 0)} (igual al área aportante)`}
                    hint="Déjalo vacío si el piso permeable ocupa toda el área aportante." />
                </div>
              )}
              {st.sudsId === "zanja" && (
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <NumberField id="zanja-ancho" label="Ancho de zanja (m)" value={st.trenchWidth} onChange={(v) => set({ trenchWidth: v })} />
                  <NumberField id="zanja-prof" label="Profundidad de zanja (m)" value={st.trenchDepth} onChange={(v) => set({ trenchDepth: v })} />
                </div>
              )}
              {st.sudsId === "deposito" && (
                <div className="grid sm:grid-cols-3 gap-4 mt-4">
                  <NumberField id="dep-largo" label="Largo (m)" value={st.chamberLength} onChange={(v) => set({ chamberLength: v })} />
                  <NumberField id="dep-ancho" label="Ancho (m)" value={st.chamberWidth} onChange={(v) => set({ chamberWidth: v })} />
                  <NumberField id="dep-prof" label="Profundidad (m)" value={st.chamberDepth} onChange={(v) => set({ chamberDepth: v })} />
                </div>
              )}

              {isNorma && <NormInputs st={st} set={set} area={areaNum} simple={simple} suggestedIdf={suggestedIdf} />}

              {sudsType.infiltrates && (
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="soil" className="text-xs font-medium text-[#1F2A24]/60 mb-1.5 block">
                      {simple ? "¿Cómo es el suelo de tu terreno?" : "Tipo de suelo (conductividad hidráulica)"}
                    </label>
                    <select id="soil" value={st.soilId} onChange={(e) => set({ soilId: e.target.value })} className={inputCls}>
                      {SOILS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}{!simple && s.k ? ` · ${fmt(s.k, 1)} mm/h` : ""}
                        </option>
                      ))}
                    </select>
                    {simple && (
                      <p className="text-xs text-[#1F2A24]/45 mt-1">
                        Arena: el agua se filtra rápido. Arcilla o cangahua: casi no deja pasar el agua.
                      </p>
                    )}
                  </div>
                  {st.soilId === "medido" && (
                    <NumberField id="soil-k" label="Tasa de infiltración medida (mm/h)" value={st.soilK}
                      onChange={(v) => set({ soilK: v })} placeholder="ej. 12" hint="Resultado de un ensayo de infiltración en el sitio." />
                  )}
                </div>
              )}
            </Section>
          )}

          {/* 05 · Resultados */}
          {results && (
            <Section number="05" title={isNorma ? (simple ? "Lo que exige la norma" : `Tanque de retención · ${NORMA_SHORT}`) : simple ? "Lo que necesitas construir" : "Dimensionamiento sugerido"}>
              {!isNorma && <div className="rounded-2xl border border-[#2F6F5E]/25 bg-[#2F6F5E]/[0.06] p-5 mb-4">
                <div className="flex items-center gap-2 text-sm font-medium text-[#2F6F5E] mb-1">
                  <Droplets size={16} />
                  {simple ? "Cuánta agua tienes que manejar" : "Volumen de escorrentía de diseño"}
                </div>
                <div className="font-display text-3xl font-semibold">{fmt(results.volL, 0)} L</div>
                <div className="text-xs text-[#1F2A24]/55 mt-1">
                  {simple
                    ? `Es lo que escurre de tu espacio de ${fmt(areaNum, 0)} m² durante este tipo de lluvia.`
                    : st.runoffMethod === "cn"
                      ? `NRCS: P = ${fmt(rainMm, 1)} mm, CN = ${surface.cn} → Q = ${fmt(results.runoff.depthMm, 1)} mm × ${fmt(areaNum, 0)} m²`
                      : `${fmt(rainMm, 1)} mm × ${fmt(areaNum, 0)} m² × C ${surface.runoffCoef} (${surface.label.toLowerCase()})`}
                </div>
              </div>}

              {results.volL <= 0 && !isNorma ? (
                <Notice tone="info">
                  Con esta lluvia y este tipo de superficie no se genera escorrentía (la lluvia no supera la abstracción inicial del método NRCS).
                  Prueba con un escenario más intenso o con el método del coeficiente.
                </Notice>
              ) : (
                <>
                  {isNorma
                    ? <NormResult r={results.sizing.retencion_norma} simple={simple} />
                    : <SudsResult sudsId={st.sudsId} r={results.sizing[st.sudsId]} simple={simple} />}
                  {sudsType.infiltrates && soil && !soil.granular && soil.id !== "medido" && (
                    <Notice tone="warn" className="mt-3">
                      {simple
                        ? "Ojo: la norma municipal de Quito solo permite infiltrar agua lluvia en suelos arenosos o granulares. Con tu tipo de suelo, este sistema necesitará un tubo de salida a la red."
                        : "El estándar municipal de agua lluvia (PUGS) solo permite la infiltración hacia los acuíferos en suelos de composición permeable, como suelos granulares. Con este suelo, prever descarga regulada a la red."}
                    </Notice>
                  )}
                  {sudsType.infiltrates && (
                    soilK > 0 ? (
                      <DrawdownPanel d={results.drawdown[st.sudsId]} dryHours={station.dryHours} soilLabel={soil.label} soilK={soilK} simple={simple} />
                    ) : (
                      <p className="text-xs text-[#1F2A24]/55 mt-3">Ingresa la tasa de infiltración medida para estimar el tiempo de vaciado.</p>
                    )
                  )}

                  <div className="mt-6 border-t border-[#1F2A24]/10 pt-5">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="text-sm font-display font-semibold">Presupuesto referencial</span>
                      <span className="text-xs text-[#1F2A24]/45 bg-[#1F2A24]/5 rounded-full px-2 py-0.5">{PRICE_SOURCE}</span>
                    </div>
                    <BudgetTable budget={results.budgets[st.sudsId]} simple={simple} />
                  </div>
                </>
              )}

              <Notice tone="warn" className="mt-5">
                {simple
                  ? "Este resultado es una guía inicial para conversar con un arquitecto o ingeniero, no un diseño final listo para construir."
                  : "Resultado orientativo con métodos estándar simplificados (volumen de captura). No reemplaza un diseño hidráulico detallado ni la verificación de un ingeniero. Útil como punto de partida para anteproyecto."}
              </Notice>

              {/* Guardar / compartir */}
              <div className="mt-5 rounded-2xl border border-[#1F2A24]/10 bg-white p-4">
                <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
                  <div>
                    <label htmlFor="proj" className="text-xs font-medium text-[#1F2A24]/60 mb-1.5 block">Nombre del proyecto (para la memoria)</label>
                    <input id="proj" type="text" value={st.projectName} onChange={(e) => set({ projectName: e.target.value })}
                      placeholder="Ej: Vivienda familia Pérez, Solanda" className={inputCls} />
                  </div>
                  <button type="button" onClick={() => window.print()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F2A24] text-[#F6F4EE] px-4 py-3 text-sm font-medium hover:bg-[#2F6F5E]">
                    <Printer size={15} /> Memoria de cálculo (PDF)
                  </button>
                  <button type="button" onClick={copyLink}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#1F2A24]/15 px-4 py-3 text-sm font-medium hover:border-[#2F6F5E] hover:text-[#2F6F5E]">
                    {copied ? <Check size={15} /> : <Link2 size={15} />} {copied ? "¡Enlace copiado!" : "Copiar enlace"}
                  </button>
                </div>
                <p className="text-xs text-[#1F2A24]/45 mt-2">
                  La memoria abre el diálogo de impresión: elige «Guardar como PDF». El enlace reabre la app con estos mismos datos.
                </p>
              </div>
            </Section>
          )}

          {/* 06 · Análisis técnico */}
          {results && !simple && (
            <Section number="06" title="Análisis técnico">
              <TechnicalAnalysis station={station} sudsId={st.sudsId} surface={surface} method={st.runoffMethod} results={results} />
            </Section>
          )}
        </main>

        <footer className="max-w-5xl mx-auto px-5 pb-10 pt-6 font-body">
          <div className="border-t border-[#1F2A24]/10 pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[#1F2A24]">
                Idea, metodología y desarrollo: <span className="font-display">Paulina Lima</span>
              </p>
              <p className="text-xs text-[#1F2A24]/50 mt-0.5">© 2026 Paulina Lima. Todos los derechos reservados. · Versión {APP_VERSION}</p>
            </div>
            <div className="text-xs text-[#1F2A24]/45 sm:text-right">
              <p>Datos de lluvia: <strong className="text-[#1F2A24]/60">FONAG</strong> (Fondo para la Protección del Agua), acceso libre.</p>
              <p>Mapa: © colaboradores de OpenStreetMap.</p>
            </div>
          </div>
        </footer>
      </div>

      {results && station && (
        <Report
          projectName={st.projectName}
          station={station}
          scenario={st.scenario}
          rainMm={rainMm}
          area={areaNum}
          surface={surface}
          method={st.runoffMethod}
          sudsId={st.sudsId}
          results={results}
          soil={soil}
          soilK={soilK}
        />
      )}
    </div>
  );
}
