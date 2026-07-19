export interface ApiRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  socket?: { remoteAddress?: string };
}

export interface ApiResponse {
  status(code: number): ApiResponse;
  json(value: unknown): void;
  end(): void;
  setHeader(name: string, value: string | string[]): void;
}

export function methodNotAllowed(res: ApiResponse): void {
  res.status(405).json({ error: 'Method not allowed' });
}

export function applyCors(req: ApiRequest, res: ApiResponse): boolean {
  const origin = getHeader(req, 'origin');
  const allowedOrigins = (process.env.FRONTEND_ORIGIN ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}

export function getBody<T>(req: ApiRequest): T {
  return typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as T);
}

export function getClientIp(req: ApiRequest): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  const raw = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return raw?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
}

export function getUserAgent(req: ApiRequest): string {
  return getHeader(req, 'user-agent') || 'unknown';
}

function getHeader(req: ApiRequest, name: string): string | undefined {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}
