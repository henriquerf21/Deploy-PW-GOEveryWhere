import { createRouter, createWebHistory } from 'vue-router';
import { isAuthenticated } from '../stores/authStore.js';

import LoginWelcomePage from '../pages/LoginWelcomePage.vue';
import LoginPage from '../pages/LoginPage.vue';
import RegisterPage from '../pages/RegisterPage.vue';
import ClientAreaPage from '../pages/ClientAreaPage.vue';
import ProductPage from '../pages/ProductPage.vue';
import AboutPage from '../pages/AboutPage.vue';
import OrderProductPage from '../pages/OrderProductPage.vue';
import OrderDeliveryPage from '../pages/OrderDeliveryPage.vue';
import OrderPaymentPage from '../pages/OrderPaymentPage.vue';
import OrderTrackingPage from '../pages/OrderTrackingPage.vue';
import OrderHistoryPage from '../pages/OrderHistoryPage.vue';

const routes = [
  { path: '/', redirect: '/about' },
  { path: '/login-welcome', name: 'login-welcome', component: LoginWelcomePage },
  { path: '/login', name: 'login', component: LoginPage },
  { path: '/register', name: 'register', component: RegisterPage },
  { path: '/dashboard', name: 'dashboard', component: ClientAreaPage, meta: { requiresAuth: true } },
  { path: '/product', name: 'product', component: ProductPage },
  { path: '/order/select', name: 'order-select', component: OrderProductPage, meta: { requiresAuth: true } },
  { path: '/order/delivery', name: 'order-delivery', component: OrderDeliveryPage, meta: { requiresAuth: true } },
  { path: '/order/payment', name: 'order-payment', component: OrderPaymentPage, meta: { requiresAuth: true } },
  { path: '/order/tracking', name: 'order-tracking', component: OrderTrackingPage, meta: { requiresAuth: true } },
  { path: '/order/history', name: 'order-history', component: OrderHistoryPage, meta: { requiresAuth: true } },
  { path: '/about', name: 'about', component: AboutPage },
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
