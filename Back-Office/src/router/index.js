import { createRouter, createWebHistory } from 'vue-router';
import { isBoAuthenticated } from '../auth/session.js';

const LoginView = () => import('../views/LoginView.vue');
const AdminLayout = () => import('../layouts/AdminLayout.vue');
const DashboardView = () => import('../views/DashboardView.vue');
const ProductsView = () => import('../views/ProductsView.vue');
const OrdersView = () => import('../views/OrdersView.vue');
const CouriersView = () => import('../views/CouriersView.vue');
const CourierNewView = () => import('../views/CourierNewView.vue');
const OrderDetailView = () => import('../views/OrderDetailView.vue');
const CourierDetailView = () => import('../views/CourierDetailView.vue');
const OperationsMapView = () => import('../views/OperationsMapView.vue');
const CustomersView = () => import('../views/CustomersView.vue');
const NotificationsView = () => import('../views/NotificationsView.vue');

const routes = [
  { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
  {
    path: '/',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: { name: 'dashboard' } },
      { path: 'dashboard', name: 'dashboard', component: DashboardView, meta: { title: 'Dashboard' } },
      { path: 'products', name: 'products', component: ProductsView, meta: { title: 'Produtos' } },
      { path: 'orders', name: 'orders', component: OrdersView, meta: { title: 'Pedidos' } },
      { path: 'orders/:id', name: 'order-detail', component: OrderDetailView, meta: { title: 'Detalhe do pedido' } },
      { path: 'couriers', name: 'couriers', component: CouriersView, meta: { title: 'Estafetas' } },
      { path: 'couriers/new', name: 'couriers-new', component: CourierNewView, meta: { title: 'Novo estafeta' } },
      { path: 'couriers/:id', name: 'courier-detail', component: CourierDetailView, meta: { title: 'Estafeta' } },
      { path: 'map', name: 'map', component: OperationsMapView, meta: { title: 'Mapa de Operações' } },
      { path: 'customers', name: 'customers', component: CustomersView, meta: { title: 'Clientes' } },
      { path: 'notifications', name: 'notifications', component: NotificationsView, meta: { title: 'Notificações' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach((to, _from, next) => {
  if (to.meta.public) {
    if (to.name === 'login' && isBoAuthenticated()) {
      next({ name: 'dashboard' });
      return;
    }
    next();
    return;
  }
  if (to.meta.requiresAuth && !isBoAuthenticated()) {
    next({ name: 'login', query: { redirect: to.fullPath } });
    return;
  }
  next();
});

export default router;