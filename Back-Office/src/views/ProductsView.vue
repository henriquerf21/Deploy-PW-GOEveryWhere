<template>
  <div class="page">
    <div class="page__head card">
      <div>
        <h2 class="page__title">Stock por Loja (Produto Único)</h2>
        <p class="page__desc">
          Gestão simplificada para operação GoEverywhere: um único produto global e stock distribuído pelos Continentes.
        </p>
      </div>
      <button type="button" class="btn btn--sec" @click="refreshAll">Atualizar</button>
    </div>

    <section class="card section">
      <div class="section__head">
        <h3>Configuração do Produto Global</h3>
      </div>
      <div class="product-row">
        <label class="lbl">Nome</label>
        <input v-model="globalProduct.name" class="inp" type="text" />
        <label class="lbl">SKU</label>
        <input v-model="globalProduct.sku" class="inp" type="text" />
        <label class="lbl">Descrição</label>
        <input v-model="globalProduct.desc" class="inp" type="text" />
        <label class="lbl">Gomas</label>
        <input v-model.number="globalProduct.gomas" class="inp" type="number" min="0" />
        <label class="lbl">Preço (€)</label>
        <input v-model.number="globalProduct.price" class="inp" type="number" min="0" step="0.01" />
        <label class="lbl">Desconto label</label>
        <input v-model="globalProduct.discountLabel" class="inp" type="text" placeholder="-10%" />
        <label class="lbl">Imagem URL</label>
        <input v-model="globalProduct.imageUrl" class="inp" type="text" />
        <label class="lbl">Ordem</label>
        <input v-model.number="globalProduct.sortOrder" class="inp" type="number" min="0" />
        <label class="lbl">Popular</label>
        <input v-model="globalProduct.popular" class="chk" type="checkbox" />
      </div>
      <div class="row-actions">
        <button type="button" class="btn btn--go" @click="saveGlobalProduct">Guardar produto no Strapi</button>
      </div>
      <p class="muted small">Este produto é usado no Front-Office (deixa de ser estático).</p>
      <div class="chips" v-if="logistics.products?.length">
        <button v-for="p in logistics.products" :key="p.id || p.sku" type="button" class="chip-btn" @click="selectCatalogProduct(p)">
          {{ p.name }} ({{ p.sku }})
        </button>
      </div>
    </section>

    <section class="card section">
      <div class="section__head">
        <h3>Lojas Continente</h3>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>Loja</th>
            <th>Cidade</th>
            <th>Distrito</th>
            <th>Formato</th>
            <th>Stock Atual</th>
            <th>Ponto Reposição</th>
            <th>Preço Loja</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="8" class="empty">Sem lojas carregadas.</td>
          </tr>
          <tr v-for="r in rows" :key="r.store.id">
            <td>
              <div class="name">{{ r.store.name }}</div>
              <div class="muted small">{{ r.store.address }}</div>
            </td>
            <td>{{ r.store.city }}</td>
            <td>{{ r.store.district }}</td>
            <td>{{ r.store.format }}</td>
            <td>
              <input v-model.number="r.stock" type="number" min="0" class="inp inp--sm" />
            </td>
            <td>
              <input v-model.number="r.reorderLevel" type="number" min="0" class="inp inp--sm" />
            </td>
            <td>
              <input v-model.number="r.price" type="number" min="0" step="0.01" class="inp inp--sm" />
            </td>
            <td>
              <button type="button" class="btn btn--go btn--sm" @click="saveRow(r)">Guardar</button>
              <button type="button" class="btn btn--sec btn--sm btn--ml" @click="openDetails(r.store)">Ver detalhes</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <Teleport to="body">
      <div v-if="detailsOpen && selectedStore" class="modal-backdrop" @click.self="closeDetails">
        <div class="modal card">
          <h3 class="modal__title">{{ selectedStore.name }}</h3>
          <p class="modal__subtitle">Detalhes obrigatórios do Continente (localização em destaque).</p>

          <div class="details-grid">
            <div><span class="k">Cidade</span><span>{{ selectedStore.city || '—' }}</span></div>
            <div><span class="k">Distrito</span><span>{{ selectedStore.district || '—' }}</span></div>
            <div><span class="k">Morada</span><span>{{ selectedStore.address || '—' }}</span></div>
            <div><span class="k">Código Postal</span><span>{{ selectedStore.postalCode || '—' }}</span></div>
            <div><span class="k">Horário</span><span>{{ selectedStore.openingHours || '—' }}</span></div>
            <div><span class="k">Telefone</span><span>{{ selectedStore.phone || '—' }}</span></div>
            <div><span class="k">Formato</span><span>{{ selectedStore.format || '—' }}</span></div>
            <div class="loc loc--lat"><span class="k">Latitude</span><span>{{ formatCoord(selectedStore.lat) }}</span></div>
            <div class="loc loc--lng"><span class="k">Longitude</span><span>{{ formatCoord(selectedStore.lng) }}</span></div>
          </div>

          <p v-if="missingRequiredFields(selectedStore).length" class="warn">
            Campos obrigatórios em falta:
            {{ missingRequiredFields(selectedStore).join(', ') }}.
          </p>

          <div class="modal-actions">
            <button type="button" class="btn btn--sec" @click="closeDetails">Fechar</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import {
  logistics,
  refreshStores,
  refreshProducts,
  addProduct,
  refreshStoreInventory,
  upsertStoreInventoryItem,
} from '../stores/logisticsStore.js';
import { toast } from '../utils/notify.js';

