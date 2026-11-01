import { supabase } from '@/lib/supabase';

export type ProfileInput = {
  display_name: string;
  school_level: string | null;
  school_grade: number | null;
};

export async function saveProfile(userId: string, input: ProfileInput): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert(
      { user_id: userId, ...input, display_name: input.display_name.trim(), updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
  if (error) throw error;
}

export async function setOnboardingCompleted(userId: string, completed: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed: completed, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) throw error;
}

export async function setTourCompleted(userId: string, completed: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ tour_completed: completed, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) throw error;
}

export async function setWeeklyGoalMinutes(userId: string, minutes: number): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ weekly_goal_minutes: minutes, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) throw error;
}
