import { supabase } from '@/lib/supabase';

export type AvailabilityInput = {
  kind: 'studietijd' | 'verplichting';
  weekday: number | null;
  specific_date: string | null;
  start_time: string;
  end_time: string;
  label: string | null;
};

export async function createAvailabilityBlock(input: AvailabilityInput): Promise<void> {
  const { error } = await supabase.from('availability_blocks').insert(input);
  if (error) throw error;
}

export async function deleteAvailabilityBlock(id: string): Promise<void> {
  const { error } = await supabase.from('availability_blocks').delete().eq('id', id);
  if (error) throw error;
}
