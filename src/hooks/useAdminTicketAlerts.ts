import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Ticket notifications for admins:
 *  - openCount: tickets with status "open" (not yet handled), shown as badge on "Support"
 *  - newTickets: tickets created since the admin was last notified, shown as a toast
 *
 * Polls once a minute while the tab is visible and right away when the tab comes back.
 * "Last notified" is remembered per admin in localStorage, so a page reload does not
 * repeat old alerts; the very first run only records the current state.
 */

export interface TicketAlert {
  id: string;
  title: string;
  created_at: string;
}

const POLL_MS = 60_000;
const storageKey = (userId: string) => `enea.ticketAlerts.lastSeen.${userId}`;

function readLastSeen(userId: string): string | null {
  try {
    return localStorage.getItem(storageKey(userId));
  } catch {
    return null;
  }
}

function writeLastSeen(userId: string, value: string) {
  try {
    localStorage.setItem(storageKey(userId), value);
  } catch {
    /* private mode etc.: alerts may repeat after a reload, nothing else breaks */
  }
}

export function useAdminTicketAlerts(userId: string | null | undefined, isAdmin: boolean) {
  const [openCount, setOpenCount] = useState(0);
  const [newTickets, setNewTickets] = useState<TicketAlert[]>([]);
  const lastSeen = useRef<string | null>(null);

  const check = useCallback(async () => {
    if (!userId || !isAdmin) return;
    const [{ count }, { data: latest }] = await Promise.all([
      supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('tickets').select('id, title, created_at').order('created_at', { ascending: false }).limit(10),
    ]);
    if (typeof count === 'number') setOpenCount(count);
    const rows = (latest || []) as TicketAlert[];
    if (!rows.length) return;

    const newest = rows[0].created_at;
    if (lastSeen.current === null) {
      // First run for this admin on this device: remember the state, do not alert about old tickets.
      lastSeen.current = readLastSeen(userId) ?? newest;
      writeLastSeen(userId, lastSeen.current);
    }
    const fresh = rows.filter(t => t.created_at > lastSeen.current!);
    if (fresh.length) {
      setNewTickets(prev => [...fresh.filter(t => !prev.some(p => p.id === t.id)), ...prev]);
      lastSeen.current = newest;
      writeLastSeen(userId, newest);
    }
  }, [userId, isAdmin]);

  useEffect(() => {
    if (!userId || !isAdmin) {
      setOpenCount(0);
      setNewTickets([]);
      lastSeen.current = null;
      return;
    }
    check();
    const timer = window.setInterval(() => { if (!document.hidden) check(); }, POLL_MS);
    const onVisible = () => { if (!document.hidden) check(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [userId, isAdmin, check]);

  const dismiss = useCallback((id?: string) => {
    setNewTickets(prev => (id ? prev.filter(t => t.id !== id) : []));
  }, []);

  return { openCount, newTickets, dismiss, refresh: check };
}
