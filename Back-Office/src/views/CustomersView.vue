<template>
  <div class="page">
    <div class="page__head card">
      <div>
        <h2 class="page__title">Gestão de clientes</h2>
        <p class="page__desc">
          RF31 — contacto, cidade, encomendas, gasto total, última encomenda e avaliação média. CRUD completo; totais derivados dos
          pedidos podem ser sincronizados.
        </p>
      </div>
      <div class="head-actions">
        <button type="button" class="btn-sync" @click="doSync">Sincronizar totais (pedidos)</button>
        <button type="button" class="btn-primary" @click="openAdd">+ Novo cliente</button>
      </div>
    </div>

    <div class="toolbar card">
      <input v-model="q" type="search" class="search" placeholder="Pesquisar nome, email ou cidade…" />
    </div>

    <div class="table-wrap card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Contacto</th>
            <th>NIF</th>
            <th>Cidade / Zona</th>
            <th>Encomendas</th>
            <th>Gasto total</th>
            <th>Última encomenda</th>
            <th>Aval. média</th>
            <th class="th-actions">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filtered.length">
            <td colspan="9" class="empty-cell">Sem clientes na lista ou na pesquisa.</td>
          </tr>
          <tr v-for="c in filtered" :key="c.id">
            <td>
              <div class="strong">{{ c.name }}</div>
              <div class="muted mono">{{ c.id }}</div>
            </td>
            <td>
              <div>{{ c.email }}</div>
              <div class="muted">{{ c.phone }}</div>
            </td>
            <td class="mono muted">{{ c.nif || '—' }}</td>
            <td>
              <div>{{ c.city }}</div>
              <div class="muted">{{ c.zone }}</div>
            </td>
            <td>{{ c.ordersCount }}</td>
            <td>{{ formatMoney(c.totalSpent) }}</td>
            <td class="muted">{{ c.lastOrderAt?.slice(0, 10) || '—' }}</td>
            <td>
              <span class="stars">{{ (Number(c.avgRating) || 0).toFixed(1) }} ★</span>
            </td>
            <td class="actions">
              <button type="button" class="link-btn" @click="openView(c)">Ver</button>
              <button type="button" class="link-btn" @click="openEdit(c)">Editar</button>
              <button type="button" class="link-btn link-btn--danger" @click="confirmDelete(c)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div
        v-if="viewCustomer"
        class="modal-backdrop"
        role="dialog"
        aria-modal="true"
        @click.self="viewCustomer = null"
        @keydown.escape="viewCustomer = null"
      >
        <div class="modal card modal--view" @keydown.stop>
          <h3 class="modal__title">{{ viewCustomer.name }}</h3>
          <dl class="dl">
            <dt>ID</dt>
            <dd class="mono">{{ viewCustomer.id }}</dd>
            <dt>Email</dt>
            <dd>{{ viewCustomer.email }}</dd>
            <dt>Telefone</dt>
            <dd>{{ viewCustomer.phone || '—' }}</dd>
            <dt>NIF</dt>
            <dd class="mono">{{ viewCustomer.nif || '—' }}</dd>
            <dt>Comunicações comerciais</dt>
            <dd>{{ viewCustomer.marketingOptIn ? 'Aceites' : 'Recusadas' }}</dd>
            <dt>Notas internas</dt>
            <dd class="notes-dd">{{ viewCustomer.notes || '—' }}</dd>
            <dt>Cidade</dt>
            <dd>{{ viewCustomer.city }}</dd>
            <dt>Zona</dt>
            <dd>{{ viewCustomer.zone }}</dd>
            <dt>Encomendas (painel)</dt>
            <dd>{{ viewCustomer.ordersCount }}</dd>
            <dt>Gasto total (entregues)</dt>
            <dd>{{ formatMoney(viewCustomer.totalSpent) }}</dd>
            <dt>Última encomenda</dt>
            <dd>{{ viewCustomer.lastOrderAt?.slice(0, 19).replace('T', ' ') || '—' }}</dd>
            <dt>Avaliação média</dt>
            <dd>{{ (Number(viewCustomer.avgRating) || 0).toFixed(1) }} / 5</dd>
          </dl>
          <div class="modal__actions">
            <button type="button" class="btn btn--sec" @click="viewCustomer = null">Fechar</button>
            <button type="button" class="btn btn--go" @click="openEditFromView">Editar</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="formOpen"
        class="modal-backdrop"
        role="dialog"
        aria-modal="true"
        @click.self="closeForm"
        @keydown.escape="closeForm"
      >
        <div class="modal card" @keydown.stop>
          <h3 class="modal__title">{{ editingId ? 'Editar cliente' : 'Novo cliente' }}</h3>
          <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
          <form class="modal__form" novalidate @submit.prevent="submitForm">
            <label for="bo-c-name">Nome</label>
            <input id="bo-c-name" v-model="form.name" type="text" class="inp" autocomplete="name" />
            <label for="bo-c-email">Email</label>
            <input id="bo-c-email" v-model="form.email" type="email" class="inp" autocomplete="email" />
            <label for="bo-c-phone">Telefone</label>
            <input id="bo-c-phone" v-model="form.phone" type="tel" class="inp" autocomplete="tel" />
            <label for="bo-c-nif">NIF (opcional)</label>
            <input id="bo-c-nif" v-model="form.nif" type="text" class="inp" inputmode="numeric" autocomplete="off" />
            <label for="bo-c-city">Cidade</label>
            <input id="bo-c-city" v-model="form.city" type="text" class="inp" />
            <label for="bo-c-zone">Zona</label>
            <select id="bo-c-zone" v-model="form.zone" class="inp">
              <option v-for="z in ZONES" :key="z" :value="z">{{ z }}</option>
            </select>
            <label for="bo-c-rating">Avaliação média (0–5)</label>
            <input id="bo-c-rating" v-model.number="form.avgRating" type="number" min="0" max="5" step="0.1" class="inp" />
            <label class="check-row">
              <input v-model="form.marketingOptIn" type="checkbox" />
              Consente comunicações comerciais (opt-in)
            </label>
            <label for="bo-c-notes">Notas internas (só painel)</label>
            <textarea id="bo-c-notes" v-model="form.notes" class="inp notes-ta" rows="2" placeholder="Preferências de entrega, alertas…" />
            <p class="form-hint">
              RF31: contacto, cidade, nº encomendas, gasto total, última encomenda e avaliação. Os três primeiros totais vêm dos
              pedidos (botão «Sincronizar» ou ao marcar entregue); a avaliação podes ajustar aqui.
            </p>
            <div class="modal__actions">
              <button type="button" class="btn btn--sec" @click="closeForm">Cancelar</button>
              <button type="submit" class="btn btn--go">{{ editingId ? 'Guardar' : 'Criar' }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue';
import {
  logistics,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  refreshCustomerAggregatesFromOrders,
  syncOperationalAggregatesFromOrders,
  getCustomerById,
} from '../stores/logisticsStore.js';
import { ZONES } from '../constants/logistics.js';
import { toast } from '../utils/notify.js';

const q = ref('');
const viewCustomer = ref(null);
const formOpen = ref(false);
const editingId = ref('');
const formError = ref('');

watch(formOpen, (open) => {
  if (open) {
    nextTick(() => document.getElementById('bo-c-name')?.focus());
  }
});

const form = reactive({
  name: '',
  email: '',
  phone: '',
  nif: '',
  city: '',
  zone: ZONES[0],
  avgRating: 4.5,
  marketingOptIn: false,
  notes: '',
});

const filtered = computed(() => {
  const s = q.value.trim().toLowerCase();
  const all = Array.isArray(logistics.customers) ? logistics.customers : [];
  if (!s) return all;
  return all.filter(
    (c) =>
      c.name.toLowerCase().includes(s) ||
      c.email.toLowerCase().includes(s) ||
      c.city.toLowerCase().includes(s) ||
      c.id.toLowerCase().includes(s)
  );
});

function formatMoney(n) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(Number(n) || 0);
}

