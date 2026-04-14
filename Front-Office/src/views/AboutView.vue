<template>
  <div class="about-page">
    <SiteHeader />

    <main>
      <!-- ═══════ FIRST CINEMATIC — Motorcycle ═══════ -->
      <section class="scroll-spacer" ref="storyRef"></section>

      <Transition name="scene-fade">
        <div v-show="sceneVisible" class="fixed-scene">
          <div class="frame-stage">
            <img class="sequence-frame" :src="currentFrameSrc" alt="GoEverywhere cinematic sequence" />
            <div class="frame-overlay" :class="sceneClass"></div>
          </div>

          <div class="scene-content">
            <div class="scene-head">
              <div class="scene-title">
                <span>Sobre Nós</span>
                <h1>GoEverywhere em movimento contínuo</h1>
                <p>Da recolha à entrega, transformamos cada etapa da última milha numa operação inteligente, rápida e previsível.</p>
              </div>
              <div class="story-progress">
                <small>{{ progressPct }}%</small>
                <div class="progress-track"><div class="progress-fill" :style="{ width: progressPct + '%' }"></div></div>
              </div>
            </div>

            <div class="kpi-strip">
              <article>
                <strong>{{ animatedKpis.deliveries }}</strong>
                <span>Entregas Concluídas</span>
              </article>
              <article>
                <strong>{{ animatedKpis.eta }} min</strong>
                <span>ETA Médio</span>
              </article>
              <article>
                <strong>{{ animatedKpis.rating }}</strong>
                <span>Satisfação Cliente</span>
              </article>
            </div>

            <div class="info-panels">
              <article v-for="(slide, index) in slides" :key="slide.title" class="info-card" :class="{ active: activeSlide === index }">
                <small>{{ slide.tag }}</small>
                <h3>{{ slide.title }}</h3>
                <p>{{ slide.text }}</p>
              </article>
            </div>
          </div>
        </div>
      </Transition>

      <div class="post-animation">

      <!-- Company Data -->
      <section class="company-data">
        <div class="data-inner">
          <div class="data-head">
            <h2>Uma operação preparada para escalar</h2>
            <p>Mantemos a mesma qualidade em cada entrega com dados em tempo real, roteamento inteligente e equipa local focada em experiência premium.</p>
          </div>
          <div class="data-grid">
            <article v-for="item in highlights" :key="item.label">
              <strong>{{ item.value }}</strong>
              <span>{{ item.label }}</span>
            </article>
          </div>
        </div>
      </section>

      <!-- ═══════ CAROUSEL — Scroll-driven (fixed overlay) ═══════ -->
      <section class="carousel-spacer" ref="carouselTrackRef"></section>

      <Transition name="scene-fade">
        <div v-show="carouselVisible" class="carousel-fixed">
          <div class="carousel-wrap">
            <div class="carousel-left">
              <div class="carousel-slides">
                <TransitionGroup name="slide-fade">
                  <div v-for="(sl, idx) in svcSlides" :key="sl.num" v-show="carouselIdx === idx" class="carousel-slide">
                    <span class="carousel-num">{{ sl.num }}</span>
                    <h2>{{ sl.title }}</h2>
                    <p>{{ sl.text }}</p>
                    <ul v-if="sl.items" class="carousel-items">
                      <li v-for="it in sl.items" :key="it.label"><i :class="'bi bi-' + it.icon"></i> {{ it.label }}</li>
                    </ul>
                  </div>
                </TransitionGroup>
              </div>
              <div class="carousel-nav">
                <button v-for="(sl, idx) in svcSlides" :key="idx" class="carousel-tab" :class="{ active: carouselIdx === idx, past: idx < carouselIdx }" @click="scrollToSlide(idx)">
                  <span class="carousel-tab-label">{{ sl.title }}</span>
                  <div class="carousel-tab-bar">
                    <div class="carousel-tab-fill" :style="tabFillStyle(idx)"></div>
                  </div>
                </button>
              </div>
            </div>
            <div class="carousel-right">
              <video ref="carouselVideoRef" class="carousel-video" :src="MEDIA.servicesCarouselVideo" muted playsinline preload="auto"></video>
            </div>
          </div>
        </div>
      </Transition>

      <!-- ═══════ NORMAL FLOW — FAQ onwards ═══════ -->

      <!-- FAQ -->
      <section class="faq-section">
        <div class="faq-inner">
          <div class="section-header" v-observe-visibility>
            <h2>Perguntas Frequentes</h2>
          </div>
          <div class="faq-list">
            <div v-for="(faq, i) in faqs" :key="i" class="faq-item" :class="{ open: faqOpen === i }" v-observe-visibility>
              <button class="faq-question" @click="faqOpen = faqOpen === i ? -1 : i">
                <span>{{ faq.q }}</span>
                <svg :class="{ rotated: faqOpen === i }" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <Transition name="accordion">
                <div v-if="faqOpen === i" class="faq-answer"><p>{{ faq.a }}</p></div>
              </Transition>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="cta-section" v-observe-visibility>
        <div class="cta-inner">
          <h2>Pronto para experimentar?</h2>
          <router-link to="/product" class="btn-cta btn-cta-lg">Encomendar Agora</router-link>
        </div>
      </section>

      <!-- Sobre Nos / Equipa -->
      <section class="about-team-section">
        <div class="about-team-inner">
          <span class="team-badge">Sobre Nós</span>
          <div class="team-desc" v-observe-visibility>
            <div class="team-desc-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            </div>
            <p>A <strong>GoEverywhere</strong> é uma startup portuguesa de logística urbana fundada em 2024. A nossa missão é tornar as entregas de última milha mais rápidas, acessíveis e sustentáveis. Começámos com um único produto — as GoGummies — gomas funcionais e proteicas disponíveis na rede Continente, entregues diretamente à porta do cliente.</p>
          </div>
          <div class="team-photo-wrap" v-observe-visibility>
            <img src="https://codia-f2c.s3.us-west-1.amazonaws.com/image/2026-03-27/JruT2DOMrE.png" alt="Equipa GoEverywhere" class="team-photo" />
            <span class="team-caption">A equipa GoEverywhere — Braga, 2026</span>
          </div>
          <div class="team-cta" v-observe-visibility>
            <router-link to="/product" class="btn-cta btn-cta-lg">
              Encomendar Agora
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </router-link>
          </div>
        </div>
      </section>

      <!-- Contact -->
      <section class="contact-section">
        <div class="contact-inner">
          <div class="contact-info" v-observe-visibility>
            <h2>Fala Connosco</h2>
            <p>Estamos aqui para ajudar com qualquer questão ou feedback.</p>
            <div class="contact-items">
              <div class="contact-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <span>info@goeverywhere.pt</span>
              </div>
              <div class="contact-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.11 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <span>+351 21 000 00 00</span>
              </div>
              <div class="contact-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>Rua Central, Braga, Portugal</span>
              </div>
            </div>
          </div>
          <form class="contact-form" @submit.prevent v-observe-visibility>
            <input type="text" placeholder="Nome" />
            <input type="email" placeholder="Email" />
            <textarea placeholder="A sua mensagem" rows="4"></textarea>
            <button type="submit" class="btn-cta">Enviar Mensagem</button>
          </form>
        </div>
      </section>

      <SiteFooter />

      </div><!-- .post-animation -->
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import { MEDIA } from '../config/media.js';

