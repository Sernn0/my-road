"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { length, lineSliceAlong, lineString } from "@turf/turf";
import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  setWorkerUrl,
  type GeoJSONSource,
  type PaddingOptions,
} from "maplibre-gl";
import { useEffect, useRef } from "react";
import { MAP_COLORS as c, MYROAD_MAP_STYLE } from "@/lib/map/style";

// 지도 계산을 돕는 작업자(worker) 파일은 번들 도구가 찾지 못해서 public/vendor에 복사해 두고 그 주소를 알려 준다.
// maplibre-gl 버전을 올리면 node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs를 새로 복사해야 한다.
setWorkerUrl("/vendor/maplibre-gl-worker-6.19.0.mjs");

// 코스 경로 지도 (PLAN 7·11번). 지도는 브라우저에서만 그릴 수 있어서 CourseMapLoader로 불러온다.
// 지도 도구: MapLibre, 지도 데이터: OpenFreeMap(OpenStreetMap 기반). 디자인은 lib/map/style.ts에서 정한다. 출처 표시는 필수.
//   mode="overview": 코스 전체가 보이게 맞춘다 (출발 전 확인 화면). padding으로 위·아래 버튼 자리를 비워 둔다.
//   mode="follow": 운동 중. 현재 위치를 따라가며, 가는 방향(heading)이 화면 위쪽이 되게 지도를 돌린다.
//                  지나온 구간(progressKm까지)은 흐리게, 남은 구간은 진하게 그린다.

const toLngLat = ([lat, lng]: [number, number]): [number, number] => [lng, lat];

// 현재 위치 표시: 방향 화살표 + 퍼지는 물결 (globals.css의 .runner-*)
function makeRunnerElement() {
  const el = document.createElement("div");
  el.className = "runner-marker";
  el.innerHTML = `
    <span class="runner-pulse"></span>
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r="15" fill="#2563EB" stroke="#fff" stroke-width="3.5"/>
      <path d="M22 12 L29 28 L22 24.5 L15 28 Z" fill="#fff"/>
    </svg>`;
  return el;
}

export default function CourseMap({
  path,
  current,
  mode = "overview",
  heading = 0,
  progressKm = 0,
  padding,
}: {
  path: [number, number][];
  current?: [number, number] | null; // 운동 중 현재 위치
  mode?: "overview" | "follow";
  heading?: number; // 가는 방향 (북쪽 0도, 시계 방향)
  progressKm?: number; // 코스 위에서 지금까지 온 거리
  padding?: Partial<PaddingOptions>; // 지도 위에 올린 버튼·카드 자리
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const readyRef = useRef(false);
  // 지도가 다 뜨기 전에 받은 값을 기억해 둔다
  const latest = useRef({ current, heading, progressKm });
  const applyRef = useRef<(() => void) | null>(null); // 지도에 현재 값을 반영하는 함수

  // 지도 만들기 (경로·모드가 바뀔 때만 다시 만든다)
  useEffect(() => {
    if (!containerRef.current) return;
    const coords = path.map(toLngLat);
    const bounds = coords.reduce((b, p) => b.extend(p), new LngLatBounds(coords[0], coords[0]));
    const pad = { top: 40, bottom: 40, left: 40, right: 40, ...padding };

    const map = new MapLibreMap({
      container: containerRef.current,
      style: MYROAD_MAP_STYLE,
      bounds,
      fitBoundsOptions: { padding: pad },
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      scrollZoom: mode === "overview",
      localIdeographFontFamily: "'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif", // 한글은 기기 글꼴로
      attributionControl: { compact: true },
    });
    map.touchZoomRotate.disableRotation();
    if (mode === "overview") map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    map.on("load", () => {
      map.addSource("route", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } } });
      map.addSource("done", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "route-glow",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": c.routeGlow, "line-width": mode === "follow" ? 22 : 16, "line-opacity": 0.28 },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": c.route, "line-width": mode === "follow" ? 8 : 6 },
      });
      // 지나온 구간: 흐린 회녹색으로 덮는다
      map.addLayer({
        id: "route-done",
        type: "line",
        source: "done",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#9DB8AA", "line-width": mode === "follow" ? 8 : 6 },
      });
      map.addSource("ends", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            { type: "Feature", properties: { kind: "start" }, geometry: { type: "Point", coordinates: coords[0] } },
            { type: "Feature", properties: { kind: "end" }, geometry: { type: "Point", coordinates: coords[coords.length - 1] } },
          ],
        },
      });
      map.addLayer({
        id: "ends",
        type: "circle",
        source: "ends",
        paint: {
          "circle-radius": mode === "follow" ? 11 : 9,
          "circle-color": ["match", ["get", "kind"], "start", c.start, c.end],
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": 3,
        },
      });
      readyRef.current = true;
      apply(true);
    });

    // 현재 위치·방향·진행을 지도에 반영한다
    const total = length(lineString(coords), { units: "kilometers" });
    function apply(first = false) {
      if (!readyRef.current) return;
      const { current: cur, heading: hd, progressKm: prog } = latest.current;
      const done = map.getSource("done") as GeoJSONSource | undefined;
      const along = Math.min(Math.max(prog, 0), total);
      done?.setData(
        along > 0.005
          ? lineSliceAlong(lineString(coords), 0, along, { units: "kilometers" })
          : { type: "FeatureCollection", features: [] },
      );
      if (!cur) return;
      const at = toLngLat(cur);
      if (!markerRef.current) {
        // 따라가기 모드에서는 지도가 가는 방향으로 돌아가므로 화살표는 화면 기준으로 늘 위를 가리킨다.
        // 전체보기 모드에서는 지도가 북쪽 위라서 화살표를 가는 방향으로 돌린다.
        markerRef.current = new Marker({
          element: makeRunnerElement(),
          rotationAlignment: mode === "follow" ? "viewport" : "map",
          pitchAlignment: "viewport",
        })
          .setLngLat(at)
          .addTo(map);
      }
      markerRef.current.setLngLat(at).setRotation(mode === "follow" ? 0 : hd);
      if (mode === "follow") {
        // 가는 방향이 위로 오게 돌리고, 살짝 기울여 앞쪽이 멀리 보이게 한다
        map.easeTo({ center: at, bearing: hd, zoom: 17, pitch: 45, duration: first ? 0 : 900, padding: pad });
      }
    }
    applyRef.current = () => apply();

    return () => {
      readyRef.current = false;
      markerRef.current = null;
      applyRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // padding은 처음 만들 때만 쓴다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, mode]);

  useEffect(() => {
    latest.current = { current, heading, progressKm };
    applyRef.current?.();
  }, [current, heading, progressKm]);

  return <div ref={containerRef} className="course-map h-full w-full" aria-label="코스 경로 지도" role="region" />;
}
