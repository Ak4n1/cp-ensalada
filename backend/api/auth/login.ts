import { login } from '../_lib/auth';
import { ApiRequest, ApiResponse, applyCors, getBody, methodNotAllowed } from '../_lib/http';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    methodNotAllowed(res);
    return;
  }

  const body = getBody<{ password?: string }>(req);
  await login(req, res, body.password?.trim() ?? '');
}
