<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as faceapi from '@vladmandic/face-api';

const videoRef = ref(null);
const streamRef = ref(null);
const permissionDenied = ref(false);
const isModelLoaded = ref(false);

// face-api 모델 로드 (CDN 활용)
const loadModels = async () => {
  const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
    ]);
    isModelLoaded.value = true;
    console.log("Face-api models loaded.");
  } catch (error) {
    console.error("모델 로드 실패:", error);
  }
};

const startCamera = async () => {
  permissionDenied.value = false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode: 'user',
        aspectRatio: { ideal: 9/16 } // 모바일 세로 비율 최적화
      },
      audio: false
    });
    streamRef.value = stream;
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
    }
  } catch (error) {
    console.error("카메라를 시작하는 중 오류 발생:", error);
    permissionDenied.value = true;
  }
};

// 실시간 얼굴 분석 (로컬 실행)
const detectFace = async () => {
  if (!videoRef.value || !isModelLoaded.value) return null;
  
  const detection = await faceapi.detectSingleFace(
    videoRef.value, 
    new faceapi.TinyFaceDetectorOptions()
  ).withFaceLandmarks().withFaceExpressions();

  
  if (!detection) return null;

  // 가장 강한 표정 추출
  const expressions = detection.expressions;
  const topExpression = Object.entries(expressions).reduce((a, b) => a[1] > b[1] ? a : b);
  
  return {
    expression: topExpression[0], // 'happy', 'sad', 'angry' 등
    probability: (topExpression[1] * 100).toFixed(1),
    landmarks: detection.landmarks.positions, // 68개 좌표 배열 (대칭 분석용)
  };
};

// 킹받는 컨셉용 캡처 (실제 전송은 안 함, 추후 필요 시 사용)
const takePhoto = () => {
  if (!videoRef.value) return null;
  const canvas = document.createElement('canvas');
  canvas.width = videoRef.value.videoWidth;
  canvas.height = videoRef.value.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.5);
};

const stopCamera = () => {
  if (streamRef.value) {
    streamRef.value.getTracks().forEach(track => track.stop());
    streamRef.value = null;
  }
};

onMounted(async () => {
  await loadModels();
  await startCamera();
});

onUnmounted(() => {
  stopCamera();
});

defineExpose({ startCamera, detectFace, takePhoto, isModelLoaded });
</script>



<template>
  <div class="camera-container">
    <video
      v-if="!permissionDenied"
      ref="videoRef"
      autoplay
      playsinline
      muted
      class="video-preview"
    ></video>
    
    <div v-else class="permission-error">
      <div class="icon">📷</div>
      <h3>카메라 권한이 거부되었습니다.</h3>
      <p>브라우저 설정에서 카메라 권한을 허용하고<br>페이지를 새로고침해 주세요.</p>
    </div>
  </div>
</template>

<style scoped>
.camera-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-preview {
  width: 100%;
  height: 100%;
  object-fit: contain; /* 줌 현상 해결을 위해 contain으로 변경 */
  transform: scaleX(-1); /* 셀카 모드 좌우 반전 */
  background: #000;
}

.permission-error {
  text-align: center;
  color: #fff;
  padding: 40px;
}

.permission-error .icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.permission-error h3 {
  color: #00ffcc;
  margin-bottom: 12px;
}

.permission-error p {
  font-size: 14px;
  opacity: 0.7;
  line-height: 1.6;
}
</style>
