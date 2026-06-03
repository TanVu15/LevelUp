import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Trash2,
  Coins,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Transaction, ExpenseCategory } from '../types';
import { playClickSound, playQuestSuccessSound } from '../utils/audio';

interface TreasuryBoardProps {
  transactions: Transaction[];
  addTransaction: (title: string, amount: number, type: 'INCOME' | 'EXPENSE', category: ExpenseCategory | 'Income Source') => void;
  deleteTransaction: (id: string) => void;
  soundEnabled: boolean;
  addXP: (amount: number) => void;
}

export default function TreasuryBoard({
  transactions,
  addTransaction,
  deleteTransaction,
  soundEnabled,
  addXP
}: TreasuryBoardProps) {
  // Budget Form inputs
  const [title, setTitle] = React.useState('');
  const [amountStr, setAmountStr] = React.useState('');
  const [type, setType] = React.useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [category, setCategory] = React.useState<ExpenseCategory | 'Income Source'>('Gym & Nutrition');

  // Update default category when type switches
  React.useEffect(() => {
    if (type === 'INCOME') {
      setCategory('Income Source');
    } else {
      setCategory('Gym & Nutrition');
    }
  }, [type]);

  // Aggregate metrics
  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Leak calculations
  const totalLeaks = transactions
    .filter(t => t.type === 'EXPENSE' && t.category === 'Unnecessary Leaks')
    .reduce((sum, t) => sum + t.amount, 0);

  const leakPercentage = totalExpense > 0 ? Math.round((totalLeaks / totalExpense) * 100) : 0;

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

    // Give XP bonus for tracking financial status!
    addXP(10);

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
    const total = transactions
      .filter(t => t.type === 'EXPENSE' && t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0);
    return { name: cat, total };
  });

  const maxCategoryTotal = Math.max(...categoryTotals.map(c => c.total), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT PANEL: Core Cashflow Meters & Spend Visualizer (7 cols) */}
      <div className="lg:col-span-7 space-y-6">

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
                  {leakPercentage >= 25 ? "WARNING: LEAK ALARM LEVEL RED" : leakPercentage > 0 ? "LEAK ANALYSIS WARNING" : "TREASURY LEAK STATUS SECURE"}
                </h4>
                <span className={`text-xs font-mono font-bold ${
                  leakPercentage >= 25 ? 'text-red-400' : leakPercentage > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {leakPercentage}% LEAKS
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                {leakPercentage >= 25 ? (
                  "CẢNH BÁO: Bro đang đốt quá nhiều ngân sách vào các khoản chi phí không cần thiết! Lỗ rò rỉ này sẽ hủy hoại con đường tự do tài chính. Cam kết cắt giảm ngay lập tức!"
                ) : leakPercentage > 0 ? (
                  "Chỉ số rò rỉ đang nằm ở mức kiểm soát trung bình. Cố gắng dọn dẹp các chi phí vô bổ để tối ưu tài nguyên rèn luyện."
                ) : (
                  "Hệ thống thông báo hoàn hảo: Không phát hiện lỗ rò rỉ vô ích nào! Bro đang bảo toàn năng lượng tài chính cực tốt."
                )}
              </p>
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
                      {catObj.name === 'Unnecessary Leaks' ? 'Unnecessary Leaks (Lỗ rò rỉ ❌)' : catObj.name}
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
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
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
                    <option value="Unnecessary Leaks">Rò Rỉ Vô Bổ (Leaks)</option>
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

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-xs font-mono">
                CHƯA GHI NHẬN SỔ SÁCH NÀO. HÃY THIẾT LẬP DÒNG TIỀN ĐẦU TIÊN CỦA BẠN.
              </div>
            ) : (
              [...transactions].reverse().map((t) => (
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
