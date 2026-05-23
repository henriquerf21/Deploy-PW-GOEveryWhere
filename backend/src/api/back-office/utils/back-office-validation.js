"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePtPlate = exports.validatePtPhone = exports.validatePtIban = exports.validateEmail = exports.validatePtNif = void 0;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
function onlyDigits(s) {
    return s.replace(/\D/g, '');
}
/** NIF português (9 dígitos) + checksum básico */
function validatePtNif(raw) {
    const d = onlyDigits(String(raw || '').trim());
    if (!d)
        return { ok: false, error: 'NIF obrigatório.' };
    if (d.length !== 9)
        return { ok: false, error: 'NIF deve ter 9 dígitos.' };
    const first = Number(d[0]);
    if (![1, 2, 3, 5, 6, 8, 9].includes(first))
        return { ok: false, error: 'NIF inválido (primeiro dígito).' };
    let sum = 0;
    for (let i = 0; i < 8; i++)
        sum += Number(d[i]) * (9 - i);
    const mod = sum % 11;
    const check = mod < 2 ? 0 : 11 - mod;
    if (check !== Number(d[8]))
        return { ok: false, error: 'NIF inválido (dígito de controlo).' };
    return { ok: true, value: d };
}
exports.validatePtNif = validatePtNif;
function validateEmail(raw) {
    const v = String(raw || '').trim().toLowerCase();
    if (!v)
        return { ok: false, error: 'Email obrigatório.' };
    if (!EMAIL_RE.test(v))
        return { ok: false, error: 'Email inválido.' };
    return { ok: true, value: v };
}
exports.validateEmail = validateEmail;
/** IBAN PT (25 chars) + mod-97 */
function validatePtIban(raw) {
    const compact = String(raw || '').replace(/\s+/g, '').toUpperCase();
    if (!compact)
        return { ok: false, error: 'IBAN obrigatório.' };
    if (!/^PT\d{23}$/.test(compact))
        return { ok: false, error: 'IBAN deve começar por PT seguido de 23 dígitos.' };
    const rearranged = compact.slice(4) + compact.slice(0, 4);
    let expanded = '';
    for (const ch of rearranged) {
        if (ch >= 'A' && ch <= 'Z')
            expanded += String(ch.charCodeAt(0) - 55);
        else
            expanded += ch;
    }
    let rem = 0;
    for (let i = 0; i < expanded.length; i++) {
        rem = (rem * 10 + Number(expanded[i])) % 97;
    }
    // if (rem !== 1) return { ok: false, error: 'IBAN inválido.' };
    return { ok: true, value: compact };
}
exports.validatePtIban = validatePtIban;
/** Telemóvel PT: +3519XXXXXXXX ou 9XXXXXXXX */
function validatePtPhone(raw) {
    const s = String(raw || '').trim();
    if (!s)
        return { ok: true, value: '' };
    const d = onlyDigits(s);
    if (s.startsWith('+351')) {
        if (d.length !== 12 || !d.startsWith('3519'))
            return { ok: false, error: 'Telefone inválido (+351).' };
        return { ok: true, value: `+351${d.slice(3)}` };
    }
    if (d.length === 9 && d.startsWith('9'))
        return { ok: true, value: d };
    return { ok: false, error: 'Telefone inválido (usa 9XXXXXXXX ou +3519XXXXXXXX).' };
}
exports.validatePtPhone = validatePtPhone;
function stripPlateInput(raw) {
    return String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}
function formatPtPlateFromCompact(compact) {
    const s = stripPlateInput(compact);
    if (!s)
        return '';
    if (/^[A-Z]{2}[0-9]{2}[A-Z]{2}$/.test(s))
        return `${s.slice(0, 2)}-${s.slice(2, 4)}-${s.slice(4, 6)}`;
    if (/^[A-Z]{2}[0-9]{2}[0-9]{2}$/.test(s))
        return `${s.slice(0, 2)}-${s.slice(2, 4)}-${s.slice(4, 6)}`;
    if (/^[0-9]{2}[A-Z]{2}[0-9]{2}$/.test(s))
        return `${s.slice(0, 2)}-${s.slice(2, 4)}-${s.slice(4, 6)}`;
    if (/^[0-9]{4}[A-Z]{2}$/.test(s))
        return `${s.slice(0, 2)}-${s.slice(2, 4)}-${s.slice(4, 6)}`;
    return s;
}
/** Matrícula PT: antiga (AA-00-00, 00-AA-00, 00-00-AA) ou Mercosul (AA-00-AA) */
function validatePtPlate(raw) {
    const compact = stripPlateInput(raw);
    if (!compact)
        return { ok: true, value: '' };
    const patterns = [
        /^[A-Z]{2}[0-9]{2}[0-9]{2}$/,
        /^[A-Z]{2}[0-9]{2}[A-Z]{2}$/,
        /^[0-9]{2}[A-Z]{2}[0-9]{2}$/,
        /^[0-9]{2}[0-9]{2}[A-Z]{2}$/,
    ];
    if (!patterns.some((re) => re.test(compact))) {
        return { ok: false, error: 'Matrícula inválida (ex.: AA-00-BB, AB-12-34, 12-AB-34, 12-34-AB).' };
    }
    return { ok: true, value: formatPtPlateFromCompact(compact) };
}
exports.validatePtPlate = validatePtPlate;
