<template>
  <nav class="cf-wizard" aria-label="Progresso da encomenda">
    <div class="cf-wizard-track">
      <template v-for="(item, index) in items" :key="item.to">
        <div
          class="cf-wizard-step"
          :class="{
            'is-done': currentStep > index + 1,
            'is-current': currentStep === index + 1,
            'is-upcoming': currentStep < index + 1,
          }"
        >
          <router-link
            v-if="currentStep > index + 1"
            :to="item.to"
            class="cf-wizard-node"
          >
            <span class="cf-wizard-badge" aria-hidden="true">
              <Check :size="14" :stroke-width="2.5" />
            </span>
            <span class="cf-wizard-label">{{ item.label }}</span>
          </router-link>
          <span
            v-else-if="currentStep === index + 1"
            class="cf-wizard-node"
            aria-current="step"
          >
            <span class="cf-wizard-badge">{{ index + 1 }}</span>
            <span class="cf-wizard-label">{{ item.label }}</span>
          </span>
          <span v-else class="cf-wizard-node" aria-disabled="true">
            <span class="cf-wizard-badge">{{ index + 1 }}</span>
            <span class="cf-wizard-label">{{ item.label }}</span>
          </span>
        </div>
        <div
          v-if="index < items.length - 1"
          class="cf-wizard-connector"
          :class="{ 'is-done': currentStep > index + 1 }"
          aria-hidden="true"
        />
      </template>
    </div>
  </nav>
</template>

<script setup>
import { Check } from 'lucide-vue-next';

defineProps({
  currentStep: {
    type: Number,
    required: true,
    validator: (n) => [1, 2, 3].includes(n),
  },
});

const items = [
  { label: 'Carrinho', to: '/order/select' },
  { label: 'Entrega', to: '/order/delivery' },
  { label: 'Pagamento', to: '/order/payment' },
];
</script>
