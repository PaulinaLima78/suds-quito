// ---------------------------------------------------------------------------
// SUDS Quito · Mapa de estaciones (Leaflet + OpenStreetMap)
// © 2026 Paulina Lima. Todos los derechos reservados.
// v2.0: Leaflet se instala como dependencia (antes se cargaba desde un CDN),
// las etiquetas se actualizan al cambiar de escenario y se puede elegir un
// punto exacto en el mapa (interpolación IDW).
// ---------------------------------------------------------------------------
import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SCENARIOS } from "../data/catalogs.js";
import { fmt } from "../lib/format.js";

const GREEN = "#1D9E75";
const GREEN_DARK = "#0F6E56";
const POINT = "#D97706";

function valueFor(s, scenario) {
  const sc = SCENARIOS.find((x) => x.id === scenario) || SCENARIOS[0];
  return s[sc.field];
}

export default function LeafletMap({ stations, selectedId, onSelect, scenario, point, pickMode, onPickPoint }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const pointLayerRef = useRef(null);
  const handlersRef = useRef({ onSelect, onPickPoint, pickMode });
  handlersRef.current = { onSelect, onPickPoint, pickMode };

  // Crear el mapa una sola vez
  useEffect(() => {
    const map = L.map(elRef.current, { zoomControl: true, scrollWheelZoom: false }).setView([-0.22, -78.52], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 18,
    }).addTo(map);

    let markerClicked = false;
    stations.forEach((s) => {
      const m = L.circleMarker([s.lat, s.lon], {
        radius: 14,
        fillColor: GREEN,
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      }).addTo(map);
      m.on("click", (e) => {
        markerClicked = true;
        L.DomEvent.stopPropagation(e);
        handlersRef.current.onSelect(s.id);
      });
      markersRef.current[s.id] = m;
    });

    map.on("click", (e) => {
      if (markerClicked) {
        markerClicked = false;
        return;
      }
      const h = handlersRef.current;
      if (h.pickMode && h.onPickPoint) h.onPickPoint(e.latlng.lat, e.latlng.lng);
    });

    pointLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, [stations]);

  // Estilo y etiqueta de cada estación
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, m]) => {
      const s = stations.find((x) => x.id === id);
      const sel = id === selectedId;
      m.setStyle({ fillColor: sel ? GREEN_DARK : GREEN, radius: sel ? 18 : 14, fillOpacity: point ? 0.6 : 0.9 });
      m.unbindTooltip();
      m.bindTooltip(`<b>${s.name}</b> (${s.code})<br/>${fmt(valueFor(s, scenario), 1)} mm`, { direction: "top" });
    });
  }, [stations, selectedId, scenario, point]);

  // Punto elegido + líneas hacia las estaciones usadas en la interpolación
  useEffect(() => {
    const layer = pointLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!point) return;
    (point.interpolation?.stations || []).forEach((st) => {
      const s = stations.find((x) => x.id === st.id);
      if (!s) return;
      L.polyline([[point.lat, point.lon], [s.lat, s.lon]], {
        color: POINT,
        weight: 1.5 + 4 * st.weight,
        opacity: 0.7,
        dashArray: "4,4",
      }).addTo(layer);
    });
    L.circleMarker([point.lat, point.lon], {
      radius: 9,
      fillColor: POINT,
      color: "#fff",
      weight: 3,
      fillOpacity: 1,
    })
      .bindTooltip(`<b>Tu punto</b><br/>${fmt(valueFor(point, scenario), 1)} mm (interpolado)`, { direction: "top" })
      .addTo(layer);
  }, [point, stations, scenario]);

  useEffect(() => {
    if (elRef.current) elRef.current.style.cursor = pickMode ? "crosshair" : "";
  }, [pickMode]);

  return (
    <div
      ref={elRef}
      role="application"
      aria-label="Mapa de estaciones de lluvia de Quito"
      className="print:hidden"
      style={{ height: "340px", borderRadius: "12px", border: "0.5px solid #e5e7eb", overflow: "hidden", zIndex: 0, position: "relative" }}
    />
  );
}
