// SUDS Quito · resultados por tipo de SUDS y presupuesto · © 2026 Paulina Lima.
import React from "react";
import { StatBlock, Notice } from "./ui.jsx";
import { fmt, fmtHours } from "../lib/format.js";
import { INFILTRATION, PAVEMENT } from "../lib/hydrology.js";
import { PRICE_SOURCE } from "../data/prices.js";

const card = "rounded-xl bg-white border border-[#1F2A24]/10 p-5";
const note = "text-xs text-[#1F2A24]/55 mt-2";

export function SudsResult({ sudsId, r, simple }) {
  switch (sudsId) {
    case "biorretencion": return <BioResult r={r} simple={simple} />;
    case "permeable": return <PermeableResult r={r} simple={simple} />;
    case "zanja": return <TrenchResult r={r} simple={simple} />;
    case "deposito": return <ChamberResult r={r} simple={simple} />;
    case "cisterna": return <CisternResult r={r} simple={simple} />;
    default: return null;
  }
}

function BioResult({ r, simple }) {
  const tooBig = r.pctOfAportante > 40;
  return (
    <div>
      {simple ? (
        <div className={card}>
          <p className="text-sm leading-relaxed">
            Necesitas un jardín hundido de aproximadamente <strong>{fmt(r.areaM2)} m²</strong> — eso es {fmt(r.pctOfAportante, 0)}% del tamaño de tu techo o patio.
            Debe tener una hondura de unos <strong>{fmt(r.pondingDepth * 100, 0)} cm</strong> donde se junta el agua, sobre una capa de tierra especial de <strong>{fmt(r.mediaDepth * 100, 0)} cm</strong> que deja pasar el agua hacia el suelo.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-3">
          <StatBlock label="Área de biorretención" value={`${fmt(r.areaM2)} m²`} sub={`≈ ${fmt(r.pctOfAportante, 0)}% del área aportante`} />
          <StatBlock label="Profundidad de ponding" value={`${fmt(r.pondingDepth * 100, 0)} cm`} sub="almacenamiento superficial" />
          <StatBlock label="Espesor de sustrato" value={`${fmt(r.mediaDepth * 100, 0)} cm`} sub={`+ ${fmt(r.gravelDepth * 100, 0)} cm de grava de drenaje`} />
        </div>
      )}
      {tooBig && (
        <p className={note}>
          {simple
            ? "Ese jardín ocuparía bastante espacio de tu lote. Podrías combinarlo con un piso permeable o una cisterna para repartir el agua entre los dos."
            : "El área requerida supera ~40% del lote aportante: considera combinarlo con pavimento permeable o una cisterna para repartir el volumen."}
        </p>
      )}
    </div>
  );
}

function PermeableResult({ r, simple }) {
  const ratioHigh = r.areaRatio > PAVEMENT.maxAreaRatio;
  return (
    <div>
      {simple ? (
        <div className={card}>
          <p className="text-sm leading-relaxed">
            Bajo el piso permeable de <strong>{fmt(r.areaPavement, 0)} m²</strong> necesitas una capa de grava de unos <strong>{fmt(r.baseDepth * 100, 0)} cm</strong> de espesor.
            Esa capa puede guardar aproximadamente el <strong>{fmt(r.coverage, 0)}%</strong> del agua de la lluvia elegida.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-3">
          <StatBlock label="Espesor de base de grava" value={`${fmt(r.baseDepth * 100, 0)} cm`} sub={`calculado ${fmt(r.rawDepth * 100, 0)} cm · porosidad ${fmt(r.voidRatio * 100, 0)}%`} />
          <StatBlock label="Capacidad de captura" value={`${fmt(r.coverage, 0)}%`} sub="del volumen de diseño" />
          <StatBlock label="Volumen objetivo" value={`${fmt(r.volumeM3, 2)} m³`} sub={`sobre ${fmt(r.areaPavement, 0)} m² de pavimento`} />
        </div>
      )}
      {r.coverage < 100 && (
        <p className={note}>
          {simple
            ? "Aun con la capa más gruesa recomendada (60 cm), el piso no alcanza a guardar toda el agua. Amplía el área permeable o súmale otro SUDS."
            : "Se alcanzó el espesor máximo constructivo (60 cm) sin cubrir el volumen: amplía el área de pavimento o combina con otro SUDS."}
        </p>
      )}
      {ratioHigh && (
        <p className={note}>
          {simple
            ? "Le llega agua de un área mucho más grande que el propio piso; con el tiempo se puede tapar con sedimento. Conviene agrandar el piso permeable."
            : `El área impermeable adicional que drena al pavimento es ${fmt(r.areaRatio, 1)} veces su superficie (recomendado ≤ ${PAVEMENT.maxAreaRatio}:1, CIRIA C753): riesgo de colmatación.`}
        </p>
      )}
    </div>
  );
}

