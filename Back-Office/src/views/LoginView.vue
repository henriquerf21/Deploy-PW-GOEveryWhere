<template>
  <div class="login-page">
    <div class="login-hero" aria-hidden="true">
      <div class="login-hero__glow login-hero__glow--1" />
      <div class="login-hero__glow login-hero__glow--2" />
      <div class="login-hero__inner">
        <div class="login-hero__brand">
          <div class="login-hero__mark">G</div>
          <div>
            <span class="login-hero__name">GoEverywhere</span>
            <span class="login-hero__badge">Admin</span>
          </div>
        </div>
        <p class="login-hero__version">GoEverywhere Platform v2.4</p>
        <div class="login-hero__pitch">
          <h2 class="login-hero__h2">Painel de Controlo</h2>
          <p class="login-hero__live">Em tempo real.</p>
          <p class="login-hero__desc">
            Painel de gestão completo para monitorizar entregas, estafetas e encomendas da plataforma.
          </p>
        </div>
        <div class="login-hero__chart-card">
          <div class="login-hero__chart-head">
            <span>Volume de entregas (últimas 12h)</span>
            <span class="login-hero__live-pill">LIVE</span>
          </div>
          <div class="login-hero__bars" role="presentation">
            <span v-for="(h, i) in barHeights" :key="i" class="login-hero__bar" :style="{ height: h + '%' }" />
          </div>
        </div>
      </div>
    </div>

    <div class="login-panel">
      <div class="login-panel__card">
        <div class="login-panel__icon-wrap" aria-hidden="true">
          <ShieldCheck :size="28" />
        </div>
        <h1 class="login-panel__title">Painel Admin</h1>
        <p class="login-panel__sub">Acesso restrito a administradores</p>

        <div v-if="googleClientId" ref="googleBtnRef" class="google-host" />
        <button v-else type="button" class="login-btn login-btn--google" @click="loginGoogleDemo">
          Entrar com Google (demo OAuth)
          <span class="login-btn__arrow" aria-hidden="true">→</span>
        </button>
        <p v-if="!googleClientId" class="login-google-hint">
          Para OAuth 2.0 real, define <code>VITE_GOOGLE_CLIENT_ID</code> no ficheiro <code>.env</code> (Google Identity Services).
        </p>

        <div class="login-divider">
          <span>ou com credenciais</span>
        </div>

        <form class="login-form" @submit.prevent="onSubmit">
          <label class="login-label">Email corporativo</label>
          <div class="login-input-wrap">
            <Mail :size="18" class="login-input-icon" />
            <input v-model="email" type="email" class="login-input" placeholder="admin@goeverywhere.pt" required />
          </div>
          <label class="login-label">Password</label>
          <div class="login-input-wrap">
            <input
              v-model="password"
              :type="showPw ? 'text' : 'password'"
              class="login-input login-input--pw"
              placeholder="A tua password"
              autocomplete="current-password"
            />
            <button type="button" class="login-pw-toggle" tabindex="-1" @click="showPw = !showPw">
              {{ showPw ? 'Ocultar' : 'Ver' }}
            </button>
          </div>
          <div class="login-row">
            <label class="login-check">
              <input v-model="remember" type="checkbox" />
              Manter sessão
            </label>
            <button type="button" class="login-link" @click="onRecoverAccess">Recuperar acesso</button>
          </div>
          <button type="submit" class="login-btn login-btn--primary">
            Aceder ao Painel
            <ArrowRight :size="18" />
          </button>
        </form>

        <p class="login-ssl">
          <Lock :size="14" />
          Conexão encriptada SSL/TLS — Acesso monitorizado
        </p>
      </div>
      <a :href="frontOfficeUrl" class="login-back-site">Voltar ao site GoGummies</a>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ShieldCheck, Mail, ArrowRight, Lock } from 'lucide-vue-next';
import { setBoSession } from '../auth/session.js';
import { loadGoogleScript, parseGoogleJwt } from '../utils/googleAuth.js';
import { toast } from '../utils/notify.js';

