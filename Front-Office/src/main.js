import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import 'bootstrap-icons/font/bootstrap-icons.css';
import vue3GoogleLogin from 'vue3-google-login';

/* Global design system */
import './styles/design-tokens.css';
import './styles/auth-shared.css';
import './styles/checkout-flow.css';

// 1. Criamos a instância da aplicação apenas UMA vez
const app = createApp(App);

// 2. Configuramos os plugins (Router e Google Login)
app.use(router);

app.use(vue3GoogleLogin, {
  clientId: '882989500750-527gfmu0r3spla3hk710pafvr90bq867.apps.googleusercontent.com'
});

// 3. Finalmente, montamos a aplicação no HTML
app.mount('#app');