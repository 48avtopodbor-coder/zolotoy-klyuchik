const enc = new TextEncoder();
const MAX_AGE = 60 * 60 * 24 * 14;

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function passwordOk(input: string, real: string): Promise<boolean> {
  // сравниваем хэши, чтобы длина пароля не влияла на время ответа
  const [a, b] = await Promise.all([sign(input, 'pw'), sign(real, 'pw')]);
  return safeEqual(a, b);
}

export async function makeSession(secret: string): Promise<string> {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  return `${exp}.${await sign(exp, secret)}`;
}

export async function sessionOk(cookie: string | undefined, secret: string): Promise<boolean> {
  if (!cookie) return false;
  const [exp, sig] = cookie.split('.');
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return safeEqual(sig, await sign(exp, secret));
}

export const SESSION_MAX_AGE = MAX_AGE;

const hex = (b: ArrayBuffer | Uint8Array) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');

async function derive(pw: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100_000 }, key, 256));
}

/** Хранится как "соль:хэш"; сам пароль нигде не сохраняется. */
export async function hashPassword(pw: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `${hex(salt)}:${await derive(pw, salt)}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [saltHex, h] = stored.split(':');
  if (!saltHex || !h) return false;
  const salt = new Uint8Array(saltHex.match(/../g)!.map((x) => parseInt(x, 16)));
  return safeEqual(await derive(pw, salt), h);
}
