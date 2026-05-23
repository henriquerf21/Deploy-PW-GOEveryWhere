<template>
  <div class="nav-maneuver-icon" :class="`nav-maneuver-icon--${iconKey}`" aria-hidden="true">
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        v-if="iconKey === 'turn-left'"
        d="M28 8v14h10l-14 18-14-18h10V8h8z"
        fill="currentColor"
      />
      <path
        v-else-if="iconKey === 'turn-right'"
        d="M20 8v14H10L24 40 38 22H28V8h-8z"
        fill="currentColor"
      />
      <path
        v-else-if="iconKey === 'slight-left'"
        d="M30 10v12h8L22 38l-12-16h8V10h12z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        v-else-if="iconKey === 'slight-right'"
        d="M18 10v12H10l14 28 12-16h-8V10H18z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        v-else-if="iconKey === 'uturn'"
        d="M24 8c-6 0-11 5-11 11v6h6v-6c0-2.8 2.2-5 5-5s5 2.2 5 5v14h6V19c0-6-5-11-11-11z"
        fill="currentColor"
      />
      <path
        v-else-if="iconKey === 'roundabout'"
        d="M24 10a14 14 0 100 28 14 14 0 000-28zm0 6a8 8 0 110 16 8 8 0 010-16zm-2 4v8h4l6-6-6-6h-4z"
        fill="currentColor"
      />
      <path
        v-else-if="iconKey === 'arrive'"
        d="M24 10l-8 8h5v14h6V18h5l-8-8z"
        fill="currentColor"
      />
      <path
        v-else-if="iconKey === 'depart'"
        d="M24 38l8-8h-5V16h-6v14h-5l8 8z"
        fill="currentColor"
      />
      <path
        v-else
        d="M24 8l-7 9h5v23h4V17h5l-7-9z"
        fill="currentColor"
      />
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getManeuverKey } from '../utils/navManeuver.js';

const props = defineProps({
  maneuver: { type: Object, default: null },
});

const iconKey = computed(() => getManeuverKey(props.maneuver));
</script>

<style scoped>
.nav-maneuver-icon {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-maneuver-icon svg {
  width: 48px;
  height: 48px;
}
</style>
