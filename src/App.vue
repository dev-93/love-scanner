<script setup>
import { ref } from 'vue';
import CameraView from './components/CameraView.vue';
import ScannerOverlay from './components/ScannerOverlay.vue';
import { generateLoveResult } from './services/gemini.js';

const cameraRef = ref(null);
const status = ref('ready'); // 'ready', 'scanning', 'result'
const progress = ref(0);
const analyzingMessage = ref('연애세포 스캔 중...');
const resultData = ref({ percent: 0, comment: '' });
const isSmiling = ref(true); // 실시간 미소 상태
let expressionLoop = null;

const analyzingMessages = [
  "얼굴 연애 수치 감지 중...",
  "심장 두근거림 분석 중...",
  "솔직한 감정 표출 여부 확인 중...",
  "가식 필터 적용 중...",
  "연애 세포 활성도 측정 중...",
  "최종 확률 계산 중..."
];

// 실시간 미소 감지 루프
const startExpressionLoop = () => {
  const check = async () => {
    if (status.value !== 'scanning') return;
    
    const faceData = await cameraRef.value?.detectFace();
    if (faceData) {
      // 미소 감지 (happy 확률이 높을 때만 true)
      isSmiling.value = faceData.expression === 'happy' && parseFloat(faceData.probability) > 50;
    }
    expressionLoop = requestAnimationFrame(check);
  };
  expressionLoop = requestAnimationFrame(check);
};

const startScan = async () => {
  if (!cameraRef.value?.isModelLoaded) {
    alert("AI 분석 모델을 불러오는 중입니다. 잠시만 기다려 주세요!");
    return;
  }

  status.value = 'scanning';
  progress.value = 0;
  analyzingMessage.value = analyzingMessages[0];
  isSmiling.value = true;
  
  startExpressionLoop();
  
  const fallbackPercent = Math.floor(Math.random() * 100) + 1;
  
  const interval = setInterval(() => {
    progress.value += Math.random() * 5 + 2;
    
    const msgIndex = Math.min(Math.floor((progress.value / 100) * analyzingMessages.length), analyzingMessages.length - 1);
    analyzingMessage.value = cameraRef.value?.isModelLoaded ? analyzingMessages[msgIndex] : "AI 모델 로딩 중...";

    if (progress.value >= 100) {
      progress.value = 100;
      clearInterval(interval);
      cancelAnimationFrame(expressionLoop);
      completeScan(fallbackPercent);
    }
  }, 100);
};

const completeScan = async (fallbackPercent) => {
  const faceData = await cameraRef.value?.detectFace();
  // 최종 결과 전송 시 '실시간 미소 여부'를 포함해서 전달
  const finalFaceData = faceData ? { ...faceData, wasSmiling: isSmiling.value } : null;
  const rawResult = await generateLoveResult(fallbackPercent, finalFaceData);
  
  let finalPercent = fallbackPercent;
  let finalComment = rawResult;

  if (rawResult.includes('|')) {
    const parts = rawResult.split('|');
    const pctMatch = parts[0].match(/\d+/);
    if (pctMatch) finalPercent = parseInt(pctMatch[0]);
    finalComment = parts[1].trim();
  }
  
  resultData.value = {
    percent: finalPercent,
    comment: finalComment
  };
  
  setTimeout(() => {
    status.value = 'result';
  }, 200);
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
      <CameraView ref="cameraRef" />
      
      <ScannerOverlay
        :status="status"
        :progress="progress"
        :analyzing-message="analyzingMessage"
        :result="resultData"
        :is-smiling="isSmiling"
        @start-scan="startScan"
        @reset-scan="resetScan"
      />

      <div v-if="status === 'scanning'" class="privacy-notice">
        🔒 로컬 AI 얼굴 분석 중 (사진은 업로드되지 않습니다)
      </div>

      <!-- 모델 로딩 오버레이 -->
      <div v-if="cameraRef && !cameraRef.isModelLoaded" class="loading-overlay">
        <div class="loader"></div>
        <p>AI 모델 로딩 중...</p>
      </div>
    </div>
  </div>
</template>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #111;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  height: 100vh;
  height: 100dvh;
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
  aspect-ratio: 9/16;
  background: #000;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.privacy-notice {
  position: absolute;
  top: 55px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: #00ffcc;
  font-size: 10px;
  padding: 4px 10px;
  border-radius: 4px;
  z-index: 100;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  color: #00ffcc;
}

.loader {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(0,255,204,0.3);
  border-radius: 50%;
  border-top-color: #00ffcc;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .app-container {
    align-items: flex-start;
  }

  .mobile-viewport {
    width: 100vw;
    width: 100dvw;
    height: 100vh;
    height: 100dvh;
    max-width: none;
    aspect-ratio: auto;
    box-shadow: none;
  }
}
</style>

