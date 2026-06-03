import React from 'react';
import { Sparkles, Award, Scale, Plus } from 'lucide-react';
import { DayLog, Achievement } from '../types';
import { playQuestSuccessSound } from '../utils/audio';

interface JourneyLogsProps {
  logs: DayLog[];
  achievements: Achievement[];
  weightLogs: { date: string; weight: number }[];
  addWeightLog: (weight: number) => void;
  soundEnabled: boolean;
  addXP: (amount: number) => void;
}

export default function JourneyLogs({
  logs,
  achievements,
  weightLogs,
  addWeightLog,
  soundEnabled,
  addXP
}: JourneyLogsProps) {
  const [newWeightStr, setNewWeightStr] = React.useState('');

  // Generate a list of the last 28 days to display as a grid
  const getPastDays = () => {
    const list = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      list.push(dateString);
    }
    return list;
  };

  const past28Days = getPastDays();

  // Find percentage of routines done for a specific date
  const getRoutineQualityForDate = (dateStr: string) => {
    const log = logs.find(l => l.date === dateStr);
    if (!log) return 0;
    const totals = Object.values(log.routines).filter(v => v).length;
    return totals; // returns score 0 - 6
  };

  // Get color based on routine score
  const getGridColor = (score: number) => {
    switch (score) {
      case 0: return 'bg-neutral-950 border border-neutral-900/50';
      case 1:
      case 2: return 'bg-orange-950/20 border border-orange-900/30 shadow-[inset_0_0_4px_rgba(244,115,22,0.1)]';
      case 3:
      case 4: return 'bg-orange-900/40 border border-orange-600/30';
      case 5: return 'bg-orange-700/60 border border-orange-500/40';
      case 6: return 'bg-orange-500 border border-orange-400 shadow-[0_0_10px_rgba(244,115,22,0.4)]';
      default: return 'bg-neutral-950';
    }
  };

  const handleWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(newWeightStr);
    if (isNaN(w) || w <= 0 || w > 300) return;

    if (soundEnabled) playQuestSuccessSound();
    addWeightLog(w);
    addXP(15);
    setNewWeightStr('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* HISTORIC PATH & TRAILING STREAKS (7 cols) */}
      <div className="lg:col-span-7 space-y-6">

        {/* Contribution Grid */}
        <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 uppercase">
                // SYSTEM STREAK GRID
              </h2>
              <p className="text-xl font-bold font-sans tracking-tight text-white mt-1">Chặng Đường Bro Đã Đi</p>
            </div>
            <span className="text-[10px] font-mono uppercase bg-orange-950/50 px-2.5 py-1 text-orange-400 rounded border border-orange-900/40">
              PAST 28 DAYS
            </span>
          </div>

          <p className="text-xs text-zinc-400 mb-6 leading-relaxed font-mono">
            Biểu đồ rèn luyện kỷ luật dựa vào tỷ lệ hoàn thành Daily Protocol. Màu càng cam đậm càng thể hiện ý chí quật cường của một người bản lĩnh.
          </p>

          {/* Grid Layout Container */}
          <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
            <div className="grid grid-cols-7 gap-2 select-none">
              {past28Days.map((dateStr) => {
                const score = getRoutineQualityForDate(dateStr);
                const readableDate = new Date(dateStr).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
                return (
                  <div
                    key={dateStr}
                    className={`aspect-square rounded-md transition-all duration-300 relative group flex items-center justify-center cursor-help ${getGridColor(score)}`}
                  >
                    {/* Tooltip on Hover */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-neutral-950 text-neutral-200 text-[10px] p-2 rounded shadow-xl border border-neutral-800 z-50 whitespace-nowrap min-w-max pointer-events-none">
                      <span className="font-bold">{readableDate}</span>: {score} / 6 thói quen hoàn thành
                    </div>

                    {score === 6 && (
                      <Sparkles className="w-2.5 h-2.5 text-black absolute animate-pulse pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Grid Legend */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-900 text-[10px] font-mono text-zinc-500">
              <span>Lười Biếng</span>
              <div className="flex gap-1.5 items-center">
                <span className="w-2.5 h-2.5 rounded bg-neutral-950 border border-neutral-900/50"></span>
                <span className="w-2.5 h-2.5 rounded bg-orange-950/20"></span>
                <span className="w-2.5 h-2.5 rounded bg-orange-900/40"></span>
                <span className="w-2.5 h-2.5 rounded bg-orange-700/60"></span>
                <span className="w-2.5 h-2.5 rounded bg-orange-500"></span>
              </div>
              <span>Kỷ Luật Tối Đa</span>
            </div>
          </div>
        </div>

        {/* Dynamic Weight Ledger for Gym Grinders */}
        <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-5 h-5 text-orange-500" />
            <div>
              <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 uppercase">
                // ANTHROPOMETRIC LOGS
              </h2>
              <p className="text-xl font-bold font-sans tracking-tight text-white mt-1">Cân Nặng Chiến Thần</p>
            </div>
          </div>

          <p className="text-xs text-zinc-400 mb-6 font-mono">
            Bulk hay Cut? Kỷ luật thể hiện qua việc kiểm soát cơ thể chính mình. Theo dõi sát sao biến động sinh trắc học từng ngày.
          </p>

          <form onSubmit={handleWeightSubmit} className="flex gap-3 mb-6 bg-black/30 p-3 rounded-xl border border-white/5">
            <div className="relative flex-1">
              <input
                type="number"
                step="0.1"
                value={newWeightStr}
                onChange={(e) => setNewWeightStr(e.target.value)}
                placeholder="Ví dụ: 78.5"
                className="w-full bg-black/60 border border-white/5 focus:border-orange-500 focus:outline-none rounded-lg px-4 py-2.5 text-sm font-mono text-neutral-200"
                required
              />
              <span className="absolute right-3 top-2.5 text-xs font-mono text-neutral-500">kg</span>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded text-black font-black italic text-xs font-mono uppercase flex items-center gap-1 hover:brightness-110"
            >
              <Plus className="w-3.5 h-3.5" /> Check Weight
            </button>
          </form>

          {/* Weight Timeline Display */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {weightLogs.slice(-4).reverse().map((wl, idx) => (
              <div key={idx} className="bg-black/40 border border-neutral-800/80 p-3 rounded-xl text-center">
                <span className="text-[9px] font-mono text-neutral-500 block uppercase">{wl.date}</span>
                <span className="text-lg font-bold font-mono text-neutral-100 block mt-1">{wl.weight} kg</span>
                {idx < weightLogs.slice(-4).length - 1 && (
                  <span className="text-[9px] font-mono text-neutral-400">
                    Status: Verified
                  </span>
                )}
              </div>
            ))}
            {weightLogs.length === 0 && (
              <div className="col-span-4 text-center py-4 text-neutral-500 text-xs font-mono">
                Chưa có dữ liệu sinh trắc. Hãy bắt đầu ghi chép cân nặng!
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ACHIEVEMENTS TIMELINE (5 cols) */}
      <div className="lg:col-span-5 space-y-6">

        <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-orange-500" />
            <div>
              <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 uppercase">
                // SYSTEM ACHIEVEMENT LOG
              </h2>
              <p className="text-xl font-bold font-sans tracking-tight text-white mt-1">Huy Chương Thống Trị</p>
            </div>
          </div>

          <p className="text-xs text-zinc-400 mb-6 font-mono font-medium">
            Hệ thống tự động ban thưởng danh hiệu khi bạn chứng minh được năng lực kỷ luật tự giác.
          </p>

          <div className="space-y-3.5">
            {achievements.map((a) => {
              const isUnlocked = a.unlockedAt !== null;
              return (
                <div
                  key={a.id}
                  className={`p-4 rounded border transition-all duration-300 flex gap-3 ${
                    isUnlocked
                      ? 'bg-orange-950/10 border-orange-500/40 shadow-[0_2px_12px_rgba(244,115,22,0.04)]'
                      : 'bg-black/40 border-white/5 opacity-50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded border flex items-center justify-center font-mono text-xl ${
                    isUnlocked
                      ? 'bg-orange-900/10 border-orange-500/40 text-orange-300'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-600'
                  }`}>
                    {a.badge}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold leading-none uppercase font-mono ${isUnlocked ? 'text-orange-400' : 'text-neutral-500'}`}>
                        {a.title}
                      </h4>
                      {isUnlocked ? (
                        <span className="text-[8px] font-mono text-orange-400 uppercase tracking-widest">
                          UNLOCKED
                        </span>
                      ) : (
                        <span className="text-[8px] font-mono text-neutral-600 uppercase tracking-widest">
                          LOCKED
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-400 mt-1.5 leading-snug">{a.description}</p>

                    {isUnlocked && (
                      <p className="text-[9px] font-mono text-zinc-500 mt-1">Unlocked: {a.unlockedAt}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
