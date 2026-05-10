import { reactive, computed } from 'vue';
import { API_URL } from '../config/env.js';

// ── Storage keys ──────────────────────────────────────────────────
const STORAGE_KEY = 'goeverywhere_auth';

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
      // Helper to extract URL from Strapi media object if necessary
      const getUrl = (val) => {
        if (!val) return null;
        if (typeof val === 'string') return val;
        if (val.url) return val.url;
        return null;
      };

      // Prioritize local state fields (like Google picture) over backend if they exist
      const localPicture = state.user?.picture;
      const localAvatar = state.user?.avatarUrl;
      
      const remotePicture = getUrl(data.picture);
      const remoteAvatar = getUrl(data.avatarUrl);

      state.user = {
        ...state.user,
        ...data,
        picture: localPicture || remotePicture,
        avatarUrl: localAvatar || remoteAvatar,
        authMethod: state.user?.authMethod || data.authMethod
      };
      saveSession({ user: state.user, jwt: state.token });
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

    // Now, fetch the profile picture from Google directly
    let googlePicture = null;
    
    // First try: Decode the token if it's a JWT (ID Token)
    try {
      const payload = JSON.parse(atob(googleAccessToken.split('.')[1]));
      if (payload && payload.picture) {
        googlePicture = payload.picture;
      }
    } catch (e) {
      // Not a valid JWT, proceed to fetch
    }

    // Second try: Fetch from Google Userinfo API (if it's an Access Token)
    if (!googlePicture) {
      try {
        console.log("A tentar buscar userinfo com:", googleAccessToken);
        const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleAccessToken}`);
        if (googleRes.ok) {
          const googleUser = await googleRes.json();
          googlePicture = googleUser.picture;
          console.log("Foto obtida com sucesso da Google:", googlePicture);
        } else {
          console.error("googleRes não está ok:", googleRes.status);
        }
      } catch (err) {
        console.error("Erro ao obter userinfo do Google:", err);
      }
    }

    state.user = {
      ...data.user,
      picture: googlePicture || data.user?.picture,
      authMethod: 'google'
    };
    state.token = data.jwt;
    console.log("Picture dentro do state.user ANTES do save:", state.user.picture);
    saveSession({ user: state.user, jwt: data.jwt });
    
    await fetchMe(); // Carregar pontos logo após login Google
    console.log("Picture dentro do state.user APOS fetchMe:", state.user.picture);

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