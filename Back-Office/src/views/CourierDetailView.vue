<template>
  <div v-if="!c" class="bo-card bo-card--padded">
    <div class="bo-empty">
      <h3 class="bo-empty__title">Estafeta não encontrado</h3>
      <p class="bo-empty__hint">Pode ter sido removido ou o ID da rota está inválido.</p>
      <RouterLink to="/couriers" class="bo-btn bo-btn--outline" style="margin-top: 12px;">Voltar à lista</RouterLink>
    </div>
  </div>

  <div v-else class="bo-page">
    <RouterLink to="/couriers" class="back-link"><ArrowLeft :size="14" /> Voltar à lista de estafetas</RouterLink>

    <header class="bo-page-head">
      <div class="bo-page-head__main" style="display: flex; gap: 16px; align-items: center;">
        <img
          v-if="c.docUrls?.selfie"
          :src="c.docUrls.selfie"
          alt="Foto do estafeta"
          class="courier-photo"
        />
        <div v-else class="bo-avatar bo-avatar--lg">{{ initials }}</div>
        <div>
          <p class="bo-page-head__eyebrow">Estafeta · {{ c.id }}</p>
          <h1 class="bo-page-head__title">{{ c.name }}</h1>
          <p class="bo-page-head__sub">{{ c.email }} · {{ c.phone || 'Sem telemóvel registado' }}</p>
        </div>
      </div>
      <div class="bo-page-head__actions">
        <span class="bo-badge" :class="stateBadgeClass(c.state)">{{ c.state }} · {{ courierStateLabels[c.state] }}</span>
        <span class="bo-badge" :class="c.online ? 'bo-badge--success' : 'bo-badge--neutral'">{{ c.online ? 'Online' : 'Offline' }}</span>
      </div>
    </header>

    <section class="bo-card bo-card--padded">
      <div class="bo-row" style="gap: 24px;">
        <label class="bo-checkbox">
          <input type="checkbox" :checked="c.online" :disabled="!canGoOnline" @change="onToggleOnline" />
          Modo online (recebe atribuições)
        </label>
        <div class="bo-row" style="gap: 8px;">
          <label class="bo-field__label" style="margin: 0;">Máx. simultâneo</label>
          <input type="number" min="1" max="10" :value="c.maxConcurrent" class="bo-input" style="width: 72px; padding: 6px 10px; text-align: center;" @change="onMax($event.target.value)" />
        </div>
      </div>
    </section>

    <section v-if="c.dataChangeRequest" class="bo-card bo-card--padded data-change-alert" role="alert">
      <header class="bo-card__head" style="padding-top: 0; border-bottom: none;">
        <div>
          <h3 class="bo-card__title">Pedido de alteração de dados</h3>
          <p class="bo-card__sub">Pedido submetido pelo estafeta na PWA.</p>
        </div>
        <span class="bo-badge bo-badge--warn">Pendente</span>
      </header>
      <div class="bo-card__body" style="padding-top: 0;">
        <dl class="bo-dl">
          <dt>Campo</dt><dd>{{ c.dataChangeRequest.field || 'Não especificado' }}</dd>
          <dt>Motivo / novo valor</dt><dd>{{ c.dataChangeRequest.reason }}<template v-if="c.dataChangeRequest.newValue"> Novo: {{ c.dataChangeRequest.newValue }}</template></dd>
        </dl>
        <button type="button" class="bo-btn bo-btn--outline bo-btn--sm" @click="clearDataRequest">Marcar como tratado</button>
      </div>
    </section>

    <div class="bo-kpi-grid">
      <article v-for="s in statItems" :key="s.k" class="bo-kpi">
        <span class="bo-kpi__label">{{ s.k }}</span>
        <span class="bo-kpi__value">{{ s.v }}</span>
      </article>
    </div>

    <div class="bo-grid bo-grid--2">
      <section class="bo-card">
        <header class="bo-card__head">
          <div>
            <h3 class="bo-card__title">Dados pessoais</h3>
            <p class="bo-card__sub">Apenas editáveis após verificação E-02 ou superior.</p>
          </div>
        </header>
        <div class="bo-card__body">
          <div v-if="canEdit" class="bo-form-grid bo-form-grid--2">
            <div class="bo-field"><label class="bo-field__label">Nome</label><input v-model="edit.name" class="bo-input" /></div>
            <div class="bo-field"><label class="bo-field__label">Email</label><input v-model="edit.email" type="email" class="bo-input" /></div>
            <div class="bo-field"><label class="bo-field__label">Telemóvel</label><input v-model="edit.phone" type="tel" class="bo-input" /></div>
            <div class="bo-field"><label class="bo-field__label">NIF</label><input v-model="edit.nif" class="bo-input" /></div>
            <div class="bo-field"><label class="bo-field__label">Cartão de Cidadão</label><input v-model="edit.cc" class="bo-input" /></div>
            <div class="bo-field"><label class="bo-field__label">Data nascimento</label><input v-model="edit.birthDate" type="date" class="bo-input" /></div>
            <div class="bo-field bo-field--span2"><label class="bo-field__label">Morada</label><input v-model="edit.address" class="bo-input" /></div>
            <div class="bo-field bo-field--span2"><label class="bo-field__label">IBAN</label><input v-model="edit.iban" class="bo-input" placeholder="PT50..." /></div>
          </div>
          <dl v-else class="bo-dl">
            <dt>Nome</dt><dd>{{ c.name }}</dd>
            <dt>Email</dt><dd>{{ c.email }}</dd>
            <dt>Telemóvel</dt><dd>{{ c.phone || '—' }}</dd>
            <dt>NIF</dt><dd class="bo-mono">{{ c.nif || '—' }}</dd>
            <dt>CC</dt><dd class="bo-mono">{{ c.cc || '—' }}</dd>
            <dt>Nascimento</dt><dd class="bo-mono">{{ c.birthDate || '—' }}</dd>
            <dt>Morada</dt><dd>{{ c.address || '—' }}</dd>
            <dt>IBAN</dt><dd class="bo-mono">{{ c.iban || '—' }}</dd>
          </dl>
        </div>
      </section>

      <section class="bo-card">
        <header class="bo-card__head">
          <div>
            <h3 class="bo-card__title">Veículo <span v-if="c.vehicle?.type" class="bo-badge bo-badge--neutral" style="margin-left: 8px;">{{ c.vehicle.type }}</span></h3>
            <p class="bo-card__sub">Identificação do veículo e validade dos documentos legais.</p>
          </div>
        </header>
        <div class="bo-card__body">
          <div v-if="canEdit" class="bo-form-grid bo-form-grid--2">
            <div class="bo-field">
              <label class="bo-field__label">Tipo</label>
              <select v-model="edit.vehicle.type" class="bo-select">
                <option value="">—</option>
                <option value="Mota">Mota</option>
                <option value="Carro">Carro</option>
                <option value="Bicicleta">Bicicleta</option>
                <option value="Trotinete">Trotinete</option>
              </select>
            </div>
            <div class="bo-field"><label class="bo-field__label">Marca</label><input v-model="edit.vehicle.brand" class="bo-input" /></div>
            <div class="bo-field"><label class="bo-field__label">Modelo</label><input v-model="edit.vehicle.model" class="bo-input" /></div>
            <div class="bo-field"><label class="bo-field__label">Cor</label><input v-model="edit.vehicle.color" class="bo-input" /></div>
            <div class="bo-field"><label class="bo-field__label">Matrícula</label><input v-model="edit.vehicle.plate" class="bo-input" /></div>
          </div>
          <dl v-else class="bo-dl">
            <dt>Tipo</dt><dd>{{ c.vehicle?.type || '—' }}</dd>
            <dt>Marca</dt><dd>{{ c.vehicle?.brand || '—' }}</dd>
            <dt>Modelo</dt><dd>{{ c.vehicle?.model || '—' }}</dd>
            <dt>Cor</dt><dd>{{ c.vehicle?.color || '—' }}</dd>
            <dt>Matrícula</dt><dd class="bo-mono">{{ c.vehicle?.plate || '—' }}</dd>
          </dl>
          <p v-if="(c.vehicle?.type || '').toLowerCase() === 'bicicleta'" class="bo-muted" style="margin-top: 10px; font-size: 12.5px; font-style: italic;">
            Veículo bicicleta — matrícula, seguro e inspeção não se aplicam.
          </p>
        </div>
      </section>
    </div>

    <div class="bo-grid bo-grid--2">
      <section class="bo-card">
        <header class="bo-card__head">
          <div>
            <h3 class="bo-card__title">Documentos</h3>
            <p class="bo-card__sub">Cada upload é guardado no Strapi. Clica em «Ver» para abrir o ficheiro original.</p>
          </div>
        </header>
        <div class="bo-card__body bo-stack--sm">
          <div v-for="d in docList" :key="d.key" class="bo-doc-row" :class="{ 'is-ok': !!d.url }">
            <div class="bo-doc-row__main">
              <span class="bo-doc-row__dot"></span>
              <div>
                <div class="bo-doc-row__name">{{ d.label }}</div>
                <div class="bo-doc-row__meta">Carregado</div>
              </div>
            </div>
            <div class="bo-doc-row__actions">
              <button type="button" class="bo-btn bo-btn--ghost bo-btn--sm" @click="openDocViewer(d)">Ver</button>
              <label class="bo-upload">
                <input type="file" accept="image/*,.pdf" :disabled="uploading[d.key]" @change="onDocUpload($event, d.key)" />
                <span>Substituir</span>
              </label>
            </div>
          </div>
          <div v-if="!docList.length" class="bo-muted" style="font-size: 13.5px; padding: 10px 0;">
            Nenhum documento carregado pelo estafeta.
          </div>
        </div>
      </section>

      <section class="bo-card">
        <header class="bo-card__head">
          <div>
            <h3 class="bo-card__title">Zonas de atuação</h3>
            <p class="bo-card__sub">Define onde o estafeta pode receber atribuições.</p>
          </div>
        </header>
        <div class="bo-card__body">
          <div v-if="canEdit" class="zones-grid">
            <button v-for="z in ZONES" :key="z" type="button" class="bo-chip" :class="{ 'is-on': edit.zones.includes(z) }" @click="toggleZ(z)">{{ z }}</button>
          </div>
          <div v-else class="zones-grid">
            <span v-for="z in c.zones" :key="z" class="bo-chip is-on" style="cursor: default;">{{ z }}</span>
            <span v-if="!c.zones.length" class="bo-muted" style="font-size: 13px;">Nenhuma zona atribuída.</span>
          </div>
        </div>
      </section>
    </div>

    <section v-if="canEdit" class="bo-card">
      <div class="bo-card__foot" style="border-top: none;">
        <button type="button" class="bo-btn bo-btn--primary" @click="saveEdit">Guardar alterações</button>
      </div>
    </section>

    <section class="bo-card">
      <header class="bo-card__head">
        <div>
          <h3 class="bo-card__title">Histórico de entregas</h3>
          <p class="bo-card__sub">Lista das últimas entregas concluídas com avaliação do cliente.</p>
        </div>
        <div class="bo-card__head-actions">
          <span class="bo-badge bo-badge--neutral">{{ deliveries.length }} entregas</span>
          <span v-if="avgDeliveryRating != null" class="bo-badge bo-badge--brand">média {{ avgDeliveryRating.toFixed(1) }} / 5</span>
        </div>
      </header>
      <div class="bo-card__body">
        <table v-if="deliveries.length" class="bo-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Loja</th>
              <th class="bo-text-right">Custo</th>
              <th>Avaliação</th>
              <th>Entregue em</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in deliveries" :key="d.id">
              <td>
                <RouterLink :to="`/orders/${d.id}`" class="bo-link bo-mono">{{ d.id }}</RouterLink>
              </td>
              <td>{{ d.clientName }}</td>
              <td class="bo-muted">{{ d.storeName || '—' }}</td>
              <td class="bo-text-right">{{ d.costEuro != null ? d.costEuro.toFixed(2) + ' €' : '—' }}</td>
              <td>
                <span v-if="d.rating != null" class="bo-badge bo-badge--brand">{{ d.rating.toFixed(1) }} / 5</span>
                <span v-else class="bo-muted" style="font-size: 12px;">sem rating</span>
              </td>
              <td class="bo-mono bo-muted">{{ formatDeliveredAt(d.deliveredAt) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="bo-muted" style="font-size: 13px;">Sem entregas concluídas até ao momento.</p>
      </div>
    </section>

    <section class="bo-card">
      <header class="bo-card__head">
        <div>
          <h3 class="bo-card__title">Notas internas admin</h3>
          <p class="bo-card__sub">Visíveis apenas no painel de administração.</p>
        </div>
      </header>
      <div class="bo-card__body bo-stack">
        <textarea v-model="adminNotesDraft" class="bo-textarea" rows="3" placeholder="Notas operacionais, acompanhamento..." />
        <div class="bo-row bo-row--end">
          <button type="button" class="bo-btn bo-btn--outline bo-btn--sm" @click="saveAdminNotes">Guardar notas</button>
        </div>
      </div>
    </section>

    <section class="bo-card">
      <header class="bo-card__head">
        <div>
          <h3 class="bo-card__title">Estado e validação</h3>
          <p class="bo-card__sub">Estado atual: <strong>{{ courierStateLabels[c.state] }}</strong></p>
        </div>
      </header>
      <div class="bo-card__body">
        <div class="bo-row">
          <button v-if="c.state === 'E-01'" type="button" class="bo-btn bo-btn--primary" @click="doVerify">Verificar / Aceitar</button>
          <button v-if="c.state === 'E-01'" type="button" class="bo-btn bo-btn--danger" @click="showRej = true">Rejeitar</button>
          <button v-if="c.state === 'E-01'" type="button" class="bo-btn bo-btn--outline" @click="showInfo = true">Pedir informação</button>
          <button v-if="['E-02', 'E-05', 'E-06'].includes(c.state)" type="button" class="bo-btn bo-btn--warn" @click="doSuspend">Suspender</button>
          <button v-if="c.state === 'E-04' || c.state === 'E-03'" type="button" class="bo-btn bo-btn--outline" @click="doReactivate">Reativar</button>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <div v-if="showRej" class="bo-modal-backdrop" @click.self="showRej = false">
        <div class="bo-modal">
          <header class="bo-modal__head">
            <div>
              <h3 class="bo-modal__title">Motivo da rejeição</h3>
              <p class="bo-modal__sub">Cliente é notificado por email. Não pode ser revertido.</p>
            </div>
            <button type="button" class="bo-modal__close" @click="showRej = false">×</button>
          </header>
          <div class="bo-modal__body">
            <textarea v-model="rejReason" class="bo-textarea" rows="4" placeholder="Indica o motivo..." />
          </div>
          <footer class="bo-modal__foot">
            <button type="button" class="bo-btn bo-btn--ghost" @click="showRej = false">Cancelar</button>
            <button type="button" class="bo-btn bo-btn--danger-solid" :disabled="!rejReason.trim()" @click="confirmRej">Confirmar rejeição</button>
          </footer>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showInfo" class="bo-modal-backdrop" @click.self="showInfo = false">
        <div class="bo-modal">
          <header class="bo-modal__head">
            <div>
              <h3 class="bo-modal__title">Pedir informação ao estafeta</h3>
              <p class="bo-modal__sub">A mensagem é enviada por email ao estafeta.</p>
            </div>
            <button type="button" class="bo-modal__close" @click="showInfo = false">×</button>
          </header>
          <div class="bo-modal__body">
            <textarea v-model="infoMsg" class="bo-textarea" rows="4" placeholder="O que precisas?" />
          </div>
          <footer class="bo-modal__foot">
            <button type="button" class="bo-btn bo-btn--ghost" @click="showInfo = false">Cancelar</button>
            <button type="button" class="bo-btn bo-btn--primary" :disabled="!infoMsg.trim()" @click="confirmInfo">Enviar pedido</button>
          </footer>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="docViewer.open" class="bo-modal-backdrop" @click.self="closeDocViewer">
        <div class="bo-modal bo-modal--doc">
          <header class="bo-modal__head">
            <div>
              <h3 class="bo-modal__title">{{ docViewer.label || 'Documento' }}</h3>
              <p class="bo-modal__sub">Visualização no painel sem abrir nova janela.</p>
            </div>
            <button type="button" class="bo-modal__close" @click="closeDocViewer">×</button>
          </header>
          <div class="bo-modal__body bo-doc-viewer">
            <p v-if="docViewer.loading" class="bo-muted">A carregar documento...</p>
            <p v-else-if="docViewer.error" class="bo-doc-viewer__error">{{ docViewer.error }}</p>
            <img
              v-else-if="docViewer.previewUrl && docViewer.isImage"
              :src="docViewer.previewUrl"
              :alt="docViewer.label || 'Documento'"
              class="bo-doc-viewer__image"
            />
            <iframe
              v-else-if="docViewer.previewUrl"
              :src="docViewer.previewUrl"
              class="bo-doc-viewer__frame"
              title="Documento"
            />
            <p v-else class="bo-muted">Sem documento para visualizar.</p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowLeft } from 'lucide-vue-next';
import {
  getCourierById,
  canEditCourierData,
  updateCourierVerified,
  verifyCourier,
  rejectCourier,
  requestCourierInfo,
  suspendCourier,
  reactivateCourier,
  setCourierOnline,
  setCourierMaxConcurrent,
  setCourierAdminNotes,
  clearCourierDataRequest,
} from '../stores/logisticsStore.js';
import { courierStateLabels, COURIER_STATE, ZONES } from '../constants/logistics.js';
import { toast } from '../utils/notify.js';
import { boUpload } from '../api/backofficeApi.js';

const route = useRoute();
const c = computed(() => getCourierById(route.params.id));
const canEdit = computed(() => c.value && canEditCourierData(c.value));
const canGoOnline = computed(() => c.value && ['E-02', 'E-05', 'E-06'].includes(c.value.state));

const initials = computed(() => {
  const n = c.value?.name || '';
  const p = n.split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  return (n.slice(0, 2) || 'ES').toUpperCase();
});

const statItems = computed(() => {
  if (!c.value) return [];
  return [
    { k: 'Entregas totais', v: c.value.stats.deliveries },
    { k: 'Avaliação média', v: c.value.stats.rating ? c.value.stats.rating.toFixed(1) : '—' },
    { k: 'No prazo', v: c.value.stats.onTimePct ? `${c.value.stats.onTimePct}%` : '—' },
    { k: 'Ativas agora', v: c.value.activeAssignments || 0 },
  ];
});

const deliveries = computed(() => Array.isArray(c.value?.deliveries) ? c.value.deliveries : []);

const avgDeliveryRating = computed(() => {
  const rated = deliveries.value.filter((d) => typeof d.rating === 'number' && d.rating > 0);
  if (!rated.length) return null;
  const sum = rated.reduce((acc, d) => acc + d.rating, 0);
  return sum / rated.length;
});

function formatDeliveredAt(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return String(iso).slice(0, 16).replace('T', ' ');
  }
}

