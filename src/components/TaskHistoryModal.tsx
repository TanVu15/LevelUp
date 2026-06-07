import React from 'react';
import { X, Check, History, Archive } from 'lucide-react';
import { Task, TaskTier } from '../types';

interface TaskHistoryModalProps {
  archivedTasks: Task[];
  onClose: () => void;
}

const TIER_META: Record<TaskTier, { label: string; cls: string }> = {
  BOSS:    { label: 'BOSS',    cls: 'text-red-400 border-red-800/40 bg-red-950/40' },
  DUNGEON: { label: 'DUNGEON', cls: 'text-orange-500 border-orange-600/30 bg-orange-950/40' },
  MANA:    { label: 'MANA',    cls: 'text-emerald-400 border-emerald-600/30 bg-emerald-950/40' },
};

// Day key dùng để nhóm — ưu tiên ngày hoàn thành, fallback ngày tạo
const dayOf = (t: Task): string => t.completedAt || t.createdAt || '';

export default function TaskHistoryModal({ archivedTasks, onClose }: TaskHistoryModalProps) {
  // Nhóm theo ngày, mới nhất trước
  const grouped = React.useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of archivedTasks) {
      const key = dayOf(t);
      const arr = map.get(key);
      if (arr) arr.push(t); else map.set(key, [t]);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [archivedTasks]);

  const doneCount = archivedTasks.filter(t => t.completed).length;

  const fmtDate = (iso: string): string => {
    if (!iso) return 'Không rõ ngày';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[80vh] flex flex-col bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl shadow-black/60"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-orange-500" />
            <div>
              <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 uppercase">// LỊCH SỬ NHIỆM VỤ</h2>
              <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                {archivedTasks.length} task đã lưu · {doneCount} hoàn thành
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-zinc-900 text-zinc-500 hover:text-white transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-4 space-y-6">
          {grouped.length === 0 ? (
            <div className="text-center py-12 text-zinc-600">
              <Archive className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-xs font-mono">Chưa có nhiệm vụ nào được lưu trữ.</p>
              <p className="text-[10px] font-mono mt-1 text-zinc-700">Task ngày cũ sẽ tự dọn vào đây khi sang ngày mới.</p>
            </div>
          ) : (
            grouped.map(([date, items]) => (
              <div key={date} className="space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 border-b border-white/5 pb-1">
                  {fmtDate(date)}
                </div>
                {items.map(task => {
                  const meta = TIER_META[task.tier];
                  return (
                    <div key={task.id} className="flex items-center gap-3 py-1.5">
                      <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        task.completed ? 'bg-emerald-600/80 border-emerald-500 text-black' : 'border-white/10 bg-zinc-900'
                      }`}>
                        {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                      <span className={`text-sm flex-1 min-w-0 truncate ${task.completed ? 'text-zinc-400 line-through' : 'text-zinc-300'}`}>
                        {task.title}
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