function doSync() {
  const r = refreshCustomerAggregatesFromOrders();
  syncOperationalAggregatesFromOrders();
  toast(r.ok ? 'Totais de clientes e gráficos operacionais atualizados.' : 'Erro', r.ok ? 'success' : 'error');
}

function openAdd() {
  editingId.value = '';
  formError.value = '';
  form.name = '';
  form.email = '';
  form.phone = '';
  form.nif = '';
  form.city = '';
  form.zone = ZONES[0];
  form.avgRating = 4.5;
  form.marketingOptIn = false;
  form.notes = '';
  formOpen.value = true;
}

function openEdit(c) {
  const live = getCustomerById(c.id) || c;
  editingId.value = live.id;
  formError.value = '';
  form.name = live.name;
  form.email = live.email;
  form.phone = live.phone || '';
  form.nif = live.nif || '';
  form.city = live.city || '';
  form.zone = live.zone || ZONES[0];
  form.avgRating = live.avgRating;
  form.marketingOptIn = !!live.marketingOptIn;
  form.notes = live.notes || '';
  formOpen.value = true;
}

function openView(c) {
  viewCustomer.value = getCustomerById(c.id) || c;
}

function openEditFromView() {
  if (!viewCustomer.value) return;
  const c = viewCustomer.value;
  viewCustomer.value = null;
  openEdit(c);
}

function closeForm() {
  formOpen.value = false;
  formError.value = '';
}

