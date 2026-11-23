"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";

// 코스 경로를 지도에 그린다 (PLAN 7번). Leaflet은 브라우저에서만 동작하므로 CourseMapLoader로 불러온다.
// 지도는 OpenStreetMap을 쓰며, 출처 표시는 필수라서 attribution을 항상 보여 준다. (DESIGN.md 7번)
// 디자인: 지도 그림(타일)은 색 필터로 차분하게 가라앉히고(globals.css의 .map-tiles),
// 경로는 메인 화면 썸네일과 같은 모양(옅게 번지는 초록 테두리 + 진한 초록 선, 흰 테두리의 출발·도착 점)으로 그린다.

const ROUTE = "#059669"; // 진한 초록 (썸네일과 같은 색)
const GLOW = "#10B981"; // 선 뒤에 옅게 번지는 초록

// 경로 전체가 한 화면에 들어오도록 지도 범위를 맞춘다
function FitToPath({ path }: { path: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(path, { padding: [32, 32] });
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
      className="course-map h-full w-full"
      aria-label="코스 경로 지도"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
        className="map-tiles"
      />
      {/* 썸네일처럼: 넓고 옅은 선을 먼저 깔고, 그 위에 진한 선 */}
      <Polyline positions={path} pathOptions={{ color: GLOW, weight: 16, opacity: 0.28, lineCap: "round", lineJoin: "round" }} interactive={false} />
      <Polyline positions={path} pathOptions={{ color: ROUTE, weight: 6, opacity: 1, lineCap: "round", lineJoin: "round" }} interactive={false} />
      {/* 출발(초록)과 도착(빨강) 표시 */}
      <CircleMarker center={start} radius={9} pathOptions={{ color: "#fff", weight: 3, fillColor: ROUTE, fillOpacity: 1 }} />
      <CircleMarker center={end} radius={9} pathOptions={{ color: "#fff", weight: 3, fillColor: "#DC2626", fillOpacity: 1 }} />
      {current && (
        <>
          {/* 현재 위치: 옅은 파란 원 위에 흰 테두리의 파란 점 */}
          <CircleMarker center={current} radius={20} pathOptions={{ stroke: false, fillColor: "#3B82F6", fillOpacity: 0.2 }} interactive={false} />
          <CircleMarker center={current} radius={9} pathOptions={{ color: "#fff", weight: 3, fillColor: "#2563EB", fillOpacity: 1 }} />
        </>
      )}
      <FitToPath path={path} />
    </MapContainer>
  );
}
