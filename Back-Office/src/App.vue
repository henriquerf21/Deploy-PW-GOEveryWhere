<template>
  <router-view />
  <BoToasts />
</template>

<script setup>
import BoToasts from './components/BoToasts.vue';
</script>

<style>
html,
body,
#app {
  margin: 0;
  min-height: 100%;
  height: 100%;
}
</style>
