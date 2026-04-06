<template>
  <div class="panel-overlay" :class="{ open: modelValue }" @click="$emit('update:modelValue', false)"></div>
  <div class="panel-slide" :class="{ open: modelValue }">
    <div class="filter-header">
      <h2>Filtros do Turno</h2>
      <button class="close-btn" @click="$emit('update:modelValue', false)" aria-label="Fechar filtros">
        <span class="close-icon" v-html="SVG.xCircle"></span>
      </button>
    </div>

    <div class="filter-body">
      <!-- Tipo de entrega -->
      <div class="filter-section">
        <label class="filter-label">Tipo de Entrega</label>
        <div class="toggle-group">
          <button
            v-for="opt in typeOptions" :key="opt.value"
            class="toggle-btn" :class="{ active: filters.type === opt.value }"
            @click="setFilter('type', opt.value)"
          >{{ opt.label }}</button>
        </div>
      </div>

      <!-- Max pickup distance -->
      <div class="filter-section">
        <label class="filter-label">
          Distância máx. recolha
          <span class="filter-value">{{ filters.maxPickupDist }} km</span>
        </label>
        <input
          type="range" min="1" max="50" step="1"
          :value="filters.maxPickupDist"
          @input="setFilter('maxPickupDist', +$event.target.value)"
          class="slider"
        >
        <div class="slider-labels"><span>1 km</span><span>50 km</span></div>
      </div>

      <!-- Max delivery distance -->
      <div class="filter-section">
        <label class="filter-label">
          Distância máx. entrega
          <span class="filter-value">{{ filters.maxDeliveryDist }} km</span>
        </label>
        <input
          type="range" min="1" max="50" step="1"
          :value="filters.maxDeliveryDist"
          @input="setFilter('maxDeliveryDist', +$event.target.value)"
          class="slider"
        >
        <div class="slider-labels"><span>1 km</span><span>50 km</span></div>
      </div>

      <!-- Max time stepper -->
      <div class="filter-section">
        <label class="filter-label">Tempo máx. estimado</label>
        <div class="stepper">
          <button class="stepper-btn" @click="stepTime(-5)" :disabled="filters.maxTime <= 5">−</button>
          <span class="stepper-value">{{ filters.maxTime }} min</span>
          <button class="stepper-btn" @click="stepTime(5)" :disabled="filters.maxTime >= 180">+</button>
        </div>
      </div>

      <!-- Zone -->
      <div class="filter-section">
        <label class="filter-label">Zona geográfica</label>
        <select class="input-field" :value="filters.zone" @change="setFilter('zone', $event.target.value)">
          <option value="all">Todas as zonas</option>
          <option v-for="z in zones" :key="z" :value="z">{{ z }}</option>
        </select>
      </div>

      <!-- Apply -->
      <button class="btn btn-primary btn-block btn-lg apply-btn" @click="$emit('update:modelValue', false)">
        Aplicar Filtros
      </button>
    </div>
  </div>
</template>

<script setup>
import { store, updateFilters } from '../stores/courierStore.js';
import { ZONES, SVG } from '../constants.js';
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
.panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(2px);
  z-index: 200;
  opacity: 0;
  pointer-events: none;
  transition: opacity .25s;
}
.panel-overlay.open {
  opacity: 1;
  pointer-events: auto;
}
.panel-slide {
  position: fixed;
  top: 0;
  right: 0;
  width: min(340px, 85vw);
  height: 100dvh;
  background: var(--ge-surface);
  z-index: 201;
  transform: translateX(100%);
  transition: transform .3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-y: auto;
  box-shadow: -4px 0 24px rgba(0,0,0,0.1);
}
.panel-slide.open {
  transform: translateX(0);
}
.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid var(--ge-border);
}
.filter-header h2 {
  font-family: var(--ge-font-display);
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}
.close-btn {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--ge-radius-full);
  background: var(--ge-page);
  font-size: 16px; color: var(--ge-text-secondary);
}
.close-icon {
  display: inline-flex;
}
.close-icon :deep(svg) {
  width: 16px;
  height: 16px;
}
.filter-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.filter-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.filter-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ge-text-secondary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--ge-brand);
  text-transform: none;
}
.toggle-group {
  display: flex;
  gap: 8px;
}
.toggle-btn {
  flex: 1;
  padding: 10px;
  border-radius: var(--ge-radius);
  font-size: 13px;
  font-weight: 600;
  background: var(--ge-page);
  color: var(--ge-text-secondary);
  border: 1.5px solid var(--ge-border);
  transition: all .15s;
}
.toggle-btn.active {
  background: var(--ge-brand-soft);
  color: var(--ge-brand);
  border-color: var(--ge-brand);
}
.slider {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--ge-border);
  outline: none;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 22px; height: 22px;
  border-radius: 50%;
  background: var(--ge-brand);
  border: 3px solid #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  cursor: pointer;
}
.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--ge-text-muted);
}
.stepper {
  display: flex;
  align-items: center;
  gap: 16px;
}
.stepper-btn {
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--ge-radius);
  background: var(--ge-page);
  border: 1.5px solid var(--ge-border);
  font-size: 18px; font-weight: 700;
  color: var(--ge-text);
}
.stepper-btn:disabled { opacity: 0.3; }
.stepper-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--ge-text);
  min-width: 70px;
  text-align: center;
}
.apply-btn {
  margin-top: 8px;
}
</style>
