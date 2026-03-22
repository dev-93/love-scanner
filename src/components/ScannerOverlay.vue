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
  },
  isSmiling: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['start-scan', 'reset-scan']);

const handleAction = () => {
  if (props.status === 'ready' || props.status === 'result') {
    emit('start-scan');
  }
};

// 킹받는 문구 목록 (웃지 않을 때)
const angryMessages = [
  "😤 웃어라 했잖아",
  "🙄 이게 웃는 거임?",
  "💀 표정 관리 좀",
  "😒 진짜 킹받네",
  "🤬 지금 장난함?",
  "😑 얼굴에 뭐 붙었냐",
];

// 스캔 중 현재 킹받는 문구 (progress에 따라)
const getAngryMessage = () => {
  const idx = Math.floor((props.progress / 100) * angryMessages.length);
  return angryMessages[Math.min(idx, angryMessages.length - 1)];
};

// 결과에 따른 색상
const getPercentColor = (percent) => {
  if (percent >= 70) return '#00ffcc';
  if (percent >= 40) return '#ffcc00';
  return '#ff4757';
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
        <span class="text">💘 오늘의 연애 확률</span>
      </div>
    </div>

    <!-- 킹받는 텍스트 피드백 (스캔 중, 웃지 않을 때) -->
    <transition name="pop">
      <div v-if="props.status === 'scanning' && !props.isSmiling" class="angry-alert">
        <span class="angry-text">{{ getAngryMessage() }}</span>
      </div>
    </transition>

    <!-- 스캔 중 미소 감지 안내 (웃고 있을 때) -->
    <transition name="fade">
      <div v-if="props.status === 'scanning' && props.isSmiling" class="smile-ok">
        😊 좋아, 계속 그 표정
      </div>
    </transition>

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
      <!-- 결과 화면 -->
      <div v-if="props.status === 'result'" class="result-box">
        <div class="result-tag">💘 오늘의 연애 확률 분석 완료</div>
        <p class="result-label">연애 성공 확률</p>
        <h1 class="result-percent" :style="{ color: getPercentColor(props.result.percent) }">
          {{ props.result.percent }}%
        </h1>
        <div class="result-bar-wrap">
          <div class="result-bar-fill" :style="{ width: props.result.percent + '%', background: getPercentColor(props.result.percent) }"></div>
        </div>
        <p class="result-comment">"{{ props.result.comment }}"</p>
      </div>

      <!-- 스캔 중 진행 상황 -->
      <div v-if="props.status === 'scanning'" class="analyzing-info">
        <p class="analyzing-text">{{ props.analyzingMessage }}</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: props.progress + '%' }"></div>
        </div>
      </div>

      <!-- 버튼 -->
      <button
        class="scan-btn"
        :class="{ 'btn-result': props.status === 'result' }"
        :disabled="props.status === 'scanning'"
        @click="handleAction"
      >
        <span v-if="props.status === 'ready'">💘 오늘의 연애 확률 측정</span>
        <span v-else-if="props.status === 'scanning'">분석 중...</span>
        <span v-else>🔄 다시 측정하기</span>
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
  overflow: hidden;
}

.scan-btn, .result-box { pointer-events: auto; }

/* 킹받는 알림 텍스트 */
.angry-alert {
  position: absolute;
  top: 18%;
  left: 50%;
  transform: translateX(-50%);
  background: #ff0055;
  border-radius: 16px;
  padding: 10px 22px;
  pointer-events: none;
  z-index: 50;
  white-space: nowrap;
  box-shadow: 0 0 30px rgba(255, 0, 85, 0.6);
  animation: shake 0.3s infinite;
}

.angry-text {
  color: #fff;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 0.5px;
}

/* 미소 OK 피드백 */
.smile-ok {
  position: absolute;
  top: 18%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 255, 204, 0.15);
  border: 1.5px solid #00ffcc;
  border-radius: 16px;
  padding: 8px 20px;
  color: #00ffcc;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  pointer-events: none;
  z-index: 50;
}

