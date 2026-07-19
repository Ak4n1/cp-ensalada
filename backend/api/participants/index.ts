import { requireSession } from '../_lib/auth';
import { ensureSeedData } from '../_lib/seed';
import { sql } from '../_lib/db';
import { ApiRequest, ApiResponse, applyCors, getBody, methodNotAllowed } from '../_lib/http';

interface ParticipantBody {
  name?: string;
  avatar?: string;
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    methodNotAllowed(res);
    return;
  }

  if (!(await requireSession(req, res))) {
    return;
  }

  await ensureSeedData();
  const body = getBody<ParticipantBody>(req);
  const name = body.name?.trim().toUpperCase();

  if (!name || !body.avatar) {
    res.status(400).json({ error: 'Datos incompletos.' });
    return;
  }

  const participantId = name.toLowerCase().replace(/\s+/g, '-');
  const [participant] = await sql`
    INSERT INTO participants (id, name, avatar, active)
    VALUES (${participantId}, ${name}, ${body.avatar}, TRUE)
    RETURNING id, name, avatar, active
  `;

  res.status(201).json({ participant });
}
