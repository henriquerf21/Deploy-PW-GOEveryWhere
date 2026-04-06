<template>
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-top">
        <div class="footer-brand">
          <span class="footer-logo" aria-hidden="true">G</span>
          <div>
            <span class="footer-name">GoEverywhere</span>
            <span class="footer-tagline">Entregas rápidas, simples e confiáveis</span>
          </div>
        </div>
        <nav class="footer-nav" aria-label="Links do rodapé">
          <router-link to="/product" class="footer-link">Produtos</router-link>
          <router-link to="/about" class="footer-link">Sobre Nós</router-link>
          <router-link to="/order/tracking" class="footer-link">Encomendas</router-link>
        </nav>
      </div>
      <div class="footer-bottom">
        <p class="copyright">© 2026 GoEverywhere, Lda. Todos os direitos reservados.</p>
        <div class="footer-socials" aria-label="Redes sociais">
          <a href="#" class="social-link" aria-label="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
          </a>
          <a href="#" class="social-link" aria-label="LinkedIn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
          </a>
          <a href="#" class="social-link" aria-label="Email">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
</script>

<style scoped>
.site-footer {
  background: var(--go-ink);
  color: #fff;
  padding: 2.5rem 1.25rem 1.5rem;
  margin-top: auto;
  border-top: 3px solid var(--go-primary);
}
.footer-inner {
  max-width: 1280px;
  margin: 0 auto;
}
.footer-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.footer-logo {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.625rem;
  background: var(--go-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.9375rem;
}
.footer-name {
  display: block;
  font-family: var(--go-font-display);
  font-weight: 600;
  font-size: 1.125rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.footer-tagline {
  display: block;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.45);
  margin-top: 2px;
}
.footer-nav {
  display: flex;
  gap: 1.5rem;
}
.footer-link {
  text-decoration: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  font-weight: 500;
  transition: color var(--go-duration-fast);
}
.footer-link:hover {
  color: var(--go-primary);
}
.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding-top: 1.25rem;
}
.copyright {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
  font-family: var(--go-font-body);
}
.footer-socials {
  display: flex;
  gap: 0.75rem;
}
.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
  transition: all var(--go-duration-fast);
}
.social-link:hover {
  background: var(--go-primary);
  color: #fff;
  transform: translateY(-2px);
}

@media (max-width: 640px) {
  .footer-top,
  .footer-bottom {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .footer-nav {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
