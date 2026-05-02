<template>
  <div class="bo-page">
    <header class="bo-page-head">
      <div class="bo-page-head__main">
        <p class="bo-page-head__eyebrow">Catálogo</p>
        <h1 class="bo-page-head__title">Produto único & Stock</h1>
        <p class="bo-page-head__sub">
          Operação simplificada GoEverywhere: um produto global no Strapi alimenta o Front-Office, e o stock é distribuído pelos Continentes.
        </p>
      </div>
      <div class="bo-page-head__actions">
        <button type="button" class="bo-btn bo-btn--outline" @click="refreshAll">Atualizar</button>
      </div>
    </header>

    <section class="bo-card">
      <header class="bo-card__head">
        <div>
          <h3 class="bo-card__title">Produto global</h3>
          <p class="bo-card__sub">Este registo é servido ao Front-Office. Atualizações refletem-se em todas as lojas.</p>
        </div>
        <div v-if="logistics.products?.length" class="bo-row">
          <span class="bo-eyebrow">Catálogo Strapi:</span>
          <button v-for="p in logistics.products.slice(0, 3)" :key="p.id || p.sku" type="button" class="bo-chip" @click="selectCatalogProduct(p)">{{ p.name }}</button>
        </div>
      </header>
      <div class="bo-card__body">
        <div class="product-layout">
          <div class="product-image">
            <div class="product-image__preview">
              <img v-if="globalProduct.imageUrl" :src="globalProduct.imageUrl" alt="Pré-visualização" />
              <span v-else class="bo-muted bo-eyebrow">Sem imagem</span>
            </div>
            <label class="bo-upload" style="margin-top: 10px; width: 100%; justify-content: center;">
              <input type="file" accept="image/*" :disabled="uploadingImage" @change="onImageUpload" />
              <span>{{ uploadingImage ? 'A carregar...' : (globalProduct.imageUrl ? 'Substituir imagem' : 'Carregar imagem') }}</span>
            </label>
          </div>
          <div class="product-fields">
            <div class="bo-form-grid bo-form-grid--2">
              <div class="bo-field bo-field--span2">
                <label class="bo-field__label">Nome <span class="bo-required">*</span></label>
                <input v-model="globalProduct.name" type="text" class="bo-input" />
              </div>
              <div class="bo-field">
                <label class="bo-field__label">SKU <span class="bo-required">*</span></label>
                <input v-model="globalProduct.sku" type="text" class="bo-input bo-mono" />
              </div>
              <div class="bo-field">
                <label class="bo-field__label">Preço (€)</label>
                <input v-model.number="globalProduct.price" type="number" min="0" step="0.01" class="bo-input bo-num" />
              </div>
              <div class="bo-field">
                <label class="bo-field__label">Gomas por frasco</label>
                <input v-model.number="globalProduct.gomas" type="number" min="0" class="bo-input bo-num" />
              </div>
              <div class="bo-field">
                <label class="bo-field__label">Etiqueta de desconto</label>
                <input v-model="globalProduct.discountLabel" type="text" class="bo-input" placeholder="Ex.: -10%" />
              </div>
              <div class="bo-field">
                <label class="bo-field__label">Ordem</label>
                <input v-model.number="globalProduct.sortOrder" type="number" min="0" class="bo-input bo-num" />
              </div>
              <div class="bo-field">
                <label class="bo-field__label">Imagem (URL)</label>
                <input v-model="globalProduct.imageUrl" type="text" class="bo-input" placeholder="https://..." />
              </div>
              <div class="bo-field bo-field--span2">
                <label class="bo-field__label">Descrição</label>
                <input v-model="globalProduct.desc" type="text" class="bo-input" />
              </div>
              <div class="bo-field bo-field--span2">
                <label class="bo-checkbox">
                  <input v-model="globalProduct.popular" type="checkbox" />
                  Marcar como popular
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer class="bo-card__foot">
        <span class="bo-muted" style="margin-right: auto; font-size: 12px;">Este produto é guardado no Strapi e consumido pelo Front-Office.</span>
        <button type="button" class="bo-btn bo-btn--primary" @click="saveGlobalProduct">Guardar produto</button>
      </footer>
    </section>

    <section class="bo-card">
      <header class="bo-card__head">
        <div>
          <h3 class="bo-card__title">Stock por loja Continente</h3>
          <p class="bo-card__sub">Cada linha cria/atualiza o item de inventário SKU «{{ globalProduct.sku || '—' }}» na respetiva loja.</p>
        </div>
        <span class="bo-badge bo-badge--info">{{ rows.length }} loja(s)</span>
      </header>
      <div class="bo-table-wrap" style="border: none; border-radius: 0; box-shadow: none;">
        <table class="bo-table">
          <thead>
            <tr>
              <th>Loja</th>
              <th>Cidade / Distrito</th>
              <th>Formato</th>
              <th>Stock</th>
              <th>Reposição</th>
              <th>Preço (€)</th>
              <th class="col-actions"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!rows.length">
              <td colspan="7" class="bo-table__empty">
                <div class="bo-empty">
                  <h3 class="bo-empty__title">Sem lojas carregadas</h3>
                  <p class="bo-empty__hint">Verifica a ligação ao Strapi ou clica em «Atualizar».</p>
                </div>
              </td>
            </tr>
            <tr v-for="r in rows" :key="r.store.id">
              <td>
                <div class="bo-table__primary">{{ r.store.name }}</div>
                <div class="bo-table__secondary">{{ r.store.address || '—' }}</div>
              </td>
              <td>
                <div>{{ r.store.city || '—' }}</div>
                <div class="bo-table__secondary">{{ r.store.district || '—' }}</div>
              </td>
              <td><span class="bo-badge bo-badge--neutral">{{ r.store.format || '—' }}</span></td>
              <td><input v-model.number="r.stock" type="number" min="0" class="bo-input bo-num" style="width: 100px;" /></td>
              <td><input v-model.number="r.reorderLevel" type="number" min="0" class="bo-input bo-num" style="width: 100px;" /></td>
              <td><input v-model.number="r.price" type="number" min="0" step="0.01" class="bo-input bo-num" style="width: 110px;" /></td>
              <td class="bo-table__actions">
                <button type="button" class="bo-btn bo-btn--sm bo-btn--primary" @click="saveRow(r)">Guardar</button>
                <button type="button" class="bo-btn bo-btn--sm bo-btn--outline" @click="openDetails(r.store)">Detalhes</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <Teleport to="body">
      <div v-if="detailsOpen && selectedStore" class="bo-modal-backdrop" @click.self="closeDetails">
        <div class="bo-modal bo-modal--lg">
          <header class="bo-modal__head">
            <div>
              <h3 class="bo-modal__title">{{ selectedStore.name }}</h3>
              <p class="bo-modal__sub">Detalhes obrigatórios da loja Continente · localização em destaque.</p>
            </div>
            <button type="button" class="bo-modal__close" @click="closeDetails">×</button>
          </header>
          <div class="bo-modal__body">
            <div class="details-grid">
              <div class="detail-cell"><span class="bo-eyebrow">Cidade</span><span>{{ selectedStore.city || '—' }}</span></div>
              <div class="detail-cell"><span class="bo-eyebrow">Distrito</span><span>{{ selectedStore.district || '—' }}</span></div>
              <div class="detail-cell detail-cell--wide"><span class="bo-eyebrow">Morada</span><span>{{ selectedStore.address || '—' }}</span></div>
              <div class="detail-cell"><span class="bo-eyebrow">Código postal</span><span class="bo-mono">{{ selectedStore.postalCode || '—' }}</span></div>
              <div class="detail-cell"><span class="bo-eyebrow">Horário</span><span>{{ selectedStore.openingHours || '—' }}</span></div>
              <div class="detail-cell"><span class="bo-eyebrow">Telefone</span><span class="bo-mono">{{ selectedStore.phone || '—' }}</span></div>
              <div class="detail-cell"><span class="bo-eyebrow">Formato</span><span>{{ selectedStore.format || '—' }}</span></div>
              <div class="detail-cell detail-cell--loc"><span class="bo-eyebrow">Latitude</span><span class="bo-mono bo-num">{{ formatCoord(selectedStore.lat) }}</span></div>
              <div class="detail-cell detail-cell--loc"><span class="bo-eyebrow">Longitude</span><span class="bo-mono bo-num">{{ formatCoord(selectedStore.lng) }}</span></div>
            </div>
            <p v-if="missingRequiredFields(selectedStore).length" class="missing-fields" role="alert">
              Em falta: {{ missingRequiredFields(selectedStore).join(', ') }}.
            </p>
          </div>
          <footer class="bo-modal__foot">
            <button type="button" class="bo-btn bo-btn--ghost" @click="closeDetails">Fechar</button>
          </footer>
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
import { boUpload } from '../api/backofficeApi.js';

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
const uploadingImage = ref(false);

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function onImageUpload(event) {
  const input = event.target;
  const file = input?.files?.[0];
  if (!file) return;
  uploadingImage.value = true;
  try {
    const r = await boUpload(file);
    globalProduct.imageUrl = r.url;
    toast(`Imagem carregada: ${r.name}`, 'success');
  } catch (err) {
    toast(err?.message || 'Falha no upload da imagem.', 'error');
  } finally {
    uploadingImage.value = false;
    input.value = '';
  }
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
    try { inv = await refreshStoreInventory(store.id); } catch { inv = []; }
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
    if (logistics.products?.length) selectCatalogProduct(logistics.products[0]);
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
  if (!sku || !name) { toast('SKU e nome do produto são obrigatórios.', 'error'); return; }
  try {
    await addProduct({
      sku, name,
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
  if (!sku || !name) { toast('SKU e nome do produto global são obrigatórios.', 'error'); return; }
  try {
    await upsertStoreInventoryItem(row.store.id, {
      sku, name,
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

onMounted(async () => { await refreshAll(); });
</script>

<style scoped>
.col-actions { width: 220px; text-align: right; white-space: nowrap; }

.product-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 24px;
  align-items: flex-start;
}

@media (max-width: 720px) {
  .product-layout { grid-template-columns: 1fr; }
}

.product-image {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.product-image__preview {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: var(--bo-radius);
  border: 1px dashed var(--bo-border);
  background: var(--bo-page);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.product-image__preview img { max-width: 92%; max-height: 92%; object-fit: contain; }

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

@media (max-width: 720px) {
  .details-grid { grid-template-columns: 1fr; }
}

.detail-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border: 1px solid var(--bo-border);
  border-radius: var(--bo-radius-sm);
  background: var(--bo-surface);
}

.detail-cell--wide { grid-column: 1 / -1; }

.detail-cell--loc {
  background: var(--bo-brand-soft);
  border-color: #a7f3d0;
}

.missing-fields {
  margin: 14px 0 0;
  padding: 10px 14px;
  background: var(--bo-warning-soft);
  color: #92400e;
  border: 1px solid #fde68a;
  border-radius: var(--bo-radius-sm);
  font-size: 13px;
  font-weight: 600;
}
</style>