function TrenchResult({ r, simple }) {
  const tooLong = r.length > 30;
  return (
    <div>
      {simple ? (
        <div className={card}>
          <p className="text-sm leading-relaxed">
            Necesitas una zanja de aproximadamente <strong>{fmt(r.length)} m</strong> de largo, por <strong>{fmt(r.width, 2)} m</strong> de ancho y <strong>{fmt(r.depth, 2)} m</strong> de profundidad, rellena de piedra (grava).
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-3">
          <StatBlock label="Largo de zanja" value={`${fmt(r.length)} m`} sub={`para ${fmt(r.volumeM3, 2)} m³ de captura`} />
          <StatBlock label="Ancho" value={`${fmt(r.width, 2)} m`} sub="definido por ti" />
          <StatBlock label="Profundidad" value={`${fmt(r.depth, 2)} m`} sub={`relleno con porosidad ≈ ${fmt(r.voidRatio * 100, 0)}%`} />
        </div>
      )}
      {tooLong && (
        <p className={note}>
          {simple
            ? "Esa zanja sería bastante larga para un lote pequeño. Podrías dividirla en varios tramos más cortos, o combinarla con otro tipo de SUDS."
            : "El largo requerido supera ~30 m: considera dividir en varios tramos en paralelo o combinar con otro SUDS para repartir el volumen."}
        </p>
      )}
    </div>
  );
}

function ChamberResult({ r, simple }) {
  if (simple) {
    return (
      <div className={card}>
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
        <StatBlock label="Volumen de captura" value={`${fmt(r.captureVolumeM3, 2)} m³`} sub={`porosidad de relleno ≈ ${fmt(r.voidRatio * 100, 0)}%`} />
        <StatBlock label="Cobertura" value={`${fmt(r.coveragePct, 0)}%`} sub={`de ${fmt(r.volumeNeededM3, 2)} m³ requeridos`} />
      </div>
      {!r.sufficient && (
        <p className={note}>
          La caja no alcanza a captar todo el volumen de diseño: considera ampliar sus dimensiones o combinarla con otro SUDS para repartir el volumen restante.
        </p>
      )}
    </div>
  );
}

function CisternResult({ r, simple }) {
  if (simple) {
    return (
      <div className={card}>
        <p className="text-sm leading-relaxed">
          Necesitas una cisterna de aproximadamente <strong>{fmt(r.volumeM3, 2)} m³</strong> (unos {fmt(r.volumeM3 * 1000, 0)} litros).
          Si es cilíndrica y de {fmt(r.heightAssumed, 1)} m de alto, tendría cerca de <strong>{fmt(r.diameter, 2)} m</strong> de diámetro.
          Conviene vaciarla en unas <strong>{r.emptyByHours} horas</strong> después de cada lluvia, para que esté lista antes de la siguiente.
        </p>
      </div>
    );
  }
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      <StatBlock label="Volumen de cisterna" value={`${fmt(r.volumeM3, 2)} m³`} sub="con 10% de seguridad" />
      <StatBlock label="Diámetro sugerido" value={`${fmt(r.diameter, 2)} m`} sub={`altura asumida ${fmt(r.heightAssumed, 1)} m`} />
      <StatBlock label="Vaciar antes de" value={`${r.emptyByHours} h`} sub={`tiempo seco mediano: ${r.dryHours} h`} />
    </div>
  );
}

// --- Tiempo de vaciado por infiltración ------------------------------------

const LEVEL_TONE = { ok: "info", limite: "warn", malo: "bad" };

