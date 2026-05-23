<template>
  <div v-if="!c" class="bo-card bo-card--padded">
    <div class="bo-empty">
      <h3 class="bo-empty__title">Cliente não encontrado</h3>
      <p class="bo-empty__hint">Pode ter sido removido ou o ID está inválido.</p>
      <RouterLink to="/customers" class="bo-btn bo-btn--outline" style="margin-top: 12px;">Voltar à lista</RouterLink>
    </div>
  </div>

  <div v-else class="bo-page">
    <RouterLink to="/customers" class="back-link"><ArrowLeft :size="14" /> Voltar à lista de clientes</RouterLink>

    <header class="bo-page-head" style="margin-top: 16px;">
      <div class="bo-page-head__main" style="display: flex; gap: 16px; align-items: center;">
        <div class="bo-avatar bo-avatar--lg">{{ initials }}</div>
        <div>
          <p class="bo-page-head__eyebrow">Cliente · {{ c.id }}</p>
          <h1 class="bo-page-head__title">{{ c.name }}</h1>
          <p class="bo-page-head__sub">{{ c.email }} · {{ c.phone || 'Sem telemóvel' }}</p>
        </div>
      </div>
      <div class="bo-page-head__actions">
        <button type="button" class="bo-btn bo-btn--outline" @click="isEditing = !isEditing">
          {{ isEditing ? 'Cancelar edição' : 'Editar cliente' }}
        </button>
        <button type="button" class="bo-btn bo-btn--danger" @click="confirmDelete">Eliminar</button>
      </div>
    </header>

    <div class="bo-grid bo-grid--2">
      <section class="bo-card">
        <header class="bo-card__head">
          <div>
            <h3 class="bo-card__title">Dados pessoais e contacto</h3>
            <p class="bo-card__sub">Morada, NIF e preferências.</p>
          </div>
        </header>
        <div class="bo-card__body">
          <div v-if="isEditing" class="bo-form-grid bo-form-grid--2">
            <div class="bo-field"><label class="bo-field__label">Nome <span class="bo-required">*</span></label><input v-model="edit.name" class="bo-input" /></div>
            <div class="bo-field"><label class="bo-field__label">Email <span class="bo-required">*</span></label><input v-model="edit.email" type="email" class="bo-input" /></div>
            <div class="bo-field"><label class="bo-field__label">Telefone</label><input v-model="edit.phone" type="tel" class="bo-input" /></div>
            <div class="bo-field"><label class="bo-field__label">NIF</label><input v-model="edit.nif" class="bo-input" /></div>
            <div class="bo-field"><label class="bo-field__label">Cidade</label><input v-model="edit.city" class="bo-input" /></div>
            <div class="bo-field"><label class="bo-field__label">Zona</label>
              <select v-model="edit.zone" class="bo-select">
                <option v-for="z in ZONES" :key="z" :value="z">{{ z }}</option>
              </select>
            </div>
            <div class="bo-field bo-field--span2">
              <label class="bo-checkbox">
                <input v-model="edit.marketingOptIn" type="checkbox" /> Consente comunicações comerciais (opt-in)
              </label>
            </div>
          </div>
          <dl v-else class="bo-dl">
            <dt>Nome</dt><dd>{{ c.name }}</dd>
            <dt>Email</dt><dd>{{ c.email }}</dd>
            <dt>Telefone</dt><dd>{{ c.phone || '—' }}</dd>
            <dt>NIF</dt><dd class="bo-mono">{{ c.nif || '—' }}</dd>
            <dt>Cidade</dt><dd>{{ c.city || '—' }}</dd>
            <dt>Zona</dt><dd>{{ c.zone || '—' }}</dd>
            <dt>Marketing opt-in</dt><dd>{{ c.marketingOptIn ? 'Aceites' : 'Recusadas' }}</dd>
          </dl>
        </div>
        <div v-if="isEditing" class="bo-card__foot">
           <button type="button" class="bo-btn bo-btn--primary" @click="saveEdit">Guardar alterações</button>
        </div>
      </section>

      <section class="bo-card">
        <header class="bo-card__head">
          <div>
            <h3 class="bo-card__title">Resumo da conta</h3>
            <p class="bo-card__sub">Métricas de atividade do cliente.</p>
          </div>
        </header>
        <div class="bo-card__body">
          <dl class="bo-dl">
            <dt>Encomendas</dt><dd>{{ c.ordersCount }}</dd>
            <dt>Gasto total</dt><dd>{{ formatMoney(c.totalSpent) }}</dd>
            <dt>GO Points</dt><dd class="bo-mono" style="color: var(--bo-brand); font-weight: 700;">{{ c.goPoints || 0 }} pts</dd>
            <dt>Avaliação média</dt><dd>{{ (Number(c.avgRating) || 0).toFixed(1) }} / 5</dd>
            <dt>Última encomenda</dt><dd>{{ c.lastOrderAt?.slice(0, 19).replace('T', ' ') || '—' }}</dd>
          </dl>
        </div>
      </section>
    </div>

    <section class="bo-card">
      <header class="bo-card__head">
        <div>
          <h3 class="bo-card__title">Notas internas admin</h3>
          <p class="bo-card__sub">Visíveis apenas no painel de administração.</p>
        </div>
      </header>
      <div class="bo-card__body bo-stack">
        <textarea v-model="adminNotesDraft" class="bo-textarea" rows="3" placeholder="Preferências de entrega, alertas..." />
        <div class="bo-row bo-row--end">
          <button type="button" class="bo-btn bo-btn--outline bo-btn--sm" @click="saveAdminNotes">Guardar notas</button>
        </div>
      </div>
    </section>

    <section class="bo-card">
      <header class="bo-card__head">
        <div>
          <h3 class="bo-card__title">Histórico de pedidos</h3>
          <p class="bo-card__sub">Todos os pedidos efetuados por este cliente.</p>
        </div>
        <div class="bo-card__head-actions">
          <span class="bo-badge bo-badge--neutral">{{ customerOrders.length }} pedidos</span>
        </div>
      </header>
      <div class="bo-card__body">
        <table v-if="customerOrders.length" class="bo-table">
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
    </section>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft } from 'lucide-vue-next';
