"use client";

import { useState } from "react";
import CurrentLocationPanel from "@/components/CurrentLocationPanel";
import RecordingView from "@/components/RecordingView";

// 코스 기록 화면의 본체: 위치 권한을 확인하고, 허용되면 경로 기록을 시작한다.
export default function CourseRecorder() {
  // "다시 기록하기"를 누르면 번호가 바뀌어 기록 화면이 처음부터 다시 시작된다
  const [attempt, setAttempt] = useState(0);
  return (
    <CurrentLocationPanel>
      {(_position, isDemo) => (
        <RecordingView
          key={attempt}
          isDemo={isDemo}
          onRestart={() => setAttempt((n) => n + 1)}
        />
      )}
    </CurrentLocationPanel>
  );
}
