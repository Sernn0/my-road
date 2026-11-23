import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "마이로드",
  description: "러닝·사이클링·걷기 코스를 기록하고 따라가는 앱",
};

// 모바일 화면 기준: 기기 너비에 맞추고 확대 없이 보여 준다
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light", // 라이트 모드만 쓴다
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full bg-zinc-100">
        {/* 모바일 폭(최대 448px)으로 가운데 정렬. 큰 화면에서도 휴대폰처럼 보인다 */}
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
          {children}
        </div>
      </body>
    </html>
  );
}
