import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './styles/bo-tokens.css';
import './styles/bo-pro.css';
import './stores/logisticsStore.js';

createApp(App).use(router).mount('#app');
