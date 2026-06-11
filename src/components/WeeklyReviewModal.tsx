import React from 'react';
import { CalendarCheck, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { WeeklyReviewData } from '../utils/weekly';

// Tổng kết tuần — ritual đầu tuần (feat-weekly-review REQ-03). Không XP, chỉ reflection.

interface WeeklyReviewModalProps {
  review: WeeklyReviewData | null;
  onClose: () => void;
}

const fmtVND = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
const fmtD = (iso: string) => { const [, m, d] = iso.split('-'); return `${d}/${m}`; };

// Mũi tên so sánh: goodWhen='up' (routine/task — tăng là tốt) | 'down' (chi tiêu).
function Delta({ cur, prev, goodWhen }: { cur: number; prev: number; goodWhen: 'up' | 'down' }) {
  if (cur === prev) return <Minus className="w-3.5 h-3.5 text-zinc-600" aria-label="Không đổi" />;
  const up = cur > prev;
  const good = goodWhen === 'up' ? up : !up;
  const Icon = up ? TrendingUp : TrendingDown;
  return <Icon className={`w-3.5 h-3.5 ${good ? 'text-emerald-400' : 'text-rose-400'}`} aria-label={up ? 'Tăng' : 'Giảm'} />;
}

export default function WeeklyReviewModal({ review, onClose }: WeeklyReviewModalProps) {
  if (!review) return null;
  const { current, previous } = review;
  const pct = current.routineTotal > 0 ? Math.round((current.routineDone / current.routineTotal) * 100) : 0;

  const rows: Array<{ label: string; cur: string; prev: string; delta: React.ReactNode }> = [
    {
      label: 'Đường Ray Kỷ Luật',
      cur: `${current.routineDone}/${current.routineTotal} (${pct}%)`,
      prev: `${previous.routineDone}/${previous.routineTotal}`,
      delta: <Delta cur={current.routineDone} prev={previous.routineDone} goodWhen="up" />,
    },
    {
      label: 'Nhiệm vụ hoàn thành',
      cur: String(current.tasksCompleted),
      prev: String(previous.tasksCompleted),
      delta: <Delta cur={current.tasksCompleted} prev={previous.tasksCompleted} goodWhen="up" />,
    },
    {
      label: 'Tổng chi tiêu',
      cur: fmtVND(current.spend),
      prev: fmtVND(previous.spend),
      delta: <Delta cur={current.spend} prev={previous.spend} goodWhen="down" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <style>{`@keyframes fadeScaleIn{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}`}</style>
      <div
        className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(234,88,12,0.2)]"
        style={{ animation: 'fadeScaleIn 0.3s ease' }}
      >
        <div className="px-7 pt-7 pb-5 border-b border-white/5 text-center">
          <div className="w-10 h-10 mx-auto mb-2 bg-orange-600/20 border border-orange-500/30 rounded-xl flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-orange-400" />
          </div>
          <h2 className="text-base font-black font-mono text-white uppercase tracking-widest">// Weekly Debrief</h2>
          <p className="text-[10px] font-mono text-orange-500 mt-1 uppercase tracking-widest">
            Tuần {fmtD(current.start)} – {fmtD(current.end)}
          </p>
        </div>

        <div className="px-6 py-5 space-y-3">
          <p className="text-[11px] font-mono text-zinc-500 text-center">
            So với tuần trước đó — nhìn lại để bước tiếp, không phải để tự trách.
          </p>

          <div className="bg-black/50 border border-white/8 rounded-xl divide-y divide-white/5">
            {rows.map(r => (
              <div key={r.label} className="flex items-center justify-between px-4 py-3 gap-3">
                <span className="text-[11px] font-mono text-zinc-500">{r.label}</span>
                <span className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-zinc-600">{r.prev}</span>
                  <span className="text-zinc-700">→</span>
                  <span className="text-white font-bold">{r.cur}</span>
                  {r.delta}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-black font-black italic text-sm uppercase tracking-widest rounded-lg transition-all"
          >
            Bắt đầu tuần mới →
          </button>
        </div>
      </div>
    </div>
  );
}
