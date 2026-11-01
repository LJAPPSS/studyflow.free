import { supabase } from '@/lib/supabase';

export async function saveSubjectNote(subjectId: string, body: string): Promise<void> {
  const { error } = await supabase
    .from('subject_notes')
    .upsert({ subject_id: subjectId, body, updated_at: new Date().toISOString() }, { onConflict: 'subject_id' });
  if (error) throw error;
}