const edit = reactive({
  name: '', email: '', phone: '', nif: '', cc: '', birthDate: '', address: '', iban: '',
  zones: [],
  vehicle: { type: '', brand: '', model: '', color: '', plate: '', licenseNumber: '', insuranceRef: '', inspectionValidUntil: '' },
});

const adminNotesDraft = ref('');
const showRej = ref(false);
const showInfo = ref(false);
const rejReason = ref('');
const infoMsg = ref('');
const docViewer = reactive({
  open: false,
  label: '',
  url: '',
  previewUrl: '',
  loading: false,
  error: '',
  isImage: false,
});

watch(c, (x) => {
  if (!x) return;
  edit.name = x.name; edit.email = x.email; edit.phone = x.phone || '';
  edit.nif = x.nif; edit.cc = x.cc; edit.birthDate = x.birthDate;
  edit.address = x.address; edit.iban = x.iban; edit.zones = [...(x.zones || [])];
  
  const rawType = x.vehicle?.type || '';
  const normalizedType = rawType ? rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase() : '';
  edit.vehicle = { 
    ...(x.vehicle || {}), 
    type: normalizedType,
    color: x.vehicle?.color || '' 
  };
  adminNotesDraft.value = x.adminNotes || '';
}, { immediate: true });

function toggleZ(z) {
  const i = edit.zones.indexOf(z);
  if (i >= 0) edit.zones.splice(i, 1);
  else edit.zones.push(z);
}

