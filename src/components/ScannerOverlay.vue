<script setup>
const props = defineProps({
  status: {
    type: String, // 'ready', 'scanning', 'result'
    default: 'ready'
  },
  progress: {
    type: Number,
    default: 0
  },
  analyzingMessage: {
    type: String,
    default: ''
  },
  result: {
    type: Object, // { percent: number, comment: string }
    default: () => ({ percent: 0, comment: '' })
  }
});

const emit = defineEmits(['start-scan', 'reset-scan']);

const handleAction = () => {
  if (props.status === 'ready' || props.status === 'result') {
    emit('start-scan');
  }
};
</script>

<template>
  <div class="scanner-overlay">
    <!-- Top HUD -->
    <div class="hud-top">
      <div class="hud-badge live">
        <span class="rec-dot"></span>
        <span class="text">LIVE</span>
      </div>
      <div class="hud-badge version">
        <span class="text">LOVE SCANNER v1.0</span>
      </div>
    </div>

    <!-- Center Scan Frame -->
    <div v-show="props.status !== 'result'" class="scan-frame">
      <div class="corner tl"></div>
      <div class="corner tr"></div>
      <div class="corner bl"></div>
      <div class="corner br"></div>
      <div v-show="props.status === 'scanning'" class="scan-line"></div>
    </div>

    <!-- Bottom UI -->
    <div class="hud-bottom">
      <!-- Result Card -->
      <div v-if="props.status === 'result'" class="result-box">
        <p class="result-label">오늘 연애할 확률</p>
        <h1 class="result-percent">{{ props.result.percent }}%</h1>
        <p class="result-comment">{{ props.result.comment }}</p>
      </div>

      <!-- Analyzing Info -->
      <div v-if="props.status === 'scanning'" class="analyzing-info">
        <p class="analyzing-text">{{ props.analyzingMessage }}</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: props.progress + '%' }"></div>
        </div>
      </div>

      <!-- Button -->
      <button 
        class="scan-btn" 
        :disabled="props.status === 'scanning'"
        @click="handleAction"
      >
        <span>{{ props.status === 'result' ? '다시 스캔' : (props.status === 'scanning' ? '분석 중...' : '스캔 시작') }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
  z-index: 10;
}

/* UI 요소 중 실제 클릭이 필요한 부분만 pointer-events auto 처리 */
.scan-btn, .result-box {
  pointer-events: auto;
}

/* Top HUD */
.hud-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hud-badge {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 6px 12px;
  border-radius: 64px;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.rec-dot {
  width: 8px;
  height: 8px;
  background: #ff4757;
  border-radius: 50%;
  margin-right: 6px;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Center Scan Frame */
.scan-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -60%);
  width: 220px;
  height: 220px;
}

.corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border-color: #00ffcc;
  border-style: solid;
}

.tl { top: 0; left: 0; border-width: 3px 0 0 3px; }
.tr { top: 0; right: 0; border-width: 3px 3px 0 0; }
.bl { bottom: 0; left: 0; border-width: 0 0 3px 3px; }
.br { bottom: 0; right: 0; border-width: 0 3px 3px 0; }

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00ffcc, transparent);
  box-shadow: 0 0 10px #00ffcc;
  animation: scanMove 2s linear infinite;
}

@keyframes scanMove {
  0% { top: 0; opacity: 1; }
  100% { top: 100%; opacity: 0.1; }
}

/* Bottom UI */
.hud-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.result-box {
  width: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  border: 1.5px solid #00ffcc;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.result-label {
  color: #00ffcc;
  font-size: 11px;
  letter-spacing: 2px;
  font-weight: 700;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.result-percent {
  color: #fff;
  font-size: 56px;
  font-weight: 800;
  margin-bottom: 12px;
  line-height: 1;
}

.result-comment {
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  line-height: 1.5;
  word-break: keep-all;
}

.analyzing-info {
  width: 100%;
  text-align: center;
}

.analyzing-text {
  color: #00ffcc;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #00ffcc;
  transition: width 0.1s linear;
}

.scan-btn {
  background: rgba(0, 255, 204, 0.1);
  border: 2px solid #00ffcc;
  border-radius: 50px;
  color: #00ffcc;
  padding: 16px 40px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s;
  pointer-events: auto;
}

.scan-btn:hover:not(:disabled) {
  background: rgba(0, 255, 204, 0.2);
  transform: scale(1.05);
}

.scan-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.scan-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
