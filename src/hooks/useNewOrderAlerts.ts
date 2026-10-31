import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { quotationService } from '../services/orderService';

const POLL_MS = 20_000;
const BASE_TITLE = typeof document !== 'undefined' ? document.title : '';

// Module-level so moving between pages (each page mounts its own Layout)
// neither re-alerts for the same orders nor alerts on the first load.
let seenIds: Set<string> | null = null;

/** A short two-note chime. Silently skipped if the browser blocks audio. */
const chime = () => {
  try {
    const ctx = new AudioContext();
    [880, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.3);
    });
  } catch {
    // no audio — the toast and tab title still show
  }
};

/**
 * Orders waiting on ops for a price (new cart orders and quote requests).
 * Polls even in a background tab, and when a new one arrives shows a toast,
 * plays a chime and puts the count in the tab title — the customer is
 * watching a 10-minute countdown, so ops shouldn't have to keep refreshing.
 * Returns the count for the sidebar badge.
 */
export const useNewOrderAlerts = (): number => {
  const { data: pending } = useQuery({
    queryKey: ['quotations', 'PENDING'],
    queryFn: () => quotationService.getAll('PENDING'),
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!pending) return;
    const ids = new Set(pending.map((q) => q.id));
    if (seenIds) {
      const fresh = pending.filter((q) => !seenIds!.has(q.id));
      if (fresh.length) {
        chime();
        toast(
          fresh.length === 1
            ? `New order needs a price — ${fresh[0].requestNumber || fresh[0].serviceName || `#${fresh[0].orderId.slice(-8)}`}`
            : `${fresh.length} new orders need a price`,
          { icon: '🔔', duration: 8000 },
        );
      }
    }
    seenIds = ids;
    document.title = ids.size ? `(${ids.size}) ${BASE_TITLE}` : BASE_TITLE;
  }, [pending]);

  return pending?.length ?? 0;
};