const aboutVideoMaskCss = `url('${MEDIA.aboutVideoMask}')`;

/* ── First cinematic refs ── */
const storyRef = ref(null);
const scrollProgress = ref(0);
const sceneVisible = ref(true);

/* ── Carousel refs ── */
const carouselTrackRef = ref(null);
const carouselIdx = ref(0);
const carouselProgress = ref(0);
const carouselVisible = ref(false);
const carouselVideoRef = ref(null);

const faqOpen = ref(-1);

/* ── First cinematic data ── */
const totalFrames = 82;

const slides = [
  { tag: 'Pedido', title: 'Submissão do pedido', text: 'O cliente escolhe o serviço, define recolha e destino, data, horário e descrição. O pedido é validado automaticamente em segundos.' },
  { tag: 'Atribuição', title: 'Atribuição inteligente', text: 'O sistema identifica o ponto de recolha mais próximo e atribui um estafeta disponível na zona, com base em localização e disponibilidade.' },
  { tag: 'Recolha', title: 'Recolha no terreno', text: 'O estafeta recebe a notificação na aplicação PWA, aceita a entrega e desloca-se ao local de recolha para levantar a encomenda.' },
  { tag: 'Trânsito', title: 'Tracking em tempo real', text: 'Durante o percurso, o cliente acompanha a entrega ao vivo com atualizações de estado: em recolha, em trânsito e ETA estimado.' },
  { tag: 'Entrega', title: 'Confirmação da entrega', text: 'O estafeta conclui a entrega com fotografia ou assinatura digital, registo de localização e confirmação no sistema.' },
  { tag: 'Escala', title: 'Preparados para escalar', text: 'Modelo replicável para novas zonas urbanas sem perder qualidade. Dashboards com indicadores por área, volume e estafetas disponíveis.' },
];

