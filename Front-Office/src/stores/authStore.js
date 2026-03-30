import { reactive, computed } from 'vue';

// ── Storage key ──────────────────────────────────────────────────
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
  // user shape: { name, email, phone, avatar, initials, authMethod }
});

// ── Computed ─────────────────────────────────────────────────────
export const isAuthenticated = computed(() => !!state.user);

export const currentUser = computed(() => state.user);

// ── Helpers ──────────────────────────────────────────────────────
function getInitials(name) {
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
 * Register a new user with email/password.
 * Returns { success, error }
 */
export function register({ firstName, lastName, email, phone, password }) {
  const users = loadUsers();

  // Check if email already exists
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
    password, // In a real app this would be hashed
    avatar: null,
    initials: getInitials(fullName),
    authMethod: 'email',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  // Auto-login after register
  const sessionUser = { ...newUser };
  delete sessionUser.password;
  state.user = sessionUser;
  saveSession(sessionUser);

  return { success: true };
}

/**
 * Login with email and password.
 * Returns { success, error }
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
 * Login with Google OAuth 2.0 (simulated).
 * Creates a session with Google-style user data.
 */
export function loginWithGoogle() {
  const googleUser = {
    name: 'Maria Silva',
    firstName: 'Maria',
    lastName: 'Silva',
    email: 'maria.silva@gmail.com',
    phone: '+351 912 345 678',
    avatar: null,
    initials: 'MS',
    authMethod: 'google',
    createdAt: new Date().toISOString(),
  };

  // Also save to users list if not already there
  const users = loadUsers();
  if (!users.find(u => u.email === googleUser.email)) {
    users.push({ ...googleUser, password: null });
    saveUsers(users);
  }

  state.user = googleUser;
  saveSession(googleUser);

  return { success: true };
}

/**
 * Logout — clear session.
 */
export function logout() {
  state.user = null;
  saveSession(null);
}

// ── Export store accessor ────────────────────────────────────────
export function useAuthStore() {
  return state;
}

export default state;
