import React from 'react';
import { playElectricZap } from '../utils/audio';

// AWAKEN "system boot" glitch — a short electric-malfunction intro played every
// time the user enters the app (after login / guest entry). Self-contained:
// plays the zap sound on mount and calls onDone after the 1.5s animation.
const GLITCH_CSS = `
@keyframes gl-fade { 0%,65%{opacity:1} 100%{opacity:0} }
@keyframes gl-noise {
  0%{transform:translate(0,0) skewX(0deg)}
  8%{transform:translate(-3px,1px) skewX(-1deg)}
  16%{transform:translate(3px,-2px) skewX(1.5deg)}
  24%{transform:translate(-2px,3px) skewX(-0.5deg)}
  32%{transform:translate(4px,-1px) skewX(2deg)}
  40%{transform:translate(-1px,2px) skewX(-1deg)}
  48%{transform:translate(2px,-3px) skewX(0.5deg)}
  56%{transform:translate(-4px,1px) skewX(-2deg)}
  64%{transform:translate(1px,-2px) skewX(1deg)}
  72%{transform:translate(3px,3px) skewX(-0.5deg)}
  80%{transform:translate(-2px,-1px) skewX(1.5deg)}
  88%{transform:translate(2px,2px) skewX(-1deg)}
  100%{transform:translate(0,0) skewX(0deg)}
}
@keyframes gl-scan { 0%{background-position:0 0} 100%{background-position:0 8px} }
@keyframes gl-flicker { 0%,100%{opacity:1} 18%{opacity:0.05} 20%{opacity:1} 52%{opacity:0.1} 54%{opacity:1} 76%{opacity:0.4} 78%{opacity:1} }
@keyframes gl-rgb-r { 0%{transform:translateX(-4px)} 33%{transform:translateX(4px)} 66%{transform:translateX(-2px)} 100%{transform:translateX(0)} }
@keyframes gl-rgb-b { 0%{transform:translateX(4px)} 33%{transform:translateX(-4px)} 66%{transform:translateX(2px)} 100%{transform:translateX(0)} }
@keyframes gl-pulse { 0%,100%{opacity:0.15} 50%{opacity:0.35} }
@keyframes gl-bar {
  0%{top:0%;height:2px;opacity:0.8}
  20%{top:30%;height:6px;opacity:0.6}
  40%{top:10%;height:3px;opacity:0.9}
  60%{top:70%;height:8px;opacity:0.5}
  80%{top:50%;height:4px;opacity:0.7}
  100%{top:90%;height:2px;opacity:0.4}
}
`;

interface BootIntroProps {
  onDone: () => void;
  soundEnabled: boolean;
}

export default function BootIntro({ onDone, soundEnabled }: BootIntroProps) {
  // Guard ONLY the sound so React 19 StrictMode's double-invoke (dev) doesn't play
  // the zap twice (which sounds out-of-sync). The timer is set/cleared each invoke
  // so StrictMode cleanup doesn't leave the intro stuck.
  const zappedRef = React.useRef(false);
  React.useEffect(() => {
    if (soundEnabled && !zappedRef.current) {
      zappedRef.current = true;
      playElectricZap();
    }
    const t = setTimeout(onDone, 1500);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
      style={{ animation: 'gl-fade 1.5s ease-in-out forwards' }}
    >
      <style>{GLITCH_CSS}</style>

      {/* Scan lines */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)',
        animation: 'gl-scan 0.06s linear infinite',
      }} />

      {/* Noise / static texture */}
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'300\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'300\' height=\'300\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")',
        backgroundSize: '300px 300px',
        animation: 'gl-noise 0.12s steps(1) infinite',
      }} />

      {/* Horizontal glitch bar */}
      <div className="absolute left-0 right-0 pointer-events-none" style={{
        background: 'rgba(249,115,22,0.25)',
        animation: 'gl-bar 0.18s steps(1) infinite',
        mixBlendMode: 'screen',
      }} />

      {/* Orange vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, rgba(194,65,12,0.25) 0%, transparent 70%)',
        animation: 'gl-pulse 0.4s ease-in-out infinite',
      }} />

      {/* Center text — RGB split */}
      <div className="relative select-none" style={{ animation: 'gl-flicker 0.35s linear infinite' }}>
        <span className="absolute inset-0 flex items-center justify-center text-5xl font-black font-mono uppercase italic tracking-widest text-red-500 opacity-70"
          style={{ animation: 'gl-rgb-r 0.13s steps(1) infinite', mixBlendMode: 'screen' }}>
          AWAKEN
        </span>
        <span className="absolute inset-0 flex items-center justify-center text-5xl font-black font-mono uppercase italic tracking-widest text-cyan-400 opacity-70"
          style={{ animation: 'gl-rgb-b 0.13s steps(1) infinite', mixBlendMode: 'screen' }}>
          AWAKEN
        </span>
        <span className="relative text-5xl font-black font-mono uppercase italic tracking-widest text-orange-500">
          AWAKEN
        </span>
        <p className="text-center text-[10px] font-mono text-zinc-500 tracking-[0.3em] mt-3 uppercase">
          System initializing...
        </p>
      </div>
    </div>
  );
}
