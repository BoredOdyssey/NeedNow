// server/auth.js - Zero-Dependency Cryptographic Authentication (PBKDF2 + JWT HMAC-SHA256)
const crypto = require('crypto');
const { db } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'neednow-super-secret-key-bangalore-2026';

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf8');
}

function hashPassword(password, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, storedHash) {
  const { hash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

function createToken(payload, expiresInMs = 7 * 24 * 60 * 60 * 1000) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Date.now() + expiresInMs;
  const tokenPayload = { ...payload, exp };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(tokenPayload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${data}.${signature}`;
}

function verifyToken(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;

    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(data)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (signature !== expectedSig) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch (err) {
    return null;
  }
}

function extractUser(req) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  const decoded = verifyToken(token);
  if (!decoded || !decoded.id) {
    return null;
  }
  const user = db.findOne('users', u => u.id === decoded.id);
  if (!user) return null;
  const { passwordHash, salt, ...safeUser } = user;
  return safeUser;
}

module.exports = {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  extractUser
};
