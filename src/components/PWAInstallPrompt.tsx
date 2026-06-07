import React from 'react';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = React.useState(() =>
    localStorage.getItem('ironwill_pwa_dismissed') === 'true'
  );

  React.useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'dismissed') {
      localStorage.setItem('ironwill_pwa_dismissed', 'true');
      setDismissed(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('ironwill_pwa_dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50 max-w-sm w-[calc(100%-2rem)]"
      // Sit above the mobile bottom tab bar (~4.5rem) so they don't overlap; on
      // desktop there's no bar but a slightly higher toast is fine.
      style={{ bottom: 'calc(4.75rem + env(safe-area-inset-bottom))' }}
    >
      <div className="bg-zinc-900 border border-orange-600/30 rounded-xl p-4 shadow-2xl shadow-black/60 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center flex-shrink-0 font-black italic text-black text-lg">L</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white">Cài LevelUp về máy</p>
          <p className="text-[10px] text-zinc-500 font-mono">Truy cập nhanh, dùng offline</p>
        </div>
        <button onClick={handleInstall} className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-black text-[10px] font-black rounded-lg flex items-center gap-1 flex-shrink-0 transition-colors">
          <Download className="w-3 h-3" /> Cài
        </button>
        <button onClick={handleDismiss} className="text-zinc-600 hover:text-zinc-400 text-xs flex-shrink-0 transition-colors">✕</button>
      </div>
    </div>
  );
}
