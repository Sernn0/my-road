import { ImageResponse } from "next/og";
import { getCompletion } from "@/lib/completions/queries";
import { formatDate, formatDistanceKm, formatDuration } from "@/lib/format";
import { loadKoreanFont } from "@/lib/og/font";

// 완주 기록 이미지 (PLAN 21번, DESIGN.md 5번). 코스·날짜·소요 시간·거리·경험치만 담는다.
// 이름, 집 주소 같은 개인정보와 이동 경로는 넣지 않는다. (PRD 5번)
export async function GET(_request: Request, ctx: RouteContext<"/api/og/[completionId]">) {
  const { completionId } = await ctx.params;
  const summary = await getCompletion(completionId);
  if (!summary) {
    return Response.json({ error: { code: "NOT_FOUND", message: "완주 기록을 찾을 수 없습니다" } }, { status: 404 });
  }

  const rows: [string, string][] = [
    ["날짜", formatDate(summary.completedAt)],
    ["소요 시간", formatDuration(summary.durationSec)],
    ["거리", formatDistanceKm(summary.distanceKm)],
    ["경험치", `+${summary.xp}점`],
  ];
  const title = "완주했어요!";
  const font = await loadKoreanFont(
    [title, "마이로드", summary.courseName, ...rows.flat(), "0123456789.:+-"].join(""),
  );
  if (!font) {
    return Response.json({ error: { code: "FONT_FAILED", message: "이미지를 만들지 못했습니다" } }, { status: 502 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(160deg, #064e3b 0%, #059669 100%)",
          color: "white",
          fontFamily: "Noto Sans KR",
        }}
      >
        <div style={{ display: "flex", fontSize: 44 }}>마이로드</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 96 }}>{title}</div>
          <div style={{ display: "flex", fontSize: 52, opacity: 0.9 }}>{summary.courseName}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, background: "rgba(0,0,0,0.25)", borderRadius: 32, padding: 48 }}>
          {rows.map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 48 }}>
              <div style={{ display: "flex", opacity: 0.8 }}>{label}</div>
              <div style={{ display: "flex" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1080, height: 1350, fonts: [{ name: "Noto Sans KR", data: font, weight: 700, style: "normal" }] },
  );
}
