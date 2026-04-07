<template>
  <div class="stretch-stats">
    <div class="stat">
      <span class="stat-value done">{{ done }}</span>
      <span class="stat-label">완료</span>
    </div>
    <div class="stat">
      <span class="stat-value skipped">{{ skipped }}</span>
      <span class="stat-label">건너뛰기</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  done: {
    type: Number,
    required: true,
  },
  skipped: {
    type: Number,
    required: true,
  },
})
</script>

<style scoped>
.stretch-stats {
  display: flex;
  gap: 32px;
  justify-content: center;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 32px;
  font-weight: 800;
}

.stat-value.done {
  color: #00ffcc;
}

.stat-value.skipped {
  color: #888;
}

.stat-label {
  font-size: 14px;
  color: #888;
}
</style>
