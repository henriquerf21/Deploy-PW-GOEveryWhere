<template>
  <div v-if="!c" class="missing card">Estafeta não encontrado.</div>
  <div v-else class="detail">
    <RouterLink to="/couriers" class="back">← Estafetas</RouterLink>

    <header class="head card">
      <div>
        <h2 class="title">{{ c.name }}</h2>
        <p class="sub">{{ c.email }} · {{ c.phone || 'Sem telemóvel' }} · {{ courierStateLabels[c.state] }}</p>
      </div>
      <div class="head-actions">
        <label class="toggle">
          <input type="checkbox" :checked="c.online" :disabled="!canGoOnline" @change="onToggleOnline" />
          Online
        </label>
        <label class="maxl">
          Máx. entregas simultâneas
          <input
            type="number"
            min="1"
            max="10"
            :value="c.maxConcurrent"
            class="inp-sm"
            @change="onMax($event.target.value)"
          />
        </label>
      </div>
    </header>

    <section class="card block block--notes">
      <h3>Notas internas (admin)</h3>
      <p class="hint">Visível só no painel — útil para follow-up e alertas à equipa.</p>
      <textarea v-model="adminNotesDraft" class="inp ta-notes" rows="3" placeholder="Ex.: Falta apólice; disponível fins-de-semana…" />
      <button type="button" class="btn btn--sec btn--sm" @click="saveAdminNotes">Guardar notas</button>
    </section>

    <section v-if="c.dataChangeRequest" class="card block block--alert">
      <h3>🚨 Pedido de Alteração de Dados</h3>
      <div class="alert-content">
        <p><strong>Campos a alterar:</strong> {{ c.dataChangeRequest.field || 'Não especificado' }}</p>
        <p><strong>Motivo / Novos valores:</strong> {{ c.dataChangeRequest.reason }} (Novo: {{ c.dataChangeRequest.newValue }})</p>
      </div>
      <div class="alert-actions">
        <button type="button" class="btn btn--sec btn--sm" @click="clearDataRequest">Marcar como tratado</button>
      </div>
    </section>

    <div class="stats card">
      <div v-for="s in statItems" :key="s.k" class="stat">
        <span class="stat__v">{{ s.v }}</span>
        <span class="stat__k">{{ s.k }}</span>
      </div>
    </div>

    <div class="grid">
      <section v-if="canEdit" class="card block">
        <h3>Editar dados</h3>
        <form class="form" @submit.prevent="saveEdit">
          <label>Nome</label>
          <input v-model="edit.name" class="inp" />
          <label>Email</label>
          <input v-model="edit.email" type="email" class="inp" />
          <label>Telemóvel</label>
          <input v-model="edit.phone" type="tel" class="inp" />
          <label>NIF</label>
          <input v-model="edit.nif" class="inp" />
          <label>CC</label>
          <input v-model="edit.cc" class="inp" />
          <label>Data nascimento</label>
          <input v-model="edit.birthDate" type="date" class="inp" />
          <label>Morada</label>
          <input v-model="edit.address" class="inp" />
          <label>IBAN</label>
          <input v-model="edit.iban" class="inp" />
          <h4>Veículo</h4>
          <label>Tipo</label>
          <input v-model="edit.vehicle.type" class="inp" />
          <label>Marca / Modelo</label>
          <div class="row2">
            <input v-model="edit.vehicle.brand" class="inp" />
            <input v-model="edit.vehicle.model" class="inp" />
          </div>
          <label>Matrícula</label>
          <input v-model="edit.vehicle.plate" class="inp" />
          <label>Cor do veículo</label>
          <input v-model="edit.vehicle.color" class="inp" placeholder="Ex.: Cinzento" />
          <label>Carta condução n.º</label>
          <input v-model="edit.vehicle.licenseNumber" class="inp" />
          <label>Seguro (ref.)</label>
          <input v-model="edit.vehicle.insuranceRef" class="inp" />
          <label>Inspeção válida até</label>
          <input v-model="edit.vehicle.inspectionValidUntil" type="date" class="inp" />
          <label>Zonas</label>
          <div class="chips">
            <button
              v-for="z in ZONES"
              :key="z"
              type="button"
              class="chip"
              :class="{ on: edit.zones.includes(z) }"
              @click="toggleZ(z)"
            >
              {{ z }}
            </button>
          </div>
          <button type="submit" class="btn btn--go">Guardar</button>
        </form>
      </section>

      <section class="card block">
        <h3>Documentos</h3>
        <ul class="docs">
          <li :class="{ ok: c.docs.idDoc }">Identificação</li>
          <li :class="{ ok: c.docs.license }">Carta de condução</li>
          <li :class="{ ok: c.docs.insurance }">Seguro</li>
          <li :class="{ ok: c.docs.inspection }">Inspeção</li>
        </ul>
      </section>

      <section class="card block">
        <h3>Estado e validação</h3>
        <div class="actions">
          <button v-if="c.state === 'E-01'" type="button" class="btn btn--go" @click="doVerify">Verificar</button>
          <template v-if="c.state === 'E-01'">
            <button type="button" class="btn btn--danger" @click="showRej = true">Rejeitar</button>
            <button type="button" class="btn btn--sec" @click="showInfo = true">Pedir info</button>
          </template>
          <button v-if="['E-02', 'E-05', 'E-06'].includes(c.state)" type="button" class="btn btn--warn" @click="doSuspend">
            Suspender
          </button>
          <button v-if="c.state === 'E-04' || c.state === 'E-03'" type="button" class="btn btn--sec" @click="doReactivate">
            Reativar
          </button>
        </div>
      </section>
    </div>

    <div v-if="showRej" class="modal">
      <div class="modal__box card">
        <h3>Motivo da rejeição</h3>
        <textarea v-model="rejReason" class="inp ta" rows="3" />
        <div class="modal__act">
          <button type="button" class="btn btn--sec" @click="showRej = false">Cancelar</button>
          <button type="button" class="btn btn--danger" :disabled="!rejReason.trim()" @click="confirmRej">Confirmar</button>
        </div>
      </div>
    </div>

    <div v-if="showInfo" class="modal">
      <div class="modal__box card">
        <h3>Mensagem ao estafeta</h3>
        <textarea v-model="infoMsg" class="inp ta" rows="3" />
        <div class="modal__act">
          <button type="button" class="btn btn--sec" @click="showInfo = false">Cancelar</button>
          <button type="button" class="btn btn--go" :disabled="!infoMsg.trim()" @click="confirmInfo">Enviar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  logistics,
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
import { courierStateLabels, ZONES } from '../constants/logistics.js';
import { toast } from '../utils/notify.js';

