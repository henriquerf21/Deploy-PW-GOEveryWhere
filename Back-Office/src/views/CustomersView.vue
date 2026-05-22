<template>
  <div class="bo-page">
    <header class="bo-page-head">
      <div class="bo-page-head__main">
        <p class="bo-page-head__eyebrow">Operações</p>
        <h1 class="bo-page-head__title">Clientes</h1>
      </div>
      <!-- Botões de ação removidos (Sincronizar / Novo cliente) -->
    </header>

    <section class="bo-card bo-card--padded">
      <div class="bo-row" style="gap: 16px; align-items: flex-end;">
        <div class="bo-field" style="flex: 1; max-width: 380px;">
          <label class="bo-field__label">Pesquisa</label>
          <input v-model="q" type="search" class="bo-input" placeholder="Nome, email, NIF ou cidade..." />
        </div>
        <div style="flex: 1;"></div>
        <span class="bo-badge bo-badge--info">{{ filtered.length }} cliente(s)</span>
      </div>
    </section>

    <div class="bo-table-wrap">
      <table class="bo-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Contacto</th>
            <th>NIF</th>
            <th>Cidade / Zona</th>
            <th>Encomendas</th>
            <th>Gasto</th>
            <th>Última</th>
            <th>Aval.</th>
            <th class="col-actions"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filtered.length">
            <td colspan="9" class="bo-table__empty">
              <div class="bo-empty">
                <h3 class="bo-empty__title">Sem clientes</h3>
                <p class="bo-empty__hint">Nenhum cliente encontrado. Ajusta a pesquisa ou aguarda novos registos via Front-Office.</p>
              </div>
            </td>
          </tr>
          <tr v-for="c in filtered" :key="c.id">
            <td>
              <div class="customer-cell">
                <div class="bo-avatar">{{ initials(c.name) }}</div>
                <div>
                  <div class="bo-table__primary">{{ c.name }}</div>
                  <div class="bo-table__secondary bo-mono">{{ c.id }}</div>
                </div>
              </div>
            </td>
            <td>
              <div>{{ c.email }}</div>
              <div class="bo-table__secondary">{{ c.phone || '—' }}</div>
            </td>
            <td class="bo-mono bo-muted">{{ c.nif || '—' }}</td>
            <td>
              <div>{{ c.city || '—' }}</div>
              <div class="bo-table__secondary">{{ c.zone }}</div>
            </td>
            <td class="bo-num">{{ c.ordersCount }}</td>
            <td class="bo-num">{{ formatMoney(c.totalSpent) }}</td>
            <td class="bo-mono bo-muted">{{ c.lastOrderAt?.slice(0, 10) || '—' }}</td>
            <td>
              <span class="bo-badge bo-badge--brand">{{ (Number(c.avgRating) || 0).toFixed(1) }} / 5</span>
            </td>
            <td class="bo-table__actions">
              <button type="button" class="bo-btn bo-btn--ghost bo-btn--sm" @click="openView(c)">Ver</button>
              <button type="button" class="bo-btn bo-btn--outline bo-btn--sm" @click="openEdit(c)">Editar</button>
              <button type="button" class="bo-btn bo-btn--danger bo-btn--sm" @click="confirmDelete(c)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div v-if="viewCustomer" class="bo-modal-backdrop" role="dialog" aria-modal="true" @click.self="viewCustomer = null">
        <div class="bo-modal bo-modal--lg">
          <header class="bo-modal__head">
            <div>
              <h3 class="bo-modal__title">{{ viewCustomer.name }}</h3>
              <p class="bo-modal__sub">Ficha de cliente. Avaliação calculada a partir das reviews.</p>
            </div>
            <button type="button" class="bo-modal__close" @click="viewCustomer = null">×</button>
          </header>
          <div class="bo-modal__body bo-stack">
              <dl class="bo-dl">
              <dt>ID</dt><dd class="bo-mono">{{ viewCustomer.id }}</dd>
              <dt>Email</dt><dd>{{ viewCustomer.email }}</dd>
              <dt>Telefone</dt><dd>{{ viewCustomer.phone || '—' }}</dd>
              <dt>NIF</dt><dd class="bo-mono">{{ viewCustomer.nif || '—' }}</dd>
              <dt>Cidade</dt><dd>{{ viewCustomer.city }}</dd>
              <dt>Zona</dt><dd>{{ viewCustomer.zone }}</dd>
              <dt>Marketing opt-in</dt><dd>{{ viewCustomer.marketingOptIn ? 'Aceites' : 'Recusadas' }}</dd>
              <dt>Notas internas</dt><dd>{{ viewCustomer.notes || '—' }}</dd>
              <dt>Encomendas</dt><dd>{{ viewCustomer.ordersCount }}</dd>
              <dt>Gasto total (entregues)</dt><dd>{{ formatMoney(viewCustomer.totalSpent) }}</dd>
              <dt>GO Points</dt><dd class="bo-mono" style="color: var(--bo-brand); font-weight: 700;">{{ viewCustomer.goPoints || 0 }} pts</dd>
              <dt>Última encomenda</dt><dd>{{ viewCustomer.lastOrderAt?.slice(0, 19).replace('T', ' ') || '—' }}</dd>
              <dt>Avaliação média</dt><dd>{{ (Number(viewCustomer.avgRating) || 0).toFixed(1) }} / 5</dd>
            </dl>

            <div class="customer-orders">
              <div class="customer-orders__head">
                <h4 class="customer-orders__title">Histórico de pedidos</h4>
                <span class="bo-badge bo-badge--neutral">{{ customerOrders.length }} pedidos</span>
              </div>
              <table v-if="customerOrders.length" class="bo-table bo-table--compact">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Data</th>
                    <th>Estado</th>
                    <th>Loja</th>
                    <th class="bo-text-right">Total</th>
                    <th>Avaliação</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="o in customerOrders" :key="o.id">
                    <td>
                      <RouterLink :to="`/orders/${o.id}`" class="bo-link bo-mono">{{ o.id }}</RouterLink>
                    </td>
                    <td class="bo-mono bo-muted">{{ formatOrderDate(o.createdAt) }}</td>
                    <td><span class="bo-badge" :class="orderStatusBadgeClass(o.status)">{{ orderStatusLabels[o.status] || o.status }}</span></td>
                    <td class="bo-muted">{{ o.storeName || '—' }}</td>
                    <td class="bo-text-right">{{ o.costEuro != null ? o.costEuro.toFixed(2) + ' €' : '—' }}</td>
                    <td>
                      <span v-if="o.rating != null" class="bo-badge bo-badge--brand">{{ o.rating.toFixed(1) }} / 5</span>
                      <span v-else class="bo-muted" style="font-size: 12px;">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <p v-else class="bo-muted" style="font-size: 13px;">Este cliente ainda não tem pedidos.</p>
            </div>
          </div>
          <footer class="bo-modal__foot">
            <button type="button" class="bo-btn bo-btn--ghost" @click="viewCustomer = null">Fechar</button>
            <button type="button" class="bo-btn bo-btn--primary" @click="openEditFromView">Editar</button>
          </footer>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="formOpen" class="bo-modal-backdrop" role="dialog" aria-modal="true" @click.self="closeForm" @keydown.escape="closeForm">
        <div class="bo-modal bo-modal--lg">
          <header class="bo-modal__head">
            <div>
              <h3 class="bo-modal__title">Editar cliente</h3>
              <p class="bo-modal__sub">Os campos com * são obrigatórios.</p>
            </div>
            <button type="button" class="bo-modal__close" @click="closeForm">×</button>
          </header>
          <form class="bo-modal__body" novalidate @submit.prevent="submitForm">
            <div v-if="formError" class="form-error" role="alert">{{ formError }}</div>
            <div class="bo-form-grid bo-form-grid--2">
              <div class="bo-field">
                <label for="bo-c-name" class="bo-field__label">Nome <span class="bo-required">*</span></label>
                <input id="bo-c-name" v-model="form.name" type="text" class="bo-input" autocomplete="name" />
              </div>
              <div class="bo-field">
                <label for="bo-c-email" class="bo-field__label">Email <span class="bo-required">*</span></label>
                <input id="bo-c-email" v-model="form.email" type="email" class="bo-input" autocomplete="email" />
              </div>
              <div class="bo-field">
                <label for="bo-c-phone" class="bo-field__label">Telefone</label>
                <input id="bo-c-phone" v-model="form.phone" type="tel" class="bo-input" autocomplete="tel" />
              </div>
              <div class="bo-field">
                <label for="bo-c-nif" class="bo-field__label">NIF</label>
                <input id="bo-c-nif" v-model="form.nif" type="text" class="bo-input" inputmode="numeric" />
              </div>
              <div class="bo-field">
                <label for="bo-c-city" class="bo-field__label">Cidade</label>
                <input id="bo-c-city" v-model="form.city" type="text" class="bo-input" />
              </div>
              <div class="bo-field">
                <label for="bo-c-zone" class="bo-field__label">Zona</label>
                <select id="bo-c-zone" v-model="form.zone" class="bo-select">
                  <option v-for="z in ZONES" :key="z" :value="z">{{ z }}</option>
                </select>
              </div>
              <div class="bo-field bo-field--span2">
                <label class="bo-field__label">Avaliação média</label>
                <input :value="form.avgRating != null ? Number(form.avgRating).toFixed(1) : '—'" type="text" class="bo-input bo-input--readonly" disabled readonly />
                <span class="bo-field__hint">Calculada das reviews recebidas — não editável.</span>
              </div>
              <div class="bo-field bo-field--span2">
                <label class="bo-checkbox">
                  <input v-model="form.marketingOptIn" type="checkbox" />
                  Consente comunicações comerciais (opt-in)
                </label>
              </div>
              <div class="bo-field bo-field--span2">
                <label for="bo-c-notes" class="bo-field__label">Notas internas (apenas painel)</label>
                <textarea id="bo-c-notes" v-model="form.notes" class="bo-textarea" rows="2" placeholder="Preferências de entrega, alertas..." />
              </div>
            </div>
          </form>
          <footer class="bo-modal__foot">
            <button type="button" class="bo-btn bo-btn--ghost" @click="closeForm">Cancelar</button>
            <button type="button" class="bo-btn bo-btn--primary" @click="submitForm">Guardar alterações</button>
          </footer>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue';

