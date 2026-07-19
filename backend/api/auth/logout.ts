import { logout } from '../_lib/auth';
import { ApiRequest, ApiResponse, applyCors, methodNotAllowed } from '../_lib/http';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    methodNotAllowed(res);
    return;
  }

  await logout(req, res);
}
