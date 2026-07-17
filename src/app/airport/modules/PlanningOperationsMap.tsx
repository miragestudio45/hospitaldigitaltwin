import React, { useEffect, useRef, useState } from "react";
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";

type PlanningParcel = { id: string; name: string; state: string };
type MapTheme = "light" | "dark";

const CENTER: [number, number] = [108.2211382, 16.0864903];
const MAP_STYLES: Record<MapTheme, string> = {
  light: "https://tiles.openfreemap.org/styles/bright",
  dark: "https://tiles.openfreemap.org/styles/fiord",
};
const PARCEL_CENTERS: Array<[number, number]> = [
  [108.2168, 16.0895], [108.2202, 16.0902], [108.2241, 16.0891],
  [108.2179, 16.0845], [108.2221, 16.0842], [108.226, 16.0852],
];

function parcelGeoJson(parcels: PlanningParcel[]) {
  return {
    type: "FeatureCollection",
    features: parcels.map((parcel, index) => {
      const [lng, lat] = PARCEL_CENTERS[index % PARCEL_CENTERS.length];
      const width = 0.00125 + (index % 2) * 0.00028;
      const height = 0.00092 + (index % 3) * 0.00012;
      return {
        type: "Feature",
        properties: { id: parcel.id, name: parcel.name, state: parcel.state },
        geometry: { type: "Polygon", coordinates: [[[lng - width, lat - height], [lng + width, lat - height * 0.85], [lng + width * 0.92, lat + height], [lng - width * 0.9, lat + height * 0.88], [lng - width, lat - height]]] },
      };
    }),
  } as const;
}

