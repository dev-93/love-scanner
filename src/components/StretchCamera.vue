<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as faceapi from '@vladmandic/face-api'
import { detectStretchMovement } from '../services/poseDetector.js'

const props = defineProps({
  active: { type: Boolean, default: false },
  cameraOn: { type: Boolean, default: false },
})

const emit = defineEmits(['stretch-detected', 'timeout', 'camera-denied'])

const videoRef = ref(null)
const streamRef = ref(null)
const permissionDenied = ref(false)
const isModelLoaded = ref(false)
const progress = ref(0)
const videoReady = ref(false)

let baselineLandmarks = null
let loopTimer = null
let loopRunning = false

defineExpose({ progress, permissionDenied })

// face-api 모델 로드
const loadModels = async () => {
  if (isModelLoaded.value) return
  const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/'
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    ])
    isModelLoaded.value = true
    console.log('[StretchCamera] 모델 로드 완료')
  } catch (error) {
    console.error('[StretchCamera] 모델 로드 실패:', error)
  }
}

// 카메라 시작 - video loadeddata 이벤트를 기다림
const startCamera = async () => {
  permissionDenied.value = false
  videoReady.value = false
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false,
    })
    streamRef.value = stream
    await nextTick() // videoRef가 DOM에 렌더링될 때까지 대기
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      // 비디오가 실제로 재생 가능할 때까지 대기
      await new Promise((resolve) => {
        videoRef.value.onloadeddata = () => {
          videoReady.value = true
          console.log('[StretchCamera] 비디오 준비 완료')
          resolve()
        }
      })
    }
  } catch (error) {
    console.error('[StretchCamera] 카메라 권한 거부:', error)
    permissionDenied.value = true
    emit('camera-denied')
  }
}

const stopCamera = () => {
  if (streamRef.value) {
    streamRef.value.getTracks().forEach((t) => t.stop())
    streamRef.value = null
  }
  videoReady.value = false
}

const detectLandmarks = async () => {
  if (!videoRef.value || !isModelLoaded.value || !videoReady.value) return null
  try {
    const det = await faceapi
      .detectSingleFace(videoRef.value, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
    if (!det) return null
    return det.landmarks.positions
  } catch (e) {
    console.error('[StretchCamera] 감지 오류:', e)
    return null
  }
}

const startDetection = () => {
  baselineLandmarks = null
  progress.value = 0
  loopRunning = true
  let cooldown = false

  console.log('[StretchCamera] 감지 루프 시작')

  const loop = async () => {
    if (!loopRunning) return

    const landmarks = await detectLandmarks()

    if (landmarks && !cooldown) {
      if (!baselineLandmarks) {
        baselineLandmarks = landmarks
        console.log('[StretchCamera] 기준 자세 저장됨')
      } else {
        const result = detectStretchMovement(baselineLandmarks, landmarks)
        progress.value = Math.round(result.confidence * 100)

        if (result.isStretching) {
          console.log('[StretchCamera] ✅ 스트레칭 감지됨!')
          emit('stretch-detected')
          cooldown = true
          progress.value = 100
          setTimeout(() => {
            baselineLandmarks = null
            cooldown = false
            progress.value = 0
          }, 3000)
        }
      }
    } else if (!landmarks && baselineLandmarks) {
      // 얼굴 못 찾으면 baseline 리셋
      baselineLandmarks = null
      progress.value = 0
    }

    loopTimer = setTimeout(() => {
      if (loopRunning) loop()
    }, 500)
  }

  loop()
}

const stopDetection = () => {
  loopRunning = false
  if (loopTimer) {
    clearTimeout(loopTimer)
    loopTimer = null
  }
  baselineLandmarks = null
  progress.value = 0
}

const handleManualComplete = () => {
  emit('stretch-detected')
}

// 초기화 및 감지 시작을 하나의 함수로
const initAndDetect = async () => {
  await loadModels()
  await startCamera()
  if (!permissionDenied.value && props.active) {
    startDetection()
  }
}

watch(() => props.cameraOn, async (on) => {
  if (on) {
    await initAndDetect()
  } else {
    stopDetection()
    stopCamera()
  }
})

watch(() => props.active, (active) => {
  if (active && videoReady.value && isModelLoaded.value) {
    startDetection()
  } else if (!active) {
    stopDetection()
  }
})

onMounted(() => {
  if (props.cameraOn) {
    initAndDetect()
  }
})

onUnmounted(() => {
  stopDetection()
  stopCamera()
})
</script>

<template>
  <div class="stretch-camera">
    <template v-if="!permissionDenied">
      <video ref="videoRef" autoplay playsinline muted class="video-preview"></video>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
    </template>
    <template v-else>
      <div class="permission-error">
        <div class="icon">📷</div>
        <h3>카메라 권한이 필요합니다</h3>
        <p>브라우저 설정에서 카메라 권한을 허용해 주세요.</p>
        <button class="btn-manual" @click="handleManualComplete">수동으로 완료하기</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.stretch-camera {
  width: 100%;
  height: 100%;
  position: relative;
}
.video-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
  background: #000;
}
.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: #333;
}
.progress-fill {
  height: 100%;
  background: #00ffcc;
  transition: width 0.3s ease;
}
.permission-error {
  text-align: center;
  color: #fff;
  padding: 40px;
}
.permission-error .icon { font-size: 64px; margin-bottom: 20px; }
.permission-error h3 { color: #00ffcc; margin-bottom: 12px; }
.permission-error p { font-size: 14px; color: #888; line-height: 1.6; margin-bottom: 24px; }
.btn-manual {
  padding: 12px 28px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  background: #00ffcc;
  color: #111;
}
.btn-manual:hover { opacity: 0.85; }
</style>
