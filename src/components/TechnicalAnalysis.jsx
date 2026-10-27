// SUDS Quito · pestañas de análisis técnico · © 2026 Paulina Lima.
import React, { useState } from "react";
import { Notice } from "./ui.jsx";
import { fmt } from "../lib/format.js";
import { monthsMissing } from "../lib/climate.js";
import { INFILTRATION } from "../lib/hydrology.js";
import { STATIONS, NINO_TABLE, MONTHS, PARTIAL_RECORD_STATIONS, ANALYSIS } from "../data/stations.js";

const TABS = [
  { key: "lluvias", label: "Tabla de lluvias" },
  { key: "estacionalidad", label: "Estacionalidad" },
  { key: "nino", label: "El Niño" },
  { key: "hietograma", label: "Hietograma" },
  { key: "metodo", label: "Método de cálculo" },
];

export default function TechnicalAnalysis({ station, sudsId, surface, method, results }) {
  const [tab, setTab] = useState("lluvias");
  return (
    <div>
      <div className="flex gap-1 mb-4 bg-[#1F2A24]/5 rounded-xl p-1 flex-wrap" role="tablist">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex-1 min-w-[7rem] rounded-lg py-2 text-xs font-medium transition-colors ${
              tab === key ? "bg-white shadow-sm text-[#1F2A24]" : "text-[#1F2A24]/50 hover:text-[#1F2A24]/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "lluvias" && <RainTable station={station} />}
      {tab === "estacionalidad" && <Seasonality station={station} sudsId={sudsId} />}
      {tab === "nino" && <NinoTable station={station} />}
      {tab === "hietograma" && <Hyetograph station={station} />}
      {tab === "metodo" && <MethodNotes station={station} surface={surface} method={method} results={results} />}
    </div>
  );
}

const muted = "text-xs text-[#1F2A24]/50 mb-3";
const foot = "text-xs text-[#1F2A24]/40 mt-2";
const th = "px-4 py-2.5 font-medium text-[#1F2A24]/60";

function RainTable({ station }) {
  const rows = [
    { label: "P90 eventos (frecuente SUDS)", mm: station.p90Duracion, inth: station.p90Duracion / station.eventDurationH, uso: "Dimensionamiento SUDS — control de volumen cotidiano", suds: true },
    { label: "P95 eventos (conservador SUDS)", mm: station.p95Extremos, inth: station.p95Extremos / station.eventDurationH, uso: "SUDS en zonas de mayor exposición", suds: true },
    { label: "TR 2 años (Gumbel · 2h)", mm: station.tr2_mm, inth: station.int_tr2, uso: "Alcantarillado domiciliario" },
    { label: "TR 5 años (Gumbel · 2h)", mm: station.tr5_mm, inth: station.int_tr5, uso: "Alcantarillado secundario" },
    { label: "TR 10 años (Gumbel · 2h)", mm: station.tr10_mm, inth: station.int_tr10, uso: "Colectores principales" },
    { label: "TR 25 años (Gumbel · 2h)", mm: station.tr25_mm, inth: station.int_tr25, uso: "Infraestructura mayor / puentes" },
  ];
  return (
    <div>
      <p className={muted}>
        Todos los escenarios para <strong>{station.name}</strong>
        {station.virtual ? " (valores interpolados por IDW)" : ""} · Análisis de lluvias de {ANALYSIS.label} (registros FONAG {ANALYSIS.period}; se actualiza cada año) · Gumbel ajustada a máximos anuales (duración 2h)
      </p>
      <div className="overflow-x-auto rounded-xl border border-[#1F2A24]/10 bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1F2A24]/10 bg-[#1F2A24]/[0.03]">
              <th className={`text-left ${th}`}>Escenario</th>
              <th className={`text-right ${th}`}>Lluvia (mm)</th>
              <th className={`text-right ${th}`}>Intensidad (mm/h)</th>
              <th className={`text-left ${th}`}>Uso</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className={`border-b border-[#1F2A24]/5 ${row.suds ? "bg-[#2F6F5E]/5" : ""}`}>
                <td className="px-4 py-2.5">{row.label}</td>
                <td className="px-4 py-2.5 text-right font-medium">{fmt(row.mm, 1)}</td>
                <td className="px-4 py-2.5 text-right">{fmt(row.inth, 1)}</td>
                <td className="px-4 py-2.5 text-[#1F2A24]/50">{row.uso}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={foot}>
        Verde = escenarios SUDS (captura/retención); la intensidad P90/P95 es la media del evento ({station.eventDurationH} h de duración típica).
        Blanco = períodos de retorno para diseño convencional. Ref: Gumbel (1958); Chow, Maidment y Mays (1988).
      </p>
      <p className={foot}>
        Nota: la serie 2020-2026 tiene ~6 máximos anuales; los valores TR10 y TR25 son extrapolaciones con incertidumbre alta.
        Para obras mayores, contrastar con las ecuaciones IDF del INAMHI.
      </p>
    </div>
  );
}

// Gráfico mensual en SVG: barras de climatología + líneas 2023/2024 con huecos en meses sin registro.
function Seasonality({ station, sudsId }) {
  const W = 600, H = 190, PAD_L = 8, PAD_B = 22, PAD_T = 18;
  const plotH = H - PAD_B - PAD_T;
  const slot = (W - PAD_L * 2) / 12;
  const n23 = station.nino2023 && monthsMissing(station.nino2023) < 10 ? station.nino2023 : null;
  const n24 = station.nino2024 && monthsMissing(station.nino2024) < 10 ? station.nino2024 : null;
  const all = [...station.climatologia, ...(n23 || []), ...(n24 || [])].filter((v) => v > 0);
  const max = Math.max(...all) * 1.08;
  const y = (v) => PAD_T + plotH - (v / max) * plotH;
  const cx = (i) => PAD_L + slot * i + slot / 2;
  const dry = ["junio", "julio", "agosto", "septiembre"];
  const MONTH_NAMES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

  const segments = (series) => {
    const segs = [];
    let cur = [];
    series.forEach((v, i) => {
      if (v > 0) cur.push(`${cx(i)},${y(v)}`);
      else if (cur.length) { segs.push(cur); cur = []; }
    });
    if (cur.length) segs.push(cur);
    return segs;
  };
  const line = (series, color) => (
    <g>
      {segments(series).map((pts, k) => (
        <polyline key={k} points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeDasharray="5,3" />
      ))}
      {series.map((v, i) => v > 0 && <circle key={i} cx={cx(i)} cy={y(v)} r="3.5" fill={color} stroke="#fff" strokeWidth="1.5" />)}
    </g>
  );
  const partial = PARTIAL_RECORD_STATIONS.includes(station.id);

  return (
    <div>
      {sudsId === "cisterna" && (
        <Notice tone="warn" className="mb-4">
          <p className="font-semibold mb-1">Advertencia de estacionalidad para cisternas</p>
          <p>
            En <strong>{station.mesSeco}</strong> llueve solo {fmt(station.lluvia_mes_seco, 0)} mm en promedio — la cisterna puede no llenarse durante semanas.
            El sistema funciona en la temporada lluviosa ({station.mesLluvioso}: {fmt(station.lluvia_mes_lluvioso, 0)} mm), pero necesita un plan de uso para la época seca.
          </p>
        </Notice>
      )}
      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl bg-[#2F6F5E]/[0.08] border border-[#2F6F5E]/20 p-4">
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
      <p className={muted}>
        Climatología mensual · {station.name} · lluvia media 2020-2026 (mm/mes){station.virtual ? " · interpolada por IDW" : ""}
      </p>
      <div className="rounded-xl bg-white border border-[#1F2A24]/10 p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Lluvia mensual promedio en ${station.name}`}>
          {station.climatologia.map((v, i) => {
            const isDry = dry.includes(MONTH_NAMES[i]);
            const barW = slot * 0.7;
            return (
              <g key={i}>
                <rect x={cx(i) - barW / 2} y={y(v)} width={barW} height={Math.max(PAD_T + plotH - y(v), 2)} rx="3" fill={isDry ? "#fbbf24" : "#1D9E75"} opacity="0.85" />
                <text x={cx(i)} y={y(v) - 4} textAnchor="middle" fontSize="10" fontWeight="600" fill={isDry ? "#b45309" : "#0F6E56"}>{Math.round(v)}</text>
                <text x={cx(i)} y={H - 6} textAnchor="middle" fontSize="11" fill="#6b7280">{MONTHS[i]}</text>
              </g>
            );
          })}
          <line x1={PAD_L} x2={W - PAD_L} y1={PAD_T + plotH} y2={PAD_T + plotH} stroke="#e5e7eb" />
          {n23 && line(n23, "#ef4444")}
          {n24 && line(n24, "#8b5cf6")}
        </svg>
        <div className="flex gap-3 flex-wrap text-[11px] text-[#6b7280] mt-2">
          <Legend color="#1D9E75">Promedio 2020-2026</Legend>
          <Legend color="#fbbf24">Época seca</Legend>
          {n23 && <Legend color="#ef4444" line>2023 (El Niño)</Legend>}
          {n24 && <Legend color="#8b5cf6" line>2024 (El Niño)</Legend>}
        </div>
        {(n23 || n24) && (
          <p className="text-[11px] text-[#6b7280] mt-1">Los meses sin registro aparecen como huecos en las líneas.</p>
        )}
      </div>
      {partial && (
        <Notice tone="warn" className="mt-3">
          Esta estación tiene un registro 2020-2026 con vacíos importantes; su climatología puede estar subestimada. Compara con estaciones vecinas.
        </Notice>
      )}
      <p className={foot}>
        La variación estacional es clave para el diseño de cisternas: el sistema acumula agua en la temporada lluviosa y la consume en la época seca.
        En años con El Niño o La Niña, los valores pueden diferir significativamente del promedio.
      </p>
    </div>
  );
}

function Legend({ color, line, children }) {
  return (
    <span className="flex items-center gap-1">
      <span style={{ width: line ? 14 : 10, height: line ? 3 : 10, background: color, borderRadius: 2, display: "inline-block" }} />
      {children}
    </span>
  );
}

function NinoTable({ station }) {
  const rows = NINO_TABLE.map((r) => {
    const s = STATIONS.find((x) => x.id === r.id);
    return { ...r, name: s.name, miss23: monthsMissing(s.nino2023), miss24: monthsMissing(s.nino2024) };
  });
  const anomaly = (v, prom, miss) => {
    const a = Math.round(((v - prom) / prom) * 100);
    const color = miss > 0 ? "#9ca3af" : a > 5 ? "#15803d" : a < -5 ? "#b91c1c" : "#6b7280";
    return (
      <span style={{ color }}>
        {a > 0 ? "+" : ""}{a}%{miss > 0 && " *"}
      </span>
    );
  };
  return (
    <div>
      <p className={muted}>
        Lluvia anual acumulada 2023 y 2024 frente al promedio 2020-2026 · estaciones FONAG con registro suficiente.
      </p>
      <Notice tone="warn" className="mb-4">
        <p className="font-semibold mb-1">¿Qué muestra El Niño 2023-2024 en Quito?</p>
        <p>
          <strong>2023:</strong> efecto mixto — algunas estaciones con exceso (Tanque-Solanda +47%, CC El Bosque +12%) y otras con déficit (Izobamba −10%). No hubo un patrón uniforme.
        </p>
        <p className="mt-1">
          <strong>2024:</strong> la mayoría de estaciones con registro completo tuvo menos lluvia que el promedio, con Chillogallo (−50%) como caso extremo.
          El Niño en la sierra se traduce en <strong>mayor variabilidad e impredecibilidad</strong>, no necesariamente en más o menos lluvia.
        </p>
        <p className="mt-1">
          Implicación para SUDS: las cisternas diseñadas con el promedio pueden quedar vacías en años como 2024. Se recomienda un factor de seguridad o un plan de uso alternativo para la época seca.
        </p>
      </Notice>
      <div className="overflow-x-auto rounded-xl border border-[#1F2A24]/10 bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1F2A24]/10 bg-[#1F2A24]/[0.03]">
              <th className={`text-left ${th}`}>Estación</th>
              <th className={`text-right ${th}`}>Prom. histórico</th>
              <th className={`text-right ${th}`}>2023</th>
              <th className={`text-right ${th}`}>Anomalía</th>
              <th className={`text-right ${th}`}>2024</th>
              <th className={`text-right ${th}`}>Anomalía</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`border-b border-[#1F2A24]/5 ${r.id === station.id ? "bg-[#2F6F5E]/5 font-medium" : ""}`}>
                <td className="px-4 py-2.5">{r.name}</td>
                <td className="px-3 py-2.5 text-right text-[#1F2A24]/60">{r.prom} mm</td>
                <td className="px-3 py-2.5 text-right">{r.v23} mm</td>
                <td className="px-3 py-2.5 text-right font-medium">{anomaly(r.v23, r.prom, r.miss23)}</td>
                <td className="px-3 py-2.5 text-right">{r.v24} mm</td>
                <td className="px-3 py-2.5 text-right font-medium">{anomaly(r.v24, r.prom, r.miss24)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={foot}>
        Verde = exceso · Rojo = déficit · <strong>*</strong> = año con meses sin registro (Rumihurco 2023: 1 mes; Rumihurco 2024 y Izobamba 2024: 3 meses); su anomalía
        está sesgada a la baja y no debe interpretarse como déficit real. Promedio calculado sobre años con ≥10 meses de datos. Collaloma Medio y Colinas del Alto
        excluidas por datos incompletos en 2023-2024.
      </p>
    </div>
  );
}

function Hyetograph({ station }) {
  const total = station.hietograma.reduce((a, b) => a + b, 0);
  const max = Math.max(...station.hietograma);
  const CHART_H = 120;
  return (
    <div>
      <p className={muted}>
        Las 2 horas más intensas del evento P90 observado · {station.name} · eventos históricos FONAG 2020-2026
        {station.virtual ? " · interpolado por IDW" : ""}
      </p>
      <div className="rounded-xl bg-white border border-[#1F2A24]/10 p-5">
        <p className="text-xs text-[#1F2A24]/40 mb-3">
          Lluvia por hora (mm/h). Estas 2 horas suman {fmt(total, 1)} mm de los {fmt(station.p90Duracion, 1)} mm del evento P90 completo
          (duración típica {station.eventDurationH} h): concentran el {fmt((total / station.p90Duracion) * 100, 0)}% del volumen.
        </p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: CHART_H + 24, marginBottom: 6 }}>
          {station.hietograma.map((mm, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#0F6E56" }}>{fmt(mm, 1)}</span>
              <div style={{ width: "100%", height: Math.max(Math.round((mm / max) * CHART_H), 4), background: "#1D9E75", borderRadius: "4px 4px 0 0" }} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, borderTop: "1px solid #e5e7eb", paddingTop: 6 }}>
          {station.hietograma.map((_, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 11, color: "#9ca3af" }}>hora {i + 1}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Box({ title, formula, children }) {
  return (
    <div className="rounded-xl bg-white border border-[#1F2A24]/10 p-4">
      <p className="font-semibold text-[#1F2A24] mb-1">{title}</p>
      {formula && <p className="font-mono bg-[#1F2A24]/5 rounded px-3 py-2 mb-1 overflow-x-auto whitespace-nowrap">{formula}</p>}
      {children}
    </div>
  );
}

function MethodNotes({ station, surface, method, results }) {
  return (
    <div className="space-y-4 text-xs text-[#1F2A24]/70 leading-relaxed">
      {method === "cn" ? (
        <Box title="1. Volumen de escorrentía — número de curva NRCS" formula="Q = (P − 0.2·S)² / (P + 0.8·S) · S = 25400/CN − 254 · V = Q × A">
          <p>
            P = lluvia de diseño (mm) · CN = {surface.cn} para {surface.label.toLowerCase()} · abstracción inicial Ia = 0.2·S. Ref: USDA NRCS (1986), TR-55 Urban Hydrology for Small Watersheds.
          </p>
          <p className="mt-1 font-medium text-[#2F6F5E]">
            Resultado actual: Q = {fmt(results.runoff.depthMm, 1)} mm → {fmt(results.volL / 1000, 3)} m³ ({fmt(results.volL, 0)} L)
          </p>
        </Box>
      ) : (
        <Box title="1. Volumen de escorrentía — coeficiente volumétrico" formula="V (L) = P (mm) × A (m²) × C">
          <p>
            P = lluvia de diseño · A = área aportante · C = coeficiente de escorrentía ({surface.runoffCoef} para {surface.label.toLowerCase()}).
            Método volumétrico usado en el dimensionamiento por volumen de captura (EPA; CIRIA C753).
          </p>
          <p className="mt-1 font-medium text-[#2F6F5E]">Resultado actual: {fmt(results.volL / 1000, 3)} m³ ({fmt(results.volL, 0)} L)</p>
        </Box>
      )}
      <Box title="2. Biorretención — área requerida" formula="A_bio = V / (d_ponding + d_sustrato × n)">
        <p>d_ponding = 0.20 m · d_sustrato = 0.45 m · n (porosidad) = 0.30 · capa de grava de drenaje 0.15 m (no se cuenta como almacenamiento). Ref: EPA LID Manual; CIRIA C753.</p>
      </Box>
      <Box title="3. Zanja / depósito de infiltración" formula="L_zanja = V / (ancho × prof × n_grava)">
        <p>n_grava = 0.35. El depósito bajo parqueadero verifica: V_captura = L × A × prof × n ≥ V diseño.</p>
      </Box>
      <Box title="4. Pavimento permeable" formula="e_base = V / (A_pavimento × n_base)">
        <p>n_base = 0.35. El espesor se limita al rango constructivo 0.15–0.60 m. Se recomienda que el área impermeable extra que drena al pavimento no supere 2:1 (CIRIA C753).</p>
      </Box>
      <Box title="5. Cisterna / tanque de detención" formula="V_cisterna = V × 1.10 · D = √(4V / π·h)">
        <p>
          Factor de seguridad 1.10, h = 1.5 m. La cisterna debe vaciarse antes del siguiente evento: se usa el tiempo seco mediano entre eventos
          ({station.dryHours} h para {station.name}) menos un margen de 4 h.
        </p>
      </Box>
      <Box title="6. Tiempo de vaciado por infiltración" formula="t = V_almacenado / (k / FS × A_infiltración)">
        <p>
          k = conductividad hidráulica saturada del suelo (Rawls et al., 1983, en Chow et al., 1988) o valor de ensayo · FS = {INFILTRATION.safetyFactor}.
          Biorretención y pavimento: infiltra el fondo. Zanja y depósito: fondo + paredes hasta media altura (BRE 365; CIRIA C753).
          Criterio: ≤ {INFILTRATION.okHours} h adecuado, {INFILTRATION.okHours}–{INFILTRATION.maxHours} h con precaución, &gt; {INFILTRATION.maxHours} h requiere dren de salida.
          Por debajo de {INFILTRATION.minViableRate} mm/h (1×10⁻⁶ m/s) la infiltración suele ser poco viable.
        </p>
      </Box>
      <Box title="7. Períodos de retorno (Gumbel)" formula="X_T = u + β·y_T · y_T = −ln(−ln(1 − 1/T)) · β = s·√6/π · u = x̄ − 0.5772·β">
        <p>
          x̄ y s = media y desviación estándar de los máximos anuales móviles (ventana 2 h) de la serie 2020-2026. Con ~6 años de registro, TR10 y TR25 son extrapolaciones
          con incertidumbre alta. Ref: Gumbel (1958); Chow, Maidment y Mays (1988) — Applied Hydrology.
        </p>
      </Box>
      <Box title="8. Interpolación espacial (punto exacto)" formula="X(p) = Σ wᵢ·Xᵢ / Σ wᵢ · wᵢ = 1 / dᵢ²">
        <p>
          Distancia inversa al cuadrado con las 4 estaciones más cercanas (distancia geodésica, fórmula de Haversine). Si el punto está a menos de 50 m de una estación,
          se usa directamente su valor. No considera el efecto de la elevación.
        </p>
      </Box>
      <p className="text-[#1F2A24]/40 text-xs">
        Resultados orientativos para anteproyecto. No reemplazan diseño hidráulico detallado ni verificación de ingeniero. Metodología: Paulina Lima · Datos: FONAG (acceso libre).
      </p>
    </div>
  );
}
