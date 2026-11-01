import { supabase } from '@/lib/supabase';
import type { ExamPeriod, SchoolYear } from '@/types/study';

export async function createSchoolYear(label: string, periodNames: string[]): Promise<SchoolYear> {
  const { data, error } = await supabase
    .from('school_years')
    .insert({ label: label.trim() })
    .select('*')
    .single();
  if (error) throw error;
  const schoolYear = data as SchoolYear;

  if (periodNames.length > 0) {
    const { error: periodError } = await supabase
      .from('exam_periods')
      .insert(periodNames.map((name) => ({ school_year_id: schoolYear.id, name })));
    if (periodError) throw periodError;
  }
  return schoolYear;
}

export async function renameSchoolYear(id: string, label: string): Promise<void> {
  const { error } = await supabase.from('school_years').update({ label: label.trim() }).eq('id', id);
  if (error) throw error;
}

export async function createExamPeriod(schoolYearId: string, name: string): Promise<void> {
  const { error } = await supabase.from('exam_periods').insert({ school_year_id: schoolYearId, name: name.trim() });
  if (error) throw error;
}

export async function renameExamPeriod(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('exam_periods').update({ name: name.trim() }).eq('id', id);
  if (error) throw error;
}

export async function deleteExamPeriod(period: ExamPeriod): Promise<void> {
  const { error } = await supabase.from('exam_periods').delete().eq('id', period.id);
  if (error) throw error;
}
