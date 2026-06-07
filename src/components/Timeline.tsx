import React from 'react';
import { Award, Scale, Plus, X, Trash2, Download, Upload, Shield } from 'lucide-react';
import { DayLog, Achievement } from '../types';
import { playQuestSuccessSound } from '../utils/audio';
import { BackupData, validateBackup } from '../utils/schema';
import TimelineEntry, { Entry } from './TimelineEntry';

const getTodayDateString = () => new Date().toISOString().split('T')[0];
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const isISO = (s: string) => ISO_RE.test(s);

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function buildEntries(
  logs: DayLog[], weightLogs: { date: string; weight: number }[],
  achievements: Achievement[], bodyPhotos: Record<string, string>, today: string,
): Entry[] {
  const map = new Map<string, Entry>();

  const get = (date: string): Entry => {
    if (!map.has(date)) {
      map.set(date, {
        isoDate: date, displayDate: fmtDate(date),
        note: '', score: 0, routines: {}, milestones: [], isToday: date === today,
      });
    }
    return map.get(date)!;
  };

  for (const log of logs) {
    const score = Object.values(log.routines).filter(Boolean).length;
    if (score > 0 || log.note) {
      const e = get(log.date);
      e.note = log.note;
      e.score = score;
      e.routines = log.routines;
    }
  }

  for (const wl of weightLogs) {
    if (!isISO(wl.date)) continue;
    const e = get(wl.date);
    e.weight = wl.weight;
    e.photo  = bodyPhotos[wl.date];
  }

  for (const ach of achievements) {
    if (ach.unlockedAt && isISO(ach.unlockedAt))
      get(ach.unlockedAt).milestones.push(`${ach.badge} ${ach.title}`);
  }

  // Ensure entries exist for every day that has a body photo
  for (const [date, photoUrl] of Object.entries(bodyPhotos)) {
    if (isISO(date)) get(date).photo = photoUrl;
  }

  get(today); // always include today

  return Array.from(map.values()).sort((a, b) => b.isoDate.localeCompare(a.isoDate));
}

// ── Weight SVG chart ──────────────────────────────────────────────────────────
function WeightChart({ data }: { data: { date: string; weight: number }[] }) {
  if (data.length < 2) return (
    <p className="text-[10px] font-mono text-zinc-600 text-center py-4">Cần ít nhất 2 lần ghi nhận để hiển thị biểu đồ.</p>
  );
  const weights = data.map(d => d.weight);
  const minW = Math.min(...weights) - 0.5;
  const range = (Math.max(...weights) + 0.5) - minW || 1;
  const W = 300, H = 70, P = 10;
  const toX = (i: number) => P + (i / (data.length - 1)) * (W - P * 2);
  const toY = (w: number) => H - P - ((w - minW) / range) * (H - P * 2);
  const pts = data.map((d, i) => `${toX(i)},${toY(d.weight)}`).join(' ');
  return (
    <div className="mt-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ea580c" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`${P},${H - P} ${pts} ${W - P},${H - P}`} fill="url(#wg)" />
        <polyline points={pts} fill="none" stroke="#ea580c" strokeWidth="1.5" strokeLinejoin="round" />
        {data.map((d, i) => <circle key={i} cx={toX(i)} cy={toY(d.weight)} r="2.5" fill="#ea580c" />)}
      </svg>
      <div className="flex justify-between mt-1 px-1">
        <span className="text-[9px] font-mono text-zinc-600">{data[0].date}</span>
        <span className="text-[9px] font-mono text-orange-400 font-bold">{data[data.length - 1].weight} kg</span>
        <span className="text-[9px] font-mono text-zinc-600">{data[data.length - 1].date}</span>
      </div>
    </div>
  );
}

// ── Streak Heatmap ────────────────────────────────────────────────────────────
function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface HeatCell {
  date: string;
  score: number;
  isToday: boolean;
  isFuture: boolean;
}

