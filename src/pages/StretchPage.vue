<script setup>
import { ref, onUnmounted } from 'vue'
import { getRandomStretch } from '../services/stretchTimer.js'
import StretchCamera from '../components/StretchCamera.vue'
import StretchStats from '../components/StretchStats.vue'

// --- State ---
const started = ref(false)
const currentStretch = ref(getRandomStretch())
const stats = ref({ done: 0, skipped: 0 })
const lastDetectedAt = ref(null)
const showCompleted = ref(false)

// 30분 리마인더
const REMINDER_INTERVAL = 30 * 60 * 1000
let reminderTimer = null
const showReminder = ref(false)

function start() {
  started.value = true
  currentStretch.value = getRandomStretch()
  startReminder()
}

function stop() {
  started.value = false
  stopReminder()
  showReminder.value = false
  showCompleted.value = false
}

function startReminder() {
  stopReminder()
  reminderTimer = setInterval(() => {
    currentStretch.value = getRandomStretch()
    showReminder.value = true
  }, REMINDER_INTERVAL)
}

function stopReminder() {
  if (reminderTimer) {
    clearInterval(reminderTimer)
    reminderTimer = null
  }
}

function handleStretchDetected() {
  stats.value = { ...stats.value, done: stats.value.done + 1 }
  lastDetectedAt.value = new Date()
  showCompleted.value = true
  showReminder.value = false

  // 리마인더 타이머 리셋 (스트레칭 했으니 30분 다시 시작)
  startReminder()

  // 3초 후 완료 메시지 숨기기
  setTimeout(() => {
    showCompleted.value = false
  }, 3000)
}

function handleSkipReminder() {
  stats.value = { ...stats.value, skipped: stats.value.skipped + 1 }
  showReminder.value = false
  startReminder()
}

function handleDoStretch() {
  showReminder.value = false
  // 리마인더 닫고 감지는 이미 계속 돌고 있음
}

onUnmounted(() => {
  stopReminder()
})
</script>

<template>
  <div class="stretch-page">
    <header class="page-header">
      <router-link to="/" class="back-link">← 러브 스캐너</router-link>
      <h1 class="page-title">🧘 스트레칭 리마인더</h1>
    </header>

    <!-- 시작 전 -->
    <div v-if="!started" class="start-screen">
      <div class="start-icon">🧘</div>
      <p class="start-desc">카메라로 스트레칭 동작을 실시간 감지합니다.<br>30분마다 스트레칭 알림도 보내드려요.</p>
      <button class="btn-start" @click="start">시작하기</button>
    </div>

    <!-- 시작 후: 카메라 + 감지 -->
    <template v-else>
      <div class="camera-area">
        <StretchCamera
          :camera-on="true"
          :active="true"
          @stretch-detected="handleStretchDetected"
        />

        <!-- 오버레이: 상태 표시 -->
        <div class="camera-overlay-top">
          <div class="status-badge monitoring">🔍 실시간 감지 중</div>
          <button class="btn-stop" @click="stop">종료</button>
        </div>

        <!-- 스트레칭 완료 오버레이 -->
        <Transition name="fade">
          <div v-if="showCompleted" class="completed-overlay">
            <div class="completed-icon">✅</div>
            <div class="completed-text">스트레칭 감지됨!</div>
          </div>
        </Transition>
      </div>

      <!-- 현재 권장 스트레칭 -->
      <div class="stretch-guide">
        <span class="guide-label">권장 스트레칭</span>
        <span class="guide-text">{{ currentStretch.instruction }}</span>
      </div>

      <!-- 통계 -->
      <StretchStats :done="stats.done" :skipped="stats.skipped" />

      <!-- 30분 리마인더 오버레이 -->
      <Teleport to="body">
        <Transition name="fade">
          <div v-if="showReminder" class="reminder-overlay">
            <div class="reminder-card">
              <div class="reminder-icon">⏰</div>
              <h2 class="reminder-title">스트레칭 시간이에요!</h2>
              <p class="reminder-instruction">{{ currentStretch.instruction }}</p>
              <div class="reminder-actions">
                <button class="btn btn-primary" @click="handleDoStretch">알겠어요</button>
                <button class="btn btn-secondary" @click="handleSkipReminder">건너뛰기</button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </template>
  </div>
</template>

<style scoped>
.stretch-page {
  width: 100%;
  min-height: 100vh;
  background: #111;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
}

.page-header {
  width: 100%;
  max-width: 640px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.back-link {
  color: #888;
  text-decoration: none;
  font-size: 13px;
  white-space: nowrap;
}
.back-link:hover { color: #00ffcc; }

.page-title {
  font-size: 20px;
  font-weight: 800;
  color: #00ffcc;
  margin: 0;
}

/* 시작 화면 */
.start-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  text-align: center;
}
.start-icon { font-size: 80px; }
.start-desc { font-size: 16px; color: #aaa; line-height: 1.6; }
.btn-start {
  padding: 14px 40px;
  background: #00ffcc;
  color: #111;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}
.btn-start:hover { opacity: 0.85; }

/* 카메라 영역 */
.camera-area {
  position: relative;
  width: 100%;
  max-width: 640px;
  border-radius: 16px;
  overflow: hidden;
  background: #000;
}

.camera-overlay-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  pointer-events: none;
  z-index: 10;
}
.camera-overlay-top > * { pointer-events: auto; }

.status-badge {
  background: rgba(0, 0, 0, 0.6);
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
}
.status-badge.monitoring { color: #00ffcc; }

.btn-stop {
  background: rgba(255, 60, 60, 0.8);
  color: #fff;
  border: none;
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.btn-stop:hover { background: rgba(255, 60, 60, 1); }

/* 완료 오버레이 */
.completed-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 255, 204, 0.15);
  z-index: 5;
}
.completed-icon { font-size: 64px; }
.completed-text {
  font-size: 24px;
  font-weight: 800;
  color: #00ffcc;
  margin-top: 8px;
}

/* 권장 스트레칭 */
.stretch-guide {
  width: 100%;
  max-width: 640px;
  background: #1a1a1a;
  border-radius: 12px;
  padding: 14px 18px;
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.guide-label { font-size: 12px; color: #888; }
.guide-text { font-size: 15px; color: #ddd; }

/* 리마인더 오버레이 */
.reminder-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
}
.reminder-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px 32px;
  text-align: center;
}
.reminder-icon { font-size: 56px; }
.reminder-title { font-size: 24px; font-weight: 800; color: #00ffcc; }
.reminder-instruction { font-size: 16px; color: #ccc; line-height: 1.6; }
.reminder-actions { display: flex; gap: 12px; margin-top: 8px; }

.btn {
  padding: 12px 28px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}
.btn:hover { opacity: 0.85; }
.btn-primary { background: #00ffcc; color: #111; }
.btn-secondary { background: #444; color: #fff; }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