const highlights = [
  { value: '12.4k+', label: 'Entregas concluídas' },
  { value: '30 min', label: 'Tempo médio de entrega' },
  { value: '4.9/5', label: 'Satisfação dos clientes' },
  { value: '50+', label: 'Estafetas ativos' },
];

/* ── Second cinematic data ── */

const svcSlides = [
  {
    num: '01', title: 'Quem Somos',
    text: 'A GoEverywhere é uma startup portuguesa de logística urbana, fundada em 2024. A nossa missão é tornar as entregas de última milha mais rápidas, acessíveis e sustentáveis — com tecnologia e toque humano.',
    items: [
      { icon: 'lightning-charge', label: 'Rapidez' },
      { icon: 'shield-check', label: 'Confiança' },
      { icon: 'heart', label: 'Cuidado' },
      { icon: 'people', label: 'Comunidade' },
    ],
  },
  {
    num: '02', title: 'Áreas de Negócio',
    text: 'Operamos em três frentes: entregas ao consumidor final (GoGummies via Continente), entregas urgentes com taxa fixa de +2.99€, e logística B2B com operações de back-office em tempo real para parceiros empresariais.',
    items: [
      { icon: 'cart3', label: 'GoGummies — Entregas Continente' },
      { icon: 'lightning-charge', label: 'Entrega Urgente — 15 min' },
      { icon: 'building', label: 'Logística B2B — Visibilidade total' },
    ],
  },
  {
    num: '03', title: 'Serviços Disponíveis',
    text: 'Os clientes submetem pedidos com tipo de serviço, local de recolha e destino, data, horário e descrição. Acompanham o estado da entrega em tempo real — do aceite à conclusão.',
    items: [
      { icon: 'box-seam', label: 'Submissão de pedidos' },
      { icon: 'geo-alt', label: 'Tracking em tempo real' },
      { icon: 'camera', label: 'Confirmação com foto/assinatura' },
    ],
  },
  {
    num: '04', title: 'Zonas de Cobertura',
    text: 'Estamos ativos nas principais zonas urbanas do Norte de Portugal, com planos de expansão para todo o território nacional.',
    items: [
      { icon: 'pin-map', label: 'Porto — Cedofeita, Bonfim, Foz, Paranhos' },
      { icon: 'pin-map-fill', label: 'Braga — Centro Histórico, Lamaçães, Gualtar, São Vicente' },
    ],
  },
];

const faqs = [
  { q: 'Como funciona a operação?', a: 'Após fazeres a tua encomenda, o nosso sistema atribui automaticamente o Continente mais perto e um estafeta disponível na tua zona. Recebes atualizações em tempo real até a entrega ser concluída.' },
  { q: 'Quais são os horários de entrega?', a: 'As entregas estão disponíveis de segunda a sábado, das 9h às 21h. Domingos e feriados das 10h às 18h.' },
  { q: 'Como me posso tornar estafeta?', a: 'Envia o teu CV e carta de motivação para estafetas@goeverywhere.pt. Procuramos pessoas com veículo próprio (bicicleta elétrica ou scooter) e disponibilidade flexível.' },
  { q: 'Posso agendar uma entrega?', a: 'De momento as entregas são imediatas. Estamos a trabalhar no agendamento de entregas para uma próxima atualização.' },
];

