import "server-only";
import { VectorTile } from "@mapbox/vector-tile";
import { cacheLife } from "next/cache";
import { PbfReader } from "pbf";
import { frameBounds, frameFor, project, THUMB_H, THUMB_W, type ThumbBasemap, type ThumbFrame, type ThumbLayout } from "@/lib/geo/thumbnail";

// 썸네일용 아주 간략한 바탕 지도 (큰 길, 물, 공원만). 지도 데이터는 상세 지도와 같은 OpenFreeMap이다.
// 코스 범위에 맞는 지도 조각(타일)을 1~4장 받아서, 필요한 모양만 골라 SVG 선으로 바꾼다.
// 같은 코스는 결과를 오래 저장해 두고(use cache) 다시 계산하지 않는다. 실패하면 null(경로만 그린다).

const TILEJSON = "https://tiles.openfreemap.org/planet";
const MAX_Z = 14; // 이 지도 데이터의 가장 자세한 단계
const MAX_TILES = 4;
const ROAD_CLASSES = new Set(["motorway", "trunk", "primary", "secondary", "tertiary"]);
const GREEN_CLASSES = new Set(["wood", "grass", "forest", "park"]);

type Shape = { kind: "line" | "polygon"; rings: [number, number][][] };

async function tileTemplate(): Promise<string> {
  const res = await fetch(TILEJSON, { signal: AbortSignal.timeout(8000) });
  const json = (await res.json()) as { tiles?: string[] };
  if (!json.tiles?.[0]) throw new Error("타일 주소 없음");
  return json.tiles[0];
}

// 썸네일을 덮는 타일이 4장 이하가 되는 가장 자세한 단계를 고른다
function pickTiles(bounds: [number, number, number, number]) {
  for (let z = MAX_Z; z >= 8; z--) {
    const n = 2 ** z;
    const tx0 = Math.floor(bounds[0] * n);
    const ty0 = Math.floor(bounds[1] * n);
    const tx1 = Math.floor(bounds[2] * n);
    const ty1 = Math.floor(bounds[3] * n);
    if ((tx1 - tx0 + 1) * (ty1 - ty0 + 1) <= MAX_TILES) {
      const tiles: { z: number; x: number; y: number }[] = [];
      for (let x = tx0; x <= tx1; x++) for (let y = ty0; y <= ty1; y++) tiles.push({ z, x, y });
      return tiles;
    }
  }
  return [];
}

// 한 층의 모양들을 썸네일 좌표로 바꾼다. 화면 밖이거나 너무 촘촘한 점은 뺀다.
function toPath(shapes: Shape[], frame: ThumbFrame): string {
  const parts: string[] = [];
  for (const shape of shapes) {
    for (const ring of shape.rings) {
      const pts: [number, number][] = [];
      for (const [mx, my] of ring) {
        const p = project(frame, mx, my);
        const last = pts[pts.length - 1];
        if (!last || Math.abs(last[0] - p[0]) + Math.abs(last[1] - p[1]) >= 0.8) pts.push(p);
      }
      if (pts.length < 2) continue;
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      // 썸네일과 전혀 겹치지 않는 모양은 버린다
      if (Math.max(...xs) < -10 || Math.min(...xs) > THUMB_W + 10 || Math.max(...ys) < -10 || Math.min(...ys) > THUMB_H + 10) continue;
      parts.push(pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ") + (shape.kind === "polygon" ? "Z" : ""));
    }
  }
  return parts.join(" ");
}

async function buildBasemap(path: [number, number][], layout: ThumbLayout): Promise<ThumbBasemap | null> {
  const frame = frameFor(path, layout);
  if (!frame) return null;
  const template = await tileTemplate();
  const tiles = pickTiles(frameBounds(frame));
  const layers = { green: [] as Shape[], water: [] as Shape[], waterLines: [] as Shape[], roads: [] as Shape[] };

  await Promise.all(
    tiles.map(async ({ z, x, y }) => {
      const url = template.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y));
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return;
      const tile = new VectorTile(new PbfReader(new Uint8Array(await res.arrayBuffer())));
      const n = 2 ** z;
      const read = (layerName: string, keep: (props: Record<string, unknown>) => boolean, target: Shape[]) => {
        const layer = tile.layers[layerName];
        if (!layer) return;
        for (let i = 0; i < layer.length; i++) {
          const f = layer.feature(i);
          if (f.type === 1 || !keep(f.properties as Record<string, unknown>)) continue;
          const rings = f.loadGeometry().map((ring) =>
            ring.map((p): [number, number] => [(x + p.x / f.extent) / n, (y + p.y / f.extent) / n]),
          );
          target.push({ kind: f.type === 3 ? "polygon" : "line", rings });
        }
      };
      read("park", () => true, layers.green);
      read("landcover", (p) => GREEN_CLASSES.has(String(p.class)), layers.green);
      read("water", () => true, layers.water);
      read("waterway", () => true, layers.waterLines);
      read("transportation", (p) => ROAD_CLASSES.has(String(p.class)), layers.roads);
    }),
  );

  return {
    green: toPath(layers.green, frame),
    water: toPath(layers.water, frame),
    waterLines: toPath(layers.waterLines, frame),
    roads: toPath(layers.roads, frame),
  };
}

// 코스별 바탕 지도. key(코스 번호 + 거리)가 같으면 저장해 둔 결과를 쓴다.
// layout은 썸네일 여백 방식 (코스 카드용 "card", 기록 이미지용 "photo")
export async function thumbBasemap(key: string, path: [number, number][], layout: ThumbLayout = "card"): Promise<ThumbBasemap | null> {
  "use cache";
  cacheLife("weeks");
  void key; // 저장 구분용 (경로가 같으면 결과도 같다)
  try {
    return await buildBasemap(path, layout);
  } catch {
    return null;
  }
}
