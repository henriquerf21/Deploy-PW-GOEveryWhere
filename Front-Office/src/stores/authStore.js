import { reactive, computed } from 'vue';

// ── Storage keys ──────────────────────────────────────────────────
const STORAGE_KEY = 'goeverywhere_auth';
const USERS_KEY = 'goeverywhere_users';

// ── Load persisted state ─────────────────────────────────────────
function loadSession() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

function loadUsers() {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveSession(user) {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ── Auth store ───────────────────────────────────────────────────
const persisted = loadSession();

const state = reactive({
  user: persisted || null,
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

/**
 * Registo por Email
 */
export function register({ firstName, lastName, email, phone, password }) {
  const users = loadUsers();

  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: 'Este email já está registado.' };
  }

  const fullName = `${firstName} ${lastName}`;
  const newUser = {
    name: fullName,
    firstName,
    lastName,
    email: email.toLowerCase(),
    phone,
    password, 
    avatar: null,
    initials: getInitials(fullName),
    authMethod: 'email',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  const sessionUser = { ...newUser };
  delete sessionUser.password;
  state.user = sessionUser;
  saveSession(sessionUser);

  return { success: true };
}

/**
 * Login por Email
 */
export function login(email, password) {
  const users = loadUsers();
  const user = users.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    return { success: false, error: 'Email ou password incorretos.' };
  }

  const sessionUser = { ...user };
  delete sessionUser.password;
  state.user = sessionUser;
  saveSession(sessionUser);

  return { success: true };
}

/**
 * LOGIN REAL COM GOOGLE 
 * Agora recebe o token e procura os dados reais do utilizador.
 */
export async function loginWithGoogle(token) {
  try {
    // 1. Pedir os dados reais à Google usando o token recebido
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Falha ao obter dados da Google');

    const googleData = await response.json();

    // 2. Montar o utilizador com os dados reais
    const fullName = `${googleData.given_name} ${googleData.family_name || ''}`;
    
    const googleUser = {
      name: fullName,
      firstName: googleData.given_name,
      lastName: googleData.family_name || '',
      email: googleData.email.toLowerCase(),
      phone: '', // Google não devolve telemóvel por defeito
      avatar: googleData.picture, // Foto real do perfil Google
      initials: getInitials(fullName),
      authMethod: 'google',
      createdAt: new Date().toISOString(),
    };

    // 3. Atualizar a base de dados local (localStorage)
    const users = loadUsers();
    if (!users.find(u => u.email === googleUser.email)) {
      users.push({ ...googleUser, password: null });
      saveUsers(users);
    }

    // 4. Iniciar sessão no estado da App
    state.user = googleUser;
    saveSession(googleUser);

    return { success: true };

  } catch (error) {
    console.error("Erro no Auth Store (Google):", error);
    return { success: false, error: 'Não foi possível obter os dados da tua conta Google.' };
  }
}

/**
 * Logout
 */
export function logout() {
  state.user = null;
  saveSession(null);
}

export function useAuthStore() {
  return state;
}

export default state;