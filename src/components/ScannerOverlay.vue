<script setup>
const props = defineProps({
  status: {
    type: String,
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
    type: Object,
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

// 긍정적인 미소 유도 문구 (미소 짓지 않을 때 노출)
const angryMessages = [
  "✨ 미소로 마주 앉은 당신은 훨씬 더 예뻐 보일 거예요",
  "😊 살짝 띤 미소가 당신의 매력을 200% 더해줍니다",
  "👀 웃는 모습에서 느껴지는 따뜻한 분위기가 좋아요",
  "💘 당신의 미소는 누군가에게 설렘이 될 수 있습니다",
];

const getAngryMessage = () => {
  // 33% 단위로 텍스트 변화 (약 2.5초마다)
  const idx = Math.floor((props.progress / 33.4));
  return angryMessages[Math.min(idx, angryMessages.length - 1)];
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
    <div :class="['hud-bottom', (props.status === 'result' && props.result.percent <= 30) ? 'screen-shake' : '']">
      <div v-if="props.status === 'result'" class="result-box judgment-box">
        <div class="result-tag">💘 오늘의 연애 확률 및 관상 분석 완료</div>
        
        <div class="result-style-badge" v-if="props.result.style">
          {{ props.result.style }}
        </div>

        <p class="result-label">연애 성공 확률</p>
        <h1 class="result-percent">{{ Math.round(props.result.percent) }}%</h1>
        
        <div class="result-divider"></div>
        
        <div class="physiognomy-box">
          <p class="physiognomy-title">🖋️ 연애 관상 분석/팁</p>
          <p class="result-comment">{{ props.result.comment }}</p>
        </div>
      </div>

      <div v-if="props.status === 'scanning'" class="analyzing-info">
        <p class="analyzing-text">{{ props.analyzingMessage }}</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: props.progress + '%' }"></div>
        </div>
      </div>

      <button
        class="scan-btn"
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

/* 킹받는 텍스트 피드백 */
.angry-alert {
  position: absolute;
  top: 18%;
  left: 50%;
  transform: translateX(-50%);
  background: #ff9f43;
  border-radius: 16px;
  padding: 10px 22px;
  pointer-events: none;
  z-index: 50;
  white-space: nowrap;
  box-shadow: 0 0 30px rgba(255, 159, 67, 0.4);
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

/* 트랜지션 - pop */
.pop-enter-active { animation: popIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.pop-leave-active { animation: popOut 0.15s ease-in; }
@keyframes popIn { from { transform: translateX(-50%) scale(0.5); opacity: 0; } to { transform: translateX(-50%) scale(1); opacity: 1; } }
@keyframes popOut { from { opacity: 1; } to { opacity: 0; } }

/* 트랜지션 - fade */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* 화면 흔들림 */
.screen-shake { animation: shake 0.5s ease-in-out; }
@keyframes shake {
  0%, 100% { transform: translate(0, 0); }
  10%, 30%, 50%, 70%, 90% { transform: translate(-8px, -4px); }
  20%, 40%, 60%, 80% { transform: translate(8px, 4px); }
}

/* 기본 HUD */
.hud-top { display: flex; justify-content: space-between; align-items: center; }
.hud-badge { background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 6px 12px; border-radius: 64px; color: #fff; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
.rec-dot { width: 8px; height: 8px; background: #ff4757; border-radius: 50%; flex-shrink: 0; animation: blink 1s infinite; }
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

/* Result Box */
.judgment-box {
  background: rgba(0, 0, 0, 0.88);
  border: 2px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  padding: 28px 24px;
  text-align: center;
  backdrop-filter: blur(10px);
}

.result-tag {
  display: inline-block;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 3px 10px;
  border-radius: 20px;
  margin-bottom: 14px;
}

.result-style-badge {
  background: linear-gradient(90deg, #ff4757, #ff6b81);
  color: #fff;
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 800;
  display: inline-block;
  margin-bottom: 12px;
  box-shadow: 0 4px 15px rgba(255, 71, 87, 0.3);
}

.result-label { color: rgba(255,255,255,0.6); font-size: 11px; letter-spacing: 1px; margin-bottom: 4px; }
.result-percent { color: #ff4757; font-size: 64px; font-weight: 900; margin-bottom: 10px; }

.result-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 15px 0;
}

.physiognomy-box {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  border-left: 3px solid #00ffcc;
  text-align: left;
}

.physiognomy-title {
  color: #00ffcc;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.result-comment { color: #eee; font-size: 14px; line-height: 1.6; font-weight: 500; }

/* HUD Bottom */
.hud-bottom { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 20px; margin-bottom: 20px; }
.analyzing-info { width: 100%; padding: 0 20px; }
.analyzing-text { color: #00ffcc; font-size: 12px; font-weight: 700; margin-bottom: 8px; }
.progress-bar { width: 100%; height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: #00ffcc; transition: width 0.1s linear; }

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

.scan-btn:active { transform: translateY(2px); box-shadow: none; }
.scan-btn:disabled { opacity: 0.4; cursor: default; background: #666; box-shadow: none; }
</style>
