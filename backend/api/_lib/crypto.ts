import crypto from 'node:crypto';

const PEPPER = process.env.AUTH_PEPPER ?? 'cp-ensalada-dev-pepper';

export function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function randomToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function hash(value: string): string {
  return crypto.createHash('sha256').update(`${PEPPER}:${value}`).digest('hex');
}
