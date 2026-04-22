<template>
  <Teleport to="body">
    <div class="bo-toasts" aria-live="polite">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="bo-toast"
        :class="'bo-toast--' + t.type"
        role="status"
      >
        {{ t.message }}
        <button type="button" class="bo-toast__x" @click="dismissToast(t.id)" aria-label="Fechar">×</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { toasts, dismissToast } from '../utils/notify.js';
</script>

<style scoped>
.bo-toasts {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: min(400px, calc(100vw - 32px));
}

.bo-toast {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  font-size: 14px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff;
  color: #111827;
}

.bo-toast--success {
  border-color: #a7f3d0;
  background: #ecfdf5;
}

.bo-toast--error {
  border-color: #fecaca;
  background: #fef2f2;
}

.bo-toast--info {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.bo-toast--loading {
  border-color: #fde68a;
  background: #fffbeb;
}

.bo-toast--warn {
  border-color: #fcd34d;
  background: #fffbeb;
}

.bo-toast__x {
  border: none;
  background: transparent;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  opacity: 0.5;
  padding: 0 0 0 8px;
}

.bo-toast__x:hover {
  opacity: 1;
}
</style>