import {
  getCustomerById,
  updateCustomer,
  deleteCustomer
} from '../stores/logisticsStore.js';
import { ZONES, ORDER_STATUS, orderStatusLabels } from '../constants/logistics.js';
import { toast } from '../utils/notify.js';
import { validateEmail, validatePtNif, validatePtPhone } from '../utils/boPtValidation.js';

const route = useRoute();
const router = useRouter();

const c = computed(() => getCustomerById(route.params.id));
const isEditing = ref(false);

const initials = computed(() => {
  const n = c.value?.name || '';
  const p = n.split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  return (n.slice(0, 2) || 'CL').toUpperCase();
});

function formatMoney(n) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(Number(n) || 0);
}

const customerOrders = computed(() => Array.isArray(c.value?.orders) ? c.value.orders : []);

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

const edit = reactive({
  name: '',
  email: '',
  phone: '',
  nif: '',
  city: '',
  zone: '',
  marketingOptIn: false,
});

const adminNotesDraft = ref('');

watch(c, (x) => {
  if (!x) return;
  edit.name = x.name;
  edit.email = x.email;
  edit.phone = x.phone || '';
  edit.nif = x.nif || '';
  edit.city = x.city || '';
  edit.zone = x.zone || ZONES[0];
  edit.marketingOptIn = !!x.marketingOptIn;
  adminNotesDraft.value = x.notes || '';
}, { immediate: true });

async function saveEdit() {
  const name = (edit.name || '').trim();
  if (!name) { toast('Nome obrigatório.', 'error'); return; }
  const email = validateEmail(edit.email);
  if (!email.ok) { toast(email.error, 'error'); return; }
  const phone = validatePtPhone(edit.phone);
  if (!phone.ok) { toast(phone.error, 'error'); return; }
  const nifRaw = (edit.nif || '').trim();
  if (nifRaw) {
    const nif = validatePtNif(nifRaw);
    if (!nif.ok) { toast(nif.error, 'error'); return; }
  }

  const payload = {
    name,
    email: email.value,
    phone: edit.phone,
    nif: edit.nif,
    city: edit.city,
    zone: edit.zone,
    marketingOptIn: edit.marketingOptIn,
    notes: adminNotesDraft.value,
  };

  const r = await updateCustomer(c.value.id, payload);
  toast(r.ok ? 'Cliente atualizado.' : r.error || 'Erro.', r.ok ? 'success' : 'error');
  if (r.ok) {
    isEditing.value = false;
  }
}

async function saveAdminNotes() {
  const payload = { notes: adminNotesDraft.value };
  const r = await updateCustomer(c.value.id, payload);
  toast(r.ok ? 'Notas guardadas.' : r.error || 'Erro', r.ok ? 'success' : 'error');
}

async function confirmDelete() {
  if (!window.confirm(`Eliminar o cliente «${c.value.name}»? Só é permitido se não houver pedidos associados.`)) return;
  const r = await deleteCustomer(c.value.id);
  toast(r.ok ? 'Cliente eliminado.' : r.error, r.ok ? 'success' : 'error');
  if (r.ok) {
    router.push('/customers');
  }
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
</style>
