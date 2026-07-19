import { requireSession } from '../_lib/auth';
import { ensureSeedData } from '../_lib/seed';
import { sql } from '../_lib/db';
import { ApiRequest, ApiResponse, applyCors, getBody, methodNotAllowed } from '../_lib/http';

interface ParticipantUpdateBody {
  name?: string;
  avatar?: string;
  active?: boolean;
}

interface ParticipantRequest extends ApiRequest {
  query: { id?: string };
}

export default async function handler(req: ParticipantRequest, res: ApiResponse): Promise<void> {
  if (applyCors(req, res)) return;

  if (!(await requireSession(req, res))) {
    return;
  }

  await ensureSeedData();
  const participantId = req.query.id;

  if (!participantId) {
    res.status(400).json({ error: 'Falta participante.' });
    return;
  }

  if (req.method === 'PATCH') {
    const body = getBody<ParticipantUpdateBody>(req);
    const name = body.name?.trim().toUpperCase();

    if (!name || !body.avatar || typeof body.active !== 'boolean') {
      res.status(400).json({ error: 'Datos incompletos.' });
      return;
    }

    const [participant] = await sql`
      UPDATE participants
      SET name = ${name}, avatar = ${body.avatar}, active = ${body.active}, updated_at = NOW()
      WHERE id = ${participantId}
      RETURNING id, name, avatar, active
    `;

    res.status(200).json({ participant });
    return;
  }

  if (req.method === 'DELETE') {
    await sql`DELETE FROM participants WHERE id = ${participantId}`;
    res.status(200).json({ ok: true });
    return;
  }

  methodNotAllowed(res);
}
