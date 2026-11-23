"use client";

import CurrentLocationPanel from "@/components/CurrentLocationPanel";
import RecordingView from "@/components/RecordingView";

// 코스 기록 화면의 본체: 위치 권한을 확인하고, 허용되면 경로 기록을 시작한다.
export default function CourseRecorder() {
  return (
    <CurrentLocationPanel>
      {(_position, isDemo) => <RecordingView isDemo={isDemo} />}
    </CurrentLocationPanel>
  );
}
