import { supabase } from '@/lib/supabase';
import { toUserMessage } from '@/lib/errors';

const MIN_PASSWORD_LENGTH = 8;

function translateAuthError(error: { message: string }, fallback: string): string {
  const message = error.message.toLowerCase();
  if (message.includes('invalid login credentials')) return 'E-mailadres of wachtwoord is onjuist.';
  if (message.includes('user already registered')) return 'Er bestaat al een account met dit e-mailadres.';
  if (message.includes('email not confirmed')) return 'Je e-mailadres is nog niet bevestigd.';
  if (message.includes('password should be at least')) {
    return `Het wachtwoord moet minstens ${MIN_PASSWORD_LENGTH} tekens lang zijn.`;
  }
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Te veel pogingen. Wacht even en probeer het opnieuw.';
  }
  return toUserMessage(error, fallback);
}

export function validateCredentials(email: string, password: string): string | null {
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Vul een geldig e-mailadres in.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Het wachtwoord moet minstens ${MIN_PASSWORD_LENGTH} tekens lang zijn.`;
  }
  return null;
}

export async function signInWithPassword(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return error ? translateAuthError(error, 'Inloggen is niet gelukt. Probeer het opnieuw.') : null;
}

export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<{ error: string | null; needsConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  if (error) {
    return { error: translateAuthError(error, 'Registreren is niet gelukt. Probeer het opnieuw.'), needsConfirmation: false };
  }
  return { error: null, needsConfirmation: data.session === null };
}

export async function signOutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
