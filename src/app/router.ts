import { useEffect, useState } from 'react';

export function parseHash(hash: string): string[] {
  const clean = hash.replace(/^#\/?/, '');
  return clean ? clean.split('/').map(decodeURIComponent) : [];
}

export function useRoute(): string[] {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function go(...parts: string[]): void {
  window.location.hash = '#/' + parts.map(encodeURIComponent).join('/');
}
