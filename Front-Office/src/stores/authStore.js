import { reactive, computed } from 'vue';

// ── Storage keys ──────────────────────────────────────────────────
const STORAGE_KEY = 'goeverywhere_auth';
const API_URL = 'http://localhost:1337/api'; // URL base do Strapi v5

// ── Load persisted state ─────────────────────────────────────────
function loadSession() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
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

// ── Auth store ───────────────────────────────────────────────────
const persisted = loadSession();

const state = reactive({
  user: persisted?.user || null,
  token: persisted?.jwt || null,
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

    const updateResponse = await fetch(`${API_URL}/users/${regData.user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${regData.jwt}`
      },
      body: JSON.stringify({
        firstName,
        lastName,
        phone,
        initials: getInitials(`${firstName} ${lastName}`)
      })
    });

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

// FUNÇÃO CORRIGIDA (FECHADA CORRETAMENTE)
export async function fetchMe() {
  if (!state.token) return;
  try {
    const res = await fetch(`${API_URL}/users/me?populate=go_point`, {
      headers: { Authorization: `Bearer ${state.token}` }
    });
    const data = await res.json();
    if (res.ok) {
      state.user = data;
    }
  } catch (err) {
    console.error("Erro no fetchMe:", err);
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
    
    await fetchMe(); // Carregar pontos logo após login

    return { success: true };
  } catch (error) {
    console.error("Erro no Login:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Login com Google
 */
export async function loginWithGoogle(googleAccessToken) {
  try {
    const response = await fetch(`${API_URL}/auth/google/callback?access_token=${googleAccessToken}`);
    if (!response.ok) throw new Error('Falha ao autenticar com o servidor Strapi');

    const data = await response.json();

    state.user = data.user;
    state.token = data.jwt;
    saveSession({ user: data.user, jwt: data.jwt });
    
    await fetchMe(); // Carregar pontos logo após login Google

    return { success: true };
  } catch (error) {
    console.error("Erro no Auth Store (Google):", error);
    return { success: false, error: 'Não foi possível ligar a conta Google.' };
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