import {
  logistics,
  updateCustomer,
  deleteCustomer,
  getCustomerById,
} from '../stores/logisticsStore.js';
import { ZONES, ORDER_STATUS, orderStatusLabels } from '../constants/logistics.js';
import { toast } from '../utils/notify.js';
import { validateEmail, validatePtNif, validatePtPhone } from '../utils/boPtValidation.js';

const q = ref('');
const viewCustomer = ref(null);
const formOpen = ref(false);
const editingId = ref('');
const formError = ref('');

watch(formOpen, (open) => {
  if (open) nextTick(() => document.getElementById('bo-c-name')?.focus());
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
      (c.city || '').toLowerCase().includes(s) ||
      (c.nif || '').toLowerCase().includes(s) ||
      c.id.toLowerCase().includes(s)
  );
});

function initials(name = '') {
  const p = String(name).split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  return (String(name).slice(0, 2) || 'CL').toUpperCase();
}

function formatMoney(n) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(Number(n) || 0);
}

const customerOrders = computed(() => Array.isArray(viewCustomer.value?.orders) ? viewCustomer.value.orders : []);

function formatOrderDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return String(iso).slice(0, 16).replace('T', ' ');
  }
}

function orderStatusBadgeClass(status) {
  switch (status) {
    case ORDER_STATUS.PENDING: return 'bo-badge--warn';
    case ORDER_STATUS.INFO_REQUESTED: return 'bo-badge--purple';
    case ORDER_STATUS.REJECTED: return 'bo-badge--danger';
    case ORDER_STATUS.APPROVED:
    case ORDER_STATUS.ASSIGNED: return 'bo-badge--info';
    case ORDER_STATUS.IN_TRANSIT: return 'bo-badge--brand';
    case ORDER_STATUS.DELIVERED: return 'bo-badge--success';
    default: return 'bo-badge--neutral';
  }
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

async function submitForm() {
  formError.value = '';
  const name = (form.name || '').trim();
  if (!name) { formError.value = 'Nome obrigatório.'; toast(formError.value, 'error'); return; }
  const email = validateEmail(form.email);
  if (!email.ok) { formError.value = email.error; toast(formError.value, 'error'); return; }
  const phone = validatePtPhone(form.phone);
  if (!phone.ok) { formError.value = phone.error; toast(formError.value, 'error'); return; }
  const nifRaw = (form.nif || '').trim();
  if (nifRaw) {
    const nif = validatePtNif(nifRaw);
    if (!nif.ok) { formError.value = nif.error; toast(formError.value, 'error'); return; }
  }
  const payload = {
    name,
    email: email.value,
    phone: form.phone,
    nif: form.nif,
    city: form.city,
    zone: form.zone,
    marketingOptIn: form.marketingOptIn,
    notes: form.notes,
  };
  if (!editingId.value) return;
  const r = await updateCustomer(editingId.value, payload);
  toast(r.ok ? 'Cliente atualizado.' : r.error || 'Erro.', r.ok ? 'success' : 'error');
  if (r.ok) closeForm();
  else if (r.error) formError.value = r.error;
}

async function confirmDelete(c) {
  if (!window.confirm(`Eliminar o cliente «${c.name}»? Só é permitido se não houver pedidos associados.`)) return;
  const r = await deleteCustomer(c.id);
  toast(r.ok ? 'Cliente eliminado.' : r.error, r.ok ? 'success' : 'error');
  if (viewCustomer.value?.id === c.id) viewCustomer.value = null;
}
</script>

<style scoped>
.col-actions { width: 220px; text-align: right; }

.customer-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-error {
  margin: 0 0 14px;
  padding: 10px 14px;
  border-radius: var(--bo-radius-sm);
  background: var(--bo-danger-soft);
  color: var(--bo-danger);
  border: 1px solid #fecaca;
  font-size: 13px;
  font-weight: 600;
}

.customer-orders {
  border-top: 1px solid var(--bo-border, #e2e8f0);
  padding-top: 14px;
  margin-top: 6px;
}

.customer-orders__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.customer-orders__title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--bo-text-secondary, #64748b);
}
</style>
