import { ref } from 'vue';

export const toasts = ref([]);

let _id = 0;

export function toast(message, type = 'info', durationMs = 5000) {
  const id = ++_id;
  toasts.value = [...toasts.value, { id, message, type }];
  if (durationMs > 0) setTimeout(() => dismissToast(id), durationMs);
}

export function dismissToast(id) {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}
