import React from 'react';

interface CelebrationToastProps {
  message: string | null;
  onClose: () => void;
}

export default function CelebrationToast({ message, onClose }: CelebrationToastProps) {
  const [progress, setProgress] = React.useState(100);

  React.useEffect(() => {
    if (!message) { setProgress(100); return; }

    setProgress(100);
    const duration = 4000;
    const interval = 40;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) { clearInterval(timer); onClose(); return 0; }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 min-w-[320px] max-w-sm animate-[slideUpIn_0.4s_ease-out]">
      <div
        className="bg-zinc-950 border border-orange-500/40 rounded-xl shadow-[0_0_30px_rgba(234,88,12,0.25)] overflow-hidden cursor-pointer"
        onClick={onClose}
      >
        <div className="px-5 py-4">
          <p className="text-sm font-bold text-white font-sans text-center">{message}</p>
          <p className="text-[10px] font-mono text-zinc-500 text-center mt-1 uppercase tracking-widest">Click để đóng</p>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-orange-600 to-amber-500 transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <style>{`
        @keyframes slideUpIn {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
