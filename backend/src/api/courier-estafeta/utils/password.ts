import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEYLEN = 64;

export function isCourierPasswordHash(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('scrypt$');
}

export function hashCourierPassword(plainPassword: string): string {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(plainPassword, salt, KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

export function verifyCourierPassword(plainPassword: string, storedPassword: string): boolean {
  if (!plainPassword || !storedPassword) return false;
  if (!isCourierPasswordHash(storedPassword)) {
    return storedPassword === plainPassword;
  }

  const parts = storedPassword.split('$');
  if (parts.length !== 3) return false;

  const salt = parts[1];
  const hashHex = parts[2];
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(plainPassword, salt, expected.length, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });

  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
