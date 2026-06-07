import React from 'react';
import { Sparkles, Award, Scale, Plus, NotebookPen, TrendingUp, TrendingDown, Minus, Download, Upload, HardDrive } from 'lucide-react';
import { DayLog, Achievement } from '../types';
import { playQuestSuccessSound } from '../utils/audio';
import { BackupData, validateBackup } from '../utils/schema';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

interface JourneyLogsProps {
  logs: DayLog[];
  achievements: Achievement[];
  weightLogs: { date: string; weight: number }[];
  addWeightLog: (weight: number) => void;
  soundEnabled: boolean;
  onUpdateNote: (note: string) => void;
  onExport: () => void;
  onImportRequest: (backup: BackupData) => void;
}

// ── Weekly comparison helper ────────────────────────────────────────────────
function getWeekStats(logs: DayLog[], startDaysAgo: number) {
  const scores: number[] = [];
  for (let i = startDaysAgo; i < startDaysAgo + 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const log = logs.find(l => l.date === dateStr);
    scores.push(log ? Object.values(log.routines).filter(Boolean).length : 0);
  }
  const avg = scores.reduce((s, v) => s + v, 0) / 7;
  const perfectDays = scores.filter(v => v === 6).length;
  const activeDays = scores.filter(v => v >= 3).length;
  return { avg: Math.round(avg * 10) / 10, perfectDays, activeDays };
}

// ── Weight SVG chart ────────────────────────────────────────────────────────
function WeightChart({ data }: { data: { date: string; weight: number }[] }) {
  if (data.length < 2) return (
    <p className="text-[10px] font-mono text-zinc-600 text-center py-4">
      Cần ít nhất 2 lần ghi nhận để hiển thị biểu đồ.
    </p>
  );

  const weights = data.map(d => d.weight);
  const minW = Math.min(...weights) - 0.5;
  const maxW = Math.max(...weights) + 0.5;
  const range = maxW - minW || 1;

  const W = 300, H = 70, PAD = 10;
  const toX = (i: number) => PAD + (i / (data.length - 1)) * (W - PAD * 2);
  const toY = (w: number) => H - PAD - ((w - minW) / range) * (H - PAD * 2);

  const points = data.map((d, i) => `${toX(i)},${toY(d.weight)}`).join(' ');

  return (
    <div className="mt-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 0.5, 1].map(t => {
          const y = PAD + t * (H - PAD * 2);
          return <line key={t} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#27272a" strokeWidth="0.5" />;
        })}

        {/* Area fill */}
        <defs>
          <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ea580c" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`${PAD},${H - PAD} ${points} ${W - PAD},${H - PAD}`}
          fill="url(#wGrad)"
        />

        {/* Line */}
        <polyline points={points} fill="none" stroke="#ea580c" strokeWidth="1.5" strokeLinejoin="round" />

        {/* Dots */}
        {data.map((d, i) => (
          <circle key={i} cx={toX(i)} cy={toY(d.weight)} r="2.5" fill="#ea580c" />
        ))}
      </svg>

      {/* X labels: first and last */}
      <div className="flex justify-between mt-1 px-2">
        <span className="text-[9px] font-mono text-zinc-600">{data[0].date}</span>
        <span className="text-[9px] font-mono text-zinc-400 font-bold">{data[data.length - 1].weight} kg</span>
        <span className="text-[9px] font-mono text-zinc-600">{data[data.length - 1].date}</span>
      </div>
    </div>
  );
}

