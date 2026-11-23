import type { MapOptions } from "maplibre-gl";

// 마이로드 지도 디자인 (라이트 모드 전용). 메인 화면 코스 썸네일과 같은 초록 계열로 맞췄다.
// 지도 데이터: OpenFreeMap(OpenStreetMap 기반 벡터 지도, 키·가입 없음). 출처 표시는 필수다.
// 층(layer)마다 색·굵기·표시 여부를 정한다. 건물·가게 이름 같은 자잘한 정보는 빼서 경로가 돋보이게 했다.

type Style = Exclude<MapOptions["style"], string | undefined>;

export const MAP_COLORS = {
  background: "#F4F8F5",
  water: "#CFEDE4",
  waterway: "#B7E3D6",
  park: "#DDF2E3",
  wood: "#D3ECDA",
  residential: "#EEF3EF",
  building: "#E5EBE7",
  road: "#FFFFFF",
  roadCasing: "#D9E3DD",
  path: "#9FD3BC", // 산책로·자전거길 (운동 코스와 관련 있어 살짝 보이게)
  label: "#5F7268",
  labelHalo: "#FFFFFF",
  route: "#059669", // 코스 선 (썸네일과 같은 색)
  routeGlow: "#10B981",
  start: "#059669",
  end: "#DC2626",
  current: "#2563EB",
} as const;

const c = MAP_COLORS;
// 한글 이름이 있으면 한글, 없으면 기본 이름
const NAME: ["coalesce", ["get", string], ["get", string]] = ["coalesce", ["get", "name:ko"], ["get", "name"]];

export const MYROAD_MAP_STYLE: Style = {
  version: 8,
  name: "myroad-light",
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sources: {
    openmaptiles: { type: "vector", url: "https://tiles.openfreemap.org/planet" },
  },
  layers: [
    { id: "background", type: "background", paint: { "background-color": c.background } },
    {
      id: "residential",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landuse",
      filter: ["in", ["get", "class"], ["literal", ["residential", "suburb", "neighbourhood"]]],
      paint: { "fill-color": c.residential },
    },
    {
      id: "wood",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landcover",
      filter: ["in", ["get", "class"], ["literal", ["wood", "grass", "farmland"]]],
      paint: { "fill-color": c.wood, "fill-opacity": 0.8 },
    },
    {
      id: "park",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "park",
      paint: { "fill-color": c.park },
    },
    {
      id: "water",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "water",
      paint: { "fill-color": c.water },
    },
    {
      id: "waterway",
      type: "line",
      source: "openmaptiles",
      "source-layer": "waterway",
      paint: { "line-color": c.waterway, "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1, 16, 3] },
    },
    {
      id: "building",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: 15,
      paint: { "fill-color": c.building, "fill-opacity": 0.7 },
    },
    // 산책로·자전거길: 점선
    {
      id: "path",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 14,
      filter: ["==", ["get", "class"], "path"],
      paint: { "line-color": c.path, "line-width": 1.5, "line-dasharray": [2, 1.5] },
    },
    // 길: 옅은 테두리 + 흰 선
    {
      id: "road-casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary", "secondary", "tertiary", "minor", "service"]]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": c.roadCasing,
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          10, ["match", ["get", "class"], ["motorway", "trunk", "primary"], 2.5, 0.8],
          16, ["match", ["get", "class"], ["motorway", "trunk", "primary"], 14, ["secondary", "tertiary"], 10, 6],
        ],
      },
    },
    {
      id: "road",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary", "secondary", "tertiary", "minor", "service"]]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": c.road,
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          10, ["match", ["get", "class"], ["motorway", "trunk", "primary"], 1.5, 0.4],
          16, ["match", ["get", "class"], ["motorway", "trunk", "primary"], 11, ["secondary", "tertiary"], 8, 4],
        ],
      },
    },
    // 글자: 큰 길 이름, 물 이름, 동네 이름만 (건물·가게 이름은 숨김)
    {
      id: "road-label",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "transportation_name",
      minzoom: 14,
      filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary", "secondary"]]],
      layout: {
        "symbol-placement": "line",
        "text-field": NAME,
        "text-font": ["Noto Sans Regular"],
        "text-size": 11,
      },
      paint: { "text-color": c.label, "text-halo-color": c.labelHalo, "text-halo-width": 1.5 },
    },
    {
      id: "water-label",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "water_name",
      layout: { "text-field": NAME, "text-font": ["Noto Sans Regular"], "text-size": 11 },
      paint: { "text-color": "#3E8C77", "text-halo-color": c.labelHalo, "text-halo-width": 1.5 },
    },
    {
      id: "place-label",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      filter: ["in", ["get", "class"], ["literal", ["city", "town", "suburb", "quarter", "neighbourhood", "village"]]],
      layout: {
        "text-field": NAME,
        "text-font": ["Noto Sans Bold"],
        "text-size": ["match", ["get", "class"], ["city", "town"], 14, 12],
      },
      paint: { "text-color": c.label, "text-halo-color": c.labelHalo, "text-halo-width": 2 },
    },
  ],
};
