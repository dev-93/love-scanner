<template>
  <Teleport to="body">
    <div v-if="visible" class="notification-overlay">
      <div class="notification-card">
        <div class="icon">🧘</div>
        <h2 class="title">스트레칭 시간이에요!</h2>
        <p class="instruction">{{ stretch?.instruction }}</p>
        <div class="actions">
          <button class="btn btn-start" @click="$emit('start-stretch')">스트레칭 시작</button>
          <button class="btn btn-skip" @click="$emit('skip')">건너뛰기</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  stretch: {
    type: Object,
    default: () => ({ type: '', instruction: '' }),
  },
})

defineEmits(['start-stretch', 'skip'])
</script>

<style scoped>
.notification-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
}

.notification-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 48px 36px;
  max-width: 420px;
  text-align: center;
}

.icon {
  font-size: 64px;
}

.title {
  font-size: 28px;
  font-weight: 800;
  color: #00ffcc;
}

.instruction {
  font-size: 18px;
  color: #ccc;
  line-height: 1.6;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.btn {
  padding: 12px 28px;
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

.btn-start {
  background: #00ffcc;
  color: #111;
}

.btn-skip {
  background: #444;
  color: #fff;
}
</style>