export default function JourneyLogs({
  logs, achievements, weightLogs, addWeightLog,
  soundEnabled, onUpdateNote, onExport, onImportRequest,
}: JourneyLogsProps) {
  const [newWeightStr, setNewWeightStr] = React.useState('');
  const [importError, setImportError] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const today = getTodayDateString();
  const todayLog = logs.find(l => l.date === today);
  const [noteText, setNoteText] = React.useState(todayLog?.note ?? '');

  React.useEffect(() => {
    const log = logs.find(l => l.date === today);
    setNoteText(log?.note ?? '');
  }, [today]); // eslint-disable-line react-hooks/exhaustive-deps

  const getPastDays = () => {
    const list = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      list.push(d.toISOString().split('T')[0]);
    }
    return list;
  };

  const past28Days = getPastDays();

  const getRoutineScore = (dateStr: string) => {
    const log = logs.find(l => l.date === dateStr);
    return log ? Object.values(log.routines).filter(Boolean).length : 0;
  };

  const getGridColor = (score: number) => {
    switch (score) {
      case 0: return 'bg-neutral-950 border border-neutral-900/50';
      case 1:
      case 2: return 'bg-orange-950/20 border border-orange-900/30';
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
    setNewWeightStr('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = '';           // reset so same file can be re-picked
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const raw = JSON.parse(ev.target?.result as string);
        onImportRequest(validateBackup(raw));
      } catch (e) {
        setImportError(typeof e === 'string' ? e : 'File không đọc được. Vui lòng chọn file backup hợp lệ.');
      }
    };
    reader.readAsText(file);
  };

  // Weekly comparison
  const thisWeek = getWeekStats(logs, 0);
  const lastWeek = getWeekStats(logs, 7);
  const avgDiff  = Math.round((thisWeek.avg - lastWeek.avg) * 10) / 10;
  const hasLastWeekData = lastWeek.avg > 0 || lastWeek.activeDays > 0;

  const trendMsg = (): string => {
    if (!hasLastWeekData) return 'Chưa đủ dữ liệu tuần trước để so sánh.';
    if (avgDiff > 0.5)  return `↑ Tốt lên! Trung bình +${avgDiff} thói quen/ngày so với tuần trước.`;
    if (avgDiff < -0.5) return `↓ Tuần này hơi chậm lại — nhưng nhận ra là bước đầu để cải thiện.`;
    return `→ Ổn định. Hãy cố phá kỷ lục tuần sau.`;
  };
  const TrendIcon = avgDiff > 0.5 ? TrendingUp : avgDiff < -0.5 ? TrendingDown : Minus;
  const trendColor = avgDiff > 0.5 ? 'text-emerald-400' : avgDiff < -0.5 ? 'text-amber-400' : 'text-zinc-400';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT */}
      <div className="lg:col-span-7 space-y-6">

        {/* Streak Grid */}
        <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 uppercase">// SYSTEM STREAK GRID</h2>
              <p className="text-xl font-bold font-sans tracking-tight text-white mt-1">Chặng Đường Bro Đã Đi</p>
            </div>
            <span className="text-[10px] font-mono uppercase bg-orange-950/50 px-2.5 py-1 text-orange-400 rounded border border-orange-900/40">PAST 28 DAYS</span>
          </div>
          <p className="text-xs text-zinc-400 mb-6 font-mono">
            Màu càng cam đậm → tỷ lệ hoàn thành thói quen càng cao trong ngày đó.
          </p>
          <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
            <div className="grid grid-cols-7 gap-2 select-none">
              {past28Days.map(dateStr => {
                const score = getRoutineScore(dateStr);
                const log   = logs.find(l => l.date === dateStr);
                const readableDate = new Date(dateStr).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
                return (
                  <div key={dateStr} className={`aspect-square rounded-md transition-all duration-300 relative group flex items-center justify-center cursor-help ${getGridColor(score)}`}>
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-neutral-950 text-neutral-200 text-[10px] p-2 rounded shadow-xl border border-neutral-800 z-50 whitespace-nowrap min-w-max pointer-events-none">
                      <span className="font-bold">{readableDate}</span>: {score} / 6 thói quen
                      {log?.note && <div className="text-zinc-400 italic mt-1 max-w-[180px] whitespace-normal">{log.note}</div>}
                    </div>
                    {score === 6 && <Sparkles className="w-2.5 h-2.5 text-black absolute animate-pulse pointer-events-none" />}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-900 text-[10px] font-mono text-zinc-500">
              <span>Lười Biếng</span>
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-neutral-950 border border-neutral-900/50" />
                <span className="w-2.5 h-2.5 rounded bg-orange-950/20" />
                <span className="w-2.5 h-2.5 rounded bg-orange-900/40" />
                <span className="w-2.5 h-2.5 rounded bg-orange-700/60" />
                <span className="w-2.5 h-2.5 rounded bg-orange-500" />
              </div>
              <span>Kỷ Luật Tối Đa</span>
            </div>
          </div>
        </div>

        {/* Weekly Comparison */}
        <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-6">
          <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 uppercase mb-1">// PROGRESS REPORT</h2>
          <p className="text-xl font-bold font-sans tracking-tight text-white mt-1 mb-4">So Sánh Tuần Này vs Tuần Trước</p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {[
              { label: 'TUẦN NÀY', stats: thisWeek, highlight: true },
              { label: 'TUẦN TRƯỚC', stats: lastWeek, highlight: false },
            ].map(({ label, stats, highlight }) => (
              <div key={label} className={`p-4 rounded-xl border ${highlight ? 'bg-orange-950/15 border-orange-600/25' : 'bg-black/30 border-white/5'}`}>
                <p className={`text-[9px] font-mono uppercase tracking-widest mb-3 ${highlight ? 'text-orange-400' : 'text-zinc-500'}`}>{label}</p>
                <div className="space-y-2">
                  <div>
                    <p className={`text-2xl font-black font-mono ${highlight ? 'text-white' : 'text-zinc-400'}`}>{stats.avg}<span className="text-sm text-zinc-500 font-normal">/6</span></p>
                    <p className="text-[9px] font-mono text-zinc-600 uppercase">avg thói quen/ngày</p>
                  </div>
                  <div className="flex gap-4 pt-2 border-t border-white/5">
                    <div>
                      <p className={`text-sm font-bold font-mono ${highlight ? 'text-orange-400' : 'text-zinc-500'}`}>{stats.perfectDays}</p>
                      <p className="text-[9px] font-mono text-zinc-600">Ngày 6/6</p>
                    </div>
                    <div>
                      <p className={`text-sm font-bold font-mono ${highlight ? 'text-orange-400' : 'text-zinc-500'}`}>{stats.activeDays}</p>
                      <p className="text-[9px] font-mono text-zinc-600">Ngày tích cực</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={`flex items-start gap-3 p-3 rounded-lg border ${avgDiff > 0.5 ? 'bg-emerald-950/15 border-emerald-600/20' : avgDiff < -0.5 ? 'bg-amber-950/15 border-amber-600/20' : 'bg-zinc-900/50 border-white/5'}`}>
            <TrendIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${trendColor}`} />
            <p className={`text-xs font-mono ${trendColor}`}>{trendMsg()}</p>
          </div>
        </div>

        {/* Daily Note */}
        <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <NotebookPen className="w-5 h-5 text-orange-500" />
            <div>
              <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 uppercase">// DAILY REFLECTION</h2>
              <p className="text-xl font-bold font-sans tracking-tight text-white mt-1">Nhật Ký Hôm Nay</p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mb-4 font-mono">Ghi 1-2 câu về ngày hôm nay — sẽ hiện trong tooltip streak grid.</p>
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            onBlur={() => onUpdateNote(noteText)}
            placeholder="Hôm nay cảm giác thế nào? Điều gì đáng ghi nhớ?"
            rows={3}
            maxLength={200}
            className="w-full bg-black/60 border border-white/5 focus:border-orange-500 focus:outline-none rounded-lg px-4 py-3 text-sm text-neutral-200 transition-colors resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-[10px] font-mono text-zinc-600">{noteText.length}/200</span>
            <button onClick={() => onUpdateNote(noteText)} className="text-[10px] font-mono text-orange-500 hover:text-orange-400 uppercase tracking-widest">Lưu ghi chú</button>
          </div>
        </div>

        {/* Weight log */}
        <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-5 h-5 text-orange-500" />
            <div>
              <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 uppercase">// ANTHROPOMETRIC LOGS</h2>
              <p className="text-xl font-bold font-sans tracking-tight text-white mt-1">Cân Nặng Chiến Thần</p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mb-6 font-mono">Ghi nhận 4 lần để unlock achievement. Hover streak grid để xem lịch sử.</p>

          <form onSubmit={handleWeightSubmit} className="flex gap-3 mb-4 bg-black/30 p-3 rounded-xl border border-white/5">
            <div className="relative flex-1">
              <input
                type="number" step="0.1" value={newWeightStr}
                onChange={e => setNewWeightStr(e.target.value)}
                placeholder="Ví dụ: 78.5"
                className="w-full bg-black/60 border border-white/5 focus:border-orange-500 focus:outline-none rounded-lg px-4 py-2.5 text-sm font-mono text-neutral-200"
                required
              />
              <span className="absolute right-3 top-2.5 text-xs font-mono text-neutral-500">kg</span>
            </div>
            <button type="submit" className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded text-black font-black italic text-xs uppercase flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Log
            </button>
          </form>

          {/* Recent entries */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {weightLogs.slice(-4).reverse().map((wl, idx) => (
              <div key={idx} className="bg-black/40 border border-neutral-800/80 p-3 rounded-xl text-center">
                <span className="text-[9px] font-mono text-neutral-500 block uppercase">{wl.date}</span>
                <span className="text-lg font-bold font-mono text-neutral-100 block mt-1">{wl.weight} kg</span>
              </div>
            ))}
            {weightLogs.length === 0 && (
              <div className="col-span-4 text-center py-4 text-neutral-500 text-xs font-mono">
                Chưa có dữ liệu. Bắt đầu ghi để unlock achievement!
              </div>
            )}
          </div>

          {/* SVG Chart */}
          {weightLogs.length >= 2 && (
            <div className="bg-black/30 border border-white/5 rounded-xl p-4">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">// WEIGHT TREND</p>
              <WeightChart data={weightLogs} />
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Achievements + Backup */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-orange-500" />
            <div>
              <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 uppercase">// ACHIEVEMENT LOG</h2>
              <p className="text-xl font-bold font-sans tracking-tight text-white mt-1">Huy Chương Thống Trị</p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mb-6 font-mono">Hệ thống tự động ban thưởng khi bạn chứng minh được năng lực tự giác.</p>
          <div className="space-y-3.5">
            {achievements.map(a => {
              const isUnlocked = a.unlockedAt !== null;
              return (
                <div key={a.id} className={`p-4 rounded border transition-all duration-300 flex gap-3 ${
                  isUnlocked ? 'bg-orange-950/10 border-orange-500/40' : 'bg-black/40 border-white/5 opacity-50'
                }`}>
                  <div className={`w-12 h-12 rounded border flex items-center justify-center text-xl ${
                    isUnlocked ? 'bg-orange-900/10 border-orange-500/40' : 'bg-neutral-950 border-neutral-800 text-neutral-600'
                  }`}>
                    {a.badge}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold uppercase font-mono ${isUnlocked ? 'text-orange-400' : 'text-neutral-500'}`}>{a.title}</h4>
                      <span className={`text-[8px] font-mono uppercase tracking-widest ${isUnlocked ? 'text-orange-400' : 'text-neutral-600'}`}>
                        {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-snug">{a.description}</p>
                    {isUnlocked && <p className="text-[9px] font-mono text-zinc-500 mt-1">Unlocked: {a.unlockedAt}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Data Backup — placed here so users can manage their progress data
            alongside the Journey tab (where they review history). */}
        <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="w-5 h-5 text-orange-500" />
            <div>
              <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 uppercase">// DATA BACKUP</h2>
              <p className="text-xl font-bold font-sans tracking-tight text-white mt-1">Sao Lưu Tiến Trình</p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mb-5 font-mono leading-relaxed">
            Xuất file backup để bảo vệ tiến trình. Nếu mất dữ liệu (đổi máy, clear cache), import lại file này để khôi phục.
          </p>

          <div className="space-y-3">
            <button
              onClick={onExport}
              className="w-full flex items-center gap-3 px-4 py-3 bg-orange-600/15 hover:bg-orange-600/25 border border-orange-500/30 rounded-xl transition-all group"
            >
              <Download className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="text-xs font-black text-orange-300 uppercase tracking-widest">Export Backup</p>
                <p className="text-[10px] font-mono text-zinc-500">Tải file levelup-backup-YYYY-MM-DD.json</p>
              </div>
            </button>

            <button
              onClick={() => { setImportError(''); fileInputRef.current?.click(); }}
              className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 border border-white/8 rounded-xl transition-all group"
            >
              <Upload className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 group-hover:scale-110 transition-all" />
              <div className="text-left">
                <p className="text-xs font-black text-zinc-300 uppercase tracking-widest">Import Backup</p>
                <p className="text-[10px] font-mono text-zinc-500">Chọn file .json để khôi phục dữ liệu</p>
              </div>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />

            {importError && (
              <p className="text-[11px] text-red-400 font-mono bg-red-950/20 border border-red-800/30 rounded px-3 py-2">
                {importError}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
