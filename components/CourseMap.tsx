"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";

// 코스 경로를 지도에 그린다 (PLAN 7번). Leaflet은 브라우저에서만 동작하므로 CourseMapLoader로 불러온다.
// 지도는 OpenStreetMap을 쓰며, 출처 표시는 필수라서 attribution을 항상 보여 준다. (DESIGN.md 7번)

// 경로 전체가 한 화면에 들어오도록 지도 범위를 맞춘다
function FitToPath({ path }: { path: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(path, { padding: [24, 24] });
  }, [map, path]);
  return null;
}

export default function CourseMap({
  path,
  current,
}: {
  path: [number, number][];
  current?: [number, number] | null; // 운동 중 현재 위치 (파란 점)
}) {
  const start = path[0];
  const end = path[path.length - 1];
  return (
    <MapContainer
      center={start}
      zoom={15}
      scrollWheelZoom={false}
      className="h-full w-full"
      aria-label="코스 경로 지도"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
      <Polyline positions={path} pathOptions={{ color: "#059669", weight: 5 }} />
      {/* 출발(초록)과 도착(빨강) 표시 */}
      <CircleMarker center={start} radius={8} pathOptions={{ color: "#fff", weight: 2, fillColor: "#059669", fillOpacity: 1 }} />
      <CircleMarker center={end} radius={8} pathOptions={{ color: "#fff", weight: 2, fillColor: "#dc2626", fillOpacity: 1 }} />
      {current && (
        <CircleMarker center={current} radius={9} pathOptions={{ color: "#fff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }} />
      )}
      <FitToPath path={path} />
    </MapContainer>
  );
}
