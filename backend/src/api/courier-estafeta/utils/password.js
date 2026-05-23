"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCourierPassword = exports.hashCourierPassword = exports.isCourierPasswordHash = void 0;
const node_crypto_1 = require("node:crypto");
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEYLEN = 64;
function isCourierPasswordHash(value) {
    return typeof value === 'string' && value.startsWith('scrypt$');
}
exports.isCourierPasswordHash = isCourierPasswordHash;
function hashCourierPassword(plainPassword) {
    const salt = (0, node_crypto_1.randomBytes)(16).toString('hex');
    const derivedKey = (0, node_crypto_1.scryptSync)(plainPassword, salt, KEYLEN, {
        N: SCRYPT_N,
        r: SCRYPT_R,
        p: SCRYPT_P,
    });
    return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}
exports.hashCourierPassword = hashCourierPassword;
function verifyCourierPassword(plainPassword, storedPassword) {
    if (!plainPassword || !storedPassword)
        return false;
    if (!isCourierPasswordHash(storedPassword)) {
        return storedPassword === plainPassword;
    }
    const parts = storedPassword.split('$');
    if (parts.length !== 3)
        return false;
    const salt = parts[1];
    const hashHex = parts[2];
    const expected = Buffer.from(hashHex, 'hex');
    const actual = (0, node_crypto_1.scryptSync)(plainPassword, salt, expected.length, {
        N: SCRYPT_N,
        r: SCRYPT_R,
        p: SCRYPT_P,
    });
    if (actual.length !== expected.length)
        return false;
    return (0, node_crypto_1.timingSafeEqual)(actual, expected);
}
exports.verifyCourierPassword = verifyCourierPassword;
