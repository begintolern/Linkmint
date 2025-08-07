import { cookies } from 'next/headers';

export function getUserToken(): string | null {
  const cookieStore = cookies();
  const token = cookieStore.get('linkmint_token');
  return token?.value || null;
}
