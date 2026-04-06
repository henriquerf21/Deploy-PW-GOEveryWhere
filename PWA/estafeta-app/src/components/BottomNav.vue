<template>
  <nav class="bottom-nav">
    <router-link v-for="item in items" :key="item.to" :to="item.to" class="nav-item" active-class="active">
      <span class="nav-icon" v-html="item.icon"></span>
      <span class="nav-label">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup>
const items = [
  {
    to: '/deliveries',
    label: 'Entregas',
    icon: '<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 00-8 0v2"/></svg>',
  },
  {
    to: '/metrics',
    label: 'Métricas',
    icon: '<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>',
  },
  {
    to: '/profile',
    label: 'Perfil',
    icon: '<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/></svg>',
  },
];
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: var(--ge-bottom-nav-h);
  padding-bottom: var(--ge-safe-bottom);
  background: var(--ge-surface);
  border-top: 1px solid var(--ge-border);
  z-index: 100;
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 16px;
  color: var(--ge-text-muted);
  transition: color .15s;
  text-decoration: none;
}
.nav-item.active {
  color: var(--ge-brand);
}
.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
}
.nav-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
</style>
