import { ref } from 'vue';

export const toasts = ref([]);

let _id = 0;

export function toast(message, type = 'info') {
  const id = ++_id;
  toasts.value = [...toasts.value, { id, message, type }];
  setTimeout(() => dismissToast(id), 5000);
}

export function dismissToast(id) {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}