function submitForm() {
  formError.value = '';
  const name = (form.name || '').trim();
  const email = (form.email || '').trim().toLowerCase();
  if (!name) {
    formError.value = 'O nome é obrigatório.';
    toast(formError.value, 'error');
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    formError.value = 'Indica um email válido.';
    toast(formError.value, 'error');
    return;
  }
  const ar = Number(form.avgRating);
  const avgRating = Number.isFinite(ar) ? Math.min(5, Math.max(0, ar)) : 0;
  if (editingId.value) {
    const r = updateCustomer(editingId.value, {
      name,
      email,
      phone: form.phone,
      nif: form.nif,
      city: form.city,
      zone: form.zone,
      avgRating,
      marketingOptIn: form.marketingOptIn,
      notes: form.notes,
    });
    toast(r.ok ? 'Cliente atualizado.' : r.error || 'Erro.', r.ok ? 'success' : 'error');
    if (r.ok) closeForm();
    else if (r.error) formError.value = r.error;
  } else {
    const r = addCustomer({
      name,
      email,
      phone: form.phone,
      nif: form.nif,
      city: form.city,
      zone: form.zone,
      avgRating,
      marketingOptIn: form.marketingOptIn,
      notes: form.notes,
    });
    toast(r.ok ? 'Cliente criado.' : r.error || 'Erro.', r.ok ? 'success' : 'error');
    if (r.ok) closeForm();
    else if (r.error) formError.value = r.error;
  }
}

function confirmDelete(c) {
  if (!window.confirm(`Eliminar o cliente «${c.name}»? Só é permitido se não houver pedidos associados.`)) return;
  const r = deleteCustomer(c.id);
  toast(r.ok ? 'Cliente eliminado.' : r.error, r.ok ? 'success' : 'error');
  if (viewCustomer.value?.id === c.id) viewCustomer.value = null;
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  background: var(--bo-surface);
  border-radius: var(--bo-radius-lg);
  border: 1px solid var(--bo-border);
  box-shadow: var(--bo-shadow);
}

.page__head {
  padding: 20px 22px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.head-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.page__title {
  margin: 0 0 6px;
  font-size: 20px;
  font-family: var(--bo-font-display);
}

.page__desc {
  margin: 0;
  font-size: 14px;
  color: var(--bo-text-secondary);
  max-width: 720px;
  line-height: 1.5;
}

.btn-primary {
  padding: 10px 16px;
  border: none;
  border-radius: var(--bo-radius-sm);
  background: var(--bo-brand);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-sync {
  padding: 10px 16px;
  border: 1px solid var(--bo-border);
  border-radius: var(--bo-radius-sm);
  background: var(--bo-page);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  color: var(--bo-text);
}

.toolbar {
  padding: 12px 16px;
}

.search {
  width: 100%;
  max-width: 400px;
  padding: 10px 14px;
  border-radius: var(--bo-radius-sm);
  border: 1px solid var(--bo-border);
  font-size: 14px;
}

.table-wrap {
  overflow: auto;
  padding: 0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th,
.data-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid var(--bo-border);
  vertical-align: top;
}

.data-table th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--bo-text-secondary);
  background: var(--bo-page);
}

.th-actions {
  width: 200px;
}

.strong {
  font-weight: 600;
}

.muted {
  font-size: 12px;
  color: var(--bo-text-secondary);
}

.mono {
  font-family: ui-monospace, monospace;
  font-size: 11px;
}

.stars {
  font-weight: 700;
  color: #d97706;
}

.actions {
  white-space: nowrap;
}

.link-btn {
  border: none;
  background: none;
  color: var(--bo-brand);
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  margin-right: 8px;
  padding: 0;
}

.link-btn--danger {
  color: #b91c1c;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 12000;
  padding: 24px;
}

.form-error {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: var(--bo-radius-sm);
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  font-size: 13px;
  font-weight: 600;
}

.empty-cell {
  text-align: center;
  padding: 32px 20px !important;
  color: var(--bo-text-secondary);
  font-size: 14px;
}

.modal {
  width: 100%;
  max-width: 440px;
  padding: 22px 24px;
}

.modal--view {
  max-width: 480px;
}

.modal__title {
  margin: 0 0 16px;
  font-size: 18px;
}

.dl {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 8px 16px;
  margin: 0 0 18px;
  font-size: 14px;
}

.dl dt {
  margin: 0;
  font-weight: 600;
  color: var(--bo-text-secondary);
}

.dl dd {
  margin: 0;
}

.modal__form {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.modal__form label {
  font-size: 12px;
  font-weight: 600;
  margin-top: 8px;
}

.form-hint {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--bo-text-secondary);
  line-height: 1.45;
}

.inp {
  border: 1px solid var(--bo-border);
  border-radius: var(--bo-radius-sm);
  padding: 10px 12px;
  font-size: 14px;
}

.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.btn {
  padding: 10px 16px;
  border-radius: var(--bo-radius-sm);
  border: none;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}

.btn--go {
  background: var(--bo-brand);
  color: #fff;
}

.btn--sec {
  background: var(--bo-page);
  border: 1px solid var(--bo-border);
  color: var(--bo-text);
}



.notes-dd {
  white-space: pre-wrap;
  color: var(--bo-text-secondary);
}

.notes-ta {
  resize: vertical;
  min-height: 56px;
}

.check-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.check-row input {
  width: 18px;
  height: 18px;
}
</style>
