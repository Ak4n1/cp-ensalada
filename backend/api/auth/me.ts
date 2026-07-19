import { hasSession } from '../_lib/auth';
import { ApiRequest, ApiResponse, applyCors, methodNotAllowed } from '../_lib/http';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    methodNotAllowed(res);
    return;
  }

  res.status(200).json({ authenticated: await hasSession(req) });
}