const route = useRoute();
const c = computed(() => getCourierById(route.params.id));

const canEdit = computed(() => c.value && canEditCourierData(c.value));

const canGoOnline = computed(() => {
  if (!c.value) return false;
  return ['E-02', 'E-05', 'E-06'].includes(c.value.state);
});

const statItems = computed(() => {
  if (!c.value) return [];
  return [
    { k: 'Entregas', v: c.value.stats.deliveries },
    { k: 'Avaliação', v: c.value.stats.rating ? c.value.stats.rating.toFixed(1) : '—' },
    { k: 'No prazo', v: c.value.stats.onTimePct ? `${c.value.stats.onTimePct}%` : '—' },
  ];
});

const edit = reactive({
  name: '',
  email: '',
  phone: '',
  nif: '',
  cc: '',
  birthDate: '',
  address: '',
  iban: '',
  zones: [],
  vehicle: {
    type: '',
    brand: '',
    model: '',
    color: '',
    plate: '',
    licenseNumber: '',
    insuranceRef: '',
    inspectionValidUntil: '',
  },
});

const adminNotesDraft = ref('');

watch(
  c,
  (x) => {
    if (!x) return;
    edit.name = x.name;
    edit.email = x.email;
    edit.phone = x.phone || '';
    edit.nif = x.nif;
    edit.cc = x.cc;
    edit.birthDate = x.birthDate;
    edit.address = x.address;
    edit.iban = x.iban;
    edit.zones = [...x.zones];
    edit.vehicle = { ...x.vehicle, color: x.vehicle?.color || '' };
    adminNotesDraft.value = x.adminNotes || '';
  },
  { immediate: true }
);

const showRej = ref(false);
const showInfo = ref(false);
const rejReason = ref('');
const infoMsg = ref('');

function toggleZ(z) {
  const i = edit.zones.indexOf(z);
  if (i >= 0) edit.zones.splice(i, 1);
  else edit.zones.push(z);
}

async function saveEdit() {
  const r = await updateCourierVerified(c.value.id, {
    ...edit,
    vehicle: { ...edit.vehicle },
    zones: [...edit.zones],
  });
  toast(r.ok ? 'Dados guardados.' : r.error, r.ok ? 'success' : 'error');
}

function saveAdminNotes() {
  const r = setCourierAdminNotes(c.value.id, adminNotesDraft.value);
  toast(r.ok ? 'Notas guardadas.' : r.error || 'Erro', r.ok ? 'success' : 'error');
}

async function clearDataRequest() {
  const r = await clearCourierDataRequest(c.value.id);
  toast(r.ok ? 'Pedido de alteração marcado como tratado.' : r.error || 'Erro', r.ok ? 'success' : 'error');
}

async function onToggleOnline(e) {
  const want = e.target.checked;
  const r = await setCourierOnline(c.value.id, want);
  if (!r.ok) {
    e.target.checked = !want;
    toast(r.error, 'error');
  } else {
    toast('Estado atualizado.', 'success');
  }
}

