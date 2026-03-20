<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const videoRef = ref(null);
const streamRef = ref(null);
const permissionDenied = ref(false);

const startCamera = async () => {
  permissionDenied.value = false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
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

const stopCamera = () => {
  if (streamRef.value) {
    streamRef.value.getTracks().forEach(track => track.stop());
    streamRef.value = null;
  }
};

onMounted(() => {
  startCamera();
});

onUnmounted(() => {
  stopCamera();
});

defineExpose({ startCamera });
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
  object-fit: cover;
  transform: scaleX(-1); /* 셀카 모드 좌우 반전 */
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
