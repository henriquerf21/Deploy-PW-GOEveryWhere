<template>
  <div class="page">
    <div class="page__head card">
      <div>
        <h2 class="page__title">Gestão de Produtos</h2>
        <p class="page__desc">
          Catálogo com marca, EAN, descrição curta e limiar de stock baixo (alerta na grelha quando ativo e stock ≤ limiar).
        </p>
      </div>
      <button type="button" class="btn-primary" @click="openAdd">
        <Plus :size="18" />
        Adicionar produto
      </button>
    </div>

    <div class="kpis">
      <div v-for="k in kpis" :key="k.label" class="kpi-mini card">
        <component :is="k.icon" class="kpi-mini__icon" :size="20" />
        <div>
          <p class="kpi-mini__val">{{ k.value }}</p>
          <p class="kpi-mini__label">{{ k.label }}</p>
        </div>
      </div>
    </div>

    <div class="toolbar card">
      <Search class="toolbar__icon" :size="18" />
      <input v-model="q" type="search" class="toolbar__input" placeholder="Pesquisar produtos..." />
    </div>

    <div class="table-wrap card">
      <table class="data-table">
        <thead>
          <tr>
            <th class="th-thumb" scope="col">Imagem</th>
            <th>Produto</th>
            <th>SKU</th>
            <th>Marca</th>
            <th>Categoria</th>
            <th>Stock</th>
            <th>Preço</th>
            <th>Estado</th>
            <th class="th-actions">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filtered.length">
            <td colspan="9" class="empty-cell">Sem produtos. Clica em «Adicionar produto» para criar o primeiro.</td>
          </tr>
          <tr v-for="row in filtered" :key="row.sku">
            <td class="td-thumb">
              <img
                class="prod-thumb"
                :src="resolveProductImage(row)"
                :alt="`Imagem: ${row.name}`"
                width="44"
                height="44"
                loading="lazy"
                decoding="async"
                @error="onThumbError"
              />
            </td>
            <td>
              <span class="cell-strong">{{ row.name }}</span>
              <div v-if="row.description" class="cell-desc">{{ row.description }}</div>
            </td>
            <td class="muted mono-sm">{{ row.sku }}</td>
            <td>{{ row.brand || '—' }}</td>
            <td>{{ row.category }}</td>
            <td>
              <span :class="{ 'stock-warn': isLowStock(row), 'stock-out': row.active && !row.stock }">
                {{ row.stock }}
              </span>
              <span v-if="isLowStock(row)" class="stock-badge">Baixo</span>
              <span v-else-if="row.active && !row.stock" class="stock-badge stock-badge--out">Esgotado</span>
            </td>
            <td>{{ formatPrice(row.price) }}</td>
            <td>
              <button type="button" class="badge-btn" :class="row.active ? 'badge--ok' : 'badge--off'" @click="toggleActive(row)">
                {{ row.active ? 'Ativo' : 'Inativo' }}
              </button>
            </td>
            <td class="actions">
              <button type="button" class="link-btn" @click="openEdit(row)">Editar</button>
              <button type="button" class="link-btn link-btn--danger" @click="removeProduct(row)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div
        v-if="modalOpen"
        class="modal-backdrop"
        role="dialog"
        aria-modal="true"
        @click.self="closeModal"
        @keydown.escape="closeModal"
      >
        <div class="modal modal--wide card" @keydown.stop>
          <h3 class="modal__title">{{ editingSku ? 'Editar produto' : 'Novo produto' }}</h3>
          <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
          <form class="modal__form" novalidate @submit.prevent="submitModal">
            <label for="bo-p-name">Nome</label>
            <input id="bo-p-name" v-model="form.name" class="inp" type="text" autocomplete="off" />
            <label for="bo-p-sku">SKU</label>
            <input id="bo-p-sku" v-model="form.sku" class="inp" type="text" :disabled="!!editingSku" autocomplete="off" />
            <label for="bo-p-brand">Marca</label>
            <input id="bo-p-brand" v-model="form.brand" class="inp" type="text" autocomplete="off" />
            <label for="bo-p-cat">Categoria</label>
            <input id="bo-p-cat" v-model="form.category" class="inp" type="text" />
            <label for="bo-p-desc">Descrição curta</label>
            <textarea id="bo-p-desc" v-model="form.description" class="inp ta-sm" rows="2" placeholder="Uma linha para listagens e SEO interno" />
            <label for="bo-p-ean">EAN / código de barras (opcional)</label>
            <input id="bo-p-ean" v-model="form.ean" class="inp" type="text" inputmode="numeric" autocomplete="off" />
            <label for="bo-p-low">Alerta stock baixo (unidades, 0 = desligado)</label>
            <input id="bo-p-low" v-model.number="form.lowStockThreshold" type="number" min="0" step="1" class="inp" />
            <label for="bo-p-stock">Stock</label>
            <input id="bo-p-stock" v-model.number="form.stock" type="number" min="0" step="1" class="inp" />
            <label for="bo-p-price">Preço (€)</label>
            <input id="bo-p-price" v-model.number="form.price" type="number" step="0.01" min="0" class="inp" />
            <label for="bo-p-img">URL ou ficheiro em <code class="code-hint">public/</code> (opcional)</label>
            <input
              id="bo-p-img"
              v-model="form.imageUrl"
              class="inp"
              type="text"
              inputmode="url"
              placeholder="media/gogummies/product-detail.png ou https://…"
              autocomplete="off"
            />
            <div class="modal__actions">
              <button type="button" class="btn btn--sec" @click="closeModal">Cancelar</button>
              <button type="submit" class="btn btn--go">{{ editingSku ? 'Guardar' : 'Adicionar' }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { Plus, Search, Package, Layers, AlertTriangle } from 'lucide-vue-next';
import { logistics, addProduct, updateProduct, deleteProduct } from '../stores/logisticsStore.js';
import { toast } from '../utils/notify.js';

const defaultThumb = `${import.meta.env.BASE_URL}media/gogummies/product-detail.png`;

const q = ref('');
const modalOpen = ref(false);
const editingSku = ref('');
const formError = ref('');

watch(modalOpen, (open) => {
  if (open) {
    nextTick(() => document.getElementById('bo-p-name')?.focus());
  }
});

const form = reactive({
  name: '',
  sku: '',
  brand: 'GoGummies',
  category: 'Geral',
  description: '',
  ean: '',
  lowStockThreshold: 0,
  stock: 0,
  price: 0,
  imageUrl: '',
});

const activeCount = computed(() => logistics.products.filter((p) => p.active).length);
const categoriesCount = computed(() => new Set(logistics.products.map((p) => p.category || 'Geral')).size);

const totalSkus = computed(() => logistics.products.length);

const lowStockCount = computed(() =>
  logistics.products.filter((p) => {
    if (!p.active) return false;
    const th = Number(p.lowStockThreshold);
    if (!Number.isFinite(th) || th <= 0) return false;
    return Number(p.stock) <= th;
  }).length
);

const kpis = computed(() => [
  { label: 'Ativos agora', value: String(activeCount.value), icon: Package },
  { label: 'Categorias', value: String(categoriesCount.value), icon: Layers },
  { label: 'Total SKU', value: String(totalSkus.value), icon: Package },
  { label: 'Stock baixo', value: String(lowStockCount.value), icon: AlertTriangle },
]);

const filtered = computed(() => {
  const s = q.value.trim().toLowerCase();
  const list = Array.isArray(logistics.products) ? logistics.products : [];
  if (!s) return list;
  return list.filter((r) => {
    const hay = [r.name, r.sku, r.category, r.brand, r.ean, r.description]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(s);
  });
});

function isLowStock(row) {
  if (!row.active) return false;
  const th = Number(row.lowStockThreshold);
  if (!Number.isFinite(th) || th <= 0) return false;
  return Number(row.stock) <= th;
}

function formatPrice(n) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(Number(n) || 0);
}

