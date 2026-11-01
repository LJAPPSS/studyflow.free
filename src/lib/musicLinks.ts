export type MusicProvider = 'spotify' | 'youtube';

export type ParsedMusicLink = {
  provider: MusicProvider;
  embedUrl: string;
};

const SPOTIFY_KINDS = ['playlist', 'album', 'track', 'episode', 'show'];
const SPOTIFY_ID = /^[A-Za-z0-9]{10,40}$/;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_LIST_ID = /^[A-Za-z0-9_-]{10,80}$/;

export function parseMusicLink(input: string): ParsedMusicLink | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;

  const host = url.hostname.replace(/^www\./, '');

  if (host === 'open.spotify.com') {
    const match = url.pathname.match(/^\/(?:intl-[a-z]{2}\/)?([a-z]+)\/([A-Za-z0-9]+)/);
    if (!match || !SPOTIFY_KINDS.includes(match[1]) || !SPOTIFY_ID.test(match[2])) return null;
    return { provider: 'spotify', embedUrl: `https://open.spotify.com/embed/${match[1]}/${match[2]}` };
  }

  if (host === 'youtu.be') {
    const videoId = url.pathname.slice(1);
    return YOUTUBE_ID.test(videoId) ? { provider: 'youtube', embedUrl: `https://www.youtube.com/embed/${videoId}` } : null;
  }

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const listId = url.searchParams.get('list');
    if (listId && YOUTUBE_LIST_ID.test(listId)) {
      return { provider: 'youtube', embedUrl: `https://www.youtube.com/embed/videoseries?list=${listId}` };
    }
    const videoId = url.searchParams.get('v');
    return videoId && YOUTUBE_ID.test(videoId) ? { provider: 'youtube', embedUrl: `https://www.youtube.com/embed/${videoId}` } : null;
  }

  return null;
}
