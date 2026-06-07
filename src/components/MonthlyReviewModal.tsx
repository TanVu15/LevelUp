import React from 'react';
import { Sparkles, TrendingUp, TrendingDown, Coins } from 'lucide-react';

export interface MonthlyReviewState {
  lastMonth: string;       // "2026-05"
  spend: number;
  budget: number;
  xpAwarded: number;
  defaultNewBudget: number;
}

interface MonthlyReviewModalProps {
  review: MonthlyReviewState | null;
  onConfirm: (newBudget: number) => void;
}

const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

const fmtYM = (ym: string) => {
  const [y, m] = ym.split('-');
  return `Tháng ${parseInt(m)}/${y}`;
};

const nextYM = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
};

export default function MonthlyReviewModal({ review, onConfirm }: MonthlyReviewModalProps) {
  const [budgetStr, setBudgetStr] = React.useState('');

  React.useEffect(() => {
    if (review) setBudgetStr(review.defaultNewBudget > 0 ? String(review.defaultNewBudget) : '');
  }, [review]);

  if (!review) return null;

  const hasBudget    = review.budget > 0;
  const saved        = hasBudget ? review.budget - review.spend : 0;
  const savedPct     = hasBudget ? Math.round((saved / review.budget) * 100) : 0;
  const underBudget  = hasBudget && saved >= 0;
  const newMonth     = nextYM(review.lastMonth);

  const handleConfirm = () => {
    const parsed = parseFloat(budgetStr.replace(/[^0-9]/g, ''));
    onConfirm(isNaN(parsed) || parsed <= 0 ? 0 : parsed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <style>{`@keyframes fadeScaleIn{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}`}</style>
      <div
        className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(234,88,12,0.2)]"
        style={{ animation: 'fadeScaleIn 0.3s ease' }}
      >
        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-white/5 text-center">
          <div className="text-3xl mb-2">🎊</div>
          <h2 className="text-base font-black font-mono text-white uppercase tracking-widest">Tháng mới bắt đầu!</h2>
          <p className="text-[10px] font-mono text-orange-500 mt-1 uppercase tracking-widest">{fmtYM(newMonth)}</p>
        </div>

        {/* Last month result */}
        <div className="px-7 py-5 space-y-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Kết quả {fmtYM(review.lastMonth)}</p>

          {hasBudget ? (
            <>
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-zinc-400">Chi tiêu thực tế</span>
                <span className="text-sm font-bold text-rose-400">{fmt(review.spend)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-zinc-400">Budget đặt ra</span>
                <span className="text-sm font-bold text-zinc-300">{fmt(review.budget)}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${underBudget ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(100, hasBudget ? Math.round((review.spend / review.budget) * 100) : 0)}%` }}
                />
              </div>

              <div className="h-px bg-white/5" />

              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                  {underBudget
                    ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    : <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
                  {underBudget ? 'Tiết kiệm được' : 'Vượt budget'}
                </span>
                <span className={`text-sm font-black ${underBudget ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {underBudget ? '+' : ''}{fmt(saved)}&nbsp;
                  <span className="text-xs font-mono opacity-70">({savedPct}%)</span>
                </span>
              </div>

              {review.xpAwarded > 0 && (
                <div className="p-3 rounded-lg bg-orange-950/20 border border-orange-600/20 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Phần thưởng
                  </span>
                  <span className="text-sm font-black text-orange-400">+{review.xpAwarded} XP</span>
                </div>
              )}

              {!underBudget && (
                <p className="text-[10px] font-mono text-zinc-500 leading-relaxed text-center">
                  Tháng này vượt ngân sách — không sao! Điều chỉnh budget thực tế hơn cho tháng tới.
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-zinc-500 leading-relaxed font-sans py-2">
              Tháng trước chưa có budget. Thiết lập ngay từ tháng này để track tiến trình tài chính!
            </p>
          )}
        </div>

        {/* New month budget */}
        <div className="px-7 pb-7 space-y-3">
          <div className="h-px bg-white/5" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Budget {fmtYM(newMonth)}</p>
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-orange-500 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              inputMode="numeric"
              value={budgetStr ? Number(budgetStr).toLocaleString('vi-VN') : ''}
              onChange={e => setBudgetStr(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              placeholder="Nhập số tiền (VND)"
              className="flex-1 bg-black/60 border border-white/10 focus:border-orange-500 focus:outline-none rounded-lg px-3 py-2.5 text-sm text-neutral-200 font-mono transition-colors"
            />
          </div>
          <button
            onClick={handleConfirm}
            className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-black font-black italic text-sm uppercase rounded-xl tracking-widest transition-all shadow-[0_0_20px_rgba(234,88,12,0.3)]"
          >
            Bắt đầu tháng mới →
          </button>
        </div>
      </div>
    </div>
  );
}
