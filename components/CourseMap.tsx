"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { LngLatBounds, Map as MapLibreMap, NavigationControl, setWorkerUrl, type GeoJSONSource } from "maplibre-gl";
import { useEffect, useRef } from "react";
import { MAP_COLORS as c, MYROAD_MAP_STYLE } from "@/lib/map/style";

// 지도 계산을 돕는 작업자(worker) 파일은 번들 도구가 찾지 못해서 public/vendor에 복사해 두고 그 주소를 알려 준다.
// maplibre-gl 버전을 올리면 node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs를 새로 복사해야 한다.
setWorkerUrl("/vendor/maplibre-gl-worker-6.19.0.mjs");

// 코스 경로를 지도에 그린다 (PLAN 7번). 지도는 브라우저에서만 그릴 수 있어서 CourseMapLoader로 불러온다.
// 지도 도구: MapLibre, 지도 데이터: OpenFreeMap(OpenStreetMap 기반). 디자인은 lib/map/style.ts에서 직접 정한다.
// 출처 표시(attribution)는 필수라서 항상 보여 준다.
// 경로는 메인 화면 썸네일과 같은 모양(옅게 번지는 초록 띠 + 진한 초록 선, 흰 테두리의 출발·도착 점)으로 그린다.

// [위도, 경도] → MapLibre가 쓰는 [경도, 위도]
const toLngLat = ([lat, lng]: [number, number]): [number, number] => [lng, lat];

type CurrentFeature = GeoJSON.FeatureCollection<GeoJSON.Point>;
function currentData(current: [number, number] | null | undefined): CurrentFeature {
  return {
    type: "FeatureCollection",
    features: current ? [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: toLngLat(current) } }] : [],
  };
}

export default function CourseMap({
  path,
  current,
}: {
  path: [number, number][];
  current?: [number, number] | null; // 운동 중 현재 위치 (파란 점)
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const currentRef = useRef(current); // 지도가 다 뜨기 전에 받은 현재 위치를 기억해 둔다

  // 지도 만들기 (경로가 바뀔 때만 다시 만든다)
  useEffect(() => {
    if (!containerRef.current) return;
    const coords = path.map(toLngLat);
    const bounds = coords.reduce((b, p) => b.extend(p), new LngLatBounds(coords[0], coords[0]));

    const map = new MapLibreMap({
      container: containerRef.current,
      style: MYROAD_MAP_STYLE,
      bounds,
      fitBoundsOptions: { padding: 36 },
      dragRotate: false, // 지도가 돌아가지 않게
      pitchWithRotate: false,
      touchPitch: false,
      scrollZoom: false,
      localIdeographFontFamily: "'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif", // 한글은 기기 글꼴로
      attributionControl: { compact: false },
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new NavigationControl({ showCompass: false }), "top-left");
    mapRef.current = map;

    map.on("load", () => {
      map.addSource("route", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } },
      });
      map.addLayer({
        id: "route-glow",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": c.routeGlow, "line-width": 16, "line-opacity": 0.28 },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": c.route, "line-width": 6 },
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
          "circle-radius": 9,
          "circle-color": ["match", ["get", "kind"], "start", c.start, c.end],
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": 3,
        },
      });

      // 현재 위치: 옅은 파란 원 위에 흰 테두리의 파란 점
      map.addSource("current", { type: "geojson", data: currentData(currentRef.current) });
      map.addLayer({
        id: "current-halo",
        type: "circle",
        source: "current",
        paint: { "circle-radius": 20, "circle-color": c.current, "circle-opacity": 0.18 },
      });
      map.addLayer({
        id: "current-dot",
        type: "circle",
        source: "current",
        paint: { "circle-radius": 9, "circle-color": c.current, "circle-stroke-color": "#FFFFFF", "circle-stroke-width": 3 },
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [path]);

  // 현재 위치가 바뀌면 점만 옮긴다
  useEffect(() => {
    currentRef.current = current;
    const source = mapRef.current?.getSource("current") as GeoJSONSource | undefined;
    source?.setData(currentData(current));
  }, [current]);

  return <div ref={containerRef} className="course-map h-full w-full" aria-label="코스 경로 지도" role="region" />;
}
