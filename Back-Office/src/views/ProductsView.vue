<template>
  <div class="bo-page">
    <header class="bo-page-head">
      <div class="bo-page-head__main">
        <p class="bo-page-head__eyebrow">Catálogo</p>
        <h1 class="bo-page-head__title">Produto único</h1>
      </div>
      <div class="bo-page-head__actions">
        <button type="button" class="bo-btn bo-btn--outline" @click="refreshAll">Atualizar</button>
      </div>
    </header>

    <section class="bo-card">
      <header class="bo-card__head">
        <div>
          <h3 class="bo-card__title">Produto global</h3>
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
        <button type="button" class="bo-btn bo-btn--primary" @click="saveGlobalProduct">Guardar produto</button>
      </footer>
    </section>

    <section class="bo-card" style="margin-top: 1.5rem;">
      <header class="bo-card__head">
        <div>
          <h3 class="bo-card__title">Lojas e Zonas de Cobertura</h3>
          <p class="bo-card__sub">As lojas abaixo estão sincronizadas com o Front-Office para recolha e entregas.</p>
        </div>
      </header>
      <div class="bo-card__body bo-stack">
        <div v-for="(stores, zone) in storesByZone" :key="zone" class="bo-field">
          <span class="bo-eyebrow" style="color: var(--bo-brand);">{{ zone }}</span>
          <div class="bo-row" style="flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
            <span v-for="s in stores" :key="s.id" class="bo-chip bo-chip--info">
              {{ s.name }}
            </span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue';
import {
  logistics,
  refreshStores,
  refreshProducts,
  addProduct,
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

const storesByZone = computed(() => {
  const groups = {
    'Braga - Centro': [],
    'Braga - Distritos': [],
    'Grande Porto': [],
    'Outras Zonas': []
  };
  
  for (const s of logistics.continentStores || []) {
    if (s.district === 'Porto') {
      groups['Grande Porto'].push(s);
    } else if (s.district === 'Braga') {
      if (s.city === 'Braga') {
        groups['Braga - Centro'].push(s);
      } else {
        groups['Braga - Distritos'].push(s);
      }
    } else {
      groups['Outras Zonas'].push(s);
    }
  }

  // Remover grupos vazios
  for (const k in groups) {
    if (groups[k].length === 0) delete groups[k];
  }
  
  return groups;
});

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

async function refreshAll() {
  try {
    await refreshProducts();
    await refreshStores();
    if (logistics.products?.length) selectCatalogProduct(logistics.products[0]);
  } catch (e) {
    toast(e?.message || 'Falha ao carregar catálogo.', 'error');
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

onMounted(async () => { await refreshAll(); });
</script>

<style scoped>
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
</style>
