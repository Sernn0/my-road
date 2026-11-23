import "server-only";

// 기록 이미지용 한글 글꼴 (PLAN 21번). 이미지에 쓰는 글자만 담은 작은 글꼴 조각을 Google Fonts에서 받아 온다.
// 받아오지 못하면 null을 돌려주고, 호출한 쪽에서 오류로 처리한다.
export async function loadKoreanFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const chars = Array.from(new Set(text)).join("");
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&text=${encodeURIComponent(chars)}`,
      // 오래된 안드로이드 브라우저로 알려야 ttf 형식 주소가 온다 (이미지 생성기는 woff2·eot를 읽지 못한다)
      { headers: { "User-Agent": "Mozilla/5.0 (Linux; U; Android 2.2; en-us; Nexus One Build/FRF91) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1" }, signal: AbortSignal.timeout(8000) },
    ).then((r) => r.text());
    const url = /src: url\((.+?)\)/.exec(css)?.[1];
    if (!url) return null;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}
