/**
 * Sesión admin sin librerías externas. La cookie es un token firmado con
 * HMAC-SHA256 usando ADMIN_SESSION_SECRET. Usamos Web Crypto (`crypto.subtle`)
 * para que el mismo código funcione en el middleware (Edge) y en las server
 * actions (Node). Este módulo NO importa la DB a propósito: el middleware lo
 * carga y debe quedarse ligero.
 */

export const ADMIN_COOKIE = 'admin_session';
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 días

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'ADMIN_SESSION_SECRET no está definida o tiene menos de 32 caracteres.',
    );
  }
  return secret;
}

// ─── base64url ──────────────────────────────────────────────────────────

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

const encoder = new TextEncoder();

async function hmacSign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return toBase64Url(new Uint8Array(sig));
}

/** Comparación en tiempo constante para no filtrar info por timing. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ─── TOKEN DE SESIÓN ──────────────────────────────────────────────────────
// Formato: <payloadB64Url>.<firmaB64Url>, con payload = { exp: epochSeconds }.

export async function createSessionToken(): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const payload = toBase64Url(encoder.encode(JSON.stringify({ exp })));
  const sig = await hmacSign(payload);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;

  const expectedSig = await hmacSign(payload);
  if (!timingSafeEqual(sig, expectedSig)) return false;

  try {
    const decoded = JSON.parse(
      new TextDecoder().decode(fromBase64Url(payload)),
    ) as { exp?: number };
    if (typeof decoded.exp !== 'number') return false;
    return Math.floor(Date.now() / 1000) < decoded.exp;
  } catch {
    return false;
  }
}

// ─── CONTRASEÑA ───────────────────────────────────────────────────────────
// Comparamos los HMAC de la entrada y de la contraseña real: así la
// comparación es de longitud fija y no filtra ni longitud ni contenido.

export async function verifyAdminPassword(input: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error('ADMIN_PASSWORD no está definida.');
  const [a, b] = await Promise.all([hmacSign(`pw:${input}`), hmacSign(`pw:${expected}`)]);
  return timingSafeEqual(a, b);
}
