// ---------------------------------------------------------------------------
// SUDS Quito · Tanque de retención según el estándar municipal de agua lluvia
// © 2026 Paulina Lima. Todos los derechos reservados.
// ---------------------------------------------------------------------------
import React from "react";
import { NumberField, Notice, StatBlock, inputCls } from "./ui.jsx";
import { fmt } from "../lib/format.js";
import {
  OCUPACIONES, IDF_STATIONS, C_IMPERMEABLE, C_PERMEABLE, NORMA_REF, DEAD_HEIGHT, FREEBOARD,
  TABLA1, REUSO, MIN_DURATION,
} from "../data/normaQuito.js";

const label = "text-xs font-medium text-[#1F2A24]/60 mb-1.5 block";

function Select({ id, text, value, onChange, options, hint }) {
  return (
    <div>
      <label htmlFor={id} className={label}>{text}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
      {hint && <p className="text-xs text-[#1F2A24]/45 mt-1">{hint}</p>}
    </div>
  );
}

export function NormInputs({ st, set, area, simple, suggestedIdf }) {
  const auto = IDF_STATIONS.find((s) => s.id === suggestedIdf);
  return (
    <div className="mt-4 space-y-4">
      <Notice tone="info">
        {simple
          ? "Desde la Ordenanza Verde Azul (OM 060-2023), toda construcción nueva en el área urbana de Quito debe tener un tanque que retenga el agua lluvia de su lote. Aquí calculamos el tamaño mínimo que exige la norma."
          : <>Dimensionamiento del volumen de retención obligatorio por lote según el <strong>{NORMA_REF}</strong>, al que remite el Art. 26 e) de la OM 060-2023 (Infraestructura Verde-Azul). Aplica a proyectos constructivos nuevos en suelo urbano del DMQ.</>}
      </Notice>
      <div className="grid sm:grid-cols-2 gap-4">
        <NumberField id="n-impf" label={simple ? "¿Cuántos m² del lote quedarán cubiertos con techo o piso duro?" : "Área impermeable con proyecto (m²)"}
          value={st.normImpFinal} onChange={(v) => set({ normImpFinal: v })} step="1"
          placeholder={`ej. ${fmt(area * 0.8, 0)}`} hint={`Del total de ${fmt(area, 0)} m² del lote.`} />
        <NumberField id="n-impi" label={simple ? "¿Cuántos m² están cubiertos hoy, antes de construir?" : "Área impermeable en condición inicial (m²)"}
          value={st.normImpInitial} onChange={(v) => set({ normImpInitial: v })} step="1" placeholder="0"
          hint={simple ? "Si hoy es terreno vacío, deja 0." : "Lote antes del proyecto (Co)."} />
        <Select id="n-occ" text={simple ? "Uso del edificio" : "Tipo de ocupación (Tabla 2 → TR)"} value={st.normOcupacion}
          onChange={(v) => set({ normOcupacion: v })}
          options={OCUPACIONES.map((o) => ({ id: o.id, label: `${o.label}${simple ? "" : ` · TR ${o.tr} años`}` }))} />
        <Select id="n-cov" text={simple ? "¿Cómo será la parte que quede con jardín o tierra?" : "Cobertura permeable con proyecto (Tabla 4)"}
          value={st.normCoverFinal} onChange={(v) => set({ normCoverFinal: v })} options={C_PERMEABLE} />
      </div>
      {!simple && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Select id="n-covi" text="Cobertura permeable inicial (Tabla 4)" value={st.normCoverInitial}
            onChange={(v) => set({ normCoverInitial: v })} options={C_PERMEABLE} />
          <Select id="n-impt" text="Superficie impermeable" value={st.normImpType}
            onChange={(v) => set({ normImpType: v })} options={C_IMPERMEABLE} />
          <Select id="n-idf" text="Ecuación IDF EMAAP-Q (Tabla 3)" value={st.normIdf || "auto"}
            onChange={(v) => set({ normIdf: v === "auto" ? "" : v })}
            options={[{ id: "auto", label: `Automática: ${auto ? auto.name : "—"} (según el estándar)` }, ...IDF_STATIONS.map((s) => ({ id: s.id, label: s.name }))]}
            hint={(IDF_STATIONS.find((s) => s.id === (st.normIdf || suggestedIdf)) || {}).uso} />
          <NumberField id="n-dur" label={`Duración de la lluvia (min, ≥ ${MIN_DURATION})`} value={st.normDuration}
            onChange={(v) => set({ normDuration: v })} step="5" />
          <NumberField id="n-tret" label="Tiempo de retención T_RET (min)" value={st.normTret}
            onChange={(v) => set({ normTret: v })} step="5" />
          <NumberField id="n-h" label="Altura útil del agua (m)" value={st.normHeight}
            onChange={(v) => set({ normHeight: v })} hint={`Se suman ${fmt(DEAD_HEIGHT, 2)} m de volumen muerto y ${fmt(FREEBOARD, 2)} m de borde libre.`} />
          <NumberField id="n-pis" label="Número de pisos" value={st.normPisos} onChange={(v) => set({ normPisos: v })} step="1" placeholder="opcional" />
          <NumberField id="n-au" label="Área útil construida (m²)" value={st.normAreaUtil} onChange={(v) => set({ normAreaUtil: v })} step="1" placeholder="opcional" />
        </div>
      )}
    </div>
  );
}

