<template>
  <div class="stepper">
    <div v-for="(step, i) in steps" :key="step.state" class="step" :class="stepClass(step.state)">
      <div class="step-dot">
        <span v-if="isCompleted(step.state)" class="dot-icon" v-html="SVG.check"></span>
        <span v-else-if="isCurrent(step.state)" class="dot-icon dot-pulse" v-html="SVG.mapPin"></span>
        <span v-else class="dot-icon dot-empty" v-html="SVG.clock"></span>
      </div>
      <div v-if="i < steps.length - 1" class="step-line" :class="{ filled: isCompleted(step.state) }"></div>
      <div class="step-label">{{ step.label }}</div>
      <div class="step-time" v-if="timestamps[step.state]">
        {{ formatTime(timestamps[step.state]) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { deliveryStateLabels, SVG } from '../constants.js';

const props = defineProps({
  currentState: { type: String, required: true },
  timestamps: { type: Object, default: () => ({}) },
});

const stateOrder = ['E-09', 'E-10', 'E-11', 'E-12', 'E-13'];
const stateIndex = (s) => stateOrder.indexOf(s);

const steps = stateOrder.map(s => ({
  state: s,
  label: {
    'E-09': 'A caminho',
    'E-10': 'Na loja',
    'E-11': 'Em trânsito',
    'E-12': 'No destino',
    'E-13': 'Entregue',
  }[s] || deliveryStateLabels[s],
}));

function isCompleted(state) {
  return stateIndex(props.currentState) > stateIndex(state);
}

function isCurrent(state) {
  return props.currentState === state;
}

function stepClass(state) {
  if (isCompleted(state)) return 'completed';
  if (isCurrent(state)) return 'current';
  return 'pending';
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}
</script>

<style scoped>
.stepper {
  display: flex;
  align-items: flex-start;
  padding: 4px 0;
  overflow-x: auto;
  gap: 0;
}
.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  min-width: 56px;
}
.step-dot {
  width: 28px; height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  position: relative;
  z-index: 2;
}
.completed .step-dot {
  background: var(--ge-brand);
  color: #fff;
}
.current .step-dot {
  background: var(--ge-status-active);
  color: #fff;
  box-shadow: 0 0 0 4px rgba(59,130,246,0.2);
}
.pending .step-dot {
  background: var(--ge-border);
  color: var(--ge-text-muted);
}
.dot-pulse {
  animation: pulse 1.5s infinite;
}
.dot-icon :deep(svg) {
  width: 13px;
  height: 13px;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.step-line {
  position: absolute;
  top: 14px;
  left: calc(50% + 14px);
  width: calc(100% - 28px);
  height: 3px;
  background: var(--ge-border);
  z-index: 1;
}
.step-line.filled { background: var(--ge-brand); }
.step-label {
  margin-top: 6px;
  font-size: 10px;
  font-weight: 500;
  color: var(--ge-text-secondary);
  text-align: center;
  line-height: 1.2;
}
.current .step-label { color: var(--ge-status-active); font-weight: 600; }
.completed .step-label { color: var(--ge-brand); }
.step-time {
  font-size: 10px;
  color: var(--ge-text-muted);
  margin-top: 2px;
  font-weight: 600;
}
</style>
