/** Mensagens alinhadas com `backend/src/api/back-office/utils/back-office-validation.ts` */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function onlyDigits(s) {
  return String(s || '').replace(/\D/g, '');
}

export function validateEmail(raw) {
  const v = String(raw || '').trim().toLowerCase();
  if (!v) return { ok: false, error: 'Email obrigatório.' };
  if (!EMAIL_RE.test(v)) return { ok: false, error: 'Email inválido.' };
  return { ok: true, value: v };
}

export function validatePtNif(raw) {
  const d = onlyDigits(raw);
  if (!d) return { ok: false, error: 'NIF obrigatório.' };
  if (d.length !== 9) return { ok: false, error: 'NIF deve ter 9 dígitos.' };
  const first = Number(d[0]);
  if (![1, 2, 3, 5, 6, 8, 9].includes(first)) return { ok: false, error: 'NIF inválido (primeiro dígito).' };
  let sum = 0;
  for (let i = 0; i < 8; i++) sum += Number(d[i]) * (9 - i);
  const mod = sum % 11;
  const check = mod < 2 ? 0 : 11 - mod;
  if (check !== Number(d[8])) return { ok: false, error: 'NIF inválido (dígito de controlo).' };
  return { ok: true, value: d };
}

export function validatePtIban(raw) {
  const compact = String(raw || '').replace(/\s+/g, '').toUpperCase();
  if (!compact) return { ok: false, error: 'IBAN obrigatório.' };
  if (!/^PT\d{21}$/.test(compact)) return { ok: false, error: 'IBAN deve começar por PT seguido de 21 dígitos.' };
  const rearranged = compact.slice(4) + compact.slice(0, 4);
  let expanded = '';
  for (const ch of rearranged) {
    if (ch >= 'A' && ch <= 'Z') expanded += String(ch.charCodeAt(0) - 55);
    else expanded += ch;
  }
  let rem = 0;
  for (let i = 0; i < expanded.length; i++) {
    rem = (rem * 10 + Number(expanded[i])) % 97;
  }
  if (rem !== 1) return { ok: false, error: 'IBAN inválido.' };
  return { ok: true, value: compact };
}

export function validatePtPhone(raw) {
  const s = String(raw || '').trim();
  if (!s) return { ok: true, value: '' };
  const d = onlyDigits(s);
  if (s.startsWith('+351')) {
    if (d.length !== 12 || !d.startsWith('3519')) return { ok: false, error: 'Telefone inválido (+351).' };
    return { ok: true, value: `+351${d.slice(3)}` };
  }
  if (d.length === 9 && d.startsWith('9')) return { ok: true, value: d };
  return { ok: false, error: 'Telefone inválido (usa 9XXXXXXXX ou +3519XXXXXXXX).' };
}

export function validatePtPlate(raw) {
  const s = String(raw || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!s) return { ok: true, value: '' };
  const old = /^[A-Z]{2}-\d{2}-[A-Z]{2}$/;
  const mercosul = /^[A-Z]{2}\d{2}[A-Z]{2}$/;
  if (old.test(s) || mercosul.test(s)) return { ok: true, value: s };
  return { ok: false, error: 'Matrícula inválida (ex.: AA-00-BB ou AA00BB).' };
}
