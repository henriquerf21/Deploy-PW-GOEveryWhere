<template>
  <Teleport to="body">
    <!-- Overlay backdrop -->
    <Transition name="fade">
      <div v-if="modelValue" class="filter-overlay" @click="$emit('update:modelValue', false)"></div>
    </Transition>

    <!-- Slide panel -->
    <Transition name="slide">
      <div v-if="modelValue" class="filter-panel">
        <!-- Header -->
        <div class="fp-header">
          <h2>Filtros do Turno</h2>
          <button class="fp-close" @click="$emit('update:modelValue', false)" aria-label="Fechar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Body -->
        <div class="fp-body">
          <!-- Tipo de entrega -->
          <div class="fp-section">
            <label class="fp-label">TIPO DE ENTREGA</label>
            <div class="fp-toggle-group">
              <button
                v-for="opt in typeOptions" :key="opt.value"
                class="fp-toggle" :class="{ active: filters.type === opt.value }"
                @click="setFilter('type', opt.value)"
              >{{ opt.label }}</button>
            </div>
          </div>

          <!-- Max pickup distance -->
          <div class="fp-section">
            <label class="fp-label">
              Distância máx. recolha
              <span class="fp-value">{{ filters.maxPickupDist }} km</span>
            </label>
            <input
              type="range" min="1" max="50" step="1"
              :value="filters.maxPickupDist"
              @input="setFilter('maxPickupDist', +$event.target.value)"
              class="fp-slider"
            >
            <div class="fp-slider-labels"><span>1 km</span><span>50 km</span></div>
          </div>

          <!-- Max delivery distance -->
          <div class="fp-section">
            <label class="fp-label">
              Distância máx. entrega
              <span class="fp-value">{{ filters.maxDeliveryDist }} km</span>
            </label>
            <input
              type="range" min="1" max="50" step="1"
              :value="filters.maxDeliveryDist"
              @input="setFilter('maxDeliveryDist', +$event.target.value)"
              class="fp-slider"
            >
            <div class="fp-slider-labels"><span>1 km</span><span>50 km</span></div>
          </div>

          <!-- Max time stepper -->
          <div class="fp-section">
            <label class="fp-label">Tempo máx. estimado</label>
            <div class="fp-stepper">
              <button class="fp-stepper-btn" @click="stepTime(-5)" :disabled="filters.maxTime <= 5">−</button>
              <span class="fp-stepper-val">{{ filters.maxTime }} min</span>
              <button class="fp-stepper-btn" @click="stepTime(5)" :disabled="filters.maxTime >= 180">+</button>
            </div>
          </div>

          <!-- Zone -->
          <div class="fp-section">
            <label class="fp-label">ZONA GEOGRÁFICA</label>
            <div class="fp-select-wrap">
              <select class="fp-select" :value="filters.zone" @change="setFilter('zone', $event.target.value)">
                <option value="all">Todas as zonas</option>
                <option v-for="z in zones" :key="z" :value="z">{{ z }}</option>
              </select>
              <svg class="fp-select-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="fp-footer">
          <button class="fp-apply" @click="$emit('update:modelValue', false)">
            Aplicar Filtros
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { store, updateFilters } from '../stores/courierStore.js';
import { ZONES } from '../constants.js';
import { computed } from 'vue';

defineProps({ modelValue: Boolean });
defineEmits(['update:modelValue']);

const filters = computed(() => store.filters);
const zones = ZONES;

const typeOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'STANDARD', label: 'Normal' },
  { value: 'EXPRESS', label: 'Urgente' },
];

function setFilter(key, val) {
  updateFilters({ [key]: val });
}

function stepTime(delta) {
  const next = Math.max(5, Math.min(180, store.filters.maxTime + delta));
  updateFilters({ maxTime: next });
}
</script>

<style scoped>
/* Overlay */
.filter-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 9998;
}

/* Panel */
.filter-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: min(360px, 88vw);
  height: 100dvh;
  background: #fff;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.15);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active {
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.slide-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 1, 1);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

/* Header */
.fp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 16px;
  border-bottom: 0.72px solid #e5e7eb;
  flex-shrink: 0;
}
.fp-header h2 {
  font-family: var(--ge-font-display);
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: #111827;
}
.fp-close {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: #f9fafb;
  border: 0.72px solid #e5e7eb;
  cursor: pointer;
  transition: background 0.15s;
}
.fp-close:hover { background: #f1f5f2; }

/* Body */
.fp-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Sections */
.fp-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.fp-label {
  font-family: var(--ge-font-display);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #6b7280;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.fp-value {
  font-size: 14px;
  font-weight: 700;
  color: #1b8a4a;
  text-transform: none;
}

/* Toggle buttons */
.fp-toggle-group {
  display: flex;
  gap: 8px;
}
.fp-toggle {
  flex: 1;
  padding: 10px;
  border-radius: 12px;
  font-family: var(--ge-font-display);
  font-size: 13px;
  font-weight: 600;
  background: #f9fafb;
  color: #6b7280;
  border: 1.5px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}
.fp-toggle.active {
  background: #f0fdf4;
  color: #1b8a4a;
  border-color: #1b8a4a;
}

/* Slider */
.fp-slider {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
}
.fp-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 22px; height: 22px;
  border-radius: 50%;
  background: #1b8a4a;
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(27, 138, 74, 0.3);
  cursor: pointer;
}
.fp-slider::-moz-range-thumb {
  width: 22px; height: 22px;
  border-radius: 50%;
  background: #1b8a4a;
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(27, 138, 74, 0.3);
  cursor: pointer;
}
.fp-slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #9ca3af;
}

/* Stepper */
.fp-stepper {
  display: flex;
  align-items: center;
  gap: 16px;
}
.fp-stepper-btn {
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 12px;
  background: #f9fafb;
  border: 0.72px solid #e5e7eb;
  font-size: 18px; font-weight: 700;
  color: #111827;
  cursor: pointer;
  transition: background 0.15s;
}
.fp-stepper-btn:hover { background: #f1f5f2; }
.fp-stepper-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.fp-stepper-val {
  font-family: var(--ge-font-display);
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  min-width: 80px;
  text-align: center;
}

/* Select */
.fp-select-wrap {
  position: relative;
}
.fp-select {
  width: 100%;
  padding: 14px 40px 14px 16px;
  background: #f9fafb;
  border: 0.72px solid #e5e7eb;
  border-radius: 16px;
  font-family: var(--ge-font);
  font-size: 14px;
  color: #111827;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
}
.fp-select:focus {
  border-color: #1b8a4a;
  box-shadow: 0 0 0 3px rgba(27, 138, 74, 0.1);
}
.fp-select-icon {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

/* Footer */
.fp-footer {
  padding: 16px 20px;
  border-top: 0.72px solid #e5e7eb;
  flex-shrink: 0;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
}
.fp-apply {
  width: 100%;
  padding: 16px;
  background: #1b8a4a;
  color: #fff;
  border: none;
  border-radius: 16px;
  font-family: var(--ge-font-display);
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(27, 138, 74, 0.25);
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}
.fp-apply:active { transform: scale(0.97); }
.fp-apply:hover { background: #157a42; }
</style>
