import { hash, id, randomToken } from './crypto';
import { ensureSchema, sql } from './db';
import { ApiRequest, ApiResponse, getClientIp, getUserAgent } from './http';

const COOKIE_NAME = 'cp_session';
const SESSION_DAYS = 7;
const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MINUTES = 10;
const BLOCK_MINUTES = 15;
const PASSWORD_HASH_PREFIX = 'sha256-pepper:';

export async function login(req: ApiRequest, res: ApiResponse, password: string): Promise<void> {
  await ensureSchema();
  await seedInitialPassword();

  const ipHash = hash(getClientIp(req));
  const userAgentHash = hash(getUserAgent(req));
  const blocked = await isBlocked(ipHash);

  if (blocked) {
    res.status(429).json({ error: 'Demasiados intentos. Probá de nuevo en unos minutos.' });
    return;
  }

  const [setting] = await sql<{ value_hash: string }[]>`
    SELECT value_hash FROM app_settings WHERE key = 'access_password'
  `;
  const valid = setting ? verifyPassword(password, setting.value_hash) : false;

  await sql`
    INSERT INTO login_attempts (id, ip_hash, user_agent_hash, success)
    VALUES (${id('attempt')}, ${ipHash}, ${userAgentHash}, ${valid})
  `;

  if (!valid) {
    res.status(401).json({ error: 'Contraseña incorrecta.' });
    return;
  }

  const token = randomToken();
  const tokenHash = hash(token);
  const sessionId = id('session');

  await sql`
    INSERT INTO sessions (id, token_hash, expires_at)
    VALUES (${sessionId}, ${tokenHash}, NOW() + (${`${SESSION_DAYS} days`})::interval)
  `;

  setSessionCookie(res, token);
  res.status(200).json({ ok: true });
}

export async function logout(req: ApiRequest, res: ApiResponse): Promise<void> {
  await ensureSchema();
  const token = readCookie(req, COOKIE_NAME);

  if (token) {
    await sql`DELETE FROM sessions WHERE token_hash = ${hash(token)}`;
  }

  clearSessionCookie(res);
  res.status(200).json({ ok: true });
}

export async function requireSession(req: ApiRequest, res: ApiResponse): Promise<boolean> {
  await ensureSchema();
  const token = readCookie(req, COOKIE_NAME);

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }

  const [session] = await sql<{ id: string }[]>`
    SELECT id FROM sessions WHERE token_hash = ${hash(token)} AND expires_at > NOW()
  `;

  if (!session) {
    clearSessionCookie(res);
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }

  return true;
}

export async function hasSession(req: ApiRequest): Promise<boolean> {
  await ensureSchema();
  const token = readCookie(req, COOKIE_NAME);

  if (!token) {
    return false;
  }

  const [session] = await sql<{ id: string }[]>`
    SELECT id FROM sessions WHERE token_hash = ${hash(token)} AND expires_at > NOW()
  `;

  return Boolean(session);
}

async function seedInitialPassword(): Promise<void> {
  const [setting] = await sql<{ value_hash: string }[]>`
    SELECT value_hash FROM app_settings WHERE key = 'access_password'
  `;

  if (setting?.value_hash.startsWith(PASSWORD_HASH_PREFIX)) {
    return;
  }

  const initialPassword = process.env.CP_INITIAL_PASSWORD;

  if (!initialPassword) {
    throw new Error('Missing CP_INITIAL_PASSWORD for first access_password seed.');
  }

  const valueHash = hashPassword(initialPassword);

  await sql`
    INSERT INTO app_settings (key, value_hash)
    VALUES ('access_password', ${valueHash})
    ON CONFLICT (key) DO UPDATE SET value_hash = EXCLUDED.value_hash, updated_at = NOW()
  `;

  await sql`DELETE FROM login_attempts`;
}

function hashPassword(password: string): string {
  return `${PASSWORD_HASH_PREFIX}${hash(password)}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  return storedHash === hashPassword(password);
}

async function isBlocked(ipHash: string): Promise<boolean> {
  const [attempts] = await sql<{ count: string }[]>`
    SELECT COUNT(*)::text AS count
    FROM login_attempts
    WHERE ip_hash = ${ipHash}
      AND success = FALSE
      AND attempted_at > NOW() - (${`${WINDOW_MINUTES} minutes`})::interval
  `;

  if (Number(attempts?.count ?? 0) < MAX_FAILED_ATTEMPTS) {
    return false;
  }

  const [lastAttempt] = await sql<{ attempted_at: string }[]>`
    SELECT attempted_at
    FROM login_attempts
    WHERE ip_hash = ${ipHash} AND success = FALSE
    ORDER BY attempted_at DESC
    LIMIT 1
  `;

  if (!lastAttempt) {
    return false;
  }

  const blockedUntil = new Date(lastAttempt.attempted_at).getTime() + BLOCK_MINUTES * 60_000;
  return Date.now() < blockedUntil;
}

function setSessionCookie(res: ApiResponse, token: string): void {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; Path=/; Max-Age=${SESSION_DAYS * 24 * 60 * 60}; HttpOnly; Secure; SameSite=None`,
  );
}

function clearSessionCookie(res: ApiResponse): void {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None`);
}

function readCookie(req: ApiRequest, name: string): string | null {
  const cookieHeader = req.headers.cookie;
  const cookie = Array.isArray(cookieHeader) ? cookieHeader.join(';') : cookieHeader;

  if (!cookie) {
    return null;
  }

  const match = cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}
