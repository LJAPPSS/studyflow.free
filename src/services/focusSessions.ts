import { supabase } from '@/lib/supabase';

export type FocusSessionInput = {
  subject_id: string | null;
  session_date: string;
  duration_minutes: number;
};

export async function insertFocusSession(input: FocusSessionInput): Promise<void> {
  const { error } = await supabase.from('focus_sessions').insert(input);
  if (error) throw error;
}
