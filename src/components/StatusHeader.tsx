import React from 'react';
import { Shield, Flame, Sparkles, Zap, Volume2, VolumeX } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface StatusHeaderProps {
  hunterName: string;
  setHunterName: (name: string) => void;
  level: number;
  xp: number;
  xpNeeded: number;
  rank: string;
  streak: number;
  disciplineMode: boolean;
  setDisciplineMode: (mode: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  totalTasksCompleted: number;
  themeStyle: 'discipline' | 'motivation';
}

export default function StatusHeader({
  hunterName,
  setHunterName,
  level,
  xp,
  xpNeeded,
  rank,
  streak,
  disciplineMode,
  setDisciplineMode,
  soundEnabled,
  setSoundEnabled,
  totalTasksCompleted,
  themeStyle
}: StatusHeaderProps) {
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [tempName, setTempName] = React.useState(hunterName);

  const getRankColor = (r: string) => {
    switch (r) {
      case 'S-Rank': return 'text-orange-500 border-orange-500 shadow-[0_0_12px_rgba(234,88,12,0.4)]';
      case 'A-Rank': return 'text-amber-500 border-amber-500';
      case 'B-Rank': return 'text-yellow-500 border-yellow-500';
      case 'C-Rank': return 'text-zinc-300 border-zinc-400';
      default: return 'text-zinc-500 border-zinc-600';
    }
  };

  const xpPercentage = Math.min(100, Math.floor((xp / xpNeeded) * 100));

  const handleToggleMode = (mode: 'motivation' | 'discipline') => {
    if (soundEnabled) playClickSound();
    if (mode === 'discipline') {
      setDisciplineMode(true);
    } else {
      setDisciplineMode(false);
    }
  };

  const saveName = () => {
    if (tempName.trim()) {
      setHunterName(tempName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <div className="p-8 rounded-xl bg-zinc-900/45 border border-white/10 transition-all duration-500">
      {/* Upper Grid: Profile, Title, Sound & Toggle controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Character Avatar (original gradient sigil — no external art) */}
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-orange-500/25 shadow-[0_0_15px_rgba(234,88,12,0.15)] flex-shrink-0 select-none bg-gradient-to-br from-orange-700 via-zinc-900 to-black flex items-center justify-center">
            <Zap className="w-7 h-7 text-orange-400" />
            <div className="absolute inset-x-0 bottom-0 bg-orange-600 px-1 py-0.5 text-center leading-none">
              <span className="text-[7.5px] text-black font-black font-mono tracking-wider uppercase block">APEX</span>
            </div>
          </div>

          {/* Rank Badge */}
          <div className={`w-16 h-16 rounded-full border flex flex-col items-center justify-center p-1 bg-black font-mono font-bold text-lg select-none flex-shrink-0 ${getRankColor(rank)}`}>
            <span className="text-[9px] uppercase text-zinc-500 tracking-wider">Rank</span>
            <span className="leading-tight italic text-xl font-black">{rank.split('-')[0]}</span>
          </div>

          <div>
            <div className="flex items-center gap-3">
              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempName}
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
                  <h1 className="text-2xl font-black text-white font-sans tracking-tight uppercase italic">
                    {hunterName}
                  </h1>
                  <button
                    onClick={() => { setIsEditingName(true); setTempName(hunterName); }}
                    className="text-[10px] uppercase text-orange-500 hover:text-orange-400 pointer-events-auto font-mono"
                  >
                    [RENAME]
                  </button>
                </div>
              )}

              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono tracking-widest bg-orange-600 text-black font-black uppercase">
                LVL {level}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1.5 font-mono uppercase tracking-widest flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-orange-500 animate-pulse" /> Ascendant Sovereignty
            </p>
          </div>
        </div>

        {/* Mindset Switches: Discipline vs Motivation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-black/40 p-3 rounded-lg border border-white/5 text-xs font-mono">
          <div className="flex flex-col gap-1 pr-3 border-r-0 sm:border-r border-white/5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">MINDSET TUNING</span>
            <span className="text-xs font-bold text-zinc-200 flex items-center gap-1">
              {disciplineMode ? (
                <>
                  <Shield className="w-3 h-3 text-orange-500" />
                  DISCIPLINE MODE
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  EASY MOTIVATION
                </>
              )}
            </span>
          </div>

          <div className="flex gap-2">
            {/* Motivation Toggle */}
            <button
              onClick={() => handleToggleMode('motivation')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-all flex items-center gap-1 ${
                !disciplineMode
                  ? 'bg-amber-600 text-black font-black italic shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${!disciplineMode ? 'bg-black animate-ping' : 'bg-zinc-600'}`}></div>
              Motivation
            </button>

            {/* Discipline Toggle */}
            <button
              onClick={() => handleToggleMode('discipline')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                disciplineMode
                  ? 'bg-orange-600 text-black font-black italic shadow-[0_0_12px_rgba(234,88,12,0.3)]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${disciplineMode ? 'bg-black animate-pulse' : 'bg-zinc-600'}`}></div>
              Discipline
            </button>
          </div>

          {/* Sound Toggle Button */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-orange-500 transition-colors ml-auto sm:ml-0 border border-white/5"
            title={soundEnabled ? "Disable UI Synthesizer" : "Enable UI Synthesizer"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-orange-500" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress Bars and Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6 pt-5 border-t border-white/5">
        {/* EXP Bar (7 cols) */}
        <div className="md:col-span-7 space-y-2">
          <div className="flex justify-between items-end text-xs font-mono">
            <span className="text-zinc-400 uppercase tracking-widest flex items-center gap-1">
              ⚡ STRENGTH PROGRESSION
            </span>
            <span className="text-orange-500 font-bold">{xp} / {xpNeeded} EXP</span>
          </div>
          <div className="w-full h-3 bg-black/60 rounded-lg overflow-hidden border border-white/5 p-[2px]">
            <div
              className="h-full rounded-sm bg-gradient-to-r from-orange-600 to-amber-500 transition-all duration-500 shadow-[0_0_8px_rgba(234,88,12,0.6)]"
              style={{ width: `${xpPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Custom Stats Counters (5 cols) */}
        <div className="md:col-span-5 grid grid-cols-2 gap-3 text-center">
          {/* Streak Counter */}
          <div className="bg-black/40 border border-white/5 rounded-lg p-2.5 flex items-center justify-between px-4">
            <div className="text-left">
              <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 block">STREAK</span>
              <span className="text-lg font-black font-mono text-orange-500 leading-none">{streak} Days</span>
            </div>
            <Flame className={`w-7 h-7 ${streak > 0 ? 'text-orange-500 animate-bounce' : 'text-zinc-700'}`} />
          </div>

          {/* Quests Cleared Status */}
          <div className="bg-black/40 border border-white/5 rounded-lg p-2.5 flex items-center justify-between px-4">
            <div className="text-left">
              <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 block">CLEARED</span>
              <span className="text-lg font-black font-mono text-zinc-200 leading-none">{totalTasksCompleted} Quests</span>
            </div>
            <Sparkles className="w-6 h-6 text-orange-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
