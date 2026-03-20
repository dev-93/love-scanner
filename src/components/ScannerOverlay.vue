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

    <!-- 우측 필터 아이콘 (장식용) -->
    <div class="filter-sidebar">
      <div class="filter-icon"><img src="https://img.icons8.com/ios-filled/50/ffffff/shield.png" alt="shield" /></div>
      <div class="filter-icon active"><img src="/guardian_shiba.png" alt="dog" class="mini-dog" /></div>
      <div class="filter-icon"><img src="https://img.icons8.com/ios-filled/50/ffffff/sword.png" alt="sword" /></div>
    </div>

    <!-- 킹받는 댕댕이 마스코트 -->
    <div :class="[
      'mascot-container', 
      props.status === 'result' ? (props.result.percent <= 30 ? 'critical-hit' : 'attack') : 'float',
      (props.status === 'scanning' && !props.isSmiling) ? 'angry-mode' : ''
    ]">
      <div class="mascot-frame">
        <img src="/guardian_shiba.png" alt="guardian dog" class="mascot-img" />
      </div>
      
      <!-- 실시간 경고 말풍선 -->
      <div v-if="props.status === 'scanning'" :class="['speech-bubble', !props.isSmiling ? 'warning' : '']">
        {{ props.isSmiling ? '입꼬리 관찰 중...' : '야 똑바로 안 웃어?!' }}
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
    <div :class="['hud-bottom', (props.status === 'result' && props.result.percent <= 30) ? 'screen-shake' : '']">
      <div v-if="props.status === 'result'" class="result-box judgment-box">
        <div class="dog-tag">방패 댕댕이의 엄격한 판결</div>
        <p class="result-label">연애 성공 확률</p>
        <h1 class="result-percent">{{ props.result.percent }}%</h1>
        <p class="result-comment">"{{ props.result.comment }}"</p>
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
        <span>{{ props.status === 'result' ? '다시 도전' : '스캔 대기 중' }}</span>
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

.scan-btn, .result-box, .filter-sidebar { pointer-events: auto; }

/* 킹받는 댕댕이 마스코트 & 프레임 */
.mascot-container {
  position: absolute;
  z-index: 100;
  width: 140px;
  pointer-events: none;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.mascot-frame {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  border: 4px solid #00ffcc;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 255, 204, 0.5);
  background: #000;
}

.mascot-img {
  width: 130%;
  height: 130%;
  object-fit: cover;
  object-position: center top;
  margin-left: -15%;
  margin-top: -10%;
}

.float {
  top: 20%;
  left: 10%;
  animation: floating 3s ease-in-out infinite;
}

/* 실시간 공격 모드 (웃지 않을 때) */
.angry-mode {
  left: 50% !important;
  top: 45% !important;
  transform: translate(-50%, -50%) scale(1.4);
  animation: growl 0.2s infinite alternate;
}

@keyframes growl {
  from { transform: translate(-51%, -50%) scale(1.4) rotate(-2deg); }
  to { transform: translate(-49%, -50%) scale(1.4) rotate(2deg); }
}

.speech-bubble {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  background: #00ffcc;
  color: #000;
  width: max-content;
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 900;
  box-shadow: 0 4px 15px rgba(0, 255, 204, 0.4);
}

.speech-bubble.warning {
  background: #ff0055;
  color: #fff;
  animation: pulse 0.5s infinite;
}

@keyframes pulse {
  0%, 100% { transform: translateX(-50%) scale(1); }
  50% { transform: translateX(-50%) scale(1.1); }
}


/* 타격 애니메이션 */
.attack {
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%) scale(1.3);
}

.critical-hit {
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%) scale(1.6);
  animation: bashAttack 0.4s ease-out forwards;
}

@keyframes bashAttack {
  0% { transform: translate(-50%, -150%) scale(1); opacity: 0; }
  20% { transform: translate(-50%, -50%) scale(2); opacity: 1; }
  35% { transform: translate(-50%, -50%) scale(1.2); }
  50% { transform: translate(-50%, -50%) scale(2.2); }
  100% { transform: translate(-50%, -50%) scale(1.6); }
}

