import { supabase } from '@/lib/supabase';
import type { SubjectColorKey } from '@/lib/constants';

export type SubjectInput = {
  name: string;
  color: SubjectColorKey;
  difficulty: number;
  confidence: number;
};

export async function createSubject(input: SubjectInput): Promise<string> {
  const { data, error } = await supabase
    .from('subjects')
    .insert({ ...input, name: input.name.trim() })
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function updateSubject(id: string, input: SubjectInput): Promise<void> {
  const name = input.name.trim();
  const { error } = await supabase
    .from('subjects')
    .update({ ...input, name, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteSubject(id: string): Promise<void> {
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) throw error;
}

export type ExamInput = {
  subject_id: string;
  exam_period_id: string | null;
  exam_date: string;
  start_time: string | null;
  duration_minutes: number | null;
  title: string | null;
};

export async function createExam(input: ExamInput): Promise<void> {
  const { error } = await supabase.from('exams').insert(input);
  if (error) throw error;
}

export async function deleteExam(id: string): Promise<void> {
  const { error } = await supabase.from('exams').delete().eq('id', id);
  if (error) throw error;
}
