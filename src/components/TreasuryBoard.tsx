import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Trash2,
  Coins,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Check,
  X
} from 'lucide-react';
import { Transaction, ExpenseCategory } from '../types';
import { playClickSound, playQuestSuccessSound } from '../utils/audio';
import { getCurrentYearMonth, toISODate } from '../utils/date';

interface TreasuryBoardProps {
  transactions: Transaction[];
  addTransaction: (title: string, amount: number, type: 'INCOME' | 'EXPENSE', category: ExpenseCategory | 'Income Source') => void;
  deleteTransaction: (id: string) => void;
  soundEnabled: boolean;
  currentMonthBudget: number;
  setCurrentMonthBudget: (amount: number) => void;
}

export default function TreasuryBoard({
  transactions,
  addTransaction,
  deleteTransaction,
  soundEnabled,
  currentMonthBudget,
  setCurrentMonthBudget,
}: TreasuryBoardProps) {
  // Transaction form
  const [title, setTitle] = React.useState('');
  const [amountStr, setAmountStr] = React.useState('');
  const [type, setType] = React.useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [category, setCategory] = React.useState<ExpenseCategory | 'Income Source'>('Gym & Nutrition');

  // Budget editing
  const [editingBudget, setEditingBudget] = React.useState(false);
  const [budgetInputStr, setBudgetInputStr] = React.useState('');

  // Monthly filter
  const currentYMNow = getCurrentYearMonth();
  const last4Months = Array.from({ length: 4 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    return toISODate(d).slice(0, 7); // local YYYY-MM (toISOString would drift a month for UTC+ zones)
  });
  const [selectedMonth, setSelectedMonth] = React.useState<string>(currentYMNow);

  // Update default category when type switches
  React.useEffect(() => {
    if (type === 'INCOME') {
      setCategory('Income Source');
    } else {
      setCategory('Gym & Nutrition');
    }
  }, [type]);

  // Filtered transactions for selected month
  const filteredTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));

  // Aggregate metrics (scoped to selected month)
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Leak calculations
  const totalLeaks = filteredTransactions
    .filter(t => t.type === 'EXPENSE' && t.category === 'Unnecessary Leaks')
    .reduce((sum, t) => sum + t.amount, 0);

  const leakPercentage = totalExpense > 0 ? Math.round((totalLeaks / totalExpense) * 100) : 0;

  const leakLabel = leakPercentage >= 25
    ? 'OPTIMIZE YOUR BUDGET'
    : leakPercentage > 0
      ? 'SPENDING REVIEW'
      : 'TREASURY FLOW SECURE';

  const leakMessage = leakPercentage >= 25
    ? 'Discretionary spend đang chiếm tỷ lệ cao. Đây là cơ hội tốt để xem xét và điều chỉnh — mỗi đồng tối ưu hóa là một bước gần hơn đến tự do tài chính.'
    : leakPercentage > 0
      ? 'Một số khoản chi có thể được tối ưu thêm. Không sao cả — nhận ra là bước đầu tiên để cải thiện.'
      : 'Hệ thống xác nhận: dòng tiền đang được quản lý hiệu quả. Tiếp tục duy trì đà tốt này!';

  // Formatting helper for currency
  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amountStr.trim()) return;

    const parsedAmount = parseFloat(amountStr.replace(/[^0-9]/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    if (soundEnabled) {
      if (type === 'INCOME') {
        playQuestSuccessSound();
      } else {
        playClickSound();
      }
    }

    addTransaction(title.trim(), parsedAmount, type, category);

    // Reset fields
    setTitle('');
    setAmountStr('');
  };

  const handleDeleteClick = (id: string) => {
    if (soundEnabled) playClickSound();
    deleteTransaction(id);
  };

  // Compute category distributions for custom SVG bars
  const expenseCategories: ExpenseCategory[] = [
    'Gym & Nutrition',
    'Work & Gear',
    'Books & Growth',
    'Rent & Utilities',
    'Unnecessary Leaks'
  ];

  const categoryTotals = expenseCategories.map(cat => {
    const total = filteredTransactions
      .filter(t => t.type === 'EXPENSE' && t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0);
    return { name: cat, total };
  });

  const maxCategoryTotal = Math.max(...categoryTotals.map(c => c.total), 1);

  // Category breakdown sorted by amount (for the breakdown pills)
  const categoryBreakdown = categoryTotals
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  // Budget progress bar — only for current month
  const currentMonthLabel = (() => { const d = new Date(); return `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`; })();
  const isCurrentMonth = selectedMonth === currentYMNow;
  // currentMonthSpend = expenses in the current calendar month (not the selected filter month)
  const currentMonthSpend = transactions
    .filter(t => t.type === 'EXPENSE' && t.date.startsWith(currentYMNow))
    .reduce((sum, t) => sum + t.amount, 0);
  const budgetRemaining  = currentMonthBudget - currentMonthSpend;
  const budgetUsedPct    = currentMonthBudget > 0 ? Math.min(100, Math.round((currentMonthSpend / currentMonthBudget) * 100)) : 0;
  const budgetBarColor   = budgetUsedPct >= 90 ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                         : budgetUsedPct >= 70 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                         : 'bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.3)]';

  const handleBudgetSave = () => {
    const parsed = parseFloat(budgetInputStr.replace(/[^0-9]/g, ''));
    if (!isNaN(parsed) && parsed > 0) setCurrentMonthBudget(parsed);
    setEditingBudget(false);
  };

  // Income trajectory — by month
  const incomeByMonth: Record<string, number> = {};
  transactions.filter(t => t.type === 'INCOME').forEach(t => {
    const ym = t.date.slice(0, 7);
    incomeByMonth[ym] = (incomeByMonth[ym] || 0) + t.amount;
  });
  const incomeMonths   = Object.keys(incomeByMonth).sort().slice(-6);
  const maxMonthIncome = Math.max(...incomeMonths.map(k => incomeByMonth[k]), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT PANEL: Core Cashflow Meters & Spend Visualizer (7 cols) */}
      <div className="lg:col-span-7 space-y-6">

        {/* ── BUDGET CHALLENGE ─────────────────────────────────────────────── */}
        <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 uppercase">// BUDGET CHALLENGE</h2>
              <p className="text-sm font-bold text-white mt-0.5">{currentMonthLabel}</p>
            </div>
            {!editingBudget && (
              <button
                onClick={() => { setBudgetInputStr(currentMonthBudget > 0 ? String(currentMonthBudget) : ''); setEditingBudget(true); }}
                className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 hover:text-orange-400 transition-colors uppercase tracking-widest"
              >
                <Pencil className="w-3 h-3" />
                {currentMonthBudget > 0 ? 'Chỉnh' : 'Đặt budget'}
              </button>
            )}
          </div>

          {editingBudget ? (
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                inputMode="numeric"
                value={budgetInputStr ? Number(budgetInputStr).toLocaleString('vi-VN') : ''}
                onChange={e => setBudgetInputStr(e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={e => { if (e.key === 'Enter') handleBudgetSave(); if (e.key === 'Escape') setEditingBudget(false); }}
                placeholder="Nhập budget tháng này (VND)"
                className="flex-1 bg-black/60 border border-white/10 focus:border-orange-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-neutral-200 font-mono transition-colors"
              />
              <button onClick={handleBudgetSave} className="p-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-black transition-colors"><Check className="w-3.5 h-3.5" /></button>
              <button onClick={() => setEditingBudget(false)} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : currentMonthBudget > 0 ? (
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">Đã chi: <span className="text-rose-400 font-bold">{formatVND(currentMonthSpend)}</span></span>
                <span className={`font-bold ${budgetRemaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {budgetRemaining >= 0 ? 'Còn lại' : 'Vượt'}: {formatVND(Math.abs(budgetRemaining))}
                </span>
              </div>
              <div className="w-full h-3 bg-zinc-950 rounded-lg p-[1px] border border-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-sm transition-all duration-500 ${budgetBarColor}`}
                  style={{ width: `${budgetUsedPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>{budgetUsedPct}% đã dùng</span>
                <span>Budget: {formatVND(currentMonthBudget)}</span>
              </div>
              {budgetUsedPct >= 90 && (
                <p className="text-[10px] font-mono text-rose-400 bg-rose-950/20 border border-rose-800/30 rounded-lg px-3 py-2">
                  ⚠ Gần chạm giới hạn! Cân nhắc kỹ các khoản chi còn lại trong tháng.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs font-mono text-zinc-600 py-2">
              Chưa có budget cho tháng này. Đặt giới hạn chi tiêu để nhận XP thưởng cuối tháng!
            </p>
          )}
        </div>

        {/* Cashflow Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Treasury Balance */}
          <div className="bg-zinc-900/45 border border-white/10 p-5 rounded-lg relative overflow-hidden">
            <Coins className="w-12 h-12 text-orange-600/10 absolute right-2 bottom-2" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] block">TREASURY BALANCE</span>
            <span className="text-2xl font-black font-mono text-orange-500 block mt-2">
              {formatVND(netBalance)}
            </span>
            <span className={`text-[10px] font-mono ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'} mt-1 block`}>
              {netBalance >= 0 ? "Surplus Cash flow safe" : "Danger: Deficit alert"}
            </span>
          </div>

          {/* Value Earned Inflow */}
          <div className="bg-zinc-900/45 border border-white/10 p-5 rounded-lg relative overflow-hidden">
            <TrendingUp className="w-12 h-12 text-emerald-800/10 absolute right-2 bottom-2" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] block">VALUE INFLOW</span>
            <span className="text-2xl font-bold font-mono text-emerald-400 block mt-2">
              +{formatVND(totalIncome)}
            </span>
            <span className="text-[10px] font-mono text-neutral-400 mt-1 block">Value created</span>
          </div>

          {/* Outflow / Upkeep */}
          <div className="bg-zinc-900/45 border border-white/10 p-5 rounded-lg relative overflow-hidden">
            <TrendingDown className="w-12 h-12 text-rose-800/10 absolute right-2 bottom-2" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] block">OUTFLOW UPKEEP</span>
            <span className="text-2xl font-bold font-mono text-rose-400 block mt-2">
              -{formatVND(totalExpense)}
            </span>
            <span className="text-[10px] font-mono text-neutral-400 mt-1 block">Energy spent</span>
          </div>
        </div>

        {/* Alert System: Leak Detector */}
        <div className={`p-5 rounded-lg border transition-all duration-300 ${
          leakPercentage >= 25
            ? 'bg-red-950/20 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
            : leakPercentage > 0
              ? 'bg-amber-950/10 border-amber-500/20'
              : 'bg-emerald-950/10 border-emerald-500/20'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded ${
              leakPercentage >= 25
                ? 'bg-red-500/15 text-red-500'
                : leakPercentage > 0
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'bg-emerald-500/10 text-emerald-500'
            }`}>
              {leakPercentage >= 25 ? (
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              ) : leakPercentage > 0 ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold font-mono tracking-wider uppercase text-neutral-100">
                  {leakLabel}
                </h4>
                <span className={`text-xs font-mono font-bold ${
                  leakPercentage >= 25 ? 'text-amber-400' : leakPercentage > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {leakPercentage}% discretionary
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{leakMessage}</p>
            </div>
          </div>
        </div>

        {/* Professional Custom Category Chart */}
        <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-6">
          <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 mb-6 uppercase">
            // TREASURY ENERGY ALLOCATION
          </h2>

          <div className="space-y-4">
            {categoryTotals.map((catObj) => {
              const widthPerc = Math.max(5, (catObj.total / maxCategoryTotal) * 100);
              const isLeak = catObj.name === 'Unnecessary Leaks';

              return (
                <div key={catObj.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${isLeak ? 'bg-red-500' : 'bg-orange-500'}`}></span>
                      {catObj.name === 'Unnecessary Leaks' ? 'Discretionary Spend (Tùy ý)' : catObj.name}
                    </span>
                    <span className="font-bold">{formatVND(catObj.total)}</span>
                  </div>

                  {/* Horizontal visual meter bar */}
                  <div className="w-full h-3 bg-zinc-950 rounded-lg p-[1px] border border-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-sm transition-all duration-500 ${
                        isLeak
                          ? 'bg-gradient-to-r from-red-800 to-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                          : 'bg-gradient-to-r from-orange-600 to-amber-500 shadow-[0_0_6px_rgba(234,88,12,0.3)]'
                      }`}
                      style={{ width: `${widthPerc}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── INCOME TRAJECTORY ────────────────────────────────────────────── */}
        {incomeMonths.length > 0 && (
          <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-6">
            <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 mb-1 uppercase">// INCOME TRAJECTORY</h2>
            <p className="text-[10px] font-mono text-zinc-600 mb-5">Thu nhập theo tháng (đơn vị: triệu VND)</p>
            <svg viewBox={`0 0 300 90`} className="w-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="incomeBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ea580c" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#c2410c" stopOpacity="0.5" />
                </linearGradient>
              </defs>
              {(() => {
                const n      = incomeMonths.length;
                const BAR_W  = Math.min(38, 260 / (n * 1.8));
                const GAP    = (300 - BAR_W * n) / (n + 1);
                const MAX_H  = 62;

                return incomeMonths.map((ym, i) => {
                  const val   = incomeByMonth[ym];
                  const barH  = Math.max(4, (val / maxMonthIncome) * MAX_H);
                  const x     = GAP + i * (BAR_W + GAP);
                  const y     = MAX_H - barH;
                  const [, mo] = ym.split('-');
                  const isLatest = i === n - 1;
                  const prev     = i > 0 ? incomeByMonth[incomeMonths[i - 1]] : null;
                  const trend    = prev !== null ? (val > prev ? '↑' : val < prev ? '↓' : '→') : null;

                  return (
                    <g key={ym}>
                      <rect x={x} y={y} width={BAR_W} height={barH} rx="3"
                        fill={isLatest ? '#ea580c' : 'url(#incomeBar)'} opacity={isLatest ? 1 : 0.65} />
                      {/* Value label */}
                      <text x={x + BAR_W / 2} y={y - 5} textAnchor="middle"
                        fill={isLatest ? '#fdba74' : '#71717a'} fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                        {(val / 1_000_000).toFixed(1)}M
                      </text>
                      {/* Month label */}
                      <text x={x + BAR_W / 2} y={78} textAnchor="middle"
                        fill={isLatest ? '#ea580c' : '#52525b'} fontSize="9" fontFamily="monospace">
                        T{parseInt(mo)}
                      </text>
                      {/* Trend arrow */}
                      {trend && trend !== '→' && (
                        <text x={x + BAR_W / 2} y={88} textAnchor="middle"
                          fill={trend === '↑' ? '#34d399' : '#f87171'} fontSize="8" fontFamily="monospace">
                          {trend}
                        </text>
                      )}
                    </g>
                  );
                });
              })()}
            </svg>
          </div>
        )}

        {/* Quick Transaction Adding Form */}
        <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-6">
          <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 mb-4 uppercase">
            // LOG NEW CASH FLOW
          </h2>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* IO Choice */}
            <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-lg border border-white/5">
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`py-2 rounded-lg text-xs font-mono font-medium transition-colors ${
                  type === 'EXPENSE'
                    ? 'bg-rose-950/30 text-rose-400 border border-rose-800/60'
                    : 'text-zinc-500 hover:text-neutral-300'
                }`}
              >
                OUTFLOW (Chi tiêu)
              </button>

              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`py-2 rounded-lg text-xs font-mono font-medium transition-colors ${
                  type === 'INCOME'
                    ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-800/40'
                    : 'text-zinc-500 hover:text-neutral-300'
                }`}
              >
                INFLOW (Thu nhập)
              </button>
            </div>

            {/* Title Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block">Transaction Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={type === 'EXPENSE' ? "Ví dụ: Protein Whey 2kg" : "Ví dụ: Lương lập trình freelance"}
                className="w-full bg-black/60 border border-white/5 focus:border-orange-500 focus:outline-none rounded-lg px-4 py-3 text-sm text-neutral-200 transition-colors"
                required
              />
            </div>

            {/* Amount / Category Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block">Amount (VND)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountStr ? Number(amountStr).toLocaleString('vi-VN') : ''}
                  onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="350.000"
                  className="w-full bg-black/60 border border-white/5 focus:border-orange-500 focus:outline-none rounded-lg px-4 py-3 text-sm text-neutral-100 font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block">Category</label>
                {type === 'EXPENSE' ? (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-black/60 border border-white/5 focus:border-orange-500 focus:outline-none rounded-lg px-3 py-3 text-xs text-neutral-300 font-mono"
                  >
                    <option value="Gym & Nutrition">Gym & Dinh Dưỡng</option>
                    <option value="Work & Gear">Công cụ & Gear</option>
                    <option value="Books & Growth">Sách x Phát Triển</option>
                    <option value="Rent & Utilities">Shelter & Sinh hoạt</option>
                    <option value="Unnecessary Leaks">Discretionary (Tùy ý)</option>
                  </select>
                ) : (
                  <select
                    value="Income Source"
                    disabled
                    className="w-full bg-black/30 border border-white/5 rounded-lg px-3 py-3 text-xs text-neutral-500 font-mono"
                  >
                    <option value="Income Source">Nguồn Thu Nhập</option>
                  </select>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 border border-orange-600/40 rounded-lg text-black font-black italic uppercase transition-all shadow-md shadow-orange-950/20"
            >
              RECORD TRANSACTION (+10 EXP)
            </button>
          </form>
        </div>

        {/* Ledger logs */}
        <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-6">
          <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 mb-4 uppercase">
            // SECURE TRANSACTION LEDGER
          </h2>

          {/* ── Budget Progress Bar (current month only) ─────────────────────── */}
          {isCurrentMonth && currentMonthBudget > 0 && (
            <div className="mb-5 p-4 bg-black/30 border border-white/5 rounded-xl space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">
                  Đã chi: <span className="text-rose-400 font-bold">{currentMonthSpend.toLocaleString('vi-VN')} ₫</span>
                </span>
                <span className={`font-bold ${budgetRemaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {budgetRemaining >= 0 ? `Còn ${(100 - budgetUsedPct)}%` : 'Vượt ngân sách'}: {Math.abs(budgetRemaining).toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div className="w-full h-2.5 bg-zinc-950 rounded-lg overflow-hidden border border-white/5">
                <div
                  className={`h-full rounded-sm transition-all duration-500 ${budgetBarColor}`}
                  style={{ width: `${budgetUsedPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>{budgetUsedPct}% đã dùng</span>
                <span>Budget: {currentMonthBudget.toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>
          )}

          {/* ── Monthly Filter Tabs ───────────────────────────────────────────── */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {last4Months.map(ym => {
              const label = new Date(ym + '-01').toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
              const isActive = ym === selectedMonth;
              return (
                <button
                  key={ym}
                  onClick={() => setSelectedMonth(ym)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-colors ${
                    isActive
                      ? 'bg-orange-600 text-black font-black'
                      : 'bg-zinc-900 border border-white/5 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* ── Category Spending Breakdown ───────────────────────────────────── */}
          {categoryBreakdown.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {categoryBreakdown.map(c => {
                const pct = totalExpense > 0 ? Math.round((c.total / totalExpense) * 100) : 0;
                const isLeak = c.name === 'Unnecessary Leaks';
                return (
                  <div
                    key={c.name}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border ${
                      isLeak
                        ? 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                        : 'bg-zinc-900/80 border-white/5 text-zinc-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isLeak ? 'bg-rose-500' : 'bg-orange-500'}`} />
                    <span className="truncate max-w-[100px]">{c.name}</span>
                    <span className="font-bold text-white">{c.total.toLocaleString('vi-VN')} ₫</span>
                    <span className="text-zinc-500">({pct}%)</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-xs font-mono">
                KHÔNG CÓ GIAO DỊCH NÀO TRONG THÁNG NÀY.
              </div>
            ) : (
              [...filteredTransactions].reverse().map((t) => (
                <div
                  key={t.id}
                  className="bg-black/40 border border-neutral-800/60 p-3 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase font-mono tracking-widest block text-neutral-500">
                      {t.category} — {t.date}
                    </span>
                    <span className="text-xs font-bold text-neutral-200 truncate block mt-0.5">
                      {t.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-xs font-bold ${
                      t.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {t.type === 'INCOME' ? '+' : '-'}{formatVND(t.amount)}
                    </span>

                    <button
                      onClick={() => handleDeleteClick(t.id)}
                      className="p-1 rounded hover:bg-neutral-900 text-neutral-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
