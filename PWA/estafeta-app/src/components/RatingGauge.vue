<template>
  <div class="gauge-wrap">
    <svg viewBox="0 0 120 80" class="gauge-svg">
      <path :d="bgArc" fill="none" :stroke="bgColor" stroke-width="10" stroke-linecap="round" />
      <path :d="fgArc" fill="none" :stroke="color" stroke-width="10" stroke-linecap="round" />
    </svg>
    <div class="gauge-value">{{ displayValue }}</div>
    <div class="gauge-label">{{ label }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  value: { type: Number, default: 0 },
  max: { type: Number, default: 5 },
  label: { type: String, default: 'Rating' },
  color: { type: String, default: 'var(--ge-brand)' },
  bgColor: { type: String, default: 'var(--ge-border)' },
});

const displayValue = computed(() => props.value.toFixed(1));

function arcPath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

const bgArc = computed(() => arcPath(60, 60, 45, -120, 120));
const fgArc = computed(() => {
  const pct = Math.min(1, Math.max(0, props.value / props.max));
  const end = -120 + pct * 240;
  return arcPath(60, 60, 45, -120, end);
});
</script>

<style scoped>
.gauge-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.gauge-svg {
  width: 120px;
  height: 80px;
}
.gauge-value {
  position: absolute;
  top: 44px;
  font-size: 22px;
  font-weight: 700;
  font-family: var(--ge-font-display);
  color: var(--ge-text);
}
.gauge-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--ge-text-muted);
  margin-top: -4px;
}
</style>