async function onMax(v) {
  const r = await setCourierMaxConcurrent(c.value.id, Number(v));
  toast(r.ok ? 'Limite atualizado.' : 'Falha ao atualizar limite.', r.ok ? 'success' : 'error');
}

async function doVerify() {
  const r = await verifyCourier(c.value.id);
  toast(r.ok ? 'Estafeta verificado (E-02).' : 'Não aplicável', r.ok ? 'success' : 'error');
}

async function confirmRej() {
  const r = await rejectCourier(c.value.id, rejReason.value);
  toast(r.ok ? 'Rejeitado. Email enviado.' : r.error, r.ok ? 'success' : 'error');
  if (r.ok) {
    showRej.value = false;
    rejReason.value = '';
  }
}

async function confirmInfo() {
  const r = await requestCourierInfo(c.value.id, infoMsg.value);
  toast(r.ok ? 'Pedido de informação enviado.' : r.error, r.ok ? 'success' : 'error');
  if (r.ok) {
    showInfo.value = false;
    infoMsg.value = '';
  }
}

async function doSuspend() {
  const r = await suspendCourier(c.value.id);
  toast(r.ok ? 'Estafeta suspenso (E-04).' : 'Falha ao suspender.', r.ok ? 'success' : 'error');
}

async function doReactivate() {
  const r = await reactivateCourier(c.value.id);
  toast(r.ok ? 'Estafeta reativado.' : 'Falha ao reativar.', r.ok ? 'success' : 'error');
}
</script>

<style scoped>
.missing {
  padding: 24px;
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.back {
  font-size: 13px;
  font-weight: 600;
  color: var(--bo-brand);
  text-decoration: none;
}

.card {
  background: var(--bo-surface);
  border-radius: var(--bo-radius-lg);
  border: 1px solid var(--bo-border);
  box-shadow: var(--bo-shadow);
}

.head {
  padding: 20px 24px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.title {
  margin: 0 0 6px;
  font-size: 22px;
  font-family: var(--bo-font-display);
}

.sub {
  margin: 0;
  font-size: 14px;
  color: var(--bo-text-secondary);
}

.head-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
}

.maxl {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.inp-sm {
  width: 56px;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid var(--bo-border);
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1px;
  padding: 0;
  overflow: hidden;
}

.stat {
  padding: 16px;
  text-align: center;
  background: var(--bo-surface);
}

.stat__v {
  display: block;
  font-size: 22px;
  font-weight: 700;
  font-family: var(--bo-font-display);
}

.stat__k {
  font-size: 12px;
  color: var(--bo-text-secondary);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.block {
  padding: 20px;
}

.block h3 {
  margin: 0 0 12px;
  font-size: 16px;
}

.block--notes {
  margin-bottom: 0;
}

.block--notes .hint {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--bo-text-secondary);
}

.block--alert {
  border-color: #fcd34d;
  background-color: #fffbeb;
}

.block--alert h3 {
  color: #b45309;
}

.alert-content p {
  margin: 0 0 8px;
  font-size: 14px;
  color: #92400e;
}

.alert-actions {
  margin-top: 12px;
}

.ta-notes {
  width: 100%;
  margin-bottom: 10px;
  resize: vertical;
  min-height: 72px;
}

.btn--sm {
  padding: 8px 14px;
  font-size: 13px;
}

.block h4 {
  margin: 16px 0 8px;
  font-size: 14px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 12px;
  font-weight: 600;
}

.inp {
  padding: 10px 12px;
  border: 1px solid var(--bo-border);
  border-radius: var(--bo-radius-sm);
  font-size: 14px;
}

.row2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--bo-border);
  background: var(--bo-page);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.chip.on {
  border-color: var(--bo-brand);
  background: var(--bo-brand-soft);
  color: var(--bo-brand-hover);
}

.docs {
  list-style: none;
  margin: 0;
  padding: 0;
}

.docs li {
  padding: 8px 0;
  font-size: 14px;
  color: #9ca3af;
}

.docs li.ok {
  color: #059669;
}

.docs li::before {
  content: '○ ';
}

.docs li.ok::before {
  content: '✓ ';
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.btn {
  padding: 10px 14px;
  border-radius: var(--bo-radius-sm);
  border: none;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}

.btn--go {
  background: var(--bo-brand);
  color: #fff;
}

.btn--sec {
  background: var(--bo-page);
  border: 1px solid var(--bo-border);
}

.btn--danger {
  background: #dc2626;
  color: #fff;
}

.btn--warn {
  background: #f59e0b;
  color: #fff;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ta {
  width: 100%;
  min-height: 72px;
}

.modal {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
  padding: 20px;
}

.modal__box {
  width: min(440px, 100%);
  padding: 22px;
}

.modal__act {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}
</style>