const router = useRouter();
const route = useRoute();

const email = ref('admin@goeverywhere.pt');
const password = ref('');
const remember = ref(true);
const showPw = ref(false);
const googleBtnRef = ref(null);
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const barHeights = [32, 48, 40, 62, 55, 70, 45, 58, 75, 68, 82, 60];

const frontOfficeUrl = import.meta.env.VITE_FRONT_OFFICE_URL || 'http://localhost:5173';

function goDash() {
  const redirect = route.query.redirect;
  router.push(typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/dashboard');
}

function loginGoogleDemo() {
  setBoSession({
    method: 'google',
    email: 'admin.demo@googleusercontent.com',
    name: 'Admin (Google demo)',
    picture: '',
  });
  toast('Sessão Google (demonstração sem cliente OAuth).', 'success');
  goDash();
}

function onRecoverAccess() {
  toast('Recuperação de password: em produção liga ao serviço de identidade. Contacta o administrador da plataforma.', 'success');
}

function onSubmit() {
  if (!password.value.trim()) {
    toast('Password obrigatória.', 'error');
    return;
  }
  const local = email.value.split('@')[0].replace(/[._]/g, ' ');
  setBoSession({
    method: 'email',
    email: email.value,
    name: local ? local.replace(/\b\w/g, (c) => c.toUpperCase()) : 'Administrador',
  });
  toast('Sessão com email/password.', 'success');
  goDash();
}

function handleGoogleCredential(response) {
  const p = parseGoogleJwt(response.credential);
  if (!p?.email) {
    toast('Resposta Google inválida.', 'error');
    return;
  }
  setBoSession({
    method: 'google',
    email: p.email,
    name: p.name || p.email,
    picture: p.picture || '',
  });
  toast('Sessão Google OAuth 2.0.', 'success');
  goDash();
}

onMounted(async () => {
  if (!googleClientId) return;
  try {
    await loadGoogleScript();
    await nextTick();
    if (!googleBtnRef.value || !window.google?.accounts?.id) return;
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredential,
    });
    window.google.accounts.id.renderButton(googleBtnRef.value, {
      theme: 'outline',
      size: 'large',
      width: 340,
      text: 'continue_with',
      locale: 'pt-PT',
    });
  } catch {
    toast('Não foi possível carregar o Google Sign-In.', 'error');
  }
});
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr minmax(360px, 480px);
  background: var(--bo-surface);
}

@media (max-width: 960px) {
  .login-page {
    grid-template-columns: 1fr;
  }
}

.login-hero {
  position: relative;
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 45%, #e8f5e9 100%);
  overflow: hidden;
  padding: clamp(32px, 5vw, 56px);
  display: flex;
  align-items: center;
}

.login-hero__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}

.login-hero__glow--1 {
  width: min(420px, 60vw);
  height: min(420px, 60vw);
  background: rgba(16, 185, 129, 0.22);
  right: -80px;
  bottom: -60px;
}

.login-hero__glow--2 {
  width: min(520px, 70vw);
  height: min(520px, 70vw);
  background: rgba(27, 138, 74, 0.12);
  top: -120px;
  left: -100px;
}

.login-hero__inner {
  position: relative;
  z-index: 1;
  max-width: 520px;
}

.login-hero__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.login-hero__mark {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--bo-brand);
  color: #fff;
  font-family: var(--bo-font-display);
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-hero__name {
  font-family: var(--bo-font-display);
  font-weight: 700;
  font-size: 18px;
  color: var(--bo-text);
}

.login-hero__badge {
  margin-left: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--bo-brand);
}

.login-hero__version {
  margin: 0 0 28px;
  font-size: 13px;
  color: var(--bo-text-secondary);
}

.login-hero__h2 {
  margin: 0 0 4px;
  font-family: var(--bo-font-display);
  font-size: 28px;
  font-weight: 700;
  color: var(--bo-text);
}

.login-hero__live {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--bo-brand);
}

