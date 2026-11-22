import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAccessService } from '../services/adminAccessService';
import { useAuth } from '../contexts/AuthContext';

const SW_URL = '/admin-sw.js';
const supported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

const keyToBytes = (base64: string) => {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
};

/**
 * Browser notifications for this admin on this device. What arrives depends
 * on their permissions (e.g. order alerts need "Manage orders"); the server decides.
 */
export const NotificationsToggle = () => {
  const { isAuthenticated } = useAuth();
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supported() || !isAuthenticated) return;
    navigator.serviceWorker
      .getRegistration(SW_URL)
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setOn(!!sub && Notification.permission === 'granted'))
      .catch(() => {});
  }, [isAuthenticated]);

  if (!supported()) return null;

  const turnOn = async () => {
    const publicKey = await adminAccessService.pushKey();
    if (!publicKey) {
      toast.error('Browser notifications are not set up on the server yet');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      toast.error('Notifications are blocked for this site in your browser settings');
      return;
    }
    const reg = await navigator.serviceWorker.register(SW_URL);
    await navigator.serviceWorker.ready;
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(publicKey) }));
    await adminAccessService.pushSubscribe(sub.toJSON());
    setOn(true);
    toast.success('Notifications turned on for this browser');
  };

  const turnOff = async () => {
    const reg = await navigator.serviceWorker.getRegistration(SW_URL);
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await adminAccessService.pushUnsubscribe(sub.endpoint).catch(() => {});
      await sub.unsubscribe();
    }
    setOn(false);
    toast.success('Notifications turned off for this browser');
  };

  const toggle = async () => {
    setBusy(true);
    try {
      await (on ? turnOff() : turnOn());
    } catch {
      toast.error("Couldn't change notifications. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const Icon = on ? Bell : BellOff;
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium text-ios-secondary-label hover:bg-black/5 transition-colors disabled:opacity-50"
    >
      <Icon className="w-4 h-4" />
      {on ? 'Notifications on' : 'Turn on notifications'}
    </button>
  );
};
