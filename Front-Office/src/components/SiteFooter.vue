<template>
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <span class="footer-logo" aria-hidden="true">G</span>
        <span class="footer-name">GoEverywhere</span>
      </div>
      <p class="copyright">© 2026 GoEverywhere, Lda. Todos os direitos reservados.</p>
    </div>
  </footer>
</template>

<script setup>
</script>

<style scoped>
.site-footer {
  background: #0f172a;
  color: #fff;
  padding: 1.5rem 1.25rem;
  margin-top: auto;
}
.footer-inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}
.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-weight: 600;
  font-size: 1rem;
}
.footer-logo {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  background: #fff;
  color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
}
.footer-name {
  font-family: 'Inter', system-ui, sans-serif;
}
.copyright {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.55);
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
}

@media (max-width: 640px) {
  .footer-inner {
    flex-direction: column;
    text-align: center;
  }
}
</style>