export function DrawdownPanel({ d, dryHours, soilLabel, soilK, simple }) {
  if (!d) return null;
  const tone = LEVEL_TONE[d.level];
  return (
    <Notice tone={tone} className="mt-4">
      {simple ? (
        <p>
          <strong>¿Cuánto tarda en vaciarse?</strong> Con tu tipo de suelo ({soilLabel.toLowerCase()}), el agua guardada se filtra en unos{" "}
          <strong>{fmtHours(d.hours)}</strong>.{" "}
          {d.level === "ok" && "Es un buen tiempo: el sistema estará listo para la próxima lluvia."}
          {d.level === "limite" && "Es algo lento: podría quedar agua estancada varios días. Conviene hacer una prueba de infiltración en tu terreno."}
          {d.level === "malo" && "Es demasiado lento: el suelo casi no deja pasar el agua. Necesitarás un tubo de salida (dren) o elegir una cisterna."}
        </p>
      ) : (
        <div>
          <p>
            <strong>Tiempo de vaciado por infiltración: {fmtHours(d.hours)}</strong> · suelo {soilLabel.toLowerCase()} (k = {fmt(soilK, 1)} mm/h,
            factor de seguridad {INFILTRATION.safetyFactor}) · área de infiltración {fmt(d.area, 1)} m² · volumen {fmt(d.stored, 2)} m³.
          </p>
          <p className="mt-1">
            {d.level === "ok" && `Cumple el criterio de vaciado ≤ ${INFILTRATION.okHours} h.`}
            {d.level === "limite" && `Entre ${INFILTRATION.okHours} y ${INFILTRATION.maxHours} h: aceptable con precaución (riesgo de encharcamiento prolongado).`}
            {d.level === "malo" && `Supera ${INFILTRATION.maxHours} h: diseñar con dren de salida a la red o un sistema de detención/reutilización.`}{" "}
            {d.beforeNextEvent
              ? `Se vacía antes del tiempo seco mediano entre eventos (${dryHours} h).`
              : `No alcanza a vaciarse en el tiempo seco mediano entre eventos (${dryHours} h): el siguiente evento puede encontrarlo parcialmente lleno.`}
          </p>
          {d.lowRate && (
            <p className="mt-1">
              Tasa de infiltración menor a {INFILTRATION.minViableRate} mm/h (1×10⁻⁶ m/s): la infiltración suele ser poco viable; confirmar con ensayo en sitio.
            </p>
          )}
        </div>
      )}
    </Notice>
  );
}

// --- Presupuesto ------------------------------------------------------------

export function BudgetTable({ budget, simple }) {
  if (!budget) return null;
  const pct = Math.round(budget.contingency * 100);
  if (simple) {
    return (
      <div className={card}>
        <p className="text-sm leading-relaxed">
          El costo referencial de construcción es de aproximadamente{" "}
          <strong className="text-[#2F6F5E]">${fmt(budget.total, 0)} USD</strong>{" "}
          (incluye un {pct}% de margen para imprevistos). Este valor es solo una guía para planificación — el costo real depende del sitio y del contratista.
        </p>
      </div>
    );
  }
  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-[#1F2A24]/10 bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1F2A24]/10 bg-[#1F2A24]/[0.03]">
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
            <tr className="border-t border-[#1F2A24]/15 bg-[#1F2A24]/[0.03]">
              <td colSpan={4} className="px-4 py-2.5 text-right text-[#1F2A24]/60 text-xs">Subtotal (sin imprevistos)</td>
              <td className="px-4 py-2.5 text-right font-medium">${fmt(budget.subtotal, 2)}</td>
            </tr>
            <tr className="bg-[#2F6F5E]/[0.08]">
              <td colSpan={4} className="px-4 py-2.5 text-right font-semibold text-[#2F6F5E] text-xs">Total + {pct}% imprevistos</td>
              <td className="px-4 py-2.5 text-right font-display font-semibold text-[#2F6F5E]">${fmt(budget.total, 2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-xs text-[#1F2A24]/40 mt-2">
        Precios referenciales: {PRICE_SOURCE}. No incluyen utilidad del contratista ni IVA. Actualizar cada 6 meses.
      </p>
    </div>
  );
}
