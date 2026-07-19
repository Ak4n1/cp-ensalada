import { requireSession } from './_lib/auth';
import { ensureSeedData } from './_lib/seed';
import { sql } from './_lib/db';
import { ApiRequest, ApiResponse, applyCors, methodNotAllowed } from './_lib/http';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    methodNotAllowed(res);
    return;
  }

  if (!(await requireSession(req, res))) {
    return;
  }

  await ensureSeedData();

  const participants = await sql`
    SELECT id, name, avatar, active
    FROM participants
    ORDER BY created_at ASC
  `;
  const materials = await sql`
    SELECT item_id AS id, name, icon
    FROM materials
    ORDER BY created_at ASC
  `;
  const contributions = await sql`
    SELECT id, participant_id AS "participantId", material_id AS "materialId", amount, created_at AS "createdAt"
    FROM contributions
    ORDER BY created_at DESC
  `;

  res.status(200).json({ participants, materials, contributions });
}
