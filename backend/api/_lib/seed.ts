import { ensureSchema } from './db';

export async function ensureSeedData(): Promise<void> {
  await ensureSchema();
}