const SINGLE_DEFAULT = {
  name: 'GoGummies - Frasco',
  sku: 'GG-FRASCO-UNICO',
  price: 14.99,
};

const globalProduct = reactive({
  name: SINGLE_DEFAULT.name,
  sku: SINGLE_DEFAULT.sku,
  desc: '30 gomas proteicas',
  price: SINGLE_DEFAULT.price,
  gomas: 30,
  discountLabel: '',
  imageUrl: '',
  sortOrder: 10,
  popular: false,
});

const rows = ref([]);
const detailsOpen = ref(false);
const selectedStore = ref(null);

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function formatCoord(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(6);
}

function missingRequiredFields(store) {
  const required = [
    ['name', 'nome'],
    ['city', 'cidade'],
    ['district', 'distrito'],
    ['address', 'morada'],
    ['postalCode', 'código postal'],
    ['lat', 'latitude'],
    ['lng', 'longitude'],
    ['openingHours', 'horário'],
    ['phone', 'telefone'],
    ['format', 'formato'],
  ];
  return required
    .filter(([key]) => store?.[key] == null || String(store[key]).trim() === '')
    .map(([, label]) => label);
}

function openDetails(store) {
  selectedStore.value = store;
  detailsOpen.value = true;
}

function closeDetails() {
  detailsOpen.value = false;
  selectedStore.value = null;
}

async function buildRows() {
  const stores = logistics.stores || [];
  const out = [];

  for (const store of stores) {
    let inv = [];
    try {
      inv = await refreshStoreInventory(store.id);
    } catch {
      inv = [];
    }

    const matchBySku = inv.find((i) => i.sku === globalProduct.sku);
    const firstItem = inv[0] || null;
    const item = matchBySku || firstItem;

    out.push({
      store,
      stock: toNum(item?.stock, 0),
      reorderLevel: toNum(item?.reorderLevel, 10),
      price: toNum(item?.price, globalProduct.price),
      unit: item?.unit || 'un',
    });
  }

  rows.value = out;
}

async function refreshAll() {
  try {
    await refreshProducts();
    await refreshStores();
    if (logistics.products?.length) {
      selectCatalogProduct(logistics.products[0]);
    }
    await buildRows();
  } catch (e) {
    toast(e?.message || 'Falha ao carregar lojas.', 'error');
  }
}

function selectCatalogProduct(p) {
  if (!p) return;
  globalProduct.name = p.name || '';
  globalProduct.sku = p.sku || '';
  globalProduct.desc = p.desc || '';
  globalProduct.price = toNum(p.price, 0);
  globalProduct.gomas = toNum(p.gomas, 0);
  globalProduct.discountLabel = p.discountLabel || p.discount || '';
  globalProduct.imageUrl = p.imageUrl || '';
  globalProduct.sortOrder = toNum(p.sortOrder, 0);
  globalProduct.popular = !!p.popular;
}

async function saveGlobalProduct() {
  const sku = (globalProduct.sku || '').trim().toUpperCase();
  const name = (globalProduct.name || '').trim();
  if (!sku || !name) {
    toast('SKU e nome do produto são obrigatórios.', 'error');
    return;
  }
  try {
    await addProduct({
      sku,
      name,
      desc: (globalProduct.desc || '').trim(),
      price: Math.max(0, toNum(globalProduct.price, 0)),
      gomas: Math.max(0, toNum(globalProduct.gomas, 0)),
      popular: !!globalProduct.popular,
      discountLabel: (globalProduct.discountLabel || '').trim(),
      imageUrl: (globalProduct.imageUrl || '').trim(),
      sortOrder: Math.max(0, toNum(globalProduct.sortOrder, 0)),
      active: true,
      category: 'Produto Único',
      brand: 'GoGummies',
    });
    toast('Produto guardado no Strapi.', 'success');
    await refreshProducts();
  } catch (e) {
    toast(e?.message || 'Erro ao guardar produto no Strapi.', 'error');
  }
}

