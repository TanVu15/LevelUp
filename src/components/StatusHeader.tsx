import React from 'react';
import { Shield, Flame, Sparkles, Zap, Volume2, VolumeX, ShieldCheck, User, LogIn, LogOut, ChevronDown } from 'lucide-react';
import { playClickSound } from '../utils/audio';
import AvatarCropModal from './AvatarCropModal';
import ProfileModal from './ProfileModal';
import { Achievement } from '../types';
import { isConfigured } from '../firebase';

interface StatusHeaderProps {
  hunterName: string;
  setHunterName: (name: string) => void;
  level: number;
  xp: number;
  xpNeeded: number;
  rank: string;
  streak: number;
  shields: number;
  disciplineMode: boolean;
  setDisciplineMode: (mode: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  totalTasksCompleted: number;
  themeStyle: 'discipline' | 'motivation';
  avatarUrl: string | null;
  onAvatarChange: (dataURL: string) => void;
  achievements: Achievement[];
  authUserEmail: string | null;
  onShowAuth: () => void;
  onSignOut: () => void;
}

const RANK_FRAME: Record<string, string> = {
  'S-Rank': 'ring-[3px] ring-orange-500 ring-offset-2 ring-offset-zinc-900 shadow-[0_0_20px_rgba(234,88,12,0.6)]',
  'A-Rank': 'ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-900 shadow-[0_0_12px_rgba(245,158,11,0.4)]',
  'B-Rank': 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-zinc-900',
  'C-Rank': 'ring-2 ring-zinc-300/60 ring-offset-1 ring-offset-zinc-900',
  'D-Rank': 'ring-[1.5px] ring-zinc-400/50',
  'E-Rank': 'ring ring-zinc-600/40',
};

export default function StatusHeader({
  hunterName, setHunterName, level, xp, xpNeeded, rank, streak, shields,
  disciplineMode, setDisciplineMode, soundEnabled, setSoundEnabled,
  totalTasksCompleted, themeStyle, avatarUrl, onAvatarChange, achievements,
  authUserEmail, onShowAuth, onSignOut,
}: StatusHeaderProps) {
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [tempName, setTempName] = React.useState(hunterName);
  const [cropSrc, setCropSrc] = React.useState<string | null>(null);
  const [showProfile, setShowProfile] = React.useState(false);
  // Mobile-only collapse: card shows just avatar/name/level/EXP until expanded.
  // Desktop (md+) always shows everything regardless. (feat-mobile-density)
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const detailCls = detailsOpen ? 'flex' : 'hidden'; // toggles the md:hidden detail blocks
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { if (ev.target?.result) setCropSrc(ev.target.result as string); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const getRankColor = (r: string) => {
    switch (r) {
      case 'S-Rank': return 'text-orange-500 border-orange-500 shadow-[0_0_12px_rgba(234,88,12,0.4)]';
      case 'A-Rank': return 'text-amber-500 border-amber-500';
      case 'B-Rank': return 'text-yellow-500 border-yellow-500';
      case 'C-Rank': return 'text-zinc-300 border-zinc-400';
      default:       return 'text-zinc-500 border-zinc-600';
    }
  };

  const xpPercentage = Math.min(100, Math.floor((xp / xpNeeded) * 100));

  const handleToggleMode = (mode: 'motivation' | 'discipline') => {
    if (soundEnabled) playClickSound();
    setDisciplineMode(mode === 'discipline');
  };

  const saveName = () => {
    if (tempName.trim()) setHunterName(tempName.trim());
    setIsEditingName(false);
  };

  return (
    <div className="p-5 sm:p-8 rounded-xl bg-zinc-900/45 border border-white/10 transition-all duration-500">
      {/* Upper row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          {/* Crop modal */}
          {cropSrc && (
            <AvatarCropModal
              dataURL={cropSrc}
              onConfirm={(url) => { onAvatarChange(url); setCropSrc(null); }}
              onCancel={() => setCropSrc(null)}
            />
          )}

          {/* Avatar + rank frame */}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />
          {showProfile && (
            <ProfileModal
              hunterName={hunterName}
              level={level}
              xp={xp}
              xpNeeded={xpNeeded}
              rank={rank}
              streak={streak}
              shields={shields}
              totalTasksCompleted={totalTasksCompleted}
              achievements={achievements}
              avatarUrl={avatarUrl}
              onClose={() => setShowProfile(false)}
              onChangeAvatar={() => fileInputRef.current?.click()}
            />
          )}
          <div
            className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex-shrink-0 select-none cursor-pointer group ${RANK_FRAME[rank] ?? RANK_FRAME['E-Rank']}`}
            onClick={() => setShowProfile(true)}
            title="Xem profile"
          >
            <div className="absolute inset-0 rounded-[9px] overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-700 via-zinc-900 to-black flex items-center justify-center">
                  <Zap className="w-7 h-7 text-orange-400" />
                </div>
              )}
            </div>
            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-[9px] bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            {/* S-Rank pulse */}
            {rank === 'S-Rank' && (
              <div className="absolute -inset-1.5 rounded-xl bg-orange-500/10 animate-pulse -z-10 pointer-events-none" />
            )}
          </div>

          {/* Rank badge */}
          <div className={`${detailCls} md:flex w-14 h-14 sm:w-16 sm:h-16 rounded-full border flex-col items-center justify-center p-1 bg-black font-mono font-bold text-lg select-none flex-shrink-0 ${getRankColor(rank)}`}>
            <span className="text-[9px] uppercase text-zinc-500 tracking-wider">Rank</span>
            <span className="leading-tight italic text-xl font-black">{rank.split('-')[0]}</span>
          </div>

          {/* Name + level */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text" value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={saveName}
                    onKeyDown={(e) => e.key === 'Enter' && saveName()}
                    maxLength={20}
                    className="bg-zinc-950 text-white font-sans text-lg px-2 py-0.5 rounded border border-orange-600 focus:outline-none"
                    autoFocus
                  />
                  <button onClick={saveName} className="text-orange-500 text-xs px-2 py-1 hover:text-white">Save</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white font-sans tracking-tight uppercase italic break-words min-w-0">{hunterName}</h1>
                  <button
                    onClick={() => { setIsEditingName(true); setTempName(hunterName); }}
                    className="text-[10px] uppercase text-orange-500 hover:text-orange-400 font-mono"
                  >[RENAME]</button>
                </div>
              )}
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono tracking-widest bg-orange-600 text-black font-black uppercase">
                LVL {level}
              </span>
            </div>
            <p className={`${detailCls} md:flex text-xs text-zinc-400 mt-1.5 font-mono uppercase tracking-widest items-center gap-1.5 min-w-0`}>
              <Zap className="w-3.5 h-3.5 text-orange-500 animate-pulse flex-shrink-0" /> <span className="break-words">Ascendant Sovereignty</span>
            </p>
          </div>
        </div>

        {/* Mindset + sound controls */}
        <div className={`${detailCls} md:flex flex-wrap items-center gap-3 bg-black/40 p-3 rounded-lg border border-white/5 text-xs font-mono`}>
          <div className="flex flex-col gap-1 pr-3 border-r-0 sm:border-r border-white/5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">MINDSET TUNING</span>
            <span className="text-xs font-bold text-zinc-200 flex items-center gap-1">
              {disciplineMode
                ? <><Shield className="w-3 h-3 text-orange-500" /> DISCIPLINE MODE</>
                : <><Sparkles className="w-3 h-3 text-amber-500" /> EASY MOTIVATION</>}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleToggleMode('motivation')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-all flex items-center gap-1 ${
                !disciplineMode
                  ? 'bg-amber-600 text-black font-black italic shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${!disciplineMode ? 'bg-black animate-ping' : 'bg-zinc-600'}`} />
              Motivation
            </button>
            <button
              onClick={() => handleToggleMode('discipline')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                disciplineMode
                  ? 'bg-orange-600 text-black font-black italic shadow-[0_0_12px_rgba(234,88,12,0.3)]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${disciplineMode ? 'bg-black animate-pulse' : 'bg-zinc-600'}`} />
              Discipline
            </button>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-orange-500 transition-colors border border-white/5"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-orange-500" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Auth indicator — only when Firebase is configured. Pushes right on desktop, wraps on mobile. */}
          {isConfigured && (
            authUserEmail ? (
              <div className="flex items-center gap-1.5 sm:ml-auto sm:border-l border-white/5 sm:pl-3">
                <span className="text-[9px] font-mono text-zinc-500 max-w-[80px] truncate" title={authUserEmail}>
                  {authUserEmail.split('@')[0]}
                </span>
                <button
                  onClick={onSignOut}
                  title="Đăng xuất"
                  aria-label="Đăng xuất"
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-600 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onShowAuth}
                className="flex items-center gap-1 sm:ml-auto sm:border-l border-white/5 sm:pl-3 text-[10px] font-mono text-zinc-500 hover:text-orange-400 transition-colors whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" />
                Đăng nhập
              </button>
            )
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6 pt-5 border-t border-white/5">
        {/* EXP bar */}
        <div className="md:col-span-7 space-y-2">
          <div className="flex justify-between items-end text-xs font-mono">
            <span className="text-zinc-400 uppercase tracking-widest flex items-center gap-1">⚡ STRENGTH PROGRESSION</span>
            <span className="text-orange-500 font-bold">{xp} / {xpNeeded} EXP</span>
          </div>
          <div className="w-full h-3 bg-black/60 rounded-lg overflow-hidden border border-white/5 p-[2px]">
            <div
              className="h-full rounded-sm bg-gradient-to-r from-orange-600 to-amber-500 transition-all duration-500 shadow-[0_0_8px_rgba(234,88,12,0.6)]"
              style={{ width: `${xpPercentage}%` }}
            />
          </div>
        </div>

        {/* Counters */}
        <div className={`${detailsOpen ? 'grid' : 'hidden'} md:grid md:col-span-5 grid-cols-3 gap-3 text-center`}>
          {/* Streak */}
          <div className="bg-black/40 border border-white/5 rounded-lg p-2.5 flex items-center justify-between px-3">
            <div className="text-left">
              <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 block">STREAK</span>
              <span className="text-lg font-black font-mono text-orange-500 leading-none">{streak}d</span>
            </div>
            <Flame className={`w-6 h-6 ${streak > 0 ? 'text-orange-500 animate-bounce' : 'text-zinc-700'}`} />
          </div>

          {/* Shields */}
          <div className={`bg-black/40 border rounded-lg p-2.5 flex items-center justify-between px-3 transition-all ${
            shields > 0 ? 'border-cyan-500/30' : 'border-white/5'
          }`}>
            <div className="text-left">
              <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 block">SHIELDS</span>
              <span className={`text-lg font-black font-mono leading-none ${shields > 0 ? 'text-cyan-400' : 'text-zinc-600'}`}>
                {shields}/2
              </span>
            </div>
            <ShieldCheck className={`w-6 h-6 ${shields > 0 ? 'text-cyan-400' : 'text-zinc-700'}`} />
          </div>

          {/* Quests cleared */}
          <div className="bg-black/40 border border-white/5 rounded-lg p-2.5 flex items-center justify-between px-3">
            <div className="text-left">
              <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 block">CLEARED</span>
              <span className="text-lg font-black font-mono text-zinc-200 leading-none">{totalTasksCompleted}</span>
            </div>
            <Sparkles className="w-6 h-6 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Mobile-only expand/collapse toggle */}
      <button
        onClick={() => setDetailsOpen(v => !v)}
        className="md:hidden mt-4 w-full flex items-center justify-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-orange-400 transition-colors"
      >
        {detailsOpen ? 'Thu gọn' : 'Chi tiết'}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
}
