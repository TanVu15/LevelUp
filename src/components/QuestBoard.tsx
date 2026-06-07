import React from 'react';
import {
  Check, Plus, Trash2, Sparkles, Play, Square, Zap, Award,
  CheckSquare, SquareTerminal, Dumbbell, DollarSign, BookOpen,
  Utensils, Moon, Map, Pencil, History
} from 'lucide-react';
import { Task, TaskTier, WhyCard, WhyCardType } from '../types';
import { playClickSound, playQuestSuccessSound, playTimerEndSound } from '../utils/audio';
import { Quote, QUOTES } from '../data/quotes';
import TaskHistoryModal from './TaskHistoryModal';
import { getTodayDateString, addDays } from '../utils/date';
import { DAILY_TIER_CAPS } from '../utils/xp';

interface QuestBoardProps {
  tasks: Task[];
  archivedTasks: Task[];
  addTask: (title: string, tier: TaskTier, dueDate?: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  dailyRoutines: Record<string, boolean>;
  toggleRoutine: (routineId: string) => void;
  disciplineMode: boolean;
  soundEnabled: boolean;
  addXP: (amount: number) => void;
  whyCards: WhyCard[];
  setWhyCards: (cards: WhyCard[]) => void;
  routineLabels: Record<string, string>;
  setRoutineLabel: (id: string, label: string) => void;
  routineDescs: Record<string, string>;
  setRoutineDesc: (id: string, desc: string) => void;
  taskTierCountsToday: Partial<Record<TaskTier, number>>;
  dailyChallenge: { id: string; title: string; desc: string; xp: number };
  isChallengeConditionMet: boolean;
  isChallengeAlreadyClaimed: boolean;
  claimDailyChallenge: () => void;
}

const WHY_TYPE_CONFIG: Record<WhyCardType, { emoji: string; label: string; textColor: string; bgCls: string; borderCls: string; btnActiveCls: string }> = {
  PAIN:    { emoji: '💔', label: 'Nỗi đau',  textColor: 'text-red-400',    bgCls: 'bg-red-950/20',    borderCls: 'border-red-800/30',    btnActiveCls: 'bg-red-950/30 border-red-700/50 text-red-400' },
  FAILURE: { emoji: '❌', label: 'Thất bại', textColor: 'text-amber-400',  bgCls: 'bg-amber-950/20',  borderCls: 'border-amber-800/30',  btnActiveCls: 'bg-amber-950/30 border-amber-700/50 text-amber-400' },
  GOAL:    { emoji: '🔥', label: 'Mục tiêu', textColor: 'text-orange-400', bgCls: 'bg-orange-950/20', borderCls: 'border-orange-800/30', btnActiveCls: 'bg-orange-950/30 border-orange-600/50 text-orange-400' },
};

const DEFAULT_ROUTINES = [
  { id: 'eat',   defaultLabel: 'EAT CLEAN',   desc: 'Ăn đủ protein + rau củ, uống đủ 2L nước',              icon: Utensils,   color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
  { id: 'pray',  defaultLabel: 'CLEAR MIND',  desc: '10 phút thiền / nhật ký / viết 3 mục tiêu hôm nay',    icon: Map,        color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  { id: 'train', defaultLabel: 'MOVE BODY',   desc: '30 phút vận động: gym, chạy, đạp xe, yoga...',         icon: Dumbbell,   color: 'text-red-500 bg-red-500/10 border-red-500/30' },
  { id: 'study', defaultLabel: 'SKILL UP',    desc: 'Đọc 20 trang sách hoặc học kỹ năng mới 30 phút',       icon: BookOpen,   color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
  { id: 'work',  defaultLabel: 'DEEP WORK',   desc: '2h tập trung sâu: tắt thông báo, một việc duy nhất',   icon: DollarSign, color: 'text-violet-400 bg-violet-500/10 border-violet-500/30' },
  { id: 'sleep', defaultLabel: 'SLEEP WELL',    desc: 'Ngủ đủ 7-8 tiếng x Chặn ánh sáng xanh', icon: Moon,     color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
];

export default function QuestBoard({
  tasks, archivedTasks, addTask, toggleTask, deleteTask,
  dailyRoutines, toggleRoutine,
  disciplineMode, soundEnabled, addXP,
  whyCards, setWhyCards,
  routineLabels, setRoutineLabel,
  routineDescs, setRoutineDesc,
  taskTierCountsToday,
  dailyChallenge, isChallengeConditionMet, isChallengeAlreadyClaimed, claimDailyChallenge,
}: QuestBoardProps) {
  const [newTaskTitle, setNewTaskTitle] = React.useState('');
  const [newTaskTier, setNewTaskTier] = React.useState<TaskTier>('DUNGEON');
  const [newDueDate, setNewDueDate] = React.useState(() => getTodayDateString());
  const [editingLabelId, setEditingLabelId] = React.useState<string | null>(null);
  const [tempLabel, setTempLabel] = React.useState('');
  const [tempDesc, setTempDesc] = React.useState('');
  const [showHistory, setShowHistory] = React.useState(false);

  // WHY card editing
  const [editingSlot, setEditingSlot] = React.useState<number | null>(null);
  const [editForm, setEditForm] = React.useState<{ type: WhyCardType; title: string; story: string }>({
    type: 'PAIN', title: '', story: ''
  });

  // Focus Timer
  const [timerMinutes, setTimerMinutes] = React.useState(25);
  const [timerSeconds, setTimerSeconds] = React.useState(0);
  const [isTimerRunning, setIsTimerRunning] = React.useState(false);
  const [activePreset, setActivePreset] = React.useState<number>(25);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const [currentQuote, setCurrentQuote] = React.useState<Quote>(QUOTES[0]);

  const rotateQuote = React.useCallback(() => {
    const mode = disciplineMode ? 'discipline' : 'motivation';
    const filtered = QUOTES.filter(q => q.mode === mode);
    const random = filtered[Math.floor(Math.random() * filtered.length)];
    if (random) setCurrentQuote(random);
  }, [disciplineMode]);

  React.useEffect(() => { rotateQuote(); }, [disciplineMode, rotateQuote]);

  React.useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        if (timerSeconds > 0) {
          setTimerSeconds(prev => prev - 1);
        } else if (timerMinutes > 0) {
          setTimerMinutes(prev => prev - 1);
          setTimerSeconds(59);
        } else {
          if (soundEnabled) playTimerEndSound();
          setIsTimerRunning(false);
          if (timerRef.current) clearInterval(timerRef.current);
          addXP(25);
          setTimerMinutes(activePreset);
          setTimerSeconds(0);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerRunning, timerMinutes, timerSeconds, activePreset, soundEnabled, addXP]);

  const handleStartTimer = () => { if (soundEnabled) playClickSound(); setIsTimerRunning(true); rotateQuote(); };
  const handleStopTimer  = () => { if (soundEnabled) playClickSound(); setIsTimerRunning(false); };
  const handleResetTimer = (minutes: number) => {
    if (soundEnabled) playClickSound();
    setIsTimerRunning(false); setActivePreset(minutes);
    setTimerMinutes(minutes); setTimerSeconds(0);
  };

  const completedRoutinesCount = DEFAULT_ROUTINES.filter(r => dailyRoutines[r.id]).length;
  const hasCompletedAllRoutines = completedRoutinesCount === DEFAULT_ROUTINES.length;

  const getTodayStr    = () => getTodayDateString();
  const getTomorrowStr = () => addDays(getTodayDateString(), 1);
  const getEndOfWeekStr = () => {
    const day = new Date().getDay(); // 0=Sun, 1=Mon...5=Fri, 6=Sat
    // Target: Friday of current week. If Sat/Sun, use coming Friday.
    const daysToFriday = day === 0 ? 5 : day <= 5 ? 5 - day : 6;
    return addDays(getTodayDateString(), daysToFriday);
  };
  const getTaskBadge = (task: Task): { label: string; cls: string } | null => {
    const today = getTodayStr();
    if (task.dueDate) {
      if (task.dueDate < today) return { label: 'OVERDUE', cls: 'bg-red-950/60 border-red-600/40 text-red-400' };
      if (task.dueDate === today) return { label: 'DUE TODAY', cls: 'bg-orange-950/60 border-orange-500/40 text-orange-400' };
      const diff = Math.ceil((new Date(task.dueDate).getTime() - new Date(today).getTime()) / 86400000);
      if (diff === 1) return { label: 'DUE TOMORROW', cls: 'bg-amber-950/50 border-amber-600/30 text-amber-400' };
      return null;
    }
    return null;
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    if (soundEnabled) playClickSound();
    addTask(newTaskTitle.trim(), newTaskTier, newDueDate || undefined);
    setNewTaskTitle('');
    setNewDueDate('');
  };

  const handleTaskToggle = (id: string, currentlyCompleted: boolean) => {
    if (soundEnabled) {
      if (!currentlyCompleted) playQuestSuccessSound(); else playClickSound();
    }
    toggleTask(id);
  };

  const startLabelEdit = (id: string, currentLabel: string, currentDesc: string) => {
    setEditingLabelId(id);
    setTempLabel(currentLabel);
    setTempDesc(currentDesc);
  };
  const saveLabelEdit = () => {
    if (editingLabelId) {
      if (tempLabel.trim()) setRoutineLabel(editingLabelId, tempLabel.trim().toUpperCase().slice(0, 20));
      setRoutineDesc(editingLabelId, tempDesc.trim());
    }
    setEditingLabelId(null);
  };
  const cancelLabelEdit = () => setEditingLabelId(null);

  const openWhyEdit = (slot: number) => {
    const card = whyCards[slot];
    setEditingSlot(slot);
    setEditForm(card ? { type: card.type, title: card.title, story: card.story } : { type: 'PAIN', title: '', story: '' });
  };

  const saveWhyCard = () => {
    if (!editForm.title.trim() || editingSlot === null) { setEditingSlot(null); return; }
    const existing = whyCards[editingSlot];
    const newCard: WhyCard = {
      id: existing?.id ?? `why_${Date.now()}`,
      type: editForm.type,
      title: editForm.title.trim(),
      story: editForm.story.trim(),
    };
    const updated = [...whyCards];
    updated[editingSlot] = newCard;
    setWhyCards(updated);
    setEditingSlot(null);
  };

  const deleteWhyCard = (slot: number) => {
    setWhyCards(whyCards.filter((_, i) => i !== slot));
    setEditingSlot(null);
  };

  // REQ-04: tier hiện cả việc chưa làm lẫn việc đã tick hôm nay (đã tick dồn xuống cuối,
  // gạch ngang). Qua ngày mới rollover mới archive (REQ-01). Completed trong `tasks` đều là
  // của hôm nay (việc xong ngày cũ đã bị archive).
  const getTasksByTier = (tier: TaskTier) => {
    const inTier = tasks.filter(t => t.tier === tier);
    return [...inTier.filter(t => !t.completed), ...inTier.filter(t => t.completed)];
  };
  const completedToday = tasks.filter(t => t.completed && (t.completedAt === getTodayStr() || t.claimedAt === getTodayStr()));

  const tierConfig = {
    BOSS:    { label: 'BOSS RAID (Mục tiêu cực lớn / Sức ép nặng nhất)', xp: 50,  color: 'text-red-400', border: 'border-b border-red-950/40', cardActive: 'bg-gradient-to-r from-red-950/20 to-black/40 border-red-900/30 hover:border-red-800', checkActive: 'bg-red-600 border-red-500', checkIdle: 'border-red-900', icon: Zap, iconColor: 'text-red-500 animate-pulse', xpBg: 'bg-red-950/60 border-red-800/40 text-red-400' },
    DUNGEON: { label: 'DUNGEON GATE (Nhiệm vụ chính quy / Trong ngày)',   xp: 20,  color: 'text-orange-500', border: 'border-b border-orange-950/20', cardActive: 'bg-black/40 border-white/5 hover:border-orange-600/30', checkActive: 'bg-orange-600 border-orange-500', checkIdle: 'border-white/10', icon: CheckSquare, iconColor: 'text-orange-500', xpBg: 'bg-orange-950/40 border-orange-600/30 text-orange-500' },
    MANA:    { label: 'MANA FARM (Việc vặt / Thói quen hỗ trợ)',          xp: 10,  color: 'text-emerald-400', border: 'border-b border-emerald-950/20', cardActive: 'bg-black/40 border-white/5 hover:border-emerald-600/30', checkActive: 'bg-emerald-600 border-emerald-500', checkIdle: 'border-white/10', icon: SquareTerminal, iconColor: 'text-emerald-400', xpBg: 'bg-emerald-950/40 border-emerald-600/30 text-emerald-400' },
  } as const;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT COLUMN */}
      <div className="lg:col-span-5 space-y-8">

        {/* Daily Protocol */}
        <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Award className="w-24 h-24 text-orange-500" />
          </div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 uppercase">// SYSTEM DAILY PROTOCOL</h2>
              <p className="text-xl font-bold font-sans tracking-tight text-white mt-1">Đường Ray Kỷ Luật</p>
            </div>
            <span className="text-xs font-mono px-3 py-1 bg-black/60 text-orange-500 border border-orange-600/30 rounded-full">
              {completedRoutinesCount} / 6 CLEARED
            </span>
          </div>
          <p className="text-xs text-neutral-400 mb-6 font-mono">
            {disciplineMode
              ? "Kẻ lười biếng phó mặc cho tâm trạng. Người kỷ luật lặp lại thói quen rèn luyện vô điều kiện mỗi ngày."
              : "Hoàn thành 6 thói quen cốt lõi của đàn anh bản lĩnh."}
          </p>

          <div className="space-y-3">
            {DEFAULT_ROUTINES.map((routine) => {
              const isDone = !!dailyRoutines[routine.id];
              const Icon = routine.icon;
              const label = routineLabels[routine.id] ?? routine.defaultLabel;
              const isEditingThis = editingLabelId === routine.id;

              const desc = routineDescs[routine.id] || routine.desc;

              return (
                <div
                  key={routine.id}
                  className={`w-full rounded-lg border transition-all duration-300 ${
                    isEditingThis
                      ? 'bg-zinc-900/60 border-orange-600/20 p-4'
                      : isDone
                        ? 'bg-orange-950/20 border-orange-600/30 text-neutral-200 p-4'
                        : 'bg-black/40 border-white/5 hover:border-white/10 text-neutral-400 p-4'
                  }`}
                >
                  {isEditingThis ? (
                    /* ── Edit mode ── */
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg border flex-shrink-0 mt-1 ${routine.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div>
                          <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 block mb-1">Tên thói quen</label>
                          <input
                            autoFocus
                            value={tempLabel}
                            onChange={e => setTempLabel(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveLabelEdit(); if (e.key === 'Escape') cancelLabelEdit(); }}
                            maxLength={20}
                            className="w-full text-xs font-bold font-mono tracking-widest uppercase bg-black/60 border border-orange-500/60 focus:border-orange-500 rounded px-3 py-1.5 text-orange-400 focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 block mb-1">Mô tả ngắn</label>
                          <input
                            value={tempDesc}
                            onChange={e => setTempDesc(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Escape') cancelLabelEdit(); }}
                            maxLength={60}
                            placeholder={routine.desc}
                            className="w-full text-[11px] font-sans bg-black/60 border border-white/10 focus:border-orange-500/50 rounded px-3 py-1.5 text-neutral-300 placeholder:text-zinc-600 focus:outline-none transition-colors"
                          />
                        </div>
                        <div className="flex gap-2 pt-0.5">
                          <button
                            onClick={saveLabelEdit}
                            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-black text-[10px] font-black font-mono rounded transition-colors"
                          >
                            ✓ LƯU
                          </button>
                          <button
                            onClick={cancelLabelEdit}
                            className="px-3 py-1.5 bg-zinc-900 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white text-[10px] font-mono rounded transition-colors"
                          >
                            HỦY
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ── Normal mode ── */
                    <div className="flex items-center justify-between">
                      <button
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        onClick={() => toggleRoutine(routine.id)}
                      >
                        <div className={`p-2 rounded-lg border flex-shrink-0 ${routine.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className={`text-xs font-bold font-mono tracking-widest uppercase ${isDone ? 'line-through text-orange-400 opacity-60' : 'text-neutral-100'}`}>
                            {label}
                          </div>
                          <div className="text-[10px] text-neutral-500 font-sans mt-0.5">{desc}</div>
                        </div>
                      </button>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <button
                          onClick={() => startLabelEdit(routine.id, label, desc)}
                          className="p-1 text-zinc-600 hover:text-orange-400 transition-colors"
                          title="Chỉnh sửa tên & mô tả"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => toggleRoutine(routine.id)}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                            isDone ? 'bg-orange-600 border-orange-500 text-black' : 'border-white/10 bg-zinc-900'
                          }`}
                        >
                          {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {hasCompletedAllRoutines && (
            <div className="mt-4 p-3 rounded-lg bg-orange-900/10 border border-orange-600/30 text-center animate-pulse">
              <span className="text-xs font-mono font-bold text-orange-400 flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-500" /> SYSTEM OVERDRIVE ACTIVE — +50 EXP AWARDED!
              </span>
            </div>
          )}
        </div>

        {/* Focus Timer */}
        <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-6 relative overflow-hidden text-center">
          <span className="text-[9px] uppercase font-mono tracking-widest text-[#ea580c] bg-orange-950/40 border border-orange-900/20 px-2.5 py-1 rounded-full absolute top-4 left-4">
            CHRONO ARENA
          </span>

          <div className="py-8">
            <div className="text-6xl font-black font-mono tracking-tight text-white mb-2 italic">
              {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
            </div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              {isTimerRunning ? "Deep execution phase... No distractions" : "CHOOSE YOUR RAID INTENSITY"}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            {([25, 45, 60] as const).map(min => (
              <button
                key={min}
                onClick={() => handleResetTimer(min)}
                disabled={isTimerRunning}
                className={`py-2 rounded-lg text-xs font-mono transition-all ${
                  activePreset === min
                    ? 'bg-orange-950/30 border border-orange-600/30 text-orange-500'
                    : 'bg-zinc-950/60 border border-white/5 hover:border-white/10 text-zinc-400'
                }`}
              >
                {min}m {min === 25 ? '(Raid Setup)' : min === 45 ? '(Deep Dungeon)' : '(Absolute Grind)'}
              </button>
            ))}
          </div>

          <div className="flex gap-3 justify-center mb-6">
            {isTimerRunning ? (
              <button
                onClick={handleStopTimer}
                className="w-1/2 py-3 bg-red-950/30 hover:bg-red-900/30 border border-red-800/80 rounded-lg text-red-300 font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2"
              >
                <Square className="w-4 h-4 fill-current" /> PAUSE FOCUS
              </button>
            ) : (
              <button
                onClick={handleStartTimer}
                className="w-1/2 py-3 bg-orange-600 hover:bg-orange-500 text-black font-black italic text-sm tracking-widest uppercase rounded-lg shadow-lg shadow-orange-950/40 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" /> AWAKEN
              </button>
            )}
            <button
              onClick={() => handleResetTimer(activePreset)}
              className="py-3 px-4 bg-zinc-950 border border-white/5 hover:border-white/10 text-zinc-300 rounded-lg font-mono text-xs uppercase"
            >Reset</button>
          </div>

          <div className="p-3 bg-black/40 border border-white/5 rounded-lg">
            <p className="text-xs italic text-zinc-300 leading-relaxed font-sans">&ldquo;{currentQuote.text}&rdquo;</p>
            <p className="text-[9px] uppercase tracking-widest text-[#ea580c] font-mono mt-1 w-full text-right">— {currentQuote.author}</p>
          </div>

          {/* WHY Panel */}
          <div className="border border-white/10 rounded-xl bg-black/25 p-5 text-left mt-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-orange-500 flex items-center gap-1.5 font-bold">
                <Zap className="w-3.5 h-3.5 text-orange-500" /> MY WHY — LÝ DO CỦA TÔI
              </span>
              <span className="text-[8px] font-mono border border-white/10 px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 select-none">MOTIVATION CORE</span>
            </div>

            <div className="space-y-2.5">
              {[0, 1, 2].map(i => {
                const card = whyCards[i];
                const isEditingThis = editingSlot === i;

                // Edit / Add form
                if (isEditingThis) {
                  const canSave = editForm.title.trim().length >= 2;
                  return (
                    <div key={i} className="rounded-lg border border-orange-600/30 bg-orange-950/10 p-4 space-y-3">
                      {/* Type selector */}
                      <div className="flex gap-2">
                        {(['PAIN', 'FAILURE', 'GOAL'] as WhyCardType[]).map(t => {
                          const cfg = WHY_TYPE_CONFIG[t];
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setEditForm(f => ({ ...f, type: t }))}
                              className={`flex-1 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all ${
                                editForm.type === t
                                  ? cfg.btnActiveCls
                                  : 'bg-zinc-950 border-white/5 text-zinc-600 hover:text-zinc-400 hover:border-white/10'
                              }`}
                            >
                              {cfg.emoji} {cfg.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Title */}
                      <div>
                        <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 block mb-1">Tiêu đề *</label>
                        <input
                          autoFocus
                          type="text"
                          value={editForm.title}
                          onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter' && canSave) saveWhyCard(); if (e.key === 'Escape') setEditingSlot(null); }}
                          maxLength={60}
                          placeholder="Ví dụ: Bị từ chối phỏng vấn vì thiếu năng lực"
                          className="w-full bg-black/60 border border-white/10 focus:border-orange-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-neutral-200 transition-colors"
                        />
                      </div>

                      {/* Story */}
                      <div>
                        <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 block mb-1">Chi tiết (tuỳ chọn)</label>
                        <textarea
                          value={editForm.story}
                          onChange={e => setEditForm(f => ({ ...f, story: e.target.value }))}
                          maxLength={150}
                          rows={2}
                          placeholder="Điều này ảnh hưởng đến bạn như thế nào..."
                          className="w-full bg-black/60 border border-white/10 focus:border-orange-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-neutral-300 transition-colors resize-none"
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div>
                          {card && (
                            <button
                              type="button"
                              onClick={() => deleteWhyCard(i)}
                              className="text-[10px] font-mono text-red-500 hover:text-red-400 transition-colors"
                            >
                              🗑 Xóa
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingSlot(null)}
                            className="px-3 py-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white font-mono text-[10px] uppercase transition-colors"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            disabled={!canSave}
                            onClick={saveWhyCard}
                            className={`px-4 py-1.5 rounded-lg font-bold font-mono text-[10px] uppercase transition-all ${
                              canSave
                                ? 'bg-orange-600 text-black hover:bg-orange-500'
                                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                            }`}
                          >
                            ✓ Lưu
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Filled card
                if (card) {
                  const cfg = WHY_TYPE_CONFIG[card.type];
                  return (
                    <div key={card.id} className={`p-3.5 rounded-lg border ${cfg.bgCls} ${cfg.borderCls} group relative`}>
                      <div className="flex items-start gap-2.5">
                        <span className="text-lg leading-none flex-shrink-0 mt-0.5">{cfg.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <span className={`text-[9px] font-mono font-bold uppercase block ${cfg.textColor}`}>{cfg.label}</span>
                          <p className="text-sm font-bold text-white mt-0.5 leading-snug">{card.title}</p>
                          {card.story && <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed italic">{card.story}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => openWhyEdit(i)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-orange-400 transition-all flex-shrink-0"
                          title="Chỉnh sửa"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                }

                // Empty slot — only show Add button for the next available position
                if (i === whyCards.length) {
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => openWhyEdit(i)}
                      className="w-full py-3 rounded-lg border border-dashed border-white/10 text-zinc-600 text-[10px] font-mono hover:border-orange-600/30 hover:text-orange-500 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3 h-3" /> Thêm lý do #{i + 1}
                    </button>
                  );
                }

                return null;
              })}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="lg:col-span-7 space-y-8">

        {/* Daily Challenge */}
        <div className="bg-zinc-900/45 border border-orange-600/20 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-5 pointer-events-none select-none">
            <Zap className="w-24 h-24 text-orange-500" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 uppercase">// Daily Challenge</h2>
            <span className="text-[9px] font-mono text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded border border-white/5">Reset nửa đêm</span>
          </div>
          <p className="text-base font-black text-white tracking-tight uppercase">{dailyChallenge.title}</p>
          <p className="text-[11px] text-zinc-400 mt-1 mb-4 leading-relaxed">{dailyChallenge.desc}</p>
          {isChallengeAlreadyClaimed ? (
            <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
              <span className="text-emerald-500">✓</span>
              COMPLETED — +{dailyChallenge.xp} XP nhận rồi!
            </div>
          ) : (
            <button
              onClick={() => { if (soundEnabled) playClickSound(); claimDailyChallenge(); }}
              disabled={!isChallengeConditionMet}
              className={`px-5 py-2.5 rounded-lg text-xs font-black italic uppercase tracking-widest transition-all ${
                isChallengeConditionMet
                  ? 'bg-orange-600 hover:bg-orange-500 text-black shadow-lg shadow-orange-950/50'
                  : 'bg-zinc-900/60 border border-white/5 text-zinc-600 cursor-not-allowed'
              }`}
            >
              {isChallengeConditionMet ? `⚡ NHẬN +${dailyChallenge.xp} XP` : `+${dailyChallenge.xp} XP — Chưa đủ điều kiện`}
            </button>
          )}
        </div>

        {/* Add quest form */}
        <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-6">
          <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 mb-4 uppercase">// QUEUE NEW QUESTS</h2>
          <form onSubmit={handleTaskSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text" value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Nhập nhiệm vụ mới... (Ví dụ: Code xong API giao dịch)"
                className="flex-1 bg-black/60 border border-white/5 hover:border-white/10 focus:border-orange-500 focus:outline-none rounded-lg px-4 py-3 text-sm text-neutral-200 transition-colors"
              />
              <div className="flex gap-2">
                <select
                  value={newTaskTier}
                  onChange={(e) => setNewTaskTier(e.target.value as TaskTier)}
                  className="bg-zinc-950 border border-white/5 focus:border-orange-500 focus:outline-none rounded-lg px-3 py-3 text-xs text-neutral-300 hover:border-white/10 font-mono"
                >
                  <option value="BOSS">BOSS RAID (Hard)</option>
                  <option value="DUNGEON">DUNGEON (Medium)</option>
                  <option value="MANA">MANA FARM (Easy)</option>
                </select>
                <button type="submit" className="bg-orange-600 text-black hover:bg-orange-500 border border-orange-600/40 px-5 py-3 rounded-lg flex items-center justify-center gap-1 text-sm font-black italic uppercase transition-colors">
                  <Plus className="w-4 h-4 text-black" /> Add
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest whitespace-nowrap">Deadline:</label>
              <input
                type="date"
                value={newDueDate}
                onChange={e => setNewDueDate(e.target.value)}
                min={getTodayStr()}
                className="bg-black/60 border border-white/5 hover:border-white/10 focus:border-orange-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs text-neutral-300 font-mono transition-colors"
              />
              {/* Quick-pick buttons */}
              {(['Hôm nay', 'Ngày mai', 'Tuần này'] as const).map(label => {
                const target = label === 'Hôm nay' ? getTodayStr() : label === 'Ngày mai' ? getTomorrowStr() : getEndOfWeekStr();
                const isActive = newDueDate === target;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setNewDueDate(target)}
                    className={`px-2.5 py-1.5 rounded text-[10px] font-mono whitespace-nowrap transition-all border ${
                      isActive
                        ? 'bg-orange-950/40 border-orange-600/50 text-orange-400'
                        : 'bg-black/40 border-white/5 text-zinc-500 hover:border-white/15 hover:text-zinc-300'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
              {newDueDate && (
                <button type="button" onClick={() => setNewDueDate('')} className="text-[10px] text-zinc-600 hover:text-red-400 font-mono ml-1">✕</button>
              )}
            </div>
          </form>
        </div>

        {/* Task tiers */}
        {(['BOSS', 'DUNGEON', 'MANA'] as TaskTier[]).map(tier => {
          const cfg = tierConfig[tier];
          const Icon = cfg.icon;
          const usedToday = taskTierCountsToday[tier] ?? 0;
          const cap = DAILY_TIER_CAPS[tier];
          const capHit = usedToday >= cap;
          return (
            <div key={tier} className="space-y-4">
              <div className={`flex items-center gap-2 pb-1.5 ${cfg.border}`}>
                <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
                <h3 className={`text-sm font-bold font-mono tracking-wider uppercase ${cfg.color}`}>{cfg.label}</h3>
                <span className={`text-[10px] border px-2 py-0.5 rounded-full font-mono ml-auto ${capHit ? 'bg-zinc-900/60 border-zinc-700/30 text-zinc-500 line-through' : cfg.xpBg}`}>
                  +{cfg.xp} XP
                </span>
                <span className={`text-[10px] border px-2 py-0.5 rounded-full font-mono ${
                  capHit
                    ? 'bg-zinc-900/40 border-zinc-700/20 text-zinc-600'
                    : usedToday > 0
                      ? 'bg-zinc-900/40 border-zinc-700/20 text-zinc-400'
                      : 'hidden'
                }`}>
                  {capHit ? `${cap}/${cap} HẾT SLOT` : `${usedToday}/${cap}`}
                </span>
              </div>
              <div className="space-y-3">
                {getTasksByTier(tier).length === 0 ? (
                  <div className="text-center py-6 bg-zinc-950/20 border border-white/5 rounded-lg text-xs text-zinc-500 font-mono">
                    {tier === 'BOSS' ? 'CHƯA CÓ BOSS RAID NÀO. HÃY THÊM MỤC TIÊU LỚN!'
                      : tier === 'DUNGEON' ? 'KHÔNG CÓ DUNGEON NÀO ĐANG CHỜ.'
                      : 'SẠCH SẼ! THÊM VIỆC VẶT ĐỂ DUY TRÌ MOMENTUM.'}
                  </div>
                ) : getTasksByTier(tier).map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-lg border flex items-center justify-between gap-4 transition-all duration-300 ${
                      task.completed
                        ? 'bg-zinc-950/30 border-white/5 text-zinc-500 opacity-60'
                        : `${cfg.cardActive} text-neutral-200`
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => handleTaskToggle(task.id, task.completed)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                          task.completed ? `${cfg.checkActive} text-black` : `${cfg.checkIdle} bg-black/60 hover:border-orange-700`
                        }`}
                      >
                        {task.completed && <Check className="w-3.5 h-3.5 stroke-[3] text-black" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium block truncate ${task.completed ? 'line-through text-zinc-600' : 'text-neutral-100'}`}>
                          {task.title}
                        </span>
                        {!task.completed && (() => {
                          const badge = getTaskBadge(task);
                          return badge ? (
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${badge.cls} mt-0.5 inline-block`}>
                              {badge.label}
                            </span>
                          ) : task.dueDate ? (
                            <span className="text-[9px] font-mono text-zinc-600 mt-0.5 block">
                              {new Date(task.dueDate).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 rounded hover:bg-zinc-900 text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Đã hoàn thành hôm nay (nhãn tĩnh — task xong đã hiện tại chỗ trong tier) + Lịch sử */}
        <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span
            className={`flex items-center gap-2 text-xs font-mono ${
              completedToday.length > 0 ? 'text-emerald-400/80' : 'text-zinc-600'
            }`}
          >
            <span className="text-emerald-500">✓</span>
            Đã hoàn thành: <span className="font-bold">{completedToday.length}</span> hôm nay
          </span>
          <button
            onClick={() => { if (soundEnabled) playClickSound(); setShowHistory(true); }}
            className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 hover:text-orange-400 transition-colors self-start sm:self-auto"
          >
            <History className="w-3.5 h-3.5" /> Lịch sử
          </button>
        </div>
      </div>

      {showHistory && <TaskHistoryModal archivedTasks={archivedTasks} onClose={() => setShowHistory(false)} />}
    </div>
  );
}