/* ── First cinematic computed ── */
const progressPct = computed(() => Math.round(scrollProgress.value * 100));
const currentFrame = computed(() => Math.min(totalFrames - 1, Math.max(0, Math.round(scrollProgress.value * (totalFrames - 1)))));
const currentFrameSrc = computed(() => MEDIA.aboutScrollFrame(currentFrame.value));
const activeSlide = computed(() => Math.min(slides.length - 1, Math.max(0, Math.floor(scrollProgress.value * slides.length))));
const sceneClass = computed(() => { const p = scrollProgress.value; if (p < 0.34) return 'scene-gate'; if (p < 0.68) return 'scene-city'; return 'scene-night'; });
const animatedKpis = computed(() => ({
  deliveries: `${Math.round(8900 + scrollProgress.value * 3600).toLocaleString('pt-PT')}+`,
  eta: Math.max(18, Math.round(34 - scrollProgress.value * 11)),
  rating: (4.62 + scrollProgress.value * 0.33).toFixed(2),
}));

/* ── Carousel scroll logic ── */
const videoDuration = 8.04;
const segmentLen = videoDuration / svcSlides.length;
let activeSegment = -1;
let segmentRaf = null;

function tabFillStyle(idx) {
  if (idx < carouselIdx.value) return { width: '100%' };
  if (idx > carouselIdx.value) return { width: '0%' };
  const perSlide = 1 / svcSlides.length;
  const slideStart = idx * perSlide;
  const intra = Math.min(1, Math.max(0, (carouselProgress.value - slideStart) / perSlide));
  return { width: (intra * 100) + '%' };
}

function startSegment(idx) {
  if (idx === activeSegment) return;
  activeSegment = idx;
  const vid = carouselVideoRef.value;
  if (!vid) return;
  if (segmentRaf) cancelAnimationFrame(segmentRaf);
  const start = idx * segmentLen;
  const end = start + segmentLen;
  vid.currentTime = start;
  vid.playbackRate = 0.55;
  vid.play().catch(() => {});
  function loop() {
    if (vid.currentTime >= end - 0.08) vid.currentTime = start;
    segmentRaf = requestAnimationFrame(loop);
  }
  segmentRaf = requestAnimationFrame(loop);
}

function stopSegment() {
  const vid = carouselVideoRef.value;
  if (vid) vid.pause();
  if (segmentRaf) { cancelAnimationFrame(segmentRaf); segmentRaf = null; }
  activeSegment = -1;
}

function scrollToSlide(idx) {
  const track = carouselTrackRef.value;
  if (!track) return;
  const rect = track.getBoundingClientRect();
  const trackH = rect.height - window.innerHeight;
  const targetScroll = window.scrollY + rect.top + (idx / svcSlides.length) * trackH;
  window.scrollTo({ top: targetScroll, behavior: 'smooth' });
}

function updateCarousel() {
  const track = carouselTrackRef.value;
  if (!track) return;
  const rect = track.getBoundingClientRect();
  const vpH = window.innerHeight;
  const inView = rect.top < vpH && rect.bottom > 0;
  carouselVisible.value = inView;
  if (!inView) {
    carouselProgress.value = rect.bottom <= 0 ? 1 : 0;
    stopSegment();
    return;
  }
  const scrollable = rect.height - vpH;
  if (scrollable <= 0) return;
  const p = Math.min(1, Math.max(0, -rect.top / scrollable));
  carouselProgress.value = p;
  carouselIdx.value = Math.min(svcSlides.length - 1, Math.floor(p * svcSlides.length));
  startSegment(carouselIdx.value);
}

/* ── Scroll handler ── */
function onScroll() {
  updateScene1();
  updateCarousel();
}

function updateScene1() {
  if (!storyRef.value) return;
  const rect = storyRef.value.getBoundingClientRect();
  const vpH = window.innerHeight;
  const inView = rect.top < vpH && rect.bottom > 0;
  sceneVisible.value = inView;
  if (!inView) { scrollProgress.value = rect.bottom <= 0 ? 1 : 0; return; }
  const track = rect.height - vpH;
  if (track <= 0) { scrollProgress.value = 0; return; }
  scrollProgress.value = Math.min(1, Math.max(0, -rect.top / track));
}

