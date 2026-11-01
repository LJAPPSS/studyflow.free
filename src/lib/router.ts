import { useEffect, useState } from 'react';

function readSegments(): string[] {
  return window.location.hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map(decodeURIComponent);
}

export function navigate(path: string): void {
  window.location.hash = path;
}

export function useSegments(): string[] {
  const [segments, setSegments] = useState(readSegments);

  useEffect(() => {
    const handleChange = () => setSegments(readSegments());
    window.addEventListener('hashchange', handleChange);
    return () => window.removeEventListener('hashchange', handleChange);
  }, []);

  return segments;
}