async function saveEdit() {
  const r = await updateCourierVerified(c.value.id, { ...edit, vehicle: { ...edit.vehicle }, zones: [...edit.zones] });
  toast(r.ok ? 'Dados guardados.' : r.error, r.ok ? 'success' : 'error');
}

async function saveAdminNotes() {
  const r = await setCourierAdminNotes(c.value.id, adminNotesDraft.value);
  toast(r.ok ? 'Notas guardadas.' : r.error || 'Erro', r.ok ? 'success' : 'error');
}

async function clearDataRequest() {
  const r = await clearCourierDataRequest(c.value.id);
  toast(r.ok ? 'Pedido de alteração marcado como tratado.' : r.error || 'Erro', r.ok ? 'success' : 'error');
}

async function onToggleOnline(e) {
  const want = e.target.checked;
  const r = await setCourierOnline(c.value.id, want);
  if (!r.ok) { e.target.checked = !want; toast(r.error, 'error'); }
  else toast('Estado atualizado.', 'success');
}

async function onMax(v) {
  const r = await setCourierMaxConcurrent(c.value.id, Number(v));
  toast(r.ok ? 'Limite atualizado.' : 'Falha.', r.ok ? 'success' : 'error');
}

async function doVerify() {
  const r = await verifyCourier(c.value.id);
  toast(r.ok ? 'Estafeta verificado E-02.' : 'Não aplicável', r.ok ? 'success' : 'error');
}

