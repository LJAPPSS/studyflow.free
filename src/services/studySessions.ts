import { supabase } from '@/lib/supabase';
import type { PlannedSession } from '@/lib/studyPlanner';

export type SessionUpdate = {
  session_date: string;
  start_time: string;
  duration_minutes: number;
};

export async function insertStudySessions(rows: PlannedSession[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase.from('study_sessions').insert(rows);
  if (error) throw error;
}

export async function deleteOpenStudySessionsFrom(fromDate: string): Promise<void> {
  const { error } = await supabase
    .from('study_sessions')
    .delete()
    .eq('completed', false)
    .gte('session_date', fromDate);
  if (error) throw error;
}

export async function setStudySessionCompleted(id: string, completed: boolean): Promise<void> {
  const { error } = await supabase.from('study_sessions').update({ completed }).eq('id', id);
  if (error) throw error;
}

export async function updateStudySession(id: string, input: SessionUpdate): Promise<void> {
  const { error } = await supabase.from('study_sessions').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteStudySession(id: string): Promise<void> {
  const { error } = await supabase.from('study_sessions').delete().eq('id', id);
  if (error) throw error;
}
