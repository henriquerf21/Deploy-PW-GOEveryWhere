<template>
  <div class="stepper">
    <div v-for="(step, i) in steps" :key="step.state" class="step" :class="stepClass(step.state)">
      <!-- Connector line (before dot, between steps) -->
      <div v-if="i > 0" class="step-line" :class="{ filled: isCompleted(step.state) || isCurrent(step.state) }"></div>
      <!-- Dot -->
      <div class="step-dot" :class="dotColorClass(step.state)">
        <!-- Completed: green check -->
        <svg v-if="isCompleted(step.state)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
        <!-- Current: state-specific icon -->
        <template v-else-if="isCurrent(step.state)">
          <svg v-if="step.state === 'E-09'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
          <svg v-else-if="step.state === 'E-10'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <svg v-else-if="step.state === 'E-11'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          <svg v-else-if="step.state === 'E-12'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
        </template>
        <!-- Pending: clock icon -->
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      </div>
      <!-- Label -->
      <span class="step-label">{{ step.label }}</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  currentState: { type: String, required: true },
  timestamps: { type: Object, default: () => ({}) },
});

const stateOrder = ['E-09', 'E-10', 'E-11', 'E-12', 'E-13'];
const stateIndex = (s) => stateOrder.indexOf(s);

const steps = stateOrder.map(s => ({
  state: s,
  label: {
    'E-09': 'Aceite',
    'E-10': 'Em recolha',
    'E-11': 'Em trânsito',
    'E-12': 'Chegou ao destino',
    'E-13': 'Entregue',
  }[s],
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
function dotColorClass(state) {
  if (isCompleted(state)) return 'dot-green';
  if (!isCurrent(state)) return 'dot-gray';
  // Current state colors per Figma
  if (state === 'E-09') return 'dot-green';
  if (state === 'E-10') return 'dot-orange';
  if (state === 'E-11') return 'dot-blue';
  if (state === 'E-12') return 'dot-orange';
  return 'dot-green';
}
</script>

<style scoped>
.stepper {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
}
.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  min-width: 52px;
}

/* Dot */
.step-dot {
  width: 32px; height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  flex-shrink: 0;
}
.dot-green { background: #22c55e; }
.dot-orange { background: #f59e0b; }
.dot-blue { background: #3b82f6; }
.dot-gray { background: #e5e7eb; }

/* Connector line */
.step-line {
  position: absolute;
  top: 16px;
  right: calc(50% + 16px);
  width: calc(100% - 32px);
  height: 3px;
  background: #e5e7eb;
  z-index: 1;
  border-radius: 2px;
}
.step-line.filled {
  background: linear-gradient(90deg, #22c55e, #f59e0b);
}
.completed .step-line.filled { background: #22c55e; }

/* Labels */
.step-label {
  margin-top: 6px;
  font-family: var(--ge-font);
  font-size: 9px;
  font-weight: 500;
  color: #9ca3af;
  text-align: center;
  line-height: 1.2;
}
.completed .step-label { color: #22c55e; }
.current .step-label {
  font-weight: 600;
  color: #111827;
}
</style>
