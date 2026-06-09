import { Zap, Shield, Compass } from 'lucide-react';

// Presentational-only chrome extracted from App.tsx. No state, no effects — just
// decorative layout that takes a few display props. See
// .sdd/specs/feat-app-chrome-extraction/SPEC.md.

export type ThemeStyle = 'discipline' | 'motivation';

/** Background glow + fixed left/right decorative panels (pointer-events-none). */
export function AppBackdrop({ themeStyle }: { themeStyle: ThemeStyle }) {
  return (
    <>
      {/* Background glow */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-950/5 via-transparent to-transparent pointer-events-none select-none z-0 overflow-hidden">
        <div className={`absolute top-[-250px] left-[50%] translate-x-[-51%] w-[600px] h-[600px] rounded-full filter blur-[120px] opacity-10 transition-all duration-1000 ${
          themeStyle === 'discipline' ? 'bg-orange-600' : 'bg-amber-600'
        }`} />
      </div>

      {/* Left panel */}
      <div className="fixed left-4 2xl:left-12 top-[120px] bottom-[120px] w-48 hidden xl:flex flex-col justify-between pointer-events-none select-none z-0">
        <div className="relative w-full h-[55%] rounded-2xl overflow-hidden border border-white/5 bg-zinc-950/20 p-3 flex flex-col justify-between opacity-15 hover:opacity-35 transition-all duration-700">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-700/40 via-zinc-950 to-black flex items-center justify-center">
            <Zap className="w-16 h-16 text-orange-500/30" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10" />
          <div className="relative z-20 text-[9px] font-mono text-orange-500 font-bold tracking-widest bg-black/60 px-1.5 py-0.5 rounded border border-white/5 w-max">SYSTEM S-RANK</div>
          <div className="relative z-20">
            <span className="text-[10px] font-mono text-zinc-500 block">SUBJECT:</span>
            <span className="text-xs font-black text-white tracking-tight uppercase">THE ASCENDANT</span>
            <p className="text-[8px] font-mono text-orange-600 mt-1 uppercase">THE APEX OPERATIVE</p>
          </div>
        </div>
        <div className="border border-white/5 bg-zinc-950/10 p-4 rounded-xl opacity-15 text-left">
          <span className="text-[8px] font-mono text-zinc-500 block tracking-widest">// COGNIZANCE</span>
          <p className="text-[10px] text-zinc-400 italic leading-normal mt-1">
            "Sự lười biếng là một vết nứt, nó sẽ nuốt chửng toàn bộ vương quốc."
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="fixed right-4 2xl:right-12 top-[120px] bottom-[120px] w-48 hidden xl:flex flex-col justify-between pointer-events-none select-none z-0">
        <div className="relative w-full h-[55%] rounded-2xl overflow-hidden border border-white/5 bg-zinc-950/20 p-3 flex flex-col justify-between opacity-15 hover:opacity-35 transition-all duration-700">
          <div className="absolute inset-0 bg-gradient-to-br from-red-800/40 via-zinc-950 to-black flex items-center justify-center">
            <Shield className="w-16 h-16 text-red-500/30" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10" />
          <div className="relative z-20 text-[9px] font-mono text-red-500 font-bold tracking-widest bg-black/60 px-1.5 py-0.5 rounded border border-white/5 w-max">DRIVE CORE</div>
          <div className="relative z-20">
            <span className="text-[10px] font-mono text-zinc-500 block">CATALYST:</span>
            <span className="text-xs font-black text-red-400 tracking-tight uppercase">YOUR WHY</span>
            <p className="text-[8px] font-mono text-red-500/80 mt-1 uppercase">NGUỒN ĐỘNG LỰC</p>
          </div>
        </div>
        <div className="border border-white/5 bg-zinc-950/10 p-4 rounded-xl opacity-15 text-left">
          <span className="text-[8px] font-mono text-zinc-500 block tracking-widest">// CATALYST</span>
          <p className="text-[10px] text-zinc-400 italic leading-normal mt-1">
            "Nhớ tại sao bạn bắt đầu — không gì có thể ngăn được người biết rõ lý do của mình."
          </p>
        </div>
      </div>
    </>
  );
}

/** Top header: logo + project title + operator/level + server-state pill. */
export function AppHeader({ themeStyle, hunterName, level }: { themeStyle: ThemeStyle; hunterName: string; level: number }) {
  return (
    <header className="hidden md:flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-white/10">
      <div className="flex items-center gap-4 select-none">
        <div className={`w-12 h-12 rounded-sm flex items-center justify-center font-bold text-black text-xl italic ${
          themeStyle === 'discipline' ? 'bg-orange-600' : 'bg-amber-500'
        }`}>L</div>
        <div>
          <h1 className="text-sm font-black leading-none text-white tracking-widest uppercase">
            PROJECT: DISCIPLINED LIFE{' '}
            <span className="text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded ml-1 bg-black text-orange-600 border border-white/10">SYS 3.5</span>
          </h1>
          <p className="text-[10px] font-mono text-orange-600 tracking-tighter uppercase mt-1">
            Operator: {hunterName} / Level {level}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 bg-zinc-900/80 p-2.5 rounded-lg border border-white/10 text-xs font-mono">
        <Compass className="w-3.5 h-3.5 text-orange-600 mr-1 ml-0.5" />
        <span className="text-zinc-500 uppercase">SERVER STATE:</span>
        <span className="text-white font-bold ml-1 animate-pulse">WARRIOR ACTIVE</span>
      </div>
    </header>
  );
}

/** Static footer. */
export function AppFooter() {
  return (
    <footer className="pt-8 border-t border-white/10 flex justify-between items-center font-mono text-[10px] text-zinc-600 select-none">
      <div className="flex gap-6">
        <span>SYS_STABLE: 100%</span>
        <span>DATA_SYNC: 0.04ms</span>
      </div>
      <p className="uppercase tracking-widest">BECOME THE STRONGEST VERSION OF YOURSELF</p>
    </footer>
  );
}
