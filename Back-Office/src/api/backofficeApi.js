const API_BASE = (import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:1337').replace(/\/$/, '');

function getJwt() {
  return localStorage.getItem('go_bo_jwt') || '';
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const jwt = getJwt();
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errObj = json?.error;
    const msg =
      (typeof errObj === 'string' ? errObj : errObj?.message) ||
      json?.message ||
      (Array.isArray(json?.error?.details?.errors) && json.error.details.errors.map((e) => e?.message).filter(Boolean).join(' · ')) ||
      `HTTP ${res.status}`;
    throw new Error(String(msg));
  }
  return json.data ?? json;
}

export async function boLoginEmail(email, password) {
  return request('/bo/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function boLoginGoogle(payload) {
  return request('/bo/auth/google', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function boBootstrap() {
  return request('/bo/bootstrap');
}

export async function boListOrders(filters = {}) {
  const q = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v != null && v !== '') q.set(k, String(v));
  });
  const suffix = q.toString() ? `?${q.toString()}` : '';
  return request(`/bo/orders${suffix}`);
}

export async function boGetOrder(id) {
  return request(`/bo/orders/${encodeURIComponent(id)}`);
}

export async function boOrderAction(id, action, payload = {}) {
  return request(`/bo/orders/${encodeURIComponent(id)}/${action}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function boCreateCourier(payload) {
  return request('/bo/couriers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function boUpdateCourier(id, payload) {
  return request(`/bo/couriers/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function boCourierAction(id, payload) {
  return request(`/bo/couriers/${encodeURIComponent(id)}/action`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function boDashboard() {
  return request('/bo/dashboard');
}

export async function boReports() {
  return request('/bo/reports');
}

export async function boCustomers() {
  return request('/bo/customers');
}

export async function boCreateCustomer(payload) {
  return request('/bo/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function boUpdateCustomer(id, payload) {
  return request(`/bo/customers/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function boDeleteCustomer(id) {
  return request(`/bo/customers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
