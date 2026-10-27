// SUDS Quito · selección de estación o punto exacto · © 2026 Paulina Lima.
import React, { useMemo, useState } from "react";
import { Info, LocateFixed, MapPin } from "lucide-react";
import LeafletMap from "./LeafletMap.jsx";
import { Notice, Toggle, inputCls } from "./ui.jsx";
import { PARTIAL_RECORD_STATIONS } from "../data/stations.js";
import { MAX_IDW_DISTANCE_KM } from "../lib/climate.js";
import { fmt } from "../lib/format.js";

export default function StationPicker({
  stations, stationId, onSelectStation, point, onPickPoint, onClearPoint, scenario, simple,
}) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState(point ? "punto" : "estacion");
  const [geoMsg, setGeoMsg] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stations;
    return stations.filter(
      (s) => s.name.toLowerCase().includes(q) || s.zona.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
    );
  }, [query, stations]);

  const locate = () => {
    if (!navigator.geolocation) {
      setGeoMsg("Tu navegador no permite obtener la ubicación.");
      return;
    }
    setGeoMsg("Buscando tu ubicación…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoMsg("");
        onPickPoint(pos.coords.latitude, pos.coords.longitude);
      },
      () => setGeoMsg("No se pudo obtener tu ubicación. Haz clic en el mapa en su lugar."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const changeMode = (m) => {
    setMode(m);
    if (m === "estacion") onClearPoint();
  };

  return (
    <div>
      <div className="mb-3">
        <Toggle
          small
          value={mode}
          onChange={changeMode}
          options={[
            { id: "estacion", label: "Elegir una estación" },
            { id: "punto", label: "Mi sitio exacto (en el mapa)" },
          ]}
        />
      </div>

      {mode === "estacion" ? (
        <>
          {simple && (
            <p className="text-sm text-[#1F2A24]/60 mb-3">
              Elige la zona de Quito más cercana a tu casa o terreno. Usamos los datos de lluvia medidos ahí.
            </p>
          )}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca por nombre de estación, código o zona…"
            aria-label="Buscar estación"
            className={`${inputCls} mb-3 placeholder:text-[#1F2A24]/35`}
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
            {filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectStation(s.id)}
                aria-pressed={stationId === s.id && !point}
                className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                  stationId === s.id && !point
                    ? "border-[#2F6F5E] bg-[#2F6F5E]/10"
                    : "border-[#1F2A24]/10 bg-white hover:border-[#2F6F5E]/40"
                }`}
              >
                <div className="font-medium text-sm">{s.name}</div>
                <div className="text-xs text-[#1F2A24]/50 mt-0.5">
                  {s.zona} · {s.code}
                  {PARTIAL_RECORD_STATIONS.includes(s.id) && <span className="text-amber-700"> · registro parcial</span>}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-sm text-[#1F2A24]/50 col-span-full py-4 text-center">
                No se encontró ninguna estación con ese nombre.
              </div>
            )}
          </div>
          <p className="text-xs text-[#1F2A24]/50 mt-4 mb-2 flex items-center gap-1.5">
            <Info size={12} /> O haz clic en una estación directamente en el mapa:
          </p>
        </>
      ) : (
        <div className="mb-3">
          <p className="text-sm text-[#1F2A24]/60 mb-3">
            {simple
              ? "Toca en el mapa el lugar exacto de tu casa o terreno. Calculamos la lluvia combinando las estaciones más cercanas."
              : "Haz clic en el mapa: la lluvia de diseño se interpola por distancia inversa (IDW, potencia 2) a partir de las 4 estaciones más cercanas."}
          </p>
          <button
            type="button"
            onClick={locate}
            className="inline-flex items-center gap-2 rounded-xl border border-[#1F2A24]/15 bg-white px-4 py-2 text-xs font-medium hover:border-[#2F6F5E] hover:text-[#2F6F5E]"
          >
            <LocateFixed size={14} /> Usar mi ubicación actual
          </button>
          {geoMsg && <span className="text-xs text-[#1F2A24]/55 ml-3">{geoMsg}</span>}
        </div>
      )}

      <LeafletMap
        stations={stations}
        selectedId={point ? null : stationId}
        onSelect={(id) => {
          setMode("estacion");
          onSelectStation(id);
        }}
        scenario={scenario === "custom" ? "p90" : scenario}
        point={point}
        pickMode={mode === "punto"}
        onPickPoint={onPickPoint}
      />

      {point && <PointSummary point={point} simple={simple} />}
    </div>
  );
}

function PointSummary({ point, simple }) {
  return (
    <div className="mt-3 space-y-2">
      <div className="rounded-xl border border-amber-300/60 bg-amber-50/60 p-4 text-xs">
        <div className="flex items-center gap-2 font-semibold text-amber-800 mb-1">
          <MapPin size={14} /> Tu punto: {fmt(point.lat, 5)}, {fmt(point.lon, 5)} · elevación estimada {fmt(point.elevationM, 0)} m
        </div>
        {!simple && (
          <table className="w-full mt-2">
            <thead>
              <tr className="text-[#1F2A24]/50">
                <th className="text-left font-medium py-1">Estación usada</th>
                <th className="text-right font-medium py-1">Distancia</th>
                <th className="text-right font-medium py-1">Peso</th>
                <th className="text-right font-medium py-1">P90</th>
              </tr>
            </thead>
            <tbody>
              {point.interpolation.stations.map((s) => (
                <tr key={s.id} className="border-t border-amber-200/60">
                  <td className="py-1">{s.name}</td>
                  <td className="py-1 text-right">{fmt(s.distanceKm, 1)} km</td>
                  <td className="py-1 text-right">{fmt(s.weight * 100, 0)}%</td>
                  <td className="py-1 text-right">{fmt(s.value, 1)} mm</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {simple && (
          <p className="text-[#1F2A24]/65">
            Usamos {point.interpolation.stations.length} estaciones cercanas; la más próxima está a {fmt(point.nearestKm, 1)} km.
          </p>
        )}
      </div>
      {!point.reliable && (
        <Notice tone="bad">
          Tu punto está a más de {MAX_IDW_DISTANCE_KM} km de la estación más cercana. La lluvia estimada es poco fiable:
          los resultados solo sirven como orden de magnitud.
        </Notice>
      )}
      {!simple && point.reliable && (
        <p className="text-xs text-[#1F2A24]/45">
          La interpolación IDW no considera la elevación ni el relieve. En laderas con fuerte gradiente altitudinal, compara con la estación más cercana.
        </p>
      )}
    </div>
  );
}