function addPlanningLayers(map: MapLibreMap, parcels: PlanningParcel[], selectedId: string, is3D: boolean) {
  if (!map.getSource("planning-parcels")) map.addSource("planning-parcels", { type: "geojson", data: parcelGeoJson(parcels) });
  if (!map.getLayer("planning-parcel-fill")) map.addLayer({ id: "planning-parcel-fill", type: "fill", source: "planning-parcels", paint: { "fill-color": ["match", ["get", "state"], "Available", "#34d399", "Negotiation", "#fbbf24", "Under construction", "#fb923c", "Operating", "#60a5fa", "#a78bfa"], "fill-opacity": ["case", ["==", ["get", "id"], selectedId], 0.5, 0.25] } });
  if (!map.getLayer("planning-parcel-outline")) map.addLayer({ id: "planning-parcel-outline", type: "line", source: "planning-parcels", paint: { "line-color": ["case", ["==", ["get", "id"], selectedId], "#ffffff", "#67e8f9"], "line-width": ["case", ["==", ["get", "id"], selectedId], 3, 1.5] } });
  if (!map.getLayer("planning-parcel-label")) map.addLayer({ id: "planning-parcel-label", type: "symbol", source: "planning-parcels", layout: { "text-field": ["get", "id"], "text-size": 11, "text-font": ["Noto Sans Regular"] }, paint: { "text-color": "#ffffff", "text-halo-color": "#06111f", "text-halo-width": 1.5 } });
  const labelLayer = map.getStyle().layers.find((layer) => layer.type === "symbol" && layer.layout?.["text-field"])?.id;
  if (!map.getSource("planning-buildings")) map.addSource("planning-buildings", { type: "vector", url: "https://tiles.openfreemap.org/planet" });
  if (!map.getLayer("planning-3d-buildings")) map.addLayer({ id: "planning-3d-buildings", source: "planning-buildings", "source-layer": "building", type: "fill-extrusion", minzoom: 14, filter: ["!=", ["get", "hide_3d"], true], layout: { visibility: is3D ? "visible" : "none" }, paint: { "fill-extrusion-color": "#8fb6c9", "fill-extrusion-height": ["coalesce", ["get", "render_height"], 8], "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0], "fill-extrusion-opacity": 0.7 } }, labelLayer);
}

export function PlanningOperationsMap({ parcels, selectedId, onSelect }: { parcels: PlanningParcel[]; selectedId: string; onSelect: (id: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onSelectRef = useRef(onSelect);
  const parcelsRef = useRef(parcels);
  const selectedIdRef = useRef(selectedId);
  const is3DRef = useRef(true);
  const mapThemeRef = useRef<MapTheme>("light");
  const [ready, setReady] = useState(false);
  const [is3D, setIs3D] = useState(true);
  const [mapTheme, setMapTheme] = useState<MapTheme>("light");

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  useEffect(() => { is3DRef.current = is3D; }, [is3D]);
  useEffect(() => {
    parcelsRef.current = parcels;
    const map = mapRef.current;
    if (!ready || !map) return;
    const source = map.getSource("planning-parcels") as GeoJSONSource | undefined;
    source?.setData(parcelGeoJson(parcels));
  }, [parcels, ready]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({ container: containerRef.current, style: MAP_STYLES.light, center: CENTER, zoom: 15.2, pitch: 48, bearing: -22, attributionControl: false, antialias: true });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-right");
    map.on("load", () => {
      addPlanningLayers(map, parcelsRef.current, selectedIdRef.current, is3DRef.current);
      map.on("click", "planning-parcel-fill", (event) => { const id = event.features?.[0]?.properties?.id; if (id) onSelectRef.current(String(id)); });
      map.on("mouseenter", "planning-parcel-fill", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "planning-parcel-fill", () => { map.getCanvas().style.cursor = "grab"; });
      setReady(true);
      map.resize();
    });
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);
    return () => { resizeObserver.disconnect(); map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    if (map.getLayer("planning-parcel-fill")) map.setPaintProperty("planning-parcel-fill", "fill-opacity", ["case", ["==", ["get", "id"], selectedId], 0.55, 0.24]);
    if (map.getLayer("planning-parcel-outline")) {
      map.setPaintProperty("planning-parcel-outline", "line-color", ["case", ["==", ["get", "id"], selectedId], "#ffffff", "#67e8f9"]);
      map.setPaintProperty("planning-parcel-outline", "line-width", ["case", ["==", ["get", "id"], selectedId], 3, 1.5]);
    }
    const index = parcels.findIndex((parcel) => parcel.id === selectedId);
    if (index >= 0) map.easeTo({ center: PARCEL_CENTERS[index], zoom: 16, duration: 650 });
  }, [parcels, ready, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    if (map.getLayer("planning-3d-buildings")) map.setLayoutProperty("planning-3d-buildings", "visibility", is3D ? "visible" : "none");
    map.easeTo({ pitch: is3D ? 52 : 0, bearing: is3D ? -22 : 0, duration: 650 });
  }, [is3D, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || mapThemeRef.current === mapTheme) return;
    mapThemeRef.current = mapTheme;
    const restoreLayers = () => {
      addPlanningLayers(map, parcelsRef.current, selectedIdRef.current, is3DRef.current);
      map.resize();
    };
    map.once("style.load", restoreLayers);
    map.setStyle(MAP_STYLES[mapTheme]);
    return () => { map.off("style.load", restoreLayers); };
  }, [mapTheme, ready]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-b-xl bg-[#06111f]">
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute left-3 top-3 z-20 flex items-center rounded-lg border border-white/10 bg-[#06111f]/88 p-1 shadow-xl backdrop-blur">
        <button onClick={() => setIs3D(false)} className={`rounded-md px-2.5 py-1.5 text-[9px] font-semibold ${!is3D ? "bg-cyan-300 text-slate-950" : "text-slate-300"}`}>2D parcels</button>
        <button onClick={() => setIs3D(true)} className={`rounded-md px-2.5 py-1.5 text-[9px] font-semibold ${is3D ? "bg-cyan-300 text-slate-950" : "text-slate-300"}`}>3D planning</button>
        <span className="mx-1 h-4 w-px bg-white/10" />
        <button onClick={() => setMapTheme("light")} title="Chế độ bản đồ sáng" className={`rounded-md px-2.5 py-1.5 text-[9px] font-semibold ${mapTheme === "light" ? "bg-amber-100 text-slate-950" : "text-slate-300"}`}>Sáng</button>
        <button onClick={() => setMapTheme("dark")} title="Chế độ bản đồ tối" className={`rounded-md px-2.5 py-1.5 text-[9px] font-semibold ${mapTheme === "dark" ? "bg-slate-600 text-white" : "text-slate-300"}`}>Tối</button>
      </div>
      <div className="absolute bottom-3 left-3 z-20 rounded-lg border border-white/10 bg-[#06111f]/88 px-3 py-2 text-[8px] text-slate-300 backdrop-blur">VN-2000 · Hòn Dấu · Click parcel để xem hồ sơ</div>
    </div>
  );
}
