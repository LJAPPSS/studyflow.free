import { supabase } from '@/lib/supabase';
import type { MusicProvider } from '@/lib/musicLinks';

export type MusicPlaylist = {
  id: string;
  label: string;
  provider: MusicProvider;
  embed_url: string;
  source_url: string;
  created_at: string;
};

export async function listMusicPlaylists(): Promise<MusicPlaylist[]> {
  const { data, error } = await supabase
    .from('music_playlists')
    .select('id, label, provider, embed_url, source_url, created_at')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as MusicPlaylist[];
}

export async function addMusicPlaylist(input: Omit<MusicPlaylist, 'id' | 'created_at'>): Promise<MusicPlaylist> {
  const { data, error } = await supabase
    .from('music_playlists')
    .insert(input)
    .select('id, label, provider, embed_url, source_url, created_at')
    .single();
  if (error) throw error;
  return data as MusicPlaylist;
}

export async function deleteMusicPlaylist(id: string): Promise<void> {
  const { error } = await supabase.from('music_playlists').delete().eq('id', id);
  if (error) throw error;
}
