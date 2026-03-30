const KEY = 'go_bo_session';
const USER_KEY = 'go_bo_user';

export function isBoAuthenticated() {
  return localStorage.getItem(KEY) === '1';
}

export function getSessionUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** @param {{ method: 'google'|'email', email: string, name?: string, picture?: string }} user */
export function setBoSession(user) {
  localStorage.setItem(KEY, '1');
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearBoSession() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(USER_KEY);
}

/** @deprecated use setBoSession */
export function setBoAuthenticated() {
  setBoSession({ method: 'email', email: 'admin@goeverywhere.pt', name: 'Administrador' });
}
