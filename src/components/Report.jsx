// ---------------------------------------------------------------------------
// SUDS Quito · Memoria de cálculo imprimible (solo visible al imprimir / PDF)
// © 2026 Paulina Lima. Todos los derechos reservados.
// ---------------------------------------------------------------------------
import React from "react";
import { fmt, fmtHours } from "../lib/format.js";
import { scenarioLabel } from "../lib/climate.js";
import { SUDS_TYPES, RUNOFF_METHODS } from "../data/catalogs.js";
import { PRICE_SOURCE } from "../data/prices.js";
import { INFILTRATION } from "../lib/hydrology.js";
import { APP_NAME, APP_VERSION, AUTHOR } from "../version.js";
import { NORMA_REF, DEAD_HEIGHT, FREEBOARD } from "../data/normaQuito.js";

function Row({ k, v }) {
  return (
    <tr>
      <td style={{ padding: "3px 8px 3px 0", color: "#555", width: "45%" }}>{k}</td>
      <td style={{ padding: "3px 0", fontWeight: 600 }}>{v}</td>
    </tr>
  );
}

function sizingRows(sudsId, r) {
  switch (sudsId) {
    case "biorretencion":
      return [
        ["Área de biorretención", `${fmt(r.areaM2, 2)} m² (${fmt(r.pctOfAportante, 0)}% del área aportante)`],
        ["Profundidad de encharcamiento", `${fmt(r.pondingDepth * 100, 0)} cm`],
        ["Espesor de sustrato filtrante", `${fmt(r.mediaDepth * 100, 0)} cm (porosidad 30%)`],
        ["Capa de grava de drenaje", `${fmt(r.gravelDepth * 100, 0)} cm`],
      ];
    case "permeable":
      return [
        ["Área de pavimento permeable", `${fmt(r.areaPavement, 1)} m²`],
        ["Espesor de base de grava", `${fmt(r.baseDepth * 100, 0)} cm (calculado ${fmt(r.rawDepth * 100, 0)} cm)`],
        ["Capacidad de captura", `${fmt(r.coverage, 0)}% del volumen de diseño`],
      ];
    case "zanja":
      return [
        ["Largo", `${fmt(r.length, 2)} m`],
        ["Ancho × profundidad", `${fmt(r.width, 2)} × ${fmt(r.depth, 2)} m`],
        ["Porosidad del relleno", `${fmt(r.voidRatio * 100, 0)}%`],
      ];
    case "deposito":
      return [
        ["Dimensiones (L × A × P)", `${fmt(r.length, 2)} × ${fmt(r.width, 2)} × ${fmt(r.depth, 2)} m`],
        ["Volumen bruto / de captura", `${fmt(r.grossVolumeM3, 2)} / ${fmt(r.captureVolumeM3, 2)} m³`],
        ["Cobertura del volumen de diseño", `${fmt(r.coveragePct, 0)}% ${r.sufficient ? "(suficiente)" : "(insuficiente)"}`],
      ];
    case "retencion_norma":
      return [
        ["Ocupación / período de retorno", `${r.occupation.label} · TR ${r.tr} años`],
        ["Ecuación IDF (EMAAP-Q)", `${r.station.name} · t = ${r.duration} min → I = ${fmt(r.intensity, 2)} mm/h`],
        ["Áreas impermeables (inicial → proyecto)", `${fmt(r.impInitial, 1)} → ${fmt(r.impFinal, 1)} m² de ${fmt(r.area, 1)} m²`],
        ["Coeficientes ponderados", `Co = ${fmt(r.co, 3)} · Cu = ${fmt(r.cu, 3)} (C imp. ${fmt(r.cImp, 2)}, C perm. ${fmt(r.cPermFinal, 2)})`],
        ["V = (Cu − Co)·I·A/6·T_RET", `(${fmt(r.cu, 3)} − ${fmt(r.co, 3)}) · ${fmt(r.intensity, 2)} · ${fmt(r.area / 10000, 4)} ha / 6 · ${r.tret} min = ${fmt(r.vCalc, 2)} m³`],
        ["Volumen mínimo Tabla 1", r.vTable !== null ? `${fmt(r.vTable, 0)} m³` : "No aplica (lote > 2500 m²: memoria de cálculo)"],
        ["Volumen útil de diseño", `${fmt(r.vDesign, 2)} m³ (rige ${r.governedBy === "tabla" ? "la Tabla 1" : "el cálculo"})`],
        ["Dimensiones (planta × altura total)", `${fmt(r.side, 2)} × ${fmt(r.side, 2)} × ${fmt(r.totalHeight, 2)} m (útil ${fmt(r.usefulHeight, 2)} + muerto ${fmt(DEAD_HEIGHT, 2)} + borde ${fmt(FREEBOARD, 2)} m)`],
        ["Ø descarga / Ø desborde (Tablas 5 y 6)", r.diam ? `${r.diam.descarga} mm / ${r.diam.desborde} mm` : "Calcular (lote > 2500 m²)"],
        ["Tiempo de vaciado (T = 2V/Qv)", r.vac ? `${fmt(r.vac.minutes, 0)} min (Qv = ${fmt(r.vac.qv * 1000, 2)} L/s, Cd 0,60, g 9,77 m/s²)` : "—"],
        ["Reúso obligatorio", r.reusoObligatorio ? "Sí (> 12 pisos o > 2500 m² útiles)" : "No"],
      ];
    case "cisterna":
      return [
        ["Volumen de cisterna (FS 1.10)", `${fmt(r.volumeM3, 2)} m³`],
        ["Diámetro / altura", `${fmt(r.diameter, 2)} m / ${fmt(r.heightAssumed, 1)} m`],
        ["Vaciar antes de", `${r.emptyByHours} h (tiempo seco mediano ${r.dryHours} h)`],
      ];
    default:
      return [];
  }
}

