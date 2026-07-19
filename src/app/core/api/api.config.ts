export const API_BASE_URL = 'https://cp-ensalada-api.vercel.app';

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
