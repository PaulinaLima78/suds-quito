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
        <Row k="Escenario de lluvia" v={`${scenarioLabel(scenario)} · ${fmt(rainMm, 1)} mm`} />
        <Row k="Área aportante" v={`${fmt(area, 1)} m² · ${surface.label}`} />
        <Row k="Método de escorrentía" v={`${RUNOFF_METHODS.find((m) => m.id === method).label} (${method === "cn" ? `CN = ${surface.cn}` : `C = ${surface.runoffCoef}`})`} />
        <Row k="Tipo de SUDS" v={SUDS_TYPES.find((t) => t.id === sudsId).label} />
        {soilK > 0 && sudsId !== "cisterna" && <Row k="Suelo" v={`${soil.label} · k = ${fmt(soilK, 1)} mm/h`} />}
      </tbody></table>

      <div style={h2}>2. Volumen de escorrentía de diseño</div>
      <table style={table}><tbody>
        <Row k="Lámina de escorrentía" v={`${fmt(results.runoff.depthMm, 1)} mm`} />
        <Row k="Volumen de diseño" v={`${fmt(results.volL / 1000, 3)} m³ (${fmt(results.volL, 0)} L)`} />
      </tbody></table>

      <div style={h2}>3. Dimensionamiento preliminar</div>
      <table style={table}><tbody>
        {sizingRows(sudsId, r).map(([k, v]) => <Row key={k} k={k} v={v} />)}
        {dd && <Row k="Tiempo de vaciado por infiltración" v={`${fmtHours(dd.hours)} (FS ${INFILTRATION.safetyFactor}; criterio ≤ ${INFILTRATION.okHours} h) — ${dd.level === "ok" ? "cumple" : dd.level === "limite" ? "con precaución" : "requiere dren de salida"}`} />}
      </tbody></table>

      <div style={h2}>4. Presupuesto referencial</div>
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

      <div style={h2}>5. Supuestos y limitaciones</div>
      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10, color: "#333" }}>
        <li>Datos de lluvia horaria FONAG 2020-2026 (12 estaciones). Percentiles P90/P95 de la lámina de eventos completos; TR por ajuste de Gumbel (serie corta, ~6 años).</li>
        <li>Porosidad de grava 0.35; sustrato de biorretención 0.30. Tasas de infiltración tabuladas (Rawls et al., 1983) salvo ensayo en sitio.</li>
        <li>Dimensionamiento por volumen de captura: no verifica caudales pico, rebose ni estabilidad estructural.</li>
        <li>Resultado orientativo para anteproyecto. No reemplaza el diseño hidráulico detallado ni la revisión de un profesional responsable.</li>
      </ul>

      <p style={{ fontSize: 9, color: "#666", marginTop: 18, borderTop: "1px solid #ddd", paddingTop: 6 }}>
        {APP_NAME} · v{APP_VERSION} · Idea, metodología y desarrollo: {AUTHOR}. © 2026 {AUTHOR}. Todos los derechos reservados.
      </p>
    </div>
  );
}
