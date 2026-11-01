import { supabase } from '@/lib/supabase';
import type { Flashcard } from '@/types/study';

export type FlashcardInput = {
  subject_id: string;
  front: string;
  back: string;
};

export async function listFlashcards(): Promise<Flashcard[]> {
  const { data, error } = await supabase
    .from('flashcards')
    .select('id, subject_id, front, back, created_at')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Flashcard[];
}

export async function createFlashcard(input: FlashcardInput): Promise<void> {
  const { error } = await supabase.from('flashcards').insert({
    subject_id: input.subject_id,
    front: input.front.trim(),
    back: input.back.trim(),
  });
  if (error) throw error;
}

export async function updateFlashcard(id: string, input: Pick<FlashcardInput, 'front' | 'back'>): Promise<void> {
  const { error } = await supabase
    .from('flashcards')
    .update({ front: input.front.trim(), back: input.back.trim() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteFlashcard(id: string): Promise<void> {
  const { error } = await supabase.from('flashcards').delete().eq('id', id);
  if (error) throw error;
}
