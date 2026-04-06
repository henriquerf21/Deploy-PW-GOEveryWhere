import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import 'bootstrap-icons/font/bootstrap-icons.css';

/* Global design system */
import './styles/design-tokens.css';
import './styles/auth-shared.css';
import './styles/checkout-flow.css';

createApp(App).use(router).mount('#app');
