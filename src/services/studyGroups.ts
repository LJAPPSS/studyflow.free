import { supabase } from '@/lib/supabase';
import type { StudyGroup, GroupMember } from '@/types/study';

type MembershipRow = { study_groups: StudyGroup | StudyGroup[] | null };
type OverviewRow = { member_user_id: string; member_name: string; member_minutes: number };

export async function listMyStudyGroups(): Promise<StudyGroup[]> {
  const { data, error } = await supabase
    .from('study_group_members')
    .select('study_groups(id, name, invite_code)')
    .order('joined_at', { ascending: true });
  if (error) throw error;
  return (data as MembershipRow[])
    .flatMap((row) => (Array.isArray(row.study_groups) ? row.study_groups : [row.study_groups]))
    .filter((group): group is StudyGroup => group !== null);
}

export async function createStudyGroup(name: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_study_group', { p_name: name.trim() });
  if (error) throw error;
  return data as string;
}

export async function joinStudyGroup(code: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_study_group', { p_code: code.trim() });
  if (error) throw error;
  return data as string;
}

export async function leaveStudyGroup(groupId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('study_group_members').delete().eq('group_id', groupId).eq('user_id', userId);
  if (error) throw error;
}

export async function loadGroupMembers(groupId: string, since: string): Promise<GroupMember[]> {
  const { data, error } = await supabase.rpc('group_member_overview', { p_group: groupId, p_since: since });
  if (error) throw error;
  if (!Array.isArray(data)) throw new Error('Onverwacht antwoord van de server.');
  return (data as OverviewRow[]).map((row) => ({
    user_id: row.member_user_id,
    name: row.member_name,
    minutes: row.member_minutes,
  }));
}