export function NormResult({ r, simple }) {
  const cumple = (
    <div className="rounded-2xl border border-[#2F6F5E]/25 bg-[#2F6F5E]/[0.06] p-5 mb-4">
      <div className="text-sm font-medium text-[#2F6F5E] mb-1">
        {simple ? "Tamaño mínimo del tanque que exige la norma" : "Volumen útil de retención exigido"}
      </div>
      <div className="font-display text-3xl font-semibold">{fmt(r.vDesign, 2)} m³</div>
      <div className="text-xs text-[#1F2A24]/55 mt-1">
        {r.governedBy === "tabla"
          ? `Rige la Tabla 1 (lote de ${fmt(r.area, 0)} m²): el cálculo da ${fmt(r.vCalc, 2)} m³, menor que el mínimo.`
          : `Rige el cálculo: ${fmt(r.vCalc, 2)} m³${r.vTable !== null ? ` (Tabla 1 exige al menos ${fmt(r.vTable, 0)} m³)` : ""}.`}
      </div>
    </div>
  );

  return (
    <div>
      {cumple}
      {simple ? (
        <div className="rounded-xl bg-white border border-[#1F2A24]/10 p-5">
          <p className="text-sm leading-relaxed">
            Un tanque de unos <strong>{fmt(r.side, 2)} × {fmt(r.side, 2)} m</strong> de base y <strong>{fmt(r.totalHeight, 2)} m</strong> de profundidad total cumple la norma
            ({fmt(r.usefulHeight, 2)} m de agua útil, más {DEAD_HEIGHT * 100} cm en el fondo para que se asiente la tierra y {FREEBOARD * 100} cm libres arriba).
            {r.diam && <> Se conecta a la caja de la calle con un tubo de desagüe de <strong>{r.diam.descarga} mm</strong> y un rebose de <strong>{r.diam.desborde} mm</strong>, y se vacía solo en unos <strong>{fmt(r.vac.minutes, 0)} minutos</strong>.</>}
          </p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-3">
            <StatBlock label="Intensidad de diseño" value={`${fmt(r.intensity, 1)} mm/h`} sub={`${r.station.name} · TR ${r.tr} años · ${r.duration} min`} />
            <StatBlock label="Coeficientes ponderados" value={`Cu ${fmt(r.cu, 2)} · Co ${fmt(r.co, 2)}`} sub={`ΔC = ${fmt(r.deltaC, 3)} · C imp. ${fmt(r.cImp, 2)}`} />
            <StatBlock label="Planta × altura total" value={`${fmt(r.side, 2)} × ${fmt(r.side, 2)} × ${fmt(r.totalHeight, 2)} m`}
              sub={`útil ${fmt(r.usefulHeight, 2)} + muerto ${fmt(DEAD_HEIGHT, 2)} + borde ${fmt(FREEBOARD, 2)} m`} />
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mt-3">
            <StatBlock label="Ø descarga a caja (Tabla 5)" value={r.diam ? `${r.diam.descarga} mm` : "Calcular"} sub={r.diam ? "vaciado inferior" : "lote > 2500 m²"} />
            <StatBlock label="Ø desborde a caja (Tabla 6)" value={r.diam ? `${r.diam.desborde} mm` : "Calcular"} sub={r.diam ? "rebose superior" : `con TR siguiente a ${r.tr} años`} />
            <StatBlock label="Tiempo de vaciado" value={r.vac ? `${fmt(r.vac.minutes, 0)} min` : "—"}
              sub={r.vac ? `Qv = ${fmt(r.vac.qv * 1000, 2)} L/s · Cd 0,60 · H ${fmt(r.usefulHeight, 2)} m` : "según diámetro calculado"} />
          </div>
          <div className="mt-3 rounded-xl bg-white border border-[#1F2A24]/10 p-4 text-xs text-[#1F2A24]/70 leading-relaxed">
            <p className="font-mono bg-[#1F2A24]/5 rounded px-3 py-2 mb-2 overflow-x-auto whitespace-nowrap">
              V = (Cu − Co) · I · A / 6 · T_RET = ({fmt(r.cu, 3)} − {fmt(r.co, 3)}) · {fmt(r.intensity, 1)} · {fmt(r.area / 10000, 4)} / 6 · {r.tret} = {fmt(r.vCalc, 2)} m³
            </p>
            <p>
              I = a·Tr^b·[ln(t+3)]^c·(ln Tr)^d / t^e (EMAAP-Q, {r.station.name}). A en hectáreas, T_RET en minutos. El volumen útil no incluye el volumen muerto
              ({fmt(r.deadVolume, 2)} m³) ni el borde libre. Tabla 1: {TABLA1.map((t, k) => `${k ? (TABLA1[k - 1].max + 1) : 0}–${t.max} m² → ${t.vol} m³`).join(" · ")}.
            </p>
          </div>
        </>
      )}
      {r.reusoObligatorio && (
        <Notice tone="warn" className="mt-3">
          Con más de {REUSO.pisos} pisos o más de {fmt(REUSO.areaUtil, 0)} m² de área útil, el estándar exige además un <strong>sistema de reúso de agua lluvia</strong> (limpieza de áreas
          externas, inodoros, lavanderías; riego preferentemente con agua lluvia), con red separada y tratamiento según el uso final.
        </Notice>
      )}
      {r.warnings.map((w) => <Notice key={w} tone="warn" className="mt-3">{w}</Notice>)}
      <p className="text-xs text-[#1F2A24]/55 mt-3">
        {simple
          ? "Si además pones techos verdes, jardines de lluvia u otros SUDS, el tanque puede ser más pequeño, siempre que lo justifiques en la memoria de cálculo."
          : "El estándar permite reducir el tanque con infraestructura verde (retención adicional o menor área impermeable), justificándolo en la memoria de cálculo. Verificación municipal: planos, memoria de cálculo paso a paso, memoria descriptiva y especificaciones técnicas."}
      </p>
    </div>
  );
}
