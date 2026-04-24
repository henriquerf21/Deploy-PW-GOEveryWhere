import { createRouter, createWebHistory } from 'vue-router';
import { isAuthenticated } from '../stores/authStore.js';

import LoginWelcomeView from '../views/LoginWelcomeView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import ClientAreaView from '../views/ClientAreaView.vue';
import ProductView from '../views/ProductView.vue';
import AboutView from '../views/AboutView.vue';
import OrderProductView from '../views/OrderProductView.vue';
import OrderDeliveryView from '../views/OrderDeliveryView.vue';
import OrderPaymentView from '../views/OrderPaymentView.vue';
import OrderTrackingView from '../views/OrderTrackingView.vue';
import OrderHistoryView from '../views/OrderHistoryView.vue';

const routes = [
  { path: '/', redirect: '/about' },
  { path: '/login-welcome', name: 'login-welcome', component: LoginWelcomeView },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/register', name: 'register', component: RegisterView },
  { path: '/dashboard', name: 'dashboard', component: ClientAreaView, meta: { requiresAuth: true } },
  { path: '/product', name: 'product', component: ProductView },
  { path: '/order/select', name: 'order-select', component: OrderProductView, meta: { requiresAuth: true } },
  { path: '/order/delivery', name: 'order-delivery', component: OrderDeliveryView, meta: { requiresAuth: true } },
  { path: '/order/payment', name: 'order-payment', component: OrderPaymentView, meta: { requiresAuth: true } },
  { path: '/order/tracking', name: 'order-tracking', component: OrderTrackingView, meta: { requiresAuth: true } },
  { path: '/order/history', name: 'order-history', component: OrderHistoryView, meta: { requiresAuth: true } },
  { path: '/about', name: 'about', component: AboutView },
  { path: '/settings', component: () => import('../views/SettingsView.vue'), meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else if ((to.name === 'login' || to.name === 'register' || to.name === 'login-welcome') && isAuthenticated.value) {
    next({ name: 'dashboard' });
  } else {
    next();
  }
});

export default router;
