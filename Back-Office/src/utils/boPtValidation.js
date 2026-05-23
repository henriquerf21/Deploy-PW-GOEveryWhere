/** Mensagens alinhadas com `backend/src/api/back-office/utils/back-office-validation.js` */

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

export function stripPlateInput(raw) {
  return String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

const PLATE_PATTERNS = [
  /^[A-Z]{2}[0-9]{2}[0-9]{2}$/,
  /^[A-Z]{2}[0-9]{2}[A-Z]{2}$/,
  /^[0-9]{2}[A-Z]{2}[0-9]{2}$/,
  /^[0-9]{2}[0-9]{2}[A-Z]{2}$/,
];

export function formatPtPlateFromCompact(compact) {
  const s = stripPlateInput(compact);
  if (!s) return '';
  if (/^[A-Z]{2}[0-9]{2}[A-Z]{2}$/.test(s)) return `${s.slice(0, 2)}-${s.slice(2, 4)}-${s.slice(4, 6)}`;
  if (/^[A-Z]{2}[0-9]{2}[0-9]{2}$/.test(s)) return `${s.slice(0, 2)}-${s.slice(2, 4)}-${s.slice(4, 6)}`;
  if (/^[0-9]{2}[A-Z]{2}[0-9]{2}$/.test(s)) return `${s.slice(0, 2)}-${s.slice(2, 4)}-${s.slice(4, 6)}`;
  if (/^[0-9]{4}[A-Z]{2}$/.test(s)) return `${s.slice(0, 2)}-${s.slice(2, 4)}-${s.slice(4, 6)}`;
  return formatPtPlateAsYouType(s);
}

export function formatPtPlateAsYouType(raw) {
  const clean = stripPlateInput(raw);
  if (!clean) return '';
  const out = [];
  const push = (ch) => { if (ch) out.push(ch); };
  const sep = () => { if (out.length && out[out.length - 1] !== '-') out.push('-'); };
  const want = (i, kind) => {
    const ch = clean[i];
    if (!ch) return false;
    if (kind === 'L' && /[A-Z]/.test(ch)) { push(ch); return true; }
    if (kind === 'D' && /[0-9]/.test(ch)) { push(ch); return true; }
    return false;
  };
  if (/^[A-Z]/.test(clean[0])) {
    if (!want(0, 'L')) return '';
    if (clean.length < 2) return out.join('');
    if (!want(1, 'L')) return out.join('');
    if (clean.length < 3) return out.join('');
    sep();
    if (!want(2, 'D')) return out.join('');
    if (clean.length < 4) return out.join('');
    if (!want(3, 'D')) return out.join('');
    if (clean.length < 5) return out.join('');
    sep();
    if (/[A-Z]/.test(clean[4])) { want(4, 'L'); if (clean.length >= 6) want(5, 'L'); }
    else { want(4, 'D'); if (clean.length >= 6) want(5, 'D'); }
    return out.join('');
  }
  if (/^[0-9]/.test(clean[0])) {
    if (!want(0, 'D')) return '';
    if (clean.length < 2) return out.join('');
    if (!want(1, 'D')) return out.join('');
    if (clean.length < 3) return out.join('');
    sep();
    if (/[A-Z]/.test(clean[2])) {
      want(2, 'L'); if (clean.length >= 4) want(3, 'L');
      if (clean.length >= 5) { sep(); want(4, 'D'); if (clean.length >= 6) want(5, 'D'); }
    } else {
      want(2, 'D'); if (clean.length >= 4) want(3, 'D');
      if (clean.length >= 5) { sep(); want(4, 'L'); if (clean.length >= 6) want(5, 'L'); }
    }
    return out.join('');
  }
  return clean;
}

export function onPlateInput(event, setter) {
  const formatted = formatPtPlateAsYouType(event.target.value);
  setter(formatted);
  if (event.target.value !== formatted) event.target.value = formatted;
}

export function validatePtPlate(raw, { required = false } = {}) {
  const compact = stripPlateInput(raw);
  if (!compact) {
    return required ? { ok: false, error: 'Matrícula obrigatória.' } : { ok: true, value: '' };
  }
  if (!PLATE_PATTERNS.some((re) => re.test(compact))) {
    return { ok: false, error: 'Matrícula inválida (ex.: AA-00-BB, AB-12-34, 12-AB-34, 12-34-AB).' };
  }
  return { ok: true, value: formatPtPlateFromCompact(compact), compact };
}
