import { createRouter, createWebHashHistory } from 'vue-router';
import { store } from '../stores/courierStore.js';

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/LoginView.vue'),
        meta: { guest: true },
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('../views/RegisterView.vue'),
        meta: { guest: true },
    },
    {
        path: '/',
        redirect: '/deliveries',
    },
    {
        path: '/deliveries',
        name: 'Deliveries',
        component: () => import('../views/DeliveryListView.vue'),
        meta: { auth: true },
    },
    {
        path: '/deliveries/:id',
        name: 'DeliveryDetail',
        component: () => import('../views/DeliveryDetailView.vue'),
        meta: { auth: true },
        props: true,
    },
    {
        path: '/confirm/:id',
        name: 'ConfirmDelivery',
        component: () => import('../views/ConfirmDeliveryView.vue'),
        meta: { auth: true },
        props: true,
    },
    {
        path: '/completed/:id',
        name: 'DeliveryCompleted',
        component: () => import('../views/DeliveryCompletedView.vue'),
        meta: { auth: true },
        props: true,
    },
    {
        path: '/history',
        name: 'DeliveryHistory',
        component: () => import('../views/DeliveryHistoryView.vue'),
        meta: { auth: true },
    },
    {
        path: '/metrics',
        name: 'Metrics',
        component: () => import('../views/MetricsView.vue'),
        meta: { auth: true },
    },
    {
        path: '/profile',
        name: 'Profile',
        component: () => import('../views/ProfileView.vue'),
        meta: { auth: true },
    },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

router.beforeEach((to, _from, next) => {
    if (to.meta.auth && !store.auth.loggedIn) {
        return next('/login');
    }
    if (to.meta.guest && store.auth.loggedIn) {
        return next('/deliveries');
    }
    next();
});

export default router;
