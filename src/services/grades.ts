import { supabase } from '@/lib/supabase';

export type GradeInput = {
  subject_id: string;
  title: string | null;
  grade: number;
  weight: number;
  grade_date: string;
};

export async function insertGrade(input: GradeInput): Promise<void> {
  const { error } = await supabase.from('grades').insert(input);
  if (error) throw error;
}

export async function deleteGrade(id: string): Promise<void> {
  const { error } = await supabase.from('grades').delete().eq('id', id);
  if (error) throw error;
}