export default function Report({ projectName, station, scenario, rainMm, area, surface, method, sudsId, results, soil, soilK }) {
  if (!results) return null;
  const r = results.sizing[sudsId];
  const budget = results.budgets[sudsId];
  const dd = results.drawdown[sudsId];
  const today = new Date().toLocaleDateString("es-EC", { year: "numeric", month: "long", day: "numeric" });
  const h2 = { fontSize: 13, fontWeight: 700, margin: "16px 0 6px", borderBottom: "1px solid #ccc", paddingBottom: 3 };
  const table = { width: "100%", borderCollapse: "collapse", fontSize: 11 };

  return (
    <div className="hidden print:block" style={{ fontFamily: "Inter, Arial, sans-serif", color: "#111", fontSize: 11, lineHeight: 1.45 }}>
      <div style={{ borderBottom: "2px solid #2F6F5E", paddingBottom: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: "#2F6F5E", fontWeight: 700, letterSpacing: 1 }}>MEMORIA DE CÁLCULO PRELIMINAR · SUDS</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{projectName || "Proyecto sin nombre"}</div>
        <div style={{ fontSize: 10, color: "#555" }}>
          Generado con {APP_NAME} v{APP_VERSION} · {today} · suds-quito.vercel.app
        </div>
      </div>

      <div style={h2}>1. Datos de entrada</div>
      <table style={table}><tbody>
        <Row k="Ubicación / estación" v={station.virtual
          ? `Punto ${fmt(station.lat, 5)}, ${fmt(station.lon, 5)} — interpolado (IDW) de ${station.interpolation.stations.map((s) => s.name).join(", ")}`
          : `${station.name} (${station.code}) · ${station.zona} · ${station.elevationM} m s.n.m.`} />
        {sudsId !== "retencion_norma" && <Row k="Escenario de lluvia" v={`${scenarioLabel(scenario)} · ${fmt(rainMm, 1)} mm`} />}
        <Row k="Área aportante" v={sudsId === "retencion_norma" ? `${fmt(area, 1)} m² (área total del lote)` : `${fmt(area, 1)} m² · ${surface.label}`} />
        {sudsId === "retencion_norma" && <Row k="Norma aplicada" v={`${NORMA_REF}; OM 060-2023 (Infraestructura Verde-Azul), Art. 26 e)`} />}
        {sudsId !== "retencion_norma" && <Row k="Método de escorrentía" v={`${RUNOFF_METHODS.find((m) => m.id === method).label} (${method === "cn" ? `CN = ${surface.cn}` : `C = ${surface.runoffCoef}`})`} />}
        <Row k="Tipo de SUDS" v={SUDS_TYPES.find((t) => t.id === sudsId).label} />
        {soilK > 0 && sudsId !== "cisterna" && sudsId !== "retencion_norma" && <Row k="Suelo" v={`${soil.label} · k = ${fmt(soilK, 1)} mm/h`} />}
      </tbody></table>

      {sudsId !== "retencion_norma" && <>
      <div style={h2}>2. Volumen de escorrentía de diseño</div>
      <table style={table}><tbody>
        <Row k="Lámina de escorrentía" v={`${fmt(results.runoff.depthMm, 1)} mm`} />
        <Row k="Volumen de diseño" v={`${fmt(results.volL / 1000, 3)} m³ (${fmt(results.volL, 0)} L)`} />
      </tbody></table>
      </>}

      <div style={h2}>{sudsId === "retencion_norma" ? "2. Cálculo del tanque de retención (paso a paso)" : "3. Dimensionamiento preliminar"}</div>
      <table style={table}><tbody>
        {sizingRows(sudsId, r).map(([k, v]) => <Row key={k} k={k} v={v} />)}
        {dd && <Row k="Tiempo de vaciado por infiltración" v={`${fmtHours(dd.hours)} (FS ${INFILTRATION.safetyFactor}; criterio ≤ ${INFILTRATION.okHours} h) — ${dd.level === "ok" ? "cumple" : dd.level === "limite" ? "con precaución" : "requiere dren de salida"}`} />}
      </tbody></table>

      <div style={h2}>{sudsId === "retencion_norma" ? "3" : "4"}. Presupuesto referencial</div>
      <table style={{ ...table, border: "1px solid #ddd" }}>
        <thead>
          <tr style={{ background: "#f3f3f3" }}>
            {["Rubro", "Cant.", "Unid.", "P. unit. USD", "Total USD"].map((h, i) => (
              <th key={h} style={{ textAlign: i ? "right" : "left", padding: "4px 6px", fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {budget.items.map((it) => (
            <tr key={it.desc} style={{ borderTop: "1px solid #eee" }}>
              <td style={{ padding: "3px 6px" }}>{it.desc}</td>
              <td style={{ padding: "3px 6px", textAlign: "right" }}>{fmt(it.qty, 2)}</td>
              <td style={{ padding: "3px 6px", textAlign: "right" }}>{it.unit}</td>
              <td style={{ padding: "3px 6px", textAlign: "right" }}>{fmt(it.p, 2)}</td>
              <td style={{ padding: "3px 6px", textAlign: "right" }}>{fmt(it.qty * it.p, 2)}</td>
            </tr>
          ))}
          <tr style={{ borderTop: "1px solid #ccc" }}>
            <td colSpan={4} style={{ padding: "4px 6px", textAlign: "right" }}>Subtotal</td>
            <td style={{ padding: "4px 6px", textAlign: "right" }}>{fmt(budget.subtotal, 2)}</td>
          </tr>
          <tr>
            <td colSpan={4} style={{ padding: "4px 6px", textAlign: "right", fontWeight: 700 }}>Total con {Math.round(budget.contingency * 100)}% de imprevistos</td>
            <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 700 }}>{fmt(budget.total, 2)}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize: 9, color: "#666", marginTop: 4 }}>Precios: {PRICE_SOURCE}. Sin utilidad del contratista ni IVA.</p>

      <div style={h2}>{sudsId === "retencion_norma" ? "4" : "5"}. Supuestos y limitaciones</div>
      {sudsId === "retencion_norma" ? (
      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10, color: "#333" }}>
        <li>Cálculo según el estándar municipal de recolección y reutilización de agua lluvia (apéndice del PUGS-DMQ): Tablas 1 a 6, ecuaciones IDF de la EMAAP-Q (válidas para TR 2–50 años y 5–360 min).</li>
        <li>La elección de la ecuación IDF y del tiempo de retención debe justificarse en la memoria; la retención adicional con infraestructura verde puede reducir el tanque si se sustenta.</li>
        <li>Volumen muerto (0,40 m) y borde libre (0,50 m) no se cuentan en el volumen útil. Presupuesto para tanque de hormigón de planta cuadrada.</li>
        <li>Resultado de anteproyecto. El proyecto definitivo requiere planos, memoria de cálculo y especificaciones firmados por un profesional responsable.</li>
      </ul>
      ) : (
      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10, color: "#333" }}>
        <li>Datos de lluvia horaria FONAG 2020-2026 (12 estaciones). Percentiles P90/P95 de la lámina de eventos completos; TR por ajuste de Gumbel (serie corta, ~6 años).</li>
        <li>Porosidad de grava 0.35; sustrato de biorretención 0.30. Tasas de infiltración tabuladas (Rawls et al., 1983) salvo ensayo en sitio.</li>
        <li>Dimensionamiento por volumen de captura: no verifica caudales pico, rebose ni estabilidad estructural.</li>
        <li>Resultado orientativo para anteproyecto. No reemplaza el diseño hidráulico detallado ni la revisión de un profesional responsable.</li>
      </ul>
      )}

      <p style={{ fontSize: 9, color: "#666", marginTop: 18, borderTop: "1px solid #ddd", paddingTop: 6 }}>
        {APP_NAME} · v{APP_VERSION} · Idea, metodología y desarrollo: {AUTHOR}. © 2026 {AUTHOR}. Todos los derechos reservados.
      </p>
    </div>
  );
}
