import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase';
import { UserFacingError } from '@/lib/errors';

export async function deleteAccount(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new UserFacingError('Je sessie is verlopen. Log opnieuw in.');

  let response: Response;
  try {
    response = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
    });
  } catch {
    throw new UserFacingError('Geen verbinding met de server. Controleer je internetverbinding.');
  }

  const body: unknown = await response.json().catch(() => null);
  const error = typeof body === 'object' && body !== null && 'error' in body ? (body as { error: unknown }).error : null;
  if (!response.ok) {
    throw new UserFacingError(typeof error === 'string' ? error : 'Je account kon niet worden verwijderd. Probeer het later opnieuw.');
  }

  await supabase.auth.signOut({ scope: 'local' });
}
