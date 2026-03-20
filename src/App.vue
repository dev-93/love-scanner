<script setup>
import { ref } from 'vue';
import CameraView from './components/CameraView.vue';
import ScannerOverlay from './components/ScannerOverlay.vue';
import { generateLoveResult } from './services/gemini.js';

const status = ref('ready'); // 'ready', 'scanning', 'result'
const progress = ref(0);
const analyzingMessage = ref('연애세포 스캔 중...');
const resultData = ref({ percent: 0, comment: '' });

const analyzingMessages = [
  "연애세포 스캔 중...",
  "호감도 분석 중...",
  "매력 지수 계산 중...",
  "연애운 데이터 수집 중...",
  "AI 감정 분석 중...",
  "결과 도출 중..."
];

const startScan = async () => {
  status.value = 'scanning';
  progress.value = 0;
  analyzingMessage.value = analyzingMessages[0];
  
  // 랜덤 확률 결정
  const targetPercent = Math.floor(Math.random() * 100) + 1;
  
  // 프로그레스바 애니메이션
  const interval = setInterval(() => {
    progress.value += Math.random() * 4 + 1;
    
    // 메시지 변경 로직
    const msgIndex = Math.min(Math.floor((progress.value / 100) * analyzingMessages.length), analyzingMessages.length - 1);
    analyzingMessage.value = analyzingMessages[msgIndex];

    if (progress.value >= 100) {
      progress.value = 100;
      clearInterval(interval);
      completeScan(targetPercent);
    }
  }, 60);
};

const completeScan = async (percent) => {
  // Gemini API를 통한 멘트 생성 (비동기)
  const comment = await generateLoveResult(percent);
  
  resultData.value = {
    percent,
    comment
  };
  
  // 약간의 딜레이 후 결과 표시
  setTimeout(() => {
    status.value = 'result';
  }, 300);
};

const resetScan = () => {
  status.value = 'ready';
  progress.value = 0;
  resultData.value = { percent: 0, comment: '' };
};
</script>

<template>
  <div class="app-container">
    <div class="mobile-viewport">
      <!-- 카메라 프리뷰 -->
      <CameraView />
      
      <!-- 오버레이 UI -->
      <ScannerOverlay
        :status="status"
        :progress="progress"
        :analyzing-message="analyzingMessage"
        :result="resultData"
        @start-scan="startScan"
        @reset-scan="resetScan"
      />
    </div>
  </div>
</template>

<style>
/* 전역 스타일 초기화 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: #111;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

@font-face {
  font-family: 'Inter';
  src: url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');
}

.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-viewport {
  position: relative;
  width: 100%;
  max-width: 420px;
  /* 9:16 비율 강제 (모바일 환경 고려) */
  aspect-ratio: 9/16;
  background: #000;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

/* 터치 지원 기기 대응 */
@media (max-width: 768px) {
  .mobile-viewport {
    width: 100vw;
    height: 100vh;
    max-width: none;
    aspect-ratio: auto;
  }
}
</style>