function resolveProductImage(row) {
  const u = (row.imageUrl || '').trim();
  if (!u) return defaultThumb;
  if (/^https?:\/\//i.test(u) || u.startsWith('data:')) return u;
  const path = u.replace(/^\.\//, '');
  if (path.startsWith('/')) return `${import.meta.env.BASE_URL}${path.slice(1)}`;
  return `${import.meta.env.BASE_URL}${path}`;
}

function onThumbError(e) {
  const el = e.target;
  if (el && el.src !== defaultThumb) el.src = defaultThumb;
}

function openAdd() {
  editingSku.value = '';
  formError.value = '';
  form.name = '';
  form.sku = `GG-${Date.now().toString(36).toUpperCase()}`;
  form.brand = 'GoGummies';
  form.category = 'Geral';
  form.description = '';
  form.ean = '';
  form.lowStockThreshold = 50;
  form.stock = 0;
  form.price = 9.99;
  form.imageUrl = 'media/gogummies/product-detail.png';
  modalOpen.value = true;
}

function openEdit(row) {
  editingSku.value = row.sku;
  formError.value = '';
  form.name = row.name;
  form.sku = row.sku;
  form.brand = row.brand || 'GoGummies';
  form.category = row.category || 'Geral';
  form.description = row.description || '';
  form.ean = row.ean || '';
  form.lowStockThreshold = Number(row.lowStockThreshold) || 0;
  form.stock = row.stock;
  form.price = row.price;
  form.imageUrl = row.imageUrl || '';
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
  formError.value = '';
}

function submitModal() {
  formError.value = '';
  const name = (form.name || '').trim();
  const sku = (form.sku || '').trim();
  if (!name) {
    formError.value = 'Indica o nome do produto.';
    toast(formError.value, 'error');
    return;
  }
  if (!sku) {
    formError.value = 'Indica o SKU (código único).';
    toast(formError.value, 'error');
    return;
  }
  const stock = Number(form.stock);
  const price = Number(form.price);
  if (!Number.isFinite(stock) || stock < 0) {
    formError.value = 'Stock tem de ser um número ≥ 0.';
    toast(formError.value, 'error');
    return;
  }
  if (!Number.isFinite(price) || price < 0) {
    formError.value = 'Preço tem de ser um número ≥ 0.';
    toast(formError.value, 'error');
    return;
  }
  const lowTh = Number(form.lowStockThreshold);
  if (!Number.isFinite(lowTh) || lowTh < 0) {
    formError.value = 'Limiar de stock tem de ser ≥ 0 (0 = sem alerta).';
    toast(formError.value, 'error');
    return;
  }
  const payloadExtra = {
    brand: (form.brand || '').trim() || 'GoGummies',
    description: (form.description || '').trim(),
    ean: (form.ean || '').trim(),
    lowStockThreshold: lowTh,
    category: form.category,
    imageUrl: (form.imageUrl || '').trim(),
  };
  if (editingSku.value) {
    const r = updateProduct(editingSku.value, {
      name,
      stock,
      price,
      ...payloadExtra,
    });
    toast(r.ok ? 'Produto atualizado.' : r.error || 'Erro ao guardar.', r.ok ? 'success' : 'error');
    if (r.ok) closeModal();
    else if (r.error) formError.value = r.error;
  } else {
    const r = addProduct({
      name,
      sku,
      stock,
      price,
      ...payloadExtra,
    });
    toast(r.ok ? 'Produto adicionado.' : r.error || 'Erro ao adicionar.', r.ok ? 'success' : 'error');
    if (r.ok) closeModal();
    else if (r.error) formError.value = r.error;
  }
}

function toggleActive(row) {
  const next = !row.active;
  const r = updateProduct(row.sku, { active: next });
  toast(r.ok ? (next ? 'Produto ativado.' : 'Produto desativado.') : r.error, r.ok ? 'success' : 'error');
}

function removeProduct(row) {
  if (!window.confirm(`Eliminar permanentemente o produto «${row.name}» (${row.sku})?`)) return;
  const r = deleteProduct(row.sku);
  toast(r.ok ? 'Produto eliminado.' : r.error, r.ok ? 'success' : 'error');
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.card {
  background: var(--bo-surface);
  border-radius: var(--bo-radius-lg);
  border: 1px solid var(--bo-border);
  box-shadow: var(--bo-shadow);
}

.page__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px;
}

.page__title {
  margin: 0 0 6px;
  font-family: var(--bo-font-display);
  font-size: 20px;
  font-weight: 700;
}

.page__desc {
  margin: 0;
  font-size: 14px;
  color: var(--bo-text-secondary);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border: none;
  border-radius: var(--bo-radius-sm);
  background: var(--bo-brand);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--bo-brand-hover);
}

.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
}