.login-hero__desc {
  margin: 0 0 28px;
  font-size: 14px;
  line-height: 1.55;
  color: var(--bo-text-secondary);
}

.login-hero__chart-card {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(12px);
  border-radius: var(--bo-radius-lg);
  padding: 18px 20px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: var(--bo-shadow-md);
}

.login-hero__chart-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--bo-text-secondary);
  margin-bottom: 16px;
}

.login-hero__live-pill {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #059669;
  background: #d1fae5;
  padding: 4px 8px;
  border-radius: 6px;
}

.login-hero__bars {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 100px;
}

.login-hero__bar {
  flex: 1;
  min-height: 8px;
  background: linear-gradient(180deg, var(--bo-brand-mid), var(--bo-brand));
  border-radius: 4px 4px 2px 2px;
  opacity: 0.85;
}

.login-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(24px, 4vw, 48px);
  background: #fafbfc;
  border-left: 1px solid var(--bo-border);
}

.login-panel__card {
  max-width: 400px;
  margin: 0 auto;
  width: 100%;
}

.login-panel__icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: var(--bo-brand-soft);
  color: var(--bo-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.login-panel__title {
  margin: 0 0 6px;
  font-family: var(--bo-font-display);
  font-size: 24px;
  font-weight: 700;
}

.login-panel__sub {
  margin: 0 0 24px;
  font-size: 14px;
  color: var(--bo-text-secondary);
}

.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  min-height: 48px;
  border-radius: var(--bo-radius-sm);
  font-size: 14px;
  font-weight: 600;
  border: none;
  transition: background 0.15s, transform 0.1s;
}

.login-btn:active {
  transform: scale(0.99);
}

.login-btn--google {
  background: var(--bo-surface);
  border: 1px solid var(--bo-border);
  color: var(--bo-text);
}

.login-btn--google:hover {
  background: var(--bo-page);
}

.google-host {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-google-hint {
  margin: 10px 0 0;
  font-size: 11px;
  color: var(--bo-text-secondary);
  line-height: 1.45;
}

.login-google-hint code {
  font-size: 10px;
  background: var(--bo-page);
  padding: 2px 5px;
  border-radius: 4px;
}

.login-btn__arrow {
  font-size: 16px;
  opacity: 0.6;
}

.login-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 22px 0;
  font-size: 12px;
  color: var(--bo-text-secondary);
}

.login-divider::before,
.login-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--bo-border);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.login-label {
  font-size: 13px;
  font-weight: 500;
  margin-top: 10px;
}

.login-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--bo-border);
  border-radius: var(--bo-radius-sm);
  padding: 0 14px;
  background: var(--bo-surface);
}

.login-input-wrap:focus-within {
  border-color: var(--bo-brand-mid);
  box-shadow: 0 0 0 3px rgba(27, 138, 74, 0.12);
}

.login-input-icon {
  flex-shrink: 0;
  color: var(--bo-text-secondary);
}

.login-input {
  flex: 1;
  min-height: 46px;
  border: none;
  background: transparent;
  font-size: 14px;
}

.login-input:focus {
  outline: none;
}

.login-input--pw {
  padding-right: 8px;
}

.login-pw-toggle {
  border: none;
  background: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--bo-brand);
  padding: 8px 0;
}

.login-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 14px;
  margin-bottom: 8px;
}

.login-check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--bo-text-secondary);
}

.login-link {
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--bo-brand);
}

.login-btn--primary {
  margin-top: 8px;
  background: var(--bo-brand);
  color: #fff;
}

.login-btn--primary:hover {
  background: var(--bo-brand-hover);
}

.login-ssl {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 24px 0 0;
  font-size: 11px;
  color: var(--bo-text-secondary);
}

.login-back-site {
  display: block;
  text-align: center;
  margin-top: 28px;
  font-size: 13px;
  font-weight: 600;
  color: var(--bo-brand);
  text-decoration: none;
}

.login-back-site:hover {
  text-decoration: underline;
}
</style>