async function confirmRej() {
  const r = await rejectCourier(c.value.id, rejReason.value);
  toast(r.ok ? 'Rejeitado.' : r.error, r.ok ? 'success' : 'error');
  if (r.ok) { showRej.value = false; rejReason.value = ''; }
}

async function confirmInfo() {
  const r = await requestCourierInfo(c.value.id, infoMsg.value);
  toast(r.ok ? 'Pedido de info enviado.' : r.error, r.ok ? 'success' : 'error');
  if (r.ok) { showInfo.value = false; infoMsg.value = ''; }
}

async function doSuspend() {
  const r = await suspendCourier(c.value.id);
  toast(r.ok ? 'Suspenso (E-04).' : 'Falha.', r.ok ? 'success' : 'error');
}

async function doReactivate() {
  const r = await reactivateCourier(c.value.id);
  toast(r.ok ? 'Reativado.' : 'Falha.', r.ok ? 'success' : 'error');
}

const uploading = reactive({
  docCcUrl: false,
  docLicenseUrl: false,
  docInsuranceUrl: false,
  docInspectionUrl: false,
  docSelfieUrl: false,
  docIbanUrl: false,
});

const docList = computed(() => {
  const u = c.value?.docUrls || {};
  const list = [
    { key: 'docCcUrl', label: 'Cartão de Cidadão', url: u.cc || '' },
    { key: 'docLicenseUrl', label: 'Carta de Condução', url: u.license || '' },
    { key: 'docInsuranceUrl', label: 'Apólice de Seguro', url: u.insurance || '' },
    { key: 'docInspectionUrl', label: 'Certificado de Inspeção', url: u.inspection || '' },
    { key: 'docSelfieUrl', label: 'Selfie', url: u.selfie || '' },
    { key: 'docIbanUrl', label: 'Comprovativo IBAN', url: u.iban || '' },
  ];
  return list.filter((d) => !!d.url);
});