async function saveRow(row) {
  const sku = (globalProduct.sku || '').trim().toUpperCase();
  const name = (globalProduct.name || '').trim();

  if (!sku || !name) {
    toast('SKU e nome do produto global são obrigatórios.', 'error');
    return;
  }

  try {
    await upsertStoreInventoryItem(row.store.id, {
      sku,
      name,
      brand: 'GoGummies',
      category: 'Produto Único',
      unit: row.unit || 'un',
      stock: Math.max(0, toNum(row.stock, 0)),
      reservedStock: 0,
      reorderLevel: Math.max(0, toNum(row.reorderLevel, 0)),
      price: Math.max(0, toNum(row.price, globalProduct.price)),
      isActive: true,
    });
    toast(`Stock guardado: ${row.store.name}.`, 'success');
  } catch (e) {
    toast(e?.message || 'Erro ao guardar stock.', 'error');
  }
}

onMounted(async () => {
  await refreshAll();
});
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.card { background: var(--bo-surface); border: 1px solid var(--bo-border); border-radius: var(--bo-radius-lg); box-shadow: var(--bo-shadow); }
.page__head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; padding: 18px 20px; }
.page__title { margin: 0 0 6px; font-family: var(--bo-font-display); }
.page__desc { margin: 0; color: var(--bo-text-secondary); }
.section { padding: 14px 16px; }
.section__head { margin-bottom: 12px; }
.product-row { display: grid; grid-template-columns: auto 1fr auto 1fr auto 140px; gap: 8px; align-items: center; }
.lbl { font-size: 12px; font-weight: 700; color: var(--bo-text-secondary); }
.inp { border: 1px solid var(--bo-border); border-radius: var(--bo-radius-sm); padding: 10px 12px; }
.chk { width: 18px; height: 18px; }
.row-actions { margin-top: 10px; display: flex; gap: 8px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.chip-btn { border: 1px solid var(--bo-border); background: var(--bo-page); border-radius: 999px; padding: 6px 10px; cursor: pointer; font-size: 12px; }
.inp--sm { width: 120px; padding: 8px 10px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.data-table th, .data-table td { border-bottom: 1px solid var(--bo-border); padding: 10px 12px; text-align: left; vertical-align: middle; }
.data-table th { font-size: 11px; text-transform: uppercase; color: var(--bo-text-secondary); }
.name { font-weight: 700; }
.small { font-size: 12px; }
.muted { color: var(--bo-text-secondary); }
.empty { text-align: center; color: var(--bo-text-secondary); }
.btn { border: none; border-radius: var(--bo-radius-sm); padding: 10px 14px; cursor: pointer; font-weight: 700; }
.btn--go { background: var(--bo-brand); color: #fff; }
.btn--sec { background: var(--bo-page); border: 1px solid var(--bo-border); }
.btn--sm { padding: 8px 10px; font-size: 12px; }
.btn--ml { margin-left: 8px; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(2, 6, 23, 0.52); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 12000; }
.modal { width: 100%; max-width: 760px; padding: 18px; }
.modal__title { margin: 0 0 4px; font-size: 20px; }
.modal__subtitle { margin: 0 0 12px; color: var(--bo-text-secondary); }
.details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.details-grid > div { display: flex; justify-content: space-between; gap: 10px; border: 1px solid var(--bo-border); border-radius: var(--bo-radius-sm); padding: 10px 12px; background: #fff; }
.details-grid .k { color: var(--bo-text-secondary); font-weight: 700; font-size: 12px; text-transform: uppercase; }
.loc { border-color: rgba(27, 138, 74, 0.35) !important; background: rgba(27, 138, 74, 0.06) !important; }
.warn { margin: 12px 0 0; color: #b45309; font-weight: 700; font-size: 13px; }
.modal-actions { display: flex; justify-content: flex-end; margin-top: 14px; }

@media (max-width: 1100px) {
  .product-row { grid-template-columns: 1fr; }
  .details-grid { grid-template-columns: 1fr; }
}
</style>