/* 트랜지션 애니메이션 */
.pop-enter-active { animation: popIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.pop-leave-active { animation: popOut 0.15s ease-in; }
@keyframes popIn { from { transform: translateX(-50%) scale(0.5); opacity: 0; } to { transform: translateX(-50%) scale(1); opacity: 1; } }
@keyframes popOut { from { opacity: 1; } to { opacity: 0; } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* 화면 흔들림 */
@keyframes shake {
  0%, 100% { transform: translateX(-50%) rotate(0deg); }
  25% { transform: translateX(calc(-50% - 3px)) rotate(-1.5deg); }
  75% { transform: translateX(calc(-50% + 3px)) rotate(1.5deg); }
}

/* 기본 HUD */
.hud-top { display: flex; justify-content: space-between; align-items: center; }
.hud-badge { background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(6px); border: 1px solid rgba(255, 255, 255, 0.15); padding: 6px 14px; border-radius: 64px; color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
.rec-dot { width: 8px; height: 8px; background: #ff4757; border-radius: 50%; animation: blink 1s infinite; flex-shrink: 0; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

/* 스캔 프레임 */
.scan-frame { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -60%); width: 220px; height: 220px; }
.corner { position: absolute; width: 24px; height: 24px; border-color: #00ffcc; border-style: solid; }
.tl { top: 0; left: 0; border-width: 3px 0 0 3px; }
.tr { top: 0; right: 0; border-width: 3px 3px 0 0; }
.bl { bottom: 0; left: 0; border-width: 0 0 3px 3px; }
.br { bottom: 0; right: 0; border-width: 0 3px 3px 0; }
.scan-line { position: absolute; top: 0; width: 100%; height: 2px; background: linear-gradient(90deg, transparent, #00ffcc, transparent); box-shadow: 0 0 10px #00ffcc; animation: scanMove 2s linear infinite; }
@keyframes scanMove { 0% { top: 0; opacity: 1; } 100% { top: 100%; opacity: 0.1; } }

/* HUD Bottom */
.hud-bottom { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 16px; margin-bottom: 20px; }

/* 결과 박스 */
.result-box {
  width: 100%;
  background: rgba(0, 0, 0, 0.88);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 24px 24px 20px;
  text-align: center;
  backdrop-filter: blur(10px);
}

.result-tag {
  display: inline-block;
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.7);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 3px 10px;
  border-radius: 20px;
  margin-bottom: 14px;
}

.result-label { color: rgba(255,255,255,0.5); font-size: 11px; letter-spacing: 1px; margin-bottom: 4px; }
.result-percent { font-size: 76px; font-weight: 900; margin-bottom: 10px; line-height: 1; transition: color 0.5s; }
.result-bar-wrap { width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; margin-bottom: 16px; }
.result-bar-fill { height: 100%; border-radius: 3px; transition: width 1s ease, background 0.5s; }
.result-comment { color: rgba(255,255,255,0.9); font-size: 15px; line-height: 1.6; font-weight: 600; }

/* 분석 중 */
.analyzing-info { width: 100%; padding: 0 10px; }
.analyzing-text { color: #00ffcc; font-size: 13px; font-weight: 700; margin-bottom: 8px; text-align: center; }
.progress-bar { width: 100%; height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #00ffcc, #00aaff); transition: width 0.1s linear; }

/* 버튼 */
.scan-btn {
  width: 100%;
  background: linear-gradient(135deg, #00ffcc, #00aaff);
  border: none;
  border-radius: 14px;
  color: #000;
  padding: 18px 20px;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 20px rgba(0, 255, 204, 0.4);
  letter-spacing: 0.3px;
}

.scan-btn.btn-result {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1.5px solid rgba(255, 255, 255, 0.25);
  box-shadow: none;
}

.scan-btn:active { transform: translateY(2px); box-shadow: none; }
.scan-btn:disabled { opacity: 0.4; cursor: default; }
</style>
