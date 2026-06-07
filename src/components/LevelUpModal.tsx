import React from 'react';
import { Zap, Star } from 'lucide-react';

export interface LevelUpInfo {
  level: number;
  rank: string;
  rankChanged: boolean;
  prevRank: string;
}

interface LevelUpModalProps {
  info: LevelUpInfo | null;
  onClose: () => void;
}

export default function LevelUpModal({ info, onClose }: LevelUpModalProps) {
  React.useEffect(() => {
    if (!info) return;
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [info, onClose]);

  if (!info) return null;

  const rankColors: Record<string, string> = {
    'E-Rank': 'text-zinc-400',
    'D-Rank': 'text-zinc-300',
    'C-Rank': 'text-white',
    'B-Rank': 'text-yellow-400',
    'A-Rank': 'text-amber-400',
    'S-Rank': 'text-orange-400',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center gap-6 px-12 py-10 rounded-2xl border border-orange-500/40 bg-zinc-950 shadow-[0_0_60px_rgba(234,88,12,0.25)] animate-[fadeScaleIn_0.35s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow orb */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute top-[-40%] left-1/2 -translate-x-1/2 w-64 h-64 bg-orange-600/15 rounded-full blur-3xl" />
        </div>

        {/* Stars */}
        <div className="flex gap-3 relative z-10">
          {[0, 1, 2].map((i) => (
            <Star
              key={i}
              className="w-5 h-5 text-amber-400 fill-amber-400"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>

        {/* Badge */}
        <div className="relative z-10 w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-700 via-zinc-900 to-black border border-orange-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(234,88,12,0.4)]">
          <Zap className="w-10 h-10 text-orange-400" />
        </div>

        {/* Text */}
        <div className="relative z-10 text-center space-y-1">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-orange-500">
            LEVEL UP
          </p>
          <p className="text-5xl font-black font-mono text-white italic">
            {info.level}
          </p>
          {info.rankChanged && (
            <div className="mt-3 px-4 py-1.5 rounded-full border border-orange-500/40 bg-orange-950/30">
              <p className="text-xs font-mono text-zinc-400">
                <span className="line-through">{info.prevRank}</span>
                {' → '}
                <span className={`font-bold ${rankColors[info.rank] ?? 'text-white'}`}>
                  {info.rank}
                </span>
              </p>
            </div>
          )}
          {!info.rankChanged && (
            <p className={`text-sm font-bold font-mono ${rankColors[info.rank] ?? 'text-white'}`}>
              {info.rank}
            </p>
          )}
        </div>

        <p className="relative z-10 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
          Click hoặc chờ để tiếp tục
        </p>
      </div>

      <style>{`
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
