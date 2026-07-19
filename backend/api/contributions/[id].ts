import { requireSession } from '../_lib/auth';
import { ensureSeedData } from '../_lib/seed';
import { sql } from '../_lib/db';
import { ApiRequest, ApiResponse, applyCors, getBody, methodNotAllowed } from '../_lib/http';

interface ContributionUpdateBody {
  participantId?: string;
  materialId?: string;
  material?: {
    id?: string;
    name?: string;
    icon?: string;
  };
  amount?: number;
}

interface ContributionRequest extends ApiRequest {
  query: { id?: string };
}

export default async function handler(req: ContributionRequest, res: ApiResponse): Promise<void> {
  if (applyCors(req, res)) return;

  if (!(await requireSession(req, res))) {
    return;
  }

  await ensureSeedData();
  const contributionId = req.query.id;

  if (!contributionId) {
    res.status(400).json({ error: 'Falta aporte.' });
    return;
  }

  if (req.method === 'PATCH') {
    const body = getBody<ContributionUpdateBody>(req);
    const amount = Number(body.amount);

    if (!body.participantId || !body.materialId || !amount || amount <= 0) {
      res.status(400).json({ error: 'Datos incompletos.' });
      return;
    }

    if (body.material?.id && body.material.name) {
      await sql`
        INSERT INTO materials (id, item_id, name, icon)
        VALUES (${body.material.id}, ${body.material.id}, ${body.material.name}, ${body.material.icon ?? ''})
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon
      `;
    }

    const [contribution] = await sql`
      UPDATE contributions
      SET participant_id = ${body.participantId}, material_id = ${body.materialId}, amount = ${amount}
      WHERE id = ${contributionId}
      RETURNING id, participant_id AS "participantId", material_id AS "materialId", amount, created_at AS "createdAt"
    `;

    if (!contribution) {
      res.status(404).json({ error: 'Aporte no encontrado.' });
      return;
    }

    res.status(200).json({ contribution });
    return;
  }

  if (req.method === 'DELETE') {
    await sql`DELETE FROM contributions WHERE id = ${contributionId}`;
    res.status(200).json({ ok: true });
    return;
  }

  methodNotAllowed(res);
}
