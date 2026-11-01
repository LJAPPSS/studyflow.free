const DEFAULT_MESSAGE = 'Er ging iets mis. Probeer het opnieuw.';

export class UserFacingError extends Error {}

export function toUserMessage(error: unknown, fallback = DEFAULT_MESSAGE): string {
  if (error instanceof UserFacingError) return error.message;
  const { message = '', code = '' } = (error ?? {}) as { message?: string; code?: string };
  if (code === '23505') return 'Deze naam bestaat al.';
  if (/row-level security|permission denied|42501/i.test(`${message} ${code}`)) {
    return 'Je hebt geen toegang tot deze gegevens. Log opnieuw in en probeer het nog eens.';
  }
  if (/failed to fetch|networkerror|network request failed/i.test(message)) {
    return 'Geen verbinding met de server. Controleer je internetverbinding.';
  }
  return fallback;
}