.kpi-mini {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
}

.kpi-mini__icon {
  color: var(--bo-brand);
}

.kpi-mini__val {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  font-family: var(--bo-font-display);
}

.kpi-mini__label {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--bo-text-secondary);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
}

.toolbar__icon {
  color: var(--bo-text-secondary);
  flex-shrink: 0;
}

.toolbar__input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  min-height: 36px;
}

.toolbar__input:focus {
  outline: none;
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
  padding: 14px 20px;
  text-align: left;
  border-bottom: 1px solid var(--bo-border);
}

.data-table th {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--bo-text-secondary);
  background: var(--bo-page);
}

.th-actions {
  min-width: 140px;
}

.th-thumb,
.td-thumb {
  width: 72px;
  vertical-align: middle;
}

.prod-thumb {
  display: block;
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: var(--bo-radius-sm);
  border: 1px solid var(--bo-border);
  background: var(--bo-page);
}

.code-hint {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 4px;
  border-radius: 4px;
  background: var(--bo-page);
}

.actions {
  white-space: nowrap;
}

.cell-strong {
  font-weight: 600;
}

.muted {
  color: var(--bo-text-secondary);
}

.badge-btn {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.badge--ok {
  background: #d1fae5;
  color: #047857;
}

.badge--off {
  background: #f3f4f6;
  color: #6b7280;
}

.link-btn {
  border: none;
  background: none;
  color: var(--bo-brand);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  margin-right: 10px;
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
  max-width: 460px;
  padding: 22px 24px;
}

.modal--wide {
  max-width: 520px;
}

.ta-sm {
  resize: vertical;
  min-height: 52px;
}

.cell-desc {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  font-weight: 400;
  color: var(--bo-text-secondary);
  line-height: 1.35;
  max-width: 280px;
}

.mono-sm {
  font-family: ui-monospace, monospace;
  font-size: 12px;
}

.stock-warn {
  font-weight: 800;
  color: #b45309;
}

.stock-out {
  font-weight: 800;
  color: #b91c1c;
}

.stock-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  background: #fef3c7;
  color: #b45309;
}

.stock-badge--out {
  background: #fee2e2;
  color: #b91c1c;
}

.modal__title {
  margin: 0 0 16px;
  font-size: 18px;
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
</style>
