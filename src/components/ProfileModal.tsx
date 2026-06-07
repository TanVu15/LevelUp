import React from 'react';
import { X, Camera, Zap, Flame, ShieldCheck } from 'lucide-react';
import { Achievement } from '../types';

interface ProfileModalProps {
  hunterName: string;
  level: number;
  xp: number;
  xpNeeded: number;
  rank: string;
  streak: number;
  shields: number;
  totalTasksCompleted: number;
  achievements: Achievement[];
  avatarUrl: string | null;
  onClose: () => void;
  onChangeAvatar: () => void;
}

const RANK_DATA = [
  { rank: 'E-Rank', label: 'E', minLevel: 1,  maxLevel: 5,    title: 'Awakened',
    frameCls: 'border border-zinc-600/70',      glowCls: '',                                             textCls: 'text-zinc-500'   },
  { rank: 'D-Rank', label: 'D', minLevel: 6,  maxLevel: 10,   title: 'Hunter',
    frameCls: 'border border-zinc-400/80',      glowCls: '',                                             textCls: 'text-zinc-400'   },
  { rank: 'C-Rank', label: 'C', minLevel: 11, maxLevel: 20,   title: 'Raider',
    frameCls: 'border-2 border-zinc-300/70',    glowCls: '',                                             textCls: 'text-zinc-300'   },
  { rank: 'B-Rank', label: 'B', minLevel: 21, maxLevel: 35,   title: 'Elite',
    frameCls: 'border-2 border-yellow-400',     glowCls: 'shadow-[0_0_8px_rgba(250,204,21,0.3)]',       textCls: 'text-yellow-400' },
  { rank: 'A-Rank', label: 'A', minLevel: 36, maxLevel: 50,   title: 'Champion',
    frameCls: 'border-2 border-amber-400',      glowCls: 'shadow-[0_0_12px_rgba(245,158,11,0.4)]',      textCls: 'text-amber-400'  },
  { rank: 'S-Rank', label: 'S', minLevel: 51, maxLevel: null, title: 'Apex',
    frameCls: 'border-[3px] border-orange-500', glowCls: 'shadow-[0_0_20px_rgba(234,88,12,0.55)]',      textCls: 'text-orange-500' },
];

const RANK_AVATAR_FRAME: Record<string, string> = {
  'S-Rank': 'ring-[3px] ring-orange-500 ring-offset-2 ring-offset-black shadow-[0_0_20px_rgba(234,88,12,0.6)]',
  'A-Rank': 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black shadow-[0_0_12px_rgba(245,158,11,0.4)]',
  'B-Rank': 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-black',
  'C-Rank': 'ring-2 ring-zinc-300/60 ring-offset-1 ring-offset-black',
  'D-Rank': 'ring-[1.5px] ring-zinc-400/50',
  'E-Rank': 'ring ring-zinc-600/40',
};