function StreakHeatmap({ logs }: { logs: DayLog[] }) {
  const scoreMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const log of logs) {
      map[log.date] = Object.values(log.routines).filter(Boolean).length;
    }
    return map;
  }, [logs]);

  const cells = React.useMemo((): HeatCell[] => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const todayISO = toISO(todayDate);

    const dow = todayDate.getDay(); // 0=Sun
    const sinceMon = dow === 0 ? 6 : dow - 1;
    const thisMonday = subDays(todayDate, sinceMon);
    const start = subDays(thisMonday, 77); // 11 weeks back = 84 days total

    const result: HeatCell[] = [];
    for (let i = 0; i < 84; i++) {
      const d = subDays(start, -i);
      const iso = toISO(d);
      result.push({
        date: iso,
        score: scoreMap[iso] ?? 0,
        isToday: iso === todayISO,
        isFuture: d > todayDate,
      });
    }
    return result;
  }, [scoreMap]);

  const activeDays = React.useMemo(
    () => logs.filter(l => Object.values(l.routines).some(Boolean)).length,
    [logs],
  );

  // Month labels: one label per column (week), show month name on first column of new month
  const monthLabels = React.useMemo(() => {
    const labels: string[] = [];
    for (let col = 0; col < 12; col++) {
      const firstDayOfWeek = cells[col * 7]; // first cell in this column (Monday)
      if (!firstDayOfWeek) { labels.push(''); continue; }
      const colMonth = firstDayOfWeek.date.slice(5, 7);
      const prevColFirstDay = col > 0 ? cells[(col - 1) * 7] : null;
      const prevMonth = prevColFirstDay ? prevColFirstDay.date.slice(5, 7) : null;
      if (col === 0 || colMonth !== prevMonth) {
        const d = new Date(firstDayOfWeek.date + 'T00:00:00');
        labels.push(d.toLocaleDateString('vi-VN', { month: 'short' }));
      } else {
        labels.push('');
      }
    }
    return labels;
  }, [cells]);

  function cellClass(cell: HeatCell): string {
    if (cell.isToday) return 'bg-orange-500 ring-1 ring-orange-300/50';
    if (cell.isFuture) return 'bg-zinc-900/20';
    if (cell.score === 0) return 'bg-zinc-800/60';
    if (cell.score <= 2) return 'bg-orange-950';
    if (cell.score <= 4) return 'bg-orange-700/60';
    return 'bg-orange-500';
  }

  const DAY_LABELS = ['T2', '', 'T4', '', 'T6', '', 'CN'];

  return (
    <div>
      {/* Month labels */}
      <div className="flex mb-1 pl-5">
        {monthLabels.map((label, i) => (
          <div key={i} className="flex-1 text-[9px] font-mono text-zinc-500 truncate">{label}</div>
        ))}
      </div>

      {/* Grid + day labels */}
      <div className="flex gap-1 items-start">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1" style={{ width: '14px' }}>
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="text-[9px] font-mono text-zinc-600 leading-none flex items-center justify-end" style={{ height: '10px' }}>
              {label}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="grid grid-cols-12 grid-rows-7 grid-flow-col gap-0.5 flex-1">
          {cells.map(cell => (
            <div
              key={cell.date}
              title={`${cell.date}: ${cell.score}/6`}
              className={`aspect-square rounded-sm ${cellClass(cell)}`}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-2">
        <span className="text-[9px] font-mono text-zinc-500">Ít</span>
        <div className="w-2.5 h-2.5 rounded-sm bg-zinc-800/60" />
        <div className="w-2.5 h-2.5 rounded-sm bg-orange-950" />
        <div className="w-2.5 h-2.5 rounded-sm bg-orange-700/60" />
        <div className="w-2.5 h-2.5 rounded-sm bg-orange-500" />
        <span className="text-[9px] font-mono text-zinc-500">Nhiều</span>
        <span className="sr-only">{activeDays} ngày active</span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface TimelineProps {
  logs: DayLog[];
  achievements: Achievement[];
  weightLogs: { date: string; weight: number }[];
  bodyPhotos: Record<string, string>;
  soundEnabled: boolean;
  onUpdateNote: (note: string) => void;
  addWeightLog: (weight: number) => void;
  onSaveBodyPhoto: (date: string, file: File) => void;
  onDeleteBodyPhoto: (date: string) => void;
  onExport: () => void;
  onImportRequest: (backup: BackupData) => void;
  isLoggedIn: boolean;
  userEmail: string | null;
  onShowAuth?: () => void;
}

export default function Timeline({
  logs, achievements, weightLogs, bodyPhotos,
  soundEnabled, onUpdateNote, addWeightLog,
  onSaveBodyPhoto, onDeleteBodyPhoto,
  onExport, onImportRequest, isLoggedIn, userEmail, onShowAuth,
}: TimelineProps) {
  const today = getTodayDateString();
  const [noteText, setNoteText] = React.useState(logs.find(l => l.date === today)?.note ?? '');
  const [weightStr, setWeightStr] = React.useState('');
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null);
  const [uploadingDate, setUploadingDate] = React.useState<string | null>(null);
  const [importError, setImportError] = React.useState('');
  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const importInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    const file = e.target.files?.[0];
    if (importInputRef.current) importInputRef.current.value = ''; // reset → chọn lại cùng file được
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const raw = JSON.parse(ev.target?.result as string);
        onImportRequest(validateBackup(raw));
      } catch (err) {
        setImportError(typeof err === 'string' ? err : 'File không đọc được. Vui lòng chọn file backup hợp lệ.');
      }
    };
    reader.readAsText(file);
  };

  React.useEffect(() => {
    setNoteText(logs.find(l => l.date === today)?.note ?? '');
  }, [today]); // eslint-disable-line react-hooks/exhaustive-deps

  const entries = React.useMemo(
    () => buildEntries(logs, weightLogs, achievements, bodyPhotos, today),
    [logs, weightLogs, achievements, bodyPhotos, today],
  );

  const handleWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weightStr);
    if (isNaN(w) || w <= 0 || w > 300) return;
    if (soundEnabled) playQuestSuccessSound();
    addWeightLog(w);
    setWeightStr('');
  };

  const handlePhotoUploadClick = (date: string) => {
    setUploadingDate(date);
    photoInputRef.current?.click();
  };

  const handlePhotoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingDate) onSaveBodyPhoto(uploadingDate, file);
    e.target.value = '';
    setUploadingDate(null);
  };

  const photoCount = Object.keys(bodyPhotos).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Hidden photo input — shared across all entries */}
      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoInputChange} />

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <button className="absolute top-4 right-4 text-zinc-400 hover:text-white"><X className="w-6 h-6" /></button>
          <img src={lightboxUrl} alt="Body check" className="max-w-full max-h-[90vh] object-contain rounded-xl" />
        </div>
      )}

      {/* LEFT — weight input + timeline */}
      <div className="lg:col-span-8 space-y-6">

        {/* Quick log */}
        <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-5">
          <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 uppercase mb-3">// LOG HÔM NAY</h2>
          <form onSubmit={handleWeightSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input type="number" step="0.1" value={weightStr}
                onChange={e => setWeightStr(e.target.value)}
                placeholder="Cân nặng hôm nay..."
                className="w-full bg-black/60 border border-white/5 focus:border-orange-500 focus:outline-none rounded-lg px-3 py-2.5 text-sm font-mono text-neutral-200"
              />
              <span className="absolute right-3 top-2.5 text-xs font-mono text-neutral-500">kg</span>
            </div>
            <button type="submit" className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded text-black font-black italic text-xs uppercase flex items-center gap-1 flex-shrink-0">
              <Plus className="w-3.5 h-3.5" /> Log
            </button>
          </form>
        </div>

        {/* Streak Heatmap */}
        {(() => {
          const activeDays = logs.filter(l => Object.values(l.routines).some(Boolean)).length;
          return (
            <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 uppercase">// STREAK MAP</h2>
                  <p className="text-sm font-bold text-white mt-1">12 Tuần Gần Nhất</p>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-white/5">
                  {activeDays} ngày active
                </span>
              </div>
              <StreakHeatmap logs={logs} />
            </div>
          );
        })()}

        {/* Timeline scroll */}
        <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 uppercase">// JOURNEY TIMELINE</h2>
              <p className="text-xl font-bold font-sans tracking-tight text-white mt-1">Hành Trình Của Bạn</p>
            </div>
            <span className="text-[10px] font-mono uppercase bg-orange-950/50 px-2.5 py-1 text-orange-400 rounded border border-orange-900/40">
              {entries.length} mốc
            </span>
          </div>

          <div className="relative">
            <div className="absolute left-[6px] top-4 bottom-4 w-px bg-gradient-to-b from-orange-500/40 via-zinc-700/30 to-transparent" />
            <div className="space-y-2">
              {entries.map(entry => (
                <TimelineEntry key={entry.isoDate} entry={entry}
                  noteText={entry.isToday ? noteText : entry.note}
                  onNoteChange={setNoteText}
                  onNoteBlur={() => onUpdateNote(noteText)}
                  onPhotoUpload={handlePhotoUploadClick}
                  onPhotoDelete={onDeleteBodyPhoto}
                  onLightbox={setLightboxUrl}
                />
              ))}
              {entries.length <= 1 && (
                <div className="pl-8 py-8 text-center text-zinc-600 text-xs font-mono">
                  Bắt đầu check-in hàng ngày để xây dựng timeline của bạn.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — achievements + weight chart + photo gallery */}
      <div className="lg:col-span-4 space-y-6">

        {/* Achievements */}
        <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-orange-500" />
            <div>
              <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 uppercase">// ACHIEVEMENT LOG</h2>
              <p className="text-lg font-bold font-sans tracking-tight text-white mt-1">Huy Chương</p>
            </div>
          </div>
          <div className="space-y-3">
            {achievements.map(a => {
              const unlocked = a.unlockedAt !== null;
              return (
                <div key={a.id} className={`p-3.5 rounded border flex gap-3 transition-all ${
                  unlocked ? 'bg-orange-950/10 border-orange-500/40' : 'bg-black/40 border-white/5 opacity-50'
                }`}>
                  <div className={`w-10 h-10 rounded border flex items-center justify-center text-lg flex-shrink-0 ${
                    unlocked ? 'bg-orange-900/10 border-orange-500/40' : 'bg-neutral-950 border-neutral-800'
                  }`}>{a.badge}</div>
                  <div className="min-w-0">
                    <div className="flex justify-between gap-1">
                      <h4 className={`text-[10px] font-bold uppercase font-mono truncate ${unlocked ? 'text-orange-400' : 'text-neutral-500'}`}>{a.title}</h4>
                      <span className={`text-[8px] font-mono flex-shrink-0 ${unlocked ? 'text-orange-400' : 'text-neutral-600'}`}>{unlocked ? '✓' : '?'}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-snug">{a.description}</p>
                    {unlocked && <p className="text-[9px] font-mono text-zinc-600 mt-1">{a.unlockedAt}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weight trend */}
        {weightLogs.length > 0 && (
          <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-4 h-4 text-orange-500" />
              <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 uppercase">// WEIGHT TREND</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {weightLogs.slice(-4).reverse().map((wl, i) => (
                <div key={i} className="bg-black/40 border border-neutral-800/80 p-2.5 rounded-xl text-center">
                  <span className="text-[9px] font-mono text-neutral-500 block">{wl.date}</span>
                  <span className="text-base font-bold font-mono text-neutral-100">{wl.weight} kg</span>
                </div>
              ))}
            </div>
            {weightLogs.length >= 2 && (
              <div className="bg-black/30 border border-white/5 rounded-xl p-3">
                <WeightChart data={weightLogs} />
              </div>
            )}
          </div>
        )}

        {/* Body photo gallery */}
        {photoCount > 0 && (
          <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-5">
            <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 uppercase mb-3">
              // BODY CHECK ({photoCount})
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(bodyPhotos).sort(([a], [b]) => b.localeCompare(a)).slice(0, 9).map(([date, url]) => (
                <div key={date} className="relative group">
                  <img src={url} alt={date} onClick={() => setLightboxUrl(url)}
                    className="w-full aspect-square object-cover rounded-lg border border-white/5 cursor-pointer hover:border-orange-500/40 transition-all"
                  />
                  <button onClick={() => onDeleteBodyPhoto(date)}
                    className="absolute top-1 right-1 bg-red-600/90 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-2.5 h-2.5 text-white" />
                  </button>
                  <span className="text-[8px] font-mono text-zinc-600 block text-center mt-0.5">{date.slice(5)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data protection widget — conditional on auth state */}
        {isLoggedIn ? (
          <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <h2 className="text-xs font-bold font-mono tracking-widest text-emerald-500 uppercase">// Cloud Sync Active</h2>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono leading-relaxed">
              Dữ liệu tự động đồng bộ — không cần sao lưu thủ công.
            </p>
            {userEmail && (
              <p className="text-[10px] text-zinc-700 font-mono mt-1.5 truncate">{userEmail}</p>
            )}
          </div>
        ) : (
          <div className="bg-zinc-900/45 border border-orange-600/15 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-orange-500" />
              <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 uppercase">// Bảo Vệ Tiến Trình</h2>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">
              Đăng nhập để tự động sao lưu lên đám mây — không bao giờ mất tiến trình dù xóa cache hay đổi máy.
            </p>
            {onShowAuth && (
              <button
                onClick={onShowAuth}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-black font-black italic text-xs uppercase tracking-widest rounded-lg transition-colors mb-3"
              >
                Đăng nhập / Đăng ký →
              </button>
            )}
            <button
              onClick={onExport}
              className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-mono text-zinc-600 hover:text-zinc-400 border border-white/5 hover:border-white/10 rounded-lg transition-all"
            >
              <Download className="w-3 h-3" />
              hoặc tải xuống thủ công (.json)
            </button>
            <button
              onClick={() => { setImportError(''); importInputRef.current?.click(); }}
              className="w-full flex items-center justify-center gap-2 py-2 mt-2 text-[10px] font-mono text-zinc-600 hover:text-zinc-400 border border-white/5 hover:border-white/10 rounded-lg transition-all"
            >
              <Upload className="w-3 h-3" />
              khôi phục từ file backup (.json)
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportFileChange}
              className="hidden"
            />
            {importError && (
              <p className="mt-2 text-[11px] text-red-400 font-mono bg-red-950/20 border border-red-800/30 rounded px-3 py-2">
                {importError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
