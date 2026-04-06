<template>
  <div class="delivery-card card" @click="$emit('details', delivery.id)">
    <div class="card-top">
      <div class="card-title-row">
        <span class="order-id">{{ delivery.orderId }}</span>
        <span class="badge" :class="priorityClass">
          <span v-if="delivery.priority === 5" class="priority-icon" v-html="SVG.flame"></span>
          {{ priorityLabel }}
        </span>
      </div>
      <span class="type-badge" :class="{ express: delivery.type === 'EXPRESS' }">
        {{ delivery.type === 'EXPRESS' ? 'EXPRESSO' : 'STANDARD' }}
      </span>
    </div>

    <div class="card-body">
      <div class="location-row">
        <span class="loc-icon" v-html="SVG.store"></span>
        <div class="loc-info">
          <span class="loc-name">{{ delivery.pickup.name }}</span>
          <span class="loc-distance">{{ delivery.pickup.distance }} km</span>
        </div>
      </div>
      <div class="route-line"></div>
      <div class="location-row">
        <span class="loc-icon" v-html="SVG.mapPin"></span>
        <div class="loc-info">
          <span class="loc-name">{{ delivery.destination.name }}</span>
          <span class="loc-distance">{{ delivery.destination.distance }} km</span>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <div class="footer-info">
        <span class="eta"><span class="eta-icon" v-html="SVG.clock"></span> {{ delivery.etaMinutes }} min</span>
        <span class="cost">€{{ delivery.costEuro?.toFixed(2) }}</span>
      </div>
      <div class="footer-actions">
        <button class="btn btn-secondary btn-sm" @click.stop="$emit('details', delivery.id)">Detalhes</button>
        <button class="btn btn-primary btn-sm" @click.stop="$emit('accept', delivery.id)">Aceitar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { PRIORITY_LABELS, PRIORITY_BADGE_CLASS, SVG } from '../constants.js';

const props = defineProps({
  delivery: { type: Object, required: true },
});

defineEmits(['accept', 'details']);

const priorityLabel = computed(() => PRIORITY_LABELS[props.delivery.priority] || 'Normal');
const priorityClass = computed(() => PRIORITY_BADGE_CLASS[props.delivery.priority] || 'badge-normal');
</script>

<style scoped>
.delivery-card {
  padding: 14px;
  cursor: pointer;
  transition: transform .1s, box-shadow .15s;
}
.delivery-card:active {
  transform: scale(0.98);
}
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.order-id {
  font-family: var(--ge-font-display);
  font-weight: 700;
  font-size: 15px;
  color: var(--ge-text);
}
.priority-icon {
  display: inline-flex;
  align-items: center;
}
.priority-icon :deep(svg) {
  width: 12px; height: 12px;
}
.type-badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 3px 8px;
  border-radius: var(--ge-radius-full);
  background: var(--ge-border-light);
  color: var(--ge-text-secondary);
}
.type-badge.express {
  background: var(--ge-priority-5-bg);
  color: var(--ge-priority-5);
}
.card-body {
  padding: 0 0 12px;
}
.location-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.loc-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  color: var(--ge-text-secondary);
}
.loc-icon :deep(svg) {
  width: 16px; height: 16px;
}
.loc-info {
  display: flex;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
}
.loc-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--ge-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.loc-distance {
  font-size: 12px;
  color: var(--ge-text-muted);
  flex-shrink: 0;
  margin-left: 8px;
}
.route-line {
  width: 2px;
  height: 14px;
  background: var(--ge-border);
  margin: 2px 0 2px 13px;
  border-radius: 1px;
}
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--ge-border-light);
}
.footer-info {
  display: flex;
  gap: 12px;
}
.eta, .cost {
  font-size: 13px;
  font-weight: 600;
}
.eta {
  color: var(--ge-text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.eta-icon {
  display: inline-flex;
  color: var(--ge-text-muted);
}
.eta-icon :deep(svg) {
  width: 14px; height: 14px;
}
.cost { color: var(--ge-brand); }
.footer-actions {
  display: flex;
  gap: 8px;
}
.btn-sm {
  padding: 8px 14px;
  font-size: 12px;
  border-radius: var(--ge-radius-sm);
}
</style>
