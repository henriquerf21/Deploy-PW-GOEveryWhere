import { reactive, computed } from 'vue';

// ── Storage keys ──────────────────────────────────────────────────
const STORAGE_KEY = 'goeverywhere_auth';
const API_URL = 'http://localhost:1337/api'; // URL base do Strapi v5

// ── Load persisted state ─────────────────────────────────────────
function loadSession() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    // Agora guardamos um objeto que contém { user, jwt }
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

function saveSession(authData) {
  if (authData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function setUser(userData) {
  state.user = userData;
  localStorage.setItem('user', JSON.stringify(userData));
}

// ── Auth store ───────────────────────────────────────────────────
const persisted = loadSession();

const state = reactive({
  user: persisted?.user || null,
  token: persisted?.jwt || null, // O JWT é a chave para o Strapi devolver o histórico
});

// ── Computed ─────────────────────────────────────────────────────
export const isAuthenticated = computed(() => !!state.user);
export const currentUser = computed(() => state.user);

// ── Helpers ──────────────────────────────────────────────────────
function getInitials(name) {
  if (!name) return '??';
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// ── Actions ──────────────────────────────────────────────────────

export async function register({ firstName, lastName, email, phone, password }) {
  try {
    // PASSO 1: Registo básico (O que o Strapi aceita sempre)
    const regResponse = await fetch(`${API_URL}/auth/local/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: email.toLowerCase(),
        email: email.toLowerCase(),
        password: password
      })
    });

    const regData = await regResponse.json();
    if (!regResponse.ok) throw new Error(regData.error?.message || 'Erro no registo');

    // PASSO 2: Atualizar os dados extra (firstName, phone, etc.)
    // Usamos o ID do utilizador acabado de criar e o Token (JWT)
    const updateResponse = await fetch(`${API_URL}/users/${regData.user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${regData.jwt}` // Autenticação obrigatória [cite: 121]
      },
      body: JSON.stringify({
        firstName,
        lastName,
        phone,
        initials: getInitials(`${firstName} ${lastName}`)
      })
    });

    if (!updateResponse.ok) console.warn("Conta criada, mas erro ao guardar dados extra.");

    // Guardar sessão com os dados atualizados
    const finalUser = { ...regData.user, firstName, lastName, phone };
    state.user = finalUser;
    state.token = regData.jwt;
    saveSession({ user: finalUser, jwt: regData.jwt });

    return { success: true };
  } catch (error) {
    console.error("🚨 Erro no processo:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Login Real no Strapi
 */
export async function login(email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: email.toLowerCase(),
        password: password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Email ou password incorretos.');
    }

    state.user = data.user;
    state.token = data.jwt;
    saveSession({ user: data.user, jwt: data.jwt });

    return { success: true };
  } catch (error) {
    console.error("Erro no Login:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Login com Google (Integração Google -> Strapi)
 */
export async function loginWithGoogle(googleAccessToken) {
  try {
    // 1. Enviamos o token da Google para o Strapi validar
    const response = await fetch(`${API_URL}/auth/google/callback?access_token=${googleAccessToken}`);
    
    if (!response.ok) throw new Error('Falha ao autenticar com o servidor Strapi');

    const data = await response.json();

    // 2. O Strapi cria/encontra o utilizador e devolve o seu próprio JWT
    state.user = data.user;
    state.token = data.jwt;
    saveSession({ user: data.user, jwt: data.jwt });

    return { success: true };

  } catch (error) {
    console.error("Erro no Auth Store (Google):", error);
    return { success: false, error: 'Não foi possível ligar a tua conta Google ao servidor.' };
  }
}

/**
 * Logout
 */
export function logout() {
  state.user = null;
  state.token = null;
  saveSession(null);
}

export function useAuthStore() {
  return state;
}

export default state;


