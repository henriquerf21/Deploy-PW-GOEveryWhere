/**
 * Decodifica payload JWT do Google Sign-In (apenas para demo / cliente sem backend).
 * Em produção validar o token no servidor.
 */
export function parseGoogleJwt(credential) {
  try {
    const part = credential.split('.')[1];
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      Array.prototype.map
        .call(atob(b64), (c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Falha ao carregar Google GSI'));
    document.head.appendChild(s);
  });
}
