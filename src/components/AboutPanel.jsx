// SUDS Quito · panel "Acerca de" · © 2026 Paulina Lima.
import React from "react";
import { APP_VERSION, RELEASE_DATE } from "../version.js";
import { ANALYSIS } from "../data/stations.js";

export default function AboutPanel() {
  return (
    <div className="max-w-5xl mx-auto px-5 py-6 font-body border-b border-[#1F2A24]/10 print:hidden">
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <h3 className="font-display text-base font-semibold mb-3">¿Para qué sirve?</h3>
          <p className="text-sm text-[#1F2A24]/70 leading-relaxed mb-3">
            Permite estimar de forma rápida el tamaño inicial de un Sistema Urbano de Drenaje Sostenible (SUDS) para cualquier punto de Quito.
            Usa datos de lluvia de 12 estaciones FONAG (2020-2026) y calcula volumen de escorrentía, dimensiones preliminares, tiempo de vaciado
            por infiltración y presupuesto referencial para biorretención, pavimento permeable, zanjas, depósitos de infiltración y cisternas.
          </p>
          <div className="rounded-xl bg-amber-50 border border-amber-200/50 p-3 text-xs text-amber-900 mb-3">
            <strong>Importante:</strong> los resultados son para anteproyecto y comunicación técnica inicial. No sustituyen el diseño hidráulico
            definitivo ni la revisión de un profesional responsable.
          </div>
          <h3 className="font-display text-base font-semibold mb-2 mt-4">Flujo de uso</h3>
          <ol className="text-xs text-[#1F2A24]/70 space-y-1.5 leading-relaxed list-none">
            {[
              ["01", "Selecciona modo", "Explicación simple para usuarios generales; Vista técnica para arquitectos e ingenieros."],
              ["02", "Ubica tu sitio", "Elige la estación más cercana o marca tu punto exacto en el mapa (la lluvia se interpola)."],
              ["03", "Lluvia de diseño", "P90 para manejo cotidiano; P95 para lluvia más fuerte; TR2–TR25 para análisis técnico."],
              ["04", "Área y superficie", "Superficie del techo, patio o lote que genera escorrentía, y su tipo."],
              ["05", "Tipo de SUDS y suelo", "Elige el sistema y el tipo de suelo para estimar cuánto tarda en vaciarse."],
              ["06", "Lee y guarda", "Volumen, dimensiones, presupuesto y advertencias. Imprime la memoria de cálculo o copia el enlace."],
            ].map(([n, t, d]) => (
              <li key={n} className="flex gap-2">
                <span className="font-display text-[#2F6F5E] font-semibold shrink-0">{n}</span>
                <span><strong>{t}:</strong> {d}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h3 className="font-display text-base font-semibold mb-3">Escenarios de lluvia</h3>
          <div className="overflow-x-auto rounded-xl border border-[#1F2A24]/10 bg-white mb-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1F2A24]/10 bg-[#1F2A24]/[0.03]">
                  <th className="text-left px-3 py-2 font-medium text-[#1F2A24]/60">Escenario</th>
                  <th className="text-left px-3 py-2 font-medium text-[#1F2A24]/60">Uso</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["P90", "Control de volumen cotidiano (90% de eventos capturados)", true],
                  ["P95", "Control ampliado, diseño conservador (95% de eventos)", true],
                  ["TR2–TR5", "Alcantarillado domiciliario y secundario"],
                  ["TR10", "Colectores principales"],
                  ["TR25", "Infraestructura mayor y puentes"],
                  ["Personalizado", "Revisar con un valor propio de lámina de lluvia (mm)"],
                ].map(([sc, uso, green]) => (
                  <tr key={sc} className={`border-b border-[#1F2A24]/5 ${green ? "bg-[#2F6F5E]/5" : ""}`}>
                    <td className="px-3 py-2 font-medium">{sc}</td>
                    <td className="px-3 py-2 text-[#1F2A24]/60">{uso}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="font-display text-base font-semibold mb-2">Variabilidad climática · El Niño</h3>
          <div className="rounded-xl bg-white border border-[#1F2A24]/10 p-3 text-xs text-[#1F2A24]/70 leading-relaxed mb-3">
            <p className="mb-2">
              Los datos de esta app corresponden al período 2020-2026, que incluyó el evento <strong>El Niño 2023-2024</strong>. En años de El Niño,
              la sierra ecuatoriana puede presentar anomalías significativas respecto al promedio:
            </p>
            <div className="space-y-1">
              {[
                ["1997–1998", "El Niño fuerte", "Lluvias extremas en costa. En sierra: comportamiento irregular."],
                ["2015–2016", "El Niño moderado-fuerte", "Afectó la temporada lluviosa de la sierra norte."],
                ["2023–2024", "El Niño moderado", "Efecto mixto en 2023 y déficit en la mayoría de estaciones de Quito en 2024."],
              ].map(([anios, tipo, efecto]) => (
                <div key={anios} className="border-l-2 border-amber-400 pl-2">
                  <span className="font-semibold text-amber-700">{anios} · {tipo}:</span> <span>{efecto}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[#1F2A24]/50">Fuentes: INAMHI, ERFEN-Ecuador, Secretaría de Gestión de Riesgos.</p>
          </div>
          <h3 className="font-display text-base font-semibold mb-2">Referencias principales</h3>
          <ul className="text-xs text-[#1F2A24]/60 space-y-0.5">
            <li>· CIRIA (2015) The SuDS Manual C753</li>
            <li>· US EPA — Stormwater Capture / Green Infrastructure; LID Manual</li>
            <li>· USDA NRCS (1986) TR-55 · Urban Hydrology for Small Watersheds</li>
            <li>· Chow, Maidment y Mays (1988) — Applied Hydrology</li>
            <li>· Rawls, Brakensiek y Miller (1983) — parámetros de infiltración Green-Ampt</li>
            <li>· Gumbel (1958) — Statistics of Extremes</li>
            <li>· Municipio de Quito — OM 060-2023, Infraestructura Verde-Azul</li>
            <li>· EPMAPS / PUGS — Estándar de recolección y reutilización de agua lluvia (IDF EMAAP-Q)</li>
            <li>· Análisis de lluvias: Paulina Lima, {ANALYSIS.label}, sobre registros FONAG {ANALYSIS.period} (12 estaciones). Se actualiza cada año; próxima actualización: {ANALYSIS.nextLabel}.</li>
          </ul>
          <p className="text-xs text-[#1F2A24]/40 mt-4">
            Versión {APP_VERSION} · {RELEASE_DATE} · © 2026 Paulina Lima. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
