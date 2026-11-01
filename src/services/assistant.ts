import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase';
import { UserFacingError } from '@/lib/errors';

export type AssistantMessage = { role: 'user' | 'assistant'; content: string };

export async function askAssistant(messages: AssistantMessage[]): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new UserFacingError('Je sessie is verlopen. Log opnieuw in.');

  let response: Response;
  try {
    response = await fetch(`${SUPABASE_URL}/functions/v1/ai-assistant`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });
  } catch {
    throw new UserFacingError('Geen verbinding met de server. Controleer je internetverbinding.');
  }

  const body: unknown = await response.json().catch(() => null);
  const error = typeof body === 'object' && body !== null && 'error' in body ? (body as { error: unknown }).error : null;
  if (!response.ok) {
    throw new UserFacingError(typeof error === 'string' ? error : 'De AI-assistent gaf geen antwoord. Probeer het opnieuw.');
  }
  const reply = typeof body === 'object' && body !== null && 'reply' in body ? (body as { reply: unknown }).reply : null;
  if (typeof reply !== 'string' || !reply.trim()) {
    throw new UserFacingError('De AI-assistent gaf een onverwacht antwoord. Probeer het opnieuw.');
  }
  return reply;
}
