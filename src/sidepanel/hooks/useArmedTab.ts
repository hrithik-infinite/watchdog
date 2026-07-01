import { useEffect, useState } from 'react';
import logger from '@/shared/logger';
import type { ArmedTabResponse } from '@/shared/messaging';

/**
 * Resolve the armed tab — the tab whose toolbar icon was clicked to open the panel
 * and grant activeTab — so Home can show which page a scan will target. Fetched
 * when the panel becomes visible; re-fetched on visibilitychange because clicking
 * the icon on a different tab re-arms it without remounting the panel.
 *
 * Display-only: the scan itself always targets the true armed tab resolved in the
 * background, so a briefly-stale hostname here never mis-scans.
 */
export function useArmedTab(): { hostname: string | null } {
  const [hostname, setHostname] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refresh = (): void => {
      chrome.runtime
        .sendMessage({ type: 'GET_ARMED_TAB' })
        .then((response: ArmedTabResponse | undefined) => {
          if (cancelled) return;
          const url = response?.tab?.url;
          if (!url) {
            setHostname(null);
            return;
          }
          try {
            setHostname(new URL(url).hostname || url);
          } catch {
            setHostname(url);
          }
        })
        .catch((error) => logger.error('Failed to resolve armed tab', { error }));
    };

    refresh();
    document.addEventListener('visibilitychange', refresh);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  return { hostname };
}
