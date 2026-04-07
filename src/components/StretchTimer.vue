<template>
  <div class="stretch-timer">
    <div class="time-display">{{ formattedTime }}</div>
    <div class="controls">
      <button v-if="state === 'idle'" class="btn btn-start" @click="$emit('start')">시작</button>
      <button v-if="state === 'counting'" class="btn btn-pause" @click="$emit('pause')">일시정지</button>
      <button v-if="state === 'paused'" class="btn btn-resume" @click="$emit('resume')">재개</button>
      <button v-if="state !== 'idle'" class="btn btn-reset" @click="$emit('reset')">초기화</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatTime } from '../services/stretchTimer.js'

const props = defineProps({
  state: {
    type: String,
    required: true,
    validator: (v) => ['idle', 'counting', 'paused'].includes(v),
  },
  remainingSeconds: {
    type: Number,
    required: true,
  },
})

defineEmits(['start', 'pause', 'resume', 'reset'])

const formattedTime = computed(() => formatTime(props.remainingSeconds))
</script>

<style scoped>
.stretch-timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.time-display {
  font-size: 36px;
  font-weight: 800;
  color: #00ffcc;
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
}

.controls {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn:hover {
  opacity: 0.85;
}

.btn-start,
.btn-resume {
  background: #00ffcc;
  color: #111;
}

.btn-pause {
  background: #ffcc00;
  color: #111;
}

.btn-reset {
  background: #444;
  color: #fff;
}
</style>