.impact-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #ff0055;
  font-size: 80px;
  font-weight: 900;
  text-shadow: 0 0 20px #fff;
  z-index: 110;
  animation: impactText 0.3s ease-out forwards;
}

@keyframes impactText {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
}

/* 화면 흔들림 */
.screen-shake {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translate(0, 0); }
  10%, 30%, 50%, 70%, 90% { transform: translate(-8px, -4px); }
  20%, 40%, 60%, 80% { transform: translate(8px, 4px); }
}

/* SNS 필터 버튼 UI */
.filter-sidebar {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 15px;
  z-index: 20;
}

.filter-icon {
  width: 44px;
  height: 44px;
  background: rgba(0, 0, 0, 0.4);
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  display: flex;
  align-items: center; justify-content: center; padding: 10px;
}

.filter-icon img { width: 100%; opacity: 0.8; }
.filter-icon.active { border-color: #00ffcc; background: rgba(0, 255, 204, 0.2); }

.speech-bubble {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  background: #00ffcc;
  color: #000;
  width: max-content;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 800;
}

/* Result Box */
.judgment-box {
  background: rgba(0, 0, 0, 0.9);
  border: 3px solid #00ffcc;
  border-radius: 24px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 0 50px rgba(0, 255, 204, 0.3);
}

.dog-tag {
  display: inline-block;
  background: #fff;
  color: #000;
  font-size: 10px;
  font-weight: 900;
  padding: 2px 8px;
  border-radius: 4px;
  margin-bottom: 12px;
}

@keyframes floating {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-20px) rotate(2deg); }
}

/* 기본 HUD & Frame */
.hud-top { display: flex; justify-content: space-between; align-items: center; }
.hud-badge { background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 6px 12px; border-radius: 64px; color: #fff; font-size: 11px; font-weight: 600; }
.rec-dot { width: 8px; height: 8px; background: #ff4757; border-radius: 50%; margin-right: 6px; animation: blink 1s infinite; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

.scan-frame { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -60%); width: 220px; height: 220px; }
.corner { position: absolute; width: 24px; height: 24px; border-color: #00ffcc; border-style: solid; }
.tl { top: 0; left: 0; border-width: 3px 0 0 3px; }
.tr { top: 0; right: 0; border-width: 3px 3px 0 0; }
.bl { bottom: 0; left: 0; border-width: 0 0 3px 3px; }
.br { bottom: 0; right: 0; border-width: 0 3px 3px 0; }

.scan-line { position: absolute; top: 0; width: 100%; height: 2px; background: linear-gradient(90deg, transparent, #00ffcc, transparent); box-shadow: 0 0 10px #00ffcc; animation: scanMove 2s linear infinite; }
@keyframes scanMove { 0% { top: 0; opacity: 1; } 100% { top: 100%; opacity: 0.1; } }

.result-label { color: rgba(255,255,255,0.6); font-size: 11px; letter-spacing: 1px; margin-bottom: 4px; }
.result-percent { color: #fff; font-size: 72px; font-weight: 900; margin-bottom: 15px; }
.result-comment { color: #fff; font-size: 17px; line-height: 1.5; font-weight: 600; }

.hud-bottom { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 20px; margin-bottom: 20px; }
.analyzing-info { width: 100%; padding: 0 20px; }
.analyzing-text { color: #00ffcc; font-size: 12px; font-weight: 700; margin-bottom: 8px; }
.progress-bar { width: 100%; height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: #00ffcc; transition: width 0.1s linear; }

.scan-btn {
  background: #00ffcc;
  border: none;
  border-radius: 12px;
  color: #000;
  padding: 18px 60px;
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 0 #008f72;
}

.scan-btn:active { transform: translateY(2px); box-shadow: 0 2px 0 #008f72; }
.scan-btn:disabled { opacity: 0.5; background: #666; box-shadow: none; }
</style>

