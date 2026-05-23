/**
 * Matrículas portuguesas: antigas (1992–2005) e Mercosul (2020+).
 * Formatos: AA-00-00 | 00-AA-00 | 00-00-AA | AA-00-AA (Mercosul)
 */

export function stripPlateInput(raw) {
  return String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

const PLATE_PATTERNS = [
  /^[A-Z]{2}[0-9]{2}[0-9]{2}$/, // AB-12-34
  /^[A-Z]{2}[0-9]{2}[A-Z]{2}$/, // Mercosul AB-12-CD
  /^[0-9]{2}[A-Z]{2}[0-9]{2}$/, // 12-AB-34
  /^[0-9]{2}[0-9]{2}[A-Z]{2}$/, // 12-34-AB
];

export function formatPtPlateFromCompact(compact) {
  const s = stripPlateInput(compact);
  if (!s) return '';
  if (/^[A-Z]{2}[0-9]{2}[A-Z]{2}$/.test(s)) {
    return `${s.slice(0, 2)}-${s.slice(2, 4)}-${s.slice(4, 6)}`;
  }
  if (/^[A-Z]{2}[0-9]{2}[0-9]{2}$/.test(s)) {
    return `${s.slice(0, 2)}-${s.slice(2, 4)}-${s.slice(4, 6)}`;
  }
  if (/^[0-9]{2}[A-Z]{2}[0-9]{2}$/.test(s)) {
    return `${s.slice(0, 2)}-${s.slice(2, 4)}-${s.slice(4, 6)}`;
  }
  if (/^[0-9]{4}[A-Z]{2}$/.test(s)) {
    return `${s.slice(0, 2)}-${s.slice(2, 4)}-${s.slice(4, 6)}`;
  }
  return formatPtPlateAsYouType(s);
}

/** Formata enquanto o utilizador escreve (só caracteres válidos na posição) */
export function formatPtPlateAsYouType(raw) {
  const clean = stripPlateInput(raw);
  if (!clean) return '';

  const out = [];
  const push = (ch) => {
    if (!ch) return false;
    out.push(ch);
    return true;
  };
  const sep = () => {
    if (out.length && out[out.length - 1] !== '-') out.push('-');
  };

  const want = (i, kind) => {
    const ch = clean[i];
    if (!ch) return false;
    if (kind === 'L' && /[A-Z]/.test(ch)) return push(ch);
    if (kind === 'D' && /[0-9]/.test(ch)) return push(ch);
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
    if (/[A-Z]/.test(clean[4])) {
      if (!want(4, 'L')) return out.join('');
      if (clean.length < 6) return out.join('');
      want(5, 'L');
    } else {
      want(4, 'D');
      if (clean.length >= 6) want(5, 'D');
    }
    return out.join('');
  }

  if (/^[0-9]/.test(clean[0])) {
    if (!want(0, 'D')) return '';
    if (clean.length < 2) return out.join('');
    if (!want(1, 'D')) return out.join('');
    if (clean.length < 3) return out.join('');
    sep();
    if (/[A-Z]/.test(clean[2])) {
      if (!want(2, 'L')) return out.join('');
      if (clean.length < 4) return out.join('');
      if (!want(3, 'L')) return out.join('');
      if (clean.length < 5) return out.join('');
      sep();
      if (clean.length >= 5) want(4, 'D');
      if (clean.length >= 6) want(5, 'D');
    } else {
      if (!want(2, 'D')) return out.join('');
      if (clean.length < 4) return out.join('');
      if (!want(3, 'D')) return out.join('');
      if (clean.length < 5) return out.join('');
      sep();
      if (clean.length >= 5) want(4, 'L');
      if (clean.length >= 6) want(5, 'L');
    }
    return out.join('');
  }

  return clean;
}

export function validatePtPlate(raw, { required = false } = {}) {
  const compact = stripPlateInput(raw);
  if (!compact) {
    return required
      ? { ok: false, error: 'Matrícula obrigatória.' }
      : { ok: true, value: '' };
  }
  const ok = PLATE_PATTERNS.some((re) => re.test(compact));
  if (!ok) {
    return {
      ok: false,
      error: 'Matrícula inválida (ex.: AA-00-BB, AB-12-34, 12-AB-34, 12-34-AB).',
    };
  }
  return { ok: true, value: formatPtPlateFromCompact(compact), compact };
}

export function onPlateInput(event, setter) {
  const formatted = formatPtPlateAsYouType(event.target.value);
  setter(formatted);
  if (event.target.value !== formatted) event.target.value = formatted;
}
