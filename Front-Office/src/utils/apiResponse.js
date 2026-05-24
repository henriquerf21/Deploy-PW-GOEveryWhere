/**
 * Lê JSON da resposta fetch; mensagem clara se o backend estiver em baixo (proxy 500 / corpo vazio).
 */
export async function readApiJson(response) {
  const text = await response.text();
  if (!text || !text.trim()) {
    const hint = response.status >= 500
      ? 'O servidor (Strapi) pode estar parado ou a reiniciar. Corre `npm run develop` na pasta backend.'
      : `HTTP ${response.status}`;
    throw new Error(hint);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Resposta inválida (HTTP ${response.status}). Usa https://localhost:5173 e confirma que o backend responde em http://127.0.0.1:1337`,
    );
  }
}