function preloadAllFrames() {
  for (let i = 0; i < totalFrames; i++) {
    new Image().src = MEDIA.aboutScrollFrame(i);
  }
}

const vObserveVisibility = {
  mounted(el) {
    el.classList.add('reveal');
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('revealed'); observer.unobserve(e.target); } }); },
      { threshold: 0.15 }
    );
    observer.observe(el);
    el._observer = observer;
  },
  unmounted(el) { if (el._observer) el._observer.disconnect(); },
};

onMounted(() => {
  preloadAllFrames();
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', onScroll);
  stopSegment();
});
</script>

<style scoped>
* { box-sizing: border-box; }

.about-page {
  font-family: 'Poppins', sans-serif;
  background: #f3f6f4;
  color: #101828;
  /* Altura do SiteHeader (logo + padding) — evita texto por baixo do sticky header */
  --about-header-clearance: calc(5.75rem + env(safe-area-inset-top, 0px));
}

/* Scroll reveal */
.reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
.revealed { opacity: 1; transform: translateY(0); }

/* ══════════════════════════════════════════
   FIRST CINEMATIC — Motorcycle
   ══════════════════════════════════════════ */
.scroll-spacer { height: 400vh; position: relative; }
.fixed-scene { position: fixed; inset: 0; z-index: 10; overflow: hidden; }
.scene-fade-enter-active, .scene-fade-leave-active { transition: opacity 0.25s ease; }
.scene-fade-enter-from, .scene-fade-leave-to { opacity: 0; }
.frame-stage { position: absolute; inset: 0; background: #12161e; }
.sequence-frame { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; object-position: center center; transform: scale(1.02); filter: saturate(0.95) contrast(1.05); }
.frame-overlay { position: absolute; inset: 0; transition: all 0.35s ease; }
.frame-overlay.scene-gate { background: linear-gradient(180deg, rgba(22,30,23,0.2) 0%, rgba(17,24,39,0.15) 60%, rgba(17,24,39,0.48) 100%); }
.frame-overlay.scene-city { background: linear-gradient(180deg, rgba(7,16,12,0.24) 0%, rgba(17,24,39,0.22) 55%, rgba(17,24,39,0.56) 100%); }
.frame-overlay.scene-night { background: linear-gradient(180deg, rgba(3,8,20,0.44) 0%, rgba(8,13,28,0.38) 52%, rgba(8,13,28,0.74) 100%); }
.scene-content {
  position: relative;
  max-width: 1280px;
  margin: 0 auto;
  height: 100%;
  padding: calc(7vh + var(--about-header-clearance)) 32px 4vh;
  display: flex;
  flex-direction: column;
}
.scene-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 22px; }
.scene-title span { display: inline-block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #86efac; font-weight: 700; margin-bottom: 10px; }
.scene-title h1 { margin: 0; max-width: 760px; font-size: clamp(32px,5vw,64px); line-height: 1.04; letter-spacing: -0.02em; color: #f9fafb; }
.scene-title p { margin: 16px 0 0; max-width: 640px; color: #d1d5db; font-size: clamp(14px,1.2vw,16px); line-height: 1.6; }
.story-progress { min-width: 240px; max-width: 320px; width: 100%; padding-top: 8px; }
.story-progress small { display: block; margin-bottom: 9px; color: #d1d5db; font-size: 12px; font-weight: 600; }
.progress-track { width: 100%; height: 8px; background: rgba(255,255,255,0.22); border-radius: 999px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg,#00c853 0%,#34d399 100%); border-radius: inherit; transition: width 0.1s linear; }
.kpi-strip { margin-top: auto; display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 12px; padding-bottom: 8px; }
.kpi-strip article { background: rgba(255,255,255,0.9); border: 1px solid rgba(255,255,255,0.36); border-radius: 14px; padding: 12px 14px; backdrop-filter: blur(6px); min-height: 72px; }
.kpi-strip strong { display: block; color: #0f8f4f; font-size: clamp(20px,2.2vw,24px); line-height: 1.15; }
.kpi-strip span { display: block; margin-top: 3px; color: #4f5d58; font-size: 12px; font-weight: 600; }
.info-panels {
  position: absolute;
  right: 32px;
  top: clamp(calc(200px + var(--about-header-clearance)), calc(28vh + var(--about-header-clearance)), calc(360px + 2rem));
  width: min(36vw, 420px);
  min-height: 230px;
}
.info-card { position: absolute; inset: 0; border-radius: 20px; background: rgba(16,24,40,0.78); color: #fff; padding: 26px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.15); opacity: 0; transform: translateY(24px) scale(0.98); transition: all 0.35s ease; }
.info-card.active { opacity: 1; transform: translateY(0) scale(1); }
.info-card small { color: #87f2b6; text-transform: uppercase; letter-spacing: 0.11em; font-weight: 700; font-size: 11px; }
.info-card h3 { margin: 10px 0 10px; font-size: clamp(20px,2.1vw,24px); line-height: 1.2; }
.info-card p { margin: 0; color: #d0d6e0; line-height: 1.6; }

/* ══════════════════════════════════════════
   POST-ANIMATION WRAPPER
   ══════════════════════════════════════════ */
.post-animation { position: relative; z-index: 11; background: #f8faf9; }

/* ── Company Data ── */
.company-data { padding: 64px 32px 80px; background: #f8faf9; }
.data-inner { max-width: 1100px; margin: 0 auto; }
.data-head h2 { margin: 0 0 12px; font-size: clamp(28px,3.2vw,44px); letter-spacing: -0.02em; }
.data-head p { margin: 0; color: #5a6472; max-width: 760px; line-height: 1.7; }
.data-grid { margin-top: 36px; display: grid; gap: 18px; grid-template-columns: repeat(4,minmax(0,1fr)); }
.data-grid article { background: #fff; border: 1px solid #e4e9e6; border-radius: 16px; padding: 22px 18px; }
.data-grid strong { display: block; font-size: 34px; color: #0f8f4f; line-height: 1.1; }
.data-grid span { display: block; margin-top: 6px; color: #5a6472; font-size: 14px; }

/* ══════════════════════════════════════════
   CAROUSEL — Scroll-driven (fixed)
   ══════════════════════════════════════════ */
.carousel-spacer {
  height: 250vh;
  position: relative;
}

.carousel-fixed {
  position: fixed;
  inset: 0;
  z-index: 12;
  display: grid;
  grid-template-columns: 50% 50%;
  background: #f8faf9;
}

.carousel-wrap {
  display: contents;
}

.carousel-left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 32px;
  padding: var(--about-header-clearance) clamp(32px, 5vw, 80px) 0;
  max-width: 620px;
}

.carousel-slides {
  position: relative;
  min-height: 280px;
}

.carousel-slide {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.slide-fade-enter-active {
  transition: opacity 0.45s ease, transform 0.45s ease;
}
.slide-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

.carousel-num {
  display: inline-block;
  font-family: 'Geist Mono', 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
  font-weight: 600;
  color: #c2c2c2;
  margin-bottom: 16px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.carousel-slide h2 {
  margin: 0 0 18px;
  font-size: clamp(26px, 2.8vw, 38px);
  font-weight: 400;
  line-height: 1.15;
  letter-spacing: -0.025em;
  color: #052424;
}

.carousel-slide p {
  margin: 0;
  font-size: clamp(15px, 1.15vw, 17.5px);
  color: #052424;
  font-weight: 500;
  line-height: 1.65;
  letter-spacing: -0.01em;
}

.carousel-items {
  list-style: none;
  padding: 0;
  margin: 18px 0 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.carousel-items li {
  font-size: 14.5px;
  color: #4b5563;
  font-weight: 500;
  padding: 10px 16px;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e8ecf0;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: border-color 0.25s, box-shadow 0.25s;
}

.carousel-items li:hover {
  border-color: #00c853;
  box-shadow: 0 2px 8px rgba(0,200,83,0.08);
}

.carousel-items li i {
  font-size: 16px;
  color: #00c853;
  flex-shrink: 0;
}

/* ── Carousel nav tabs with progress ── */
.carousel-nav {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.carousel-tab {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 0;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  border-top: 1px solid #e8ecf0;
  transition: opacity 0.25s;
}

.carousel-tab:last-child {
  border-bottom: 1px solid #e8ecf0;
}

.carousel-tab-label {
  font-size: 15px;
  font-weight: 600;
  color: #9ca3af;
  transition: color 0.25s;
}

.carousel-tab.active .carousel-tab-label {
  color: #1a2332;
}

.carousel-tab-bar {
  width: 100%;
  height: 3px;
  background: #e8ecf0;
  border-radius: 3px;
  overflow: hidden;
}

.carousel-tab-fill {
  height: 100%;
  background: #00c853;
  border-radius: 3px;
  transition: width 0.15s linear;
}

.carousel-tab.past .carousel-tab-label {
  color: #6b7280;
}

/* ── Carousel video (right side — Terminal Industries mask shape) ── */
.carousel-right {
  position: relative;
  margin: 28px 0;
  background: #0d1117;
  border-radius: 20px 0 0 20px;
  overflow: hidden;
  -webkit-mask-image: v-bind(aboutVideoMaskCss);
  mask-image: v-bind(aboutVideoMaskCss);
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
}

.carousel-video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ══════════════════════════════════════════
   COMMON SECTIONS
   ══════════════════════════════════════════ */
.section-tag { display: inline-block; font-size: 13px; font-weight: 600; color: #00c853; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; }
.section-header { text-align: center; margin-bottom: 48px; }
.section-header h2, .contact-info h2, .cta-inner h2 { font-size: clamp(28px,3vw,40px); font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; }

.btn-cta { display: inline-flex; align-items: center; gap: 8px; background: #00c853; color: #fff; padding: 16px 36px; border-radius: 14px; font-weight: 700; font-size: 15px; text-decoration: none; border: none; cursor: pointer; font-family: inherit; transition: all 0.3s ease; box-shadow: 0 6px 24px rgba(0,200,83,0.3); }
.btn-cta:hover { background: #00b048; transform: translateY(-2px); box-shadow: 0 10px 32px rgba(0,200,83,0.4); }
.btn-cta-lg { padding: 18px 48px; font-size: 17px; }

/* ── FAQ ── */
.faq-section { padding: 100px 32px; background: #f6f7f7; }
.faq-inner { max-width: 700px; margin: 0 auto; }
.faq-list { display: flex; flex-direction: column; gap: 12px; }
.faq-item { background: #fff; border-radius: 14px; overflow: hidden; transition: box-shadow 0.3s ease; }
.faq-item.open { box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
.faq-question { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 20px 24px; background: none; border: none; font-family: inherit; font-size: 15px; font-weight: 600; color: #111827; cursor: pointer; text-align: left; transition: color 0.2s; }
.faq-question:hover { color: #00c853; }
.faq-question svg { flex-shrink: 0; transition: transform 0.3s ease; color: #9ca3af; }
.faq-question svg.rotated { transform: rotate(180deg); color: #00c853; }
.faq-answer { padding: 0 24px 20px; }
.faq-answer p { font-size: 14px; color: #6b7280; line-height: 1.7; }
.accordion-enter-active { animation: accordionIn 0.3s ease; }
.accordion-leave-active { animation: accordionOut 0.2s ease; }
@keyframes accordionIn { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 200px; } }
@keyframes accordionOut { from { opacity: 1; } to { opacity: 0; } }

/* ── CTA Section ── */
.cta-section { padding: 100px 32px; background: linear-gradient(135deg,#e8f5e9 0%,#c8e6c9 100%); text-align: center; }
.cta-inner { max-width: 600px; margin: 0 auto; }

/* ── About Team ── */
.about-team-section { padding: 80px 32px 100px; background: #f6f7f7; }
.about-team-inner { max-width: 900px; margin: 0 auto; }
.team-badge { display: inline-block; background: #00c853; color: #fff; font-size: 13px; font-weight: 700; padding: 8px 20px; border-radius: 20px; margin-bottom: 28px; }
.team-desc { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 40px; }
.team-desc-icon { flex-shrink: 0; width: 44px; height: 44px; border-radius: 12px; background: #e8f5e9; display: flex; align-items: center; justify-content: center; }
.team-desc p { font-size: 15px; color: #374151; line-height: 1.8; margin: 0; }
.team-desc strong { color: #111827; }
.team-photo-wrap { border-radius: 20px; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.1); }
.team-photo { width: 100%; height: auto; display: block; object-fit: cover; }
.team-caption { display: block; text-align: center; padding: 14px; font-size: 13px; font-weight: 500; color: #6b7280; background: #fff; }
.team-cta { margin-top: 40px; text-align: center; }

/* ── Contact ── */
.contact-section { padding: 100px 32px; background: #111827; color: #fff; }
.contact-inner { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start; }
.contact-info h2 { color: #fff; margin-bottom: 12px; }
.contact-info > p { color: #9ca3af; font-size: 15px; line-height: 1.6; margin-bottom: 32px; }
.contact-items { display: flex; flex-direction: column; gap: 20px; }
.contact-item { display: flex; align-items: center; gap: 14px; font-size: 15px; color: #d1d5db; }
.contact-form { display: flex; flex-direction: column; gap: 14px; }
.contact-form input, .contact-form textarea { background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 14px 18px; font-family: inherit; font-size: 14px; color: #fff; outline: none; transition: all 0.3s ease; }
.contact-form input::placeholder, .contact-form textarea::placeholder { color: #6b7280; }
.contact-form input:focus, .contact-form textarea:focus { border-color: #00c853; background: rgba(0,200,83,0.06); }
.contact-form textarea { resize: vertical; min-height: 100px; }

/* ══════════════════════════════════════════
   RESPONSIVE
   ══════════════════════════════════════════ */
@media (max-width: 980px) {
  .scroll-spacer { height: 350vh; }
  .scene-content { padding: calc(7vh + var(--about-header-clearance)) 24px 4vh; }
  .scene-title h1 { max-width: 620px; }
  .info-panels { width: min(46vw,360px); right: 24px; }
  .kpi-strip { grid-template-columns: 1fr 1fr; gap: 10px; }
  .data-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
}
@media (max-width: 768px) {
  .contact-inner { grid-template-columns: 1fr; }
  .carousel-fixed { grid-template-columns: 50% 50%; }
  .carousel-left { padding: 0 24px; max-width: 100%; }
  .carousel-slides { min-height: 200px; }
  .carousel-slide h2 { font-size: 24px; }
  .carousel-slide p { font-size: 14px; }
  .carousel-tab { padding: 8px 0; }
  .carousel-tab-label { font-size: 13px; }
}
@media (max-width: 720px) {
  .scroll-spacer { height: 300vh; }
  .scene-head { flex-direction: column; gap: 8px; }
  .story-progress { min-width: 0; width: 100%; }
  .scene-content { padding: calc(8vh + var(--about-header-clearance)) 18px 7vh; }
  .scene-title h1 { max-width: 96%; font-size: clamp(30px,8.2vw,44px); }
  .scene-title p { max-width: 100%; margin-top: 12px; }
  .info-panels { left: 18px; right: 18px; width: auto; top: auto; bottom: 135px; min-height: 205px; }
  .kpi-strip { grid-template-columns: 1fr; gap: 8px; }
  .data-grid { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .scroll-spacer { height: 280vh; }
  .sequence-frame { object-position: 62% center; }
  .scene-content { padding: calc(7.5vh + var(--about-header-clearance)) 14px 6vh; }
  .story-progress { max-width: 100%; }
  .info-panels { left: 14px; right: 14px; bottom: 124px; min-height: 190px; }
  .info-card { padding: 18px; border-radius: 16px; }
  .info-card p { font-size: 13px; line-height: 1.45; }
  .kpi-strip article { min-height: 64px; padding: 10px 12px; }
  .company-data { padding: 72px 16px 84px; }
  .carousel-spacer { height: 200vh; }
  .carousel-fixed { grid-template-columns: 1fr; grid-template-rows: 1fr auto; }
  .carousel-left { padding: 16px 14px 0; max-width: 100%; }
  .carousel-slides { min-height: 140px; }
  .carousel-slide h2 { font-size: 22px; }
  .carousel-slide p { font-size: 13px; }
  .carousel-right { height: 40vh; margin: 0; -webkit-mask-image: none; mask-image: none; border-radius: 12px; overflow: hidden; }
  .carousel-tab { padding: 6px 0; }
  .carousel-tab-label { font-size: 11px; }
}
</style>