async function onDocUpload(event, fieldKey) {
  const input = event.target;
  const file = input?.files?.[0];
  if (!file || !c.value) return;
  uploading[fieldKey] = true;
  try {
    const up = await boUpload(file);
    const r = await updateCourierVerified(c.value.id, { [fieldKey]: up.url });
    if (r.ok) toast('Documento carregado e guardado.', 'success');
    else toast(r.error || 'Falha ao guardar.', 'error');
  } catch (err) {
    toast(err?.message || 'Falha no upload do documento.', 'error');
  } finally {
    uploading[fieldKey] = false;
    input.value = '';
  }
}

function stateBadgeClass(state) {
  switch (state) {
    case COURIER_STATE.E01: return 'bo-badge--warn';
    case COURIER_STATE.E02: return 'bo-badge--info';
    case COURIER_STATE.E03: return 'bo-badge--danger';
    case COURIER_STATE.E04: return 'bo-badge--danger';
    case COURIER_STATE.E05: return 'bo-badge--neutral';
    case COURIER_STATE.E06: return 'bo-badge--success';
    default: return 'bo-badge--neutral';
  }
}

function isImageUrl(url = '') {
  const clean = String(url).toLowerCase().split('?')[0];
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'].some(ext => clean.endsWith(ext));
}

async function openDocViewer(doc) {
  closeDocViewer();
  docViewer.open = true;
  docViewer.label = doc?.label || 'Documento';
  docViewer.url = doc?.url || '';
  docViewer.isImage = isImageUrl(docViewer.url);
  if (!docViewer.url) return;
  docViewer.loading = true;
  try {
    const res = await fetch(docViewer.url);
    if (!res.ok) throw new Error('Não foi possível carregar o ficheiro.');
    const blob = await res.blob();
    docViewer.previewUrl = URL.createObjectURL(blob);
  } catch (err) {
    docViewer.error = err?.message || 'Falha ao abrir o documento.';
  } finally {
    docViewer.loading = false;
  }
}

function closeDocViewer() {
  if (docViewer.previewUrl) {
    URL.revokeObjectURL(docViewer.previewUrl);
  }
  docViewer.open = false;
  docViewer.label = '';
  docViewer.url = '';
  docViewer.previewUrl = '';
  docViewer.loading = false;
  docViewer.error = '';
  docViewer.isImage = false;
}
</script>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--bo-brand);
  text-decoration: none;
  width: fit-content;
}

.back-link:hover { opacity: 0.75; }

.data-change-alert {
  border: 1px solid #fcd34d;
  background: linear-gradient(90deg, #fffbeb, var(--bo-surface));
}

.courier-photo {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  object-fit: cover;
  border: 2px solid var(--bo-border);
}

.zones-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.bo-modal--doc {
  width: min(1000px, 92vw);
  max-width: 1000px;
}

.bo-doc-viewer {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}

.bo-doc-viewer__image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
  border: 1px solid var(--bo-border);
  background: #fff;
}

.bo-doc-viewer__frame {
  width: 100%;
  height: 70vh;
  border: 1px solid var(--bo-border);
  border-radius: 8px;
  background: #fff;
}

.bo-doc-viewer__error {
  color: #b91c1c;
  font-size: 13px;
  font-weight: 600;
}
</style>
