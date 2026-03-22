<script setup>
import { ref } from 'vue';
import CameraView from './components/CameraView.vue';
import ScannerOverlay from './components/ScannerOverlay.vue';
import { generateLoveResult } from './services/gemini.js';
import { calculateLoveScore } from './services/scoreExpert.js';

const cameraRef = ref(null);
const status = ref('ready'); // 'ready', 'scanning', 'result'
const progress = ref(0);
const analyzingMessage = ref('연애세포 스캔 중...');
const resultData = ref({ percent: 0, comment: '' });
const isSmiling = ref(true); // 실시간 미소 상태
let expressionLoop = null;

const analyzingMessages = [
  "진심 어린 미소를 보여주세요...",
  "안 웃으면 댕댕이가 공격합니다!",
  "입꼬리 체크 중...",
  "가식 여부 판별 중...",
  "얼굴 근육 움직임 분석 중...",
  "거의 다 왔습니다..."
];

// 실시간 미소 감지 루프 (2초 간격으로 쓰로틀링 - 눈 피로 방지)
const EXPRESSION_UPDATE_INTERVAL = 2000; // ms
let lastExpressionUpdate = 0;

const startExpressionLoop = () => {
  const check = async (timestamp) => {
    if (status.value !== 'scanning') return;

    // 2초마다 한 번만 표정 업데이트
    if (timestamp - lastExpressionUpdate >= EXPRESSION_UPDATE_INTERVAL) {
      lastExpressionUpdate = timestamp;
      const faceData = await cameraRef.value?.detectFace();
      if (faceData) {
        // 미소 감지 (happy 확률이 높을 때만 true)
        isSmiling.value = faceData.expression === 'happy' && parseFloat(faceData.probability) > 50;
      }
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
  lastExpressionUpdate = 0; // 루프 시작 시 타임스탬프 초기화
  
  startExpressionLoop();
  
  const interval = setInterval(() => {
    progress.value += Math.random() * 1.5 + 0.5;
    
    const msgIndex = Math.min(Math.floor((progress.value / 100) * analyzingMessages.length), analyzingMessages.length - 1);
    analyzingMessage.value = cameraRef.value?.isModelLoaded ? analyzingMessages[msgIndex] : "AI 모델 로딩 중...";

    if (progress.value >= 100) {
      progress.value = 100;
      clearInterval(interval);
      cancelAnimationFrame(expressionLoop);
      completeScan();
    }
  }, 100);
};

const completeScan = async () => {
  const faceData = await cameraRef.value?.detectFace();
  // 최종 결과 전송 시 '실시간 미소 여부'를 포함해서 전달
  const finalFaceData = faceData ? { ...faceData, wasSmiling: isSmiling.value } : null;

  // 🎯 전문가 스코어 계산 (표정 + 얼굴 대칭/비율 정밀 점수)
  const expertScore = calculateLoveScore(finalFaceData);

  const rawResult = await generateLoveResult(expertScore.percent, finalFaceData, expertScore.harmonyScore);
  
  // AI가 점수를 반환하면 AI 점수 사용, 실패하면 전문가 점수 사용
  let finalPercent = expertScore.percent;
  let finalComment = rawResult;

  if (rawResult.includes('|')) {
    const parts = rawResult.split('|');
    const pctMatch = parts[0].match(/[\d.]+/);
    if (pctMatch) finalPercent = parseFloat(pctMatch[0]);
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
  .mobile-viewport {
    width: 100vw;
    height: 100vh;
    max-width: none;
    aspect-ratio: auto;
  }
}
</style>