export default function ProfileModal({
  hunterName, level, xp, xpNeeded, rank,
  streak, shields, totalTasksCompleted,
  achievements, avatarUrl, onClose, onChangeAvatar,
}: ProfileModalProps) {
  const xpPct    = Math.min(100, Math.floor((xp / xpNeeded) * 100));
  const unlocked = achievements.filter(a => a.unlockedAt !== null).length;
  const rankData = RANK_DATA.find(r => r.rank === rank);

  const handleChangeAvatar = () => {
    onClose();
    // Small delay so modal unmounts before file picker opens
    setTimeout(onChangeAvatar, 60);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-white/10">
          <span className="text-[10px] font-mono font-bold tracking-widest text-orange-500 uppercase">// Player Profile</span>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar + Identity */}
        <div className="flex items-center gap-5 px-6 py-5 bg-black/20 border-b border-white/5">
          <div className={`relative w-20 h-20 rounded-xl flex-shrink-0 ${RANK_AVATAR_FRAME[rank] ?? RANK_AVATAR_FRAME['E-Rank']}`}>
            <div className="absolute inset-0 rounded-[10px] overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-700 via-zinc-900 to-black flex items-center justify-center">
                  <Zap className="w-8 h-8 text-orange-400" />
                </div>
              )}
            </div>
            {rank === 'S-Rank' && (
              <div className="absolute -inset-2 rounded-xl bg-orange-500/10 animate-pulse -z-10 pointer-events-none" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-white font-sans tracking-tight uppercase italic truncate">
              {hunterName}
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="px-2 py-0.5 bg-orange-600 text-black text-[10px] font-black rounded font-mono uppercase">
                LVL {level}
              </span>
              <span className={`text-[10px] font-mono font-bold ${rankData?.textCls ?? 'text-zinc-500'}`}>
                {rank}
              </span>
            </div>
            <button
              onClick={handleChangeAvatar}
              className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 hover:text-orange-400 transition-colors"
            >
              <Camera className="w-3 h-3" /> Đổi avatar
            </button>
          </div>
        </div>

        {/* XP Bar */}
        <div className="px-6 py-4 border-b border-white/5">
          <div className="flex justify-between text-[10px] font-mono mb-2">
            <span className="text-zinc-500 uppercase tracking-widest">Strength Progression</span>
            <span className="text-orange-400 font-bold">{xp} / {xpNeeded} XP &nbsp;({xpPct}%)</span>
          </div>
          <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/5 p-[1px]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-600 to-amber-500 transition-all duration-500 shadow-[0_0_6px_rgba(234,88,12,0.5)]"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-white/5">
          <div className="bg-black/40 rounded-xl p-3 text-center border border-white/5">
            <Flame className={`w-4 h-4 mx-auto mb-1 ${streak > 0 ? 'text-orange-500' : 'text-zinc-700'}`} />
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Streak</p>
            <p className="text-xl font-black font-mono text-orange-400 leading-tight">{streak}<span className="text-xs">d</span></p>
          </div>
          <div className={`bg-black/40 rounded-xl p-3 text-center border ${shields > 0 ? 'border-cyan-500/30' : 'border-white/5'}`}>
            <ShieldCheck className={`w-4 h-4 mx-auto mb-1 ${shields > 0 ? 'text-cyan-400' : 'text-zinc-700'}`} />
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Shields</p>
            <p className={`text-xl font-black font-mono leading-tight ${shields > 0 ? 'text-cyan-400' : 'text-zinc-600'}`}>
              {shields}<span className="text-xs">/2</span>
            </p>
          </div>
          <div className="bg-black/40 rounded-xl p-3 text-center border border-white/5">
            <Zap className="w-4 h-4 mx-auto mb-1 text-orange-500" />
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Cleared</p>
            <p className="text-xl font-black font-mono text-zinc-200 leading-tight">{totalTasksCompleted}</p>
          </div>
        </div>

        {/* Rank Progression */}
        <div className="px-6 py-4 border-b border-white/5">
          <p className="text-[10px] font-mono font-bold tracking-widest text-orange-500 uppercase mb-3">
            // Rank Progression
          </p>
          <div className="grid grid-cols-6 gap-2">
            {RANK_DATA.map(rd => {
              const isCurrent = rd.rank === rank;
              return (
                <div
                  key={rd.rank}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-orange-950/30 border-orange-600/40'
                      : 'bg-black/30 border-white/5'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black font-mono text-sm ${rd.frameCls} ${rd.glowCls} ${rd.textCls}`}>
                    {rd.label}
                  </div>
                  <span className={`text-[7px] font-mono text-center leading-tight mt-0.5 ${isCurrent ? 'text-orange-400' : 'text-zinc-600'}`}>
                    {rd.maxLevel ? `Lv${rd.minLevel}–${rd.maxLevel}` : `Lv${rd.minLevel}+`}
                  </span>
                  <span className={`text-[7px] font-mono uppercase tracking-wider ${isCurrent ? 'text-orange-300' : 'text-zinc-700'}`}>
                    {rd.title}
                  </span>
                  {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse mt-0.5" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements */}
        <div className="px-6 py-4 pb-6">
          <div className="flex justify-between items-center mb-3">
            <p className="text-[10px] font-mono font-bold tracking-widest text-orange-500 uppercase">// Achievements</p>
            <span className="text-[9px] font-mono text-zinc-500">{unlocked}/{achievements.length} mở khóa</span>
          </div>
          <div className="space-y-2">
            {achievements.map(a => {
              const isUnlocked = a.unlockedAt !== null;
              return (
                <div
                  key={a.id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                    isUnlocked
                      ? 'bg-orange-950/10 border-orange-500/30'
                      : 'bg-black/30 border-white/5 opacity-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded border flex items-center justify-center text-base flex-shrink-0 ${
                    isUnlocked ? 'bg-orange-900/10 border-orange-500/30' : 'bg-zinc-950 border-zinc-800'
                  }`}>
                    {a.badge}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-bold font-mono truncate ${isUnlocked ? 'text-orange-400' : 'text-zinc-600'}`}>
                      {a.title}
                    </p>
                    <p className="text-[10px] text-zinc-500 leading-snug">{a.description}</p>
                  </div>
                  {isUnlocked && (
                    <span className="text-[8px] font-mono text-zinc-600 flex-shrink-0 tabular-nums">{a.unlockedAt}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
