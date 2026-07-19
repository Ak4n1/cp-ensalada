import { requireSession } from '../_lib/auth';
import { id } from '../_lib/crypto';
import { ensureSeedData } from '../_lib/seed';
import { sql } from '../_lib/db';
import { ApiRequest, ApiResponse, applyCors, getBody, methodNotAllowed } from '../_lib/http';

interface ContributionBody {
  participantId?: string;
  material?: {
    id?: string;
    name?: string;
    icon?: string;
  };
  amount?: number;
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
  const body = getBody<ContributionBody>(req);
  const amount = Number(body.amount);

  if (!body.participantId || !body.material?.id || !body.material.name || !amount || amount <= 0) {
    res.status(400).json({ error: 'Datos incompletos.' });
    return;
  }

  await sql`
    INSERT INTO materials (id, item_id, name, icon)
    VALUES (${body.material.id}, ${body.material.id}, ${body.material.name}, ${body.material.icon ?? ''})
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon
  `;

  const [contribution] = await sql`
    INSERT INTO contributions (id, participant_id, material_id, amount)
    VALUES (${id('contribution')}, ${body.participantId}, ${body.material.id}, ${amount})
    RETURNING id, participant_id AS "participantId", material_id AS "materialId", amount, created_at AS "createdAt"
  `;

  res.status(201).json({ contribution });
}
