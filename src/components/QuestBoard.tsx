import React from 'react';
import {
  Check,
  Plus,
  Trash2,
  Sparkles,
  Play,
  Square,
  Zap,
  Award,
  CheckSquare,
  SquareTerminal,
  Dumbbell,
  DollarSign,
  BookOpen,
  Utensils,
  Moon,
  Map,
  Sword,
  Swords,
  Shield
} from 'lucide-react';
import { Task, TaskTier } from '../types';
import { playClickSound, playQuestSuccessSound, playTimerEndSound } from '../utils/audio';
import { Quote, QUOTES } from '../data/quotes';

interface QuestBoardProps {
  tasks: Task[];
  addTask: (title: string, tier: TaskTier) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  dailyRoutines: Record<string, boolean>;
  toggleRoutine: (routineId: string) => void;
  disciplineMode: boolean;
  soundEnabled: boolean;
  addXP: (amount: number) => void;
}

// Original summonable allies (no copyrighted character names / artwork).
const ALLY_UNITS = [
  {
    id: 'crimson',
    name: 'Vệ Binh Crimson',
    title: 'THE CRIMSON SENTINEL',
    role: 'Phó tướng Thiết giáp',
    unlockedAt: 'Hệ thống Sẵn sàng',
    icon: Sword,
    gradient: 'from-red-800 via-zinc-900 to-black',
    activeColor: 'border-red-500/40 text-red-400',
    glowColor: 'shadow-[0_0_20px_rgba(239,68,68,0.25)]',
    quote: {
      discipline: 'Ý chí của chỉ huy là tuyệt đối. Hãy hoàn thành Boss Raid rực rỡ nhất!',
      motivation: 'Thế gian chỉ phục tùng kẻ có kỷ luật cốt lõi. Hãy đứng dậy và chiến đấu!'
    }
  },
  {
    id: 'onyx',
    name: 'Sát Thủ Onyx',
    title: 'THE ONYX REAPER',
    role: 'Song đao Tốc độ',
    unlockedAt: 'Cực kỳ mạnh mẽ',
    icon: Swords,
    gradient: 'from-amber-700 via-zinc-900 to-black',
    activeColor: 'border-amber-500/40 text-amber-400',
    glowColor: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
    quote: {
      discipline: 'Chỉ có kỷ luật vô lượng mới giải phóng được Sức mạnh tối thượng!',
      motivation: 'Chỉ huy ơi! Thần sẽ quét sạch tất cả chướng ngại trước mặt ngài!'
    }
  },
  {
    id: 'titan',
    name: 'Hộ Vệ Titan',
    title: 'THE TITAN BULWARK',
    role: 'Kiên phòng Đồng tử',
    unlockedAt: 'Lá chắn Bất diệt',
    icon: Shield,
    gradient: 'from-cyan-800 via-zinc-900 to-black',
    activeColor: 'border-cyan-500/40 text-cyan-400',
    glowColor: 'shadow-[0_0_20px_rgba(6,182,212,0.25)]',
    quote: {
      discipline: 'Kiên trì vững như thạch bàn. Không khuất phục trước bất cứ cám dỗ nào!',
      motivation: 'Hét lớn một tiếng để xua tan lười biếng nào! Awaken!'
    }
  }
];

export default function QuestBoard({
  tasks,
  addTask,
  toggleTask,
  deleteTask,
  dailyRoutines,
  toggleRoutine,
  disciplineMode,
  soundEnabled,
  addXP
}: QuestBoardProps) {
  // Task input state
  const [newTaskTitle, setNewTaskTitle] = React.useState('');
  const [newTaskTier, setNewTaskTier] = React.useState<TaskTier>('DUNGEON');
  const [activeCompanionId, setActiveCompanionId] = React.useState('crimson');

  const activeCompanion = ALLY_UNITS.find(c => c.id === activeCompanionId) || ALLY_UNITS[0];
  const ActiveIcon = activeCompanion.icon;

  // Focus Timer states
  const [timerMinutes, setTimerMinutes] = React.useState(25);
  const [timerSeconds, setTimerSeconds] = React.useState(0);
  const [isTimerRunning, setIsTimerRunning] = React.useState(false);
  const [activePreset, setActivePreset] = React.useState<number>(25);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Quote state
  const [currentQuote, setCurrentQuote] = React.useState<Quote>(QUOTES[0]);

  // Load a random quote matching current mode
  const rotateQuote = React.useCallback(() => {
    const mode = disciplineMode ? 'discipline' : 'motivation';
    const filtered = QUOTES.filter(q => q.mode === mode);
    const random = filtered[Math.floor(Math.random() * filtered.length)];
    if (random) setCurrentQuote(random);
  }, [disciplineMode]);

  React.useEffect(() => {
    rotateQuote();
  }, [disciplineMode, rotateQuote]);

  // Focus Timer Logic
  React.useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        if (timerSeconds > 0) {
          setTimerSeconds(prev => prev - 1);
        } else if (timerSeconds === 0) {
          if (timerMinutes > 0) {
            setTimerMinutes(prev => prev - 1);
            setTimerSeconds(59);
          } else {
            // Timer Finished
            if (soundEnabled) playTimerEndSound();
            setIsTimerRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);

            // Reward with EXP
            addXP(25);
            alert("🔥 HOÀN THÀNH CHẶNG ĐƯỜNG FOCUS! Bro đã nạp +25 EXP sức mạnh. Tiếp tục rèn luyện!");

            // Reset to active preset
            setTimerMinutes(activePreset);
            setTimerSeconds(0);
          }
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timerMinutes, timerSeconds, activePreset, soundEnabled, addXP]);

  const handleStartTimer = () => {
    if (soundEnabled) playClickSound();
    setIsTimerRunning(true);
    rotateQuote();
  };

  const handleStopTimer = () => {
    if (soundEnabled) playClickSound();
    setIsTimerRunning(false);
  };

  const handleResetTimer = (minutes: number) => {
    if (soundEnabled) playClickSound();
    setIsTimerRunning(false);
    setActivePreset(minutes);
    setTimerMinutes(minutes);
    setTimerSeconds(0);
  };

  // Habit List: EAT, PRAY, TRAIN, STUDY, WORK, SLEEP
  const DEFAULT_ROUTINES = [
    { id: 'eat', label: 'EAT PROTEIN', desc: 'Dinh dưỡng sạch x bổ sung Whey/Yến mạch', icon: Utensils, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
    { id: 'pray', label: 'PRAY & PLAN', desc: 'Thiền định x Viết mục tiêu buổi sáng', icon: Map, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
    { id: 'train', label: 'TRAIN HARD', desc: 'Nâng tạ x Cardio cường độ cao', icon: Dumbbell, color: 'text-red-500 bg-red-500/10 border-red-500/30' },
    { id: 'study', label: 'STUDY FOCUS', desc: 'Đọc 10 trang sách x Code 1 tiếng', icon: BookOpen, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
    { id: 'work', label: 'WORK GRIND', desc: 'Không điện thoại x Tập trung cao độ tối đa', icon: DollarSign, color: 'text-violet-400 bg-violet-500/10 border-violet-500/30' },
    { id: 'sleep', label: 'SLEEP WELL', desc: 'Ngủ đủ 7-8 tiếng x Chặn ánh sáng xanh', icon: Moon, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
  ];

  const completedRoutinesCount = DEFAULT_ROUTINES.filter(r => dailyRoutines[r.id]).length;
  const hasCompletedAllRoutines = completedRoutinesCount === DEFAULT_ROUTINES.length;

  const handleRoutineClick = (id: string) => {
    if (soundEnabled) {
      if (!dailyRoutines[id]) {
        playQuestSuccessSound();
      } else {
        playClickSound();
      }
    }
    toggleRoutine(id);
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    if (soundEnabled) playClickSound();
    addTask(newTaskTitle.trim(), newTaskTier);
    setNewTaskTitle('');
  };

  const handleTaskToggle = (id: string, currentlyCompleted: boolean) => {
    if (soundEnabled) {
      if (!currentlyCompleted) {
        playQuestSuccessSound();
      } else {
        playClickSound();
      }
    }
    toggleTask(id);
  };

  // Filter tasks relative to tier
  const getTasksByTier = (tier: TaskTier) => tasks.filter(t => t.tier === tier);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT COLUMN: Routine Grid & Focus Timer (5 cols) */}
      <div className="lg:col-span-5 space-y-8">

        {/* Routine Grid (EAT PRAY TRAIN...) */}
        <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Award className="w-24 h-24 text-orange-500" />
          </div>

          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 uppercase">
                // SYSTEM DAILY PROTOCOL
              </h2>
              <p className="text-xl font-bold font-sans tracking-tight text-white mt-1">Đường Ray Kỷ Luật</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono px-3 py-1 bg-black/60 text-orange-500 border border-orange-600/30 rounded-full">
                {completedRoutinesCount} / 6 CLEARED
              </span>
            </div>
          </div>

          <p className="text-xs text-neutral-400 mb-6 font-mono">
            {disciplineMode
              ? "Kẻ lười biếng phó mặc cho tâm trạng. Người kỷ luật lặp lại thói quen rèn luyện vô điều kiện mỗi ngày."
              : "Hoàn thành 6 thói quen cốt lõi của đàn anh bản lĩnh."
            }
          </p>

          <div className="space-y-3">
            {DEFAULT_ROUTINES.map((routine) => {
              const isDone = !!dailyRoutines[routine.id];
              const Icon = routine.icon;
              return (
                <button
                  key={routine.id}
                  onClick={() => handleRoutineClick(routine.id)}
                  className={`w-full p-4 rounded-lg border flex items-center justify-between text-left transition-all duration-300 ${
                    isDone
                      ? 'bg-orange-950/20 border-orange-600/30 text-neutral-200'
                      : 'bg-black/40 border-white/5 hover:border-white/10 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${routine.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`text-xs font-bold font-mono tracking-widest uppercase ${isDone ? 'line-through text-orange-400 opacity-60' : 'text-neutral-100'}`}>
                        {routine.label}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-sans mt-0.5">{routine.desc}</div>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                    isDone
                      ? 'bg-orange-600 border-orange-500 text-black'
                      : 'border-white/10 bg-zinc-900'
                  }`}>
                    {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* All-Routines Bonus Trigger */}
          {hasCompletedAllRoutines && (
            <div className="mt-4 p-3 rounded-lg bg-orange-900/10 border border-orange-600/30 text-center animate-pulse">
              <span className="text-xs font-mono font-bold text-orange-400 flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-500" /> SYSTEM OVERDRIVE ACTIVE (+50 EXP INCOMING)
              </span>
            </div>
          )}
        </div>

        {/* Focus clock "AWAKEN CHRONO" */}
        <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-6 relative overflow-hidden text-center">
          <span className="text-[9px] uppercase font-mono tracking-widest text-[#ea580c] bg-orange-950/40 border border-orange-900/20 px-2.5 py-1 rounded-full absolute top-4 left-4">
            CHRONO ARENA
          </span>

          <div className="py-8">
            {/* Clock Face Display */}
            <div className="text-6xl font-black font-mono tracking-tight text-white mb-2 shadow-text italic">
              {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
            </div>

            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              {isTimerRunning ? "Deep execution phase... No distractions" : "CHOOSE YOUR RAID INTENSITY"}
            </p>
          </div>

          {/* Presets */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <button
              onClick={() => handleResetTimer(25)}
              className={`py-2 rounded-lg text-xs font-mono transition-all ${
                activePreset === 25
                  ? 'bg-orange-950/30 border border-orange-600/30 text-orange-500'
                  : 'bg-zinc-950/60 border border-white/5 hover:border-white/10 text-zinc-400'
              }`}
              disabled={isTimerRunning}
            >
              25m (Raid Setup)
            </button>
            <button
              onClick={() => handleResetTimer(45)}
              className={`py-2 rounded-lg text-xs font-mono transition-all ${
                activePreset === 45
                  ? 'bg-orange-950/30 border border-orange-600/30 text-orange-500'
                  : 'bg-zinc-950/60 border border-white/5 hover:border-white/10 text-zinc-400'
              }`}
              disabled={isTimerRunning}
            >
              45m (Deep Dungeon)
            </button>
            <button
              onClick={() => handleResetTimer(60)}
              className={`py-2 rounded-lg text-xs font-mono transition-all ${
                activePreset === 60
                  ? 'bg-orange-950/30 border border-orange-600/30 text-orange-500'
                  : 'bg-zinc-950/60 border border-white/5 hover:border-white/10 text-zinc-400'
              }`}
              disabled={isTimerRunning}
            >
              60m (Absolute Grind)
            </button>
          </div>

          {/* Action Trigger Buttons */}
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
            >
              Reset
            </button>
          </div>

          {/* Mindset Core Quote Display */}
          <div className="p-3 bg-black/40 border border-white/5 rounded-lg">
            <p className="text-xs italic text-zinc-300 leading-relaxed font-sans">
              &ldquo;{currentQuote.text}&rdquo;
            </p>
            <p className="text-[9px] uppercase tracking-widest text-[#ea580c] font-mono mt-1 w-full text-right">
              — {currentQuote.author}
            </p>
          </div>

          {/* Active Ally Commander Summon */}
          <div className="border border-white/10 rounded-xl bg-black/25 p-5 text-left relative overflow-hidden mt-6 transition-all duration-300">
            {/* Ambient Background Aura */}
            <div className="absolute inset-0 bg-radial-gradient from-orange-600/5 to-transparent pointer-events-none" />

            <div className="flex justify-between items-center mb-3.5 relative z-10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-orange-500 flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse" /> SOLDIER COMMAND PORT
              </span>
              <span className="text-[8px] font-mono border border-white/10 px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 select-none">
                ACTIVE ASSISTANT
              </span>
            </div>

            {/* General Description Grid */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center relative z-10">
              {/* Sigil Frame (original gradient + icon, no external art) */}
              <div className={`relative w-24 h-24 sm:w-20 sm:h-24 rounded-lg overflow-hidden border bg-gradient-to-br flex items-center justify-center flex-shrink-0 transition-all duration-500 ${activeCompanion.gradient} ${activeCompanion.activeColor} ${activeCompanion.glowColor}`}>
                <ActiveIcon className="w-9 h-9 relative z-10" />

                {/* Visual Label inside sigil */}
                <span className="absolute top-1 left-1 px-1 py-0.5 bg-black/85 text-[6.5px] font-mono uppercase text-zinc-400 rounded leading-none z-20">
                  S-RANK
                </span>
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none"></div>
              </div>

              {/* Character Specs & Dialogue */}
              <div className="flex-1 min-w-0">
                <span className="text-[8px] font-mono uppercase tracking-widest text-orange-500 block font-bold leading-none">{activeCompanion.title}</span>
                <h4 className="text-base font-black text-white block mt-1 font-sans leading-none tracking-tight">{activeCompanion.name}</h4>
                <p className="text-[10px] font-mono text-zinc-400 block mt-1.5 leading-none">
                  {activeCompanion.role} • <span className="text-zinc-500">{activeCompanion.unlockedAt}</span>
                </p>

                {/* Immersive message box representing dialogue */}
                <div className="mt-3 p-2.5 bg-zinc-950/80 border border-white/5 rounded text-xs select-none relative sm:-ml-2">
                  <p className="text-zinc-300 italic text-[11px] leading-relaxed">
                    &ldquo;{disciplineMode ? activeCompanion.quote.discipline : activeCompanion.quote.motivation}&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Clickable summon selector bar */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/5 relative z-10">
              {ALLY_UNITS.map((companion) => {
                const isSelected = companion.id === activeCompanionId;
                return (
                  <button
                    key={companion.id}
                    type="button"
                    onClick={() => {
                      if (soundEnabled) playClickSound();
                      setActiveCompanionId(companion.id);
                    }}
                    className={`py-2 px-1 rounded-md text-center transition-all cursor-pointer font-mono text-[9px] uppercase tracking-wider block font-black border ${
                      isSelected
                        ? 'bg-orange-600 border-orange-500 text-black shadow-[0_0_12px_rgba(234,88,12,0.3)] hover:bg-orange-500'
                        : 'bg-black/55 border-white/5 text-zinc-500 hover:text-zinc-300 hover:border-white/10 hover:bg-zinc-950'
                    }`}
                  >
                    {companion.id}
                  </button>
                );
              })}
            </div>

          </div>

        </div>
      </div>

      {/* RIGHT COLUMN: Quest Board (BOSS FIGHT, MINI QUESTS) (7 cols) */}
      <div className="lg:col-span-7 space-y-8">

        {/* Quest Manager Add Form */}
        <div className="bg-zinc-900/45 border border-white/10 rounded-xl p-6">
          <h2 className="text-xs font-bold font-mono tracking-widest text-orange-500 mb-4 uppercase">
            // QUEUE NEW QUESTS
          </h2>

          <form onSubmit={handleTaskSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newTaskTitle}
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

              <button
                type="submit"
                className="bg-orange-600 text-black hover:bg-orange-500 border border-orange-600/40 px-5 py-3 rounded-lg flex items-center justify-center gap-1 text-sm font-black italic uppercase transition-colors"
              >
                <Plus className="w-4 h-4 text-black" /> Add
              </button>
            </div>
          </form>
        </div>

        {/* BOSS RAID (S-Rank Priorities) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1.5 border-b border-red-950/40">
            <Zap className="w-5 h-5 text-red-500 animate-pulse" />
            <h3 className="text-sm font-bold font-mono text-red-400 tracking-wider uppercase">
              BOSS RAID (Mục tiêu cực lớn / Sức ép nặng nhất)
            </h3>
            <span className="text-[10px] bg-red-950/60 border border-red-800/40 text-red-400 px-2 py-0.5 rounded-full font-mono ml-auto">
              +40 XP
            </span>
          </div>

          <div className="space-y-3">
            {getTasksByTier('BOSS').length === 0 ? (
              <div className="text-center py-6 bg-zinc-950/20 border border-white/5 rounded-lg text-xs text-zinc-500 font-mono">
                CHƯA CÓ BOSS RAID NÀO. HÃY THÊM MỤC TIÊU LỚN ĐỂ CHIẾN ĐẤU BRO ƠI!
              </div>
            ) : (
              getTasksByTier('BOSS').map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border flex items-center justify-between gap-4 transition-all duration-300 ${
                    task.completed
                      ? 'bg-zinc-950/30 border-white/5 text-zinc-500 opacity-60'
                      : 'bg-gradient-to-r from-red-950/20 to-black/40 border-red-900/30 hover:border-red-800 text-neutral-200 shadow-[0_2px_8px_rgba(239,68,68,0.03)]'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleTaskToggle(task.id, task.completed)}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                        task.completed
                          ? 'bg-red-600 border-red-500 text-black'
                          : 'border-red-900 bg-black/60 hover:border-red-700'
                      }`}
                    >
                      {task.completed && <Check className="w-3.5 h-3.5 stroke-[3] text-black" />}
                    </button>

                    <span className={`text-sm font-medium truncate ${task.completed ? 'line-through text-zinc-600' : 'text-neutral-100'}`}>
                      {task.title}
                    </span>
                  </div>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 rounded hover:bg-zinc-900 text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* DUNGEON GATE (Standard Tasks) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1.5 border-b border-orange-950/20">
            <CheckSquare className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-bold font-mono text-orange-500 tracking-wider uppercase">
              DUNGEON GATE (Nhiệm vụ chính quy / Trong ngày)
            </h3>
            <span className="text-[10px] bg-orange-950/40 border border-orange-600/30 text-orange-500 px-2 py-0.5 rounded-full font-mono ml-auto">
              +20 XP
            </span>
          </div>

          <div className="space-y-3">
            {getTasksByTier('DUNGEON').length === 0 ? (
              <div className="text-center py-6 bg-zinc-950/20 border border-white/5 rounded-lg text-xs text-zinc-500 font-mono">
                KHÔNG CÓ DỰ ÁN DUNGEON NÀO ĐANG CHỜ. THU HOẠCH MANA HOẶC CHIẾN BOSS ĐI BRO!
              </div>
            ) : (
              getTasksByTier('DUNGEON').map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border flex items-center justify-between gap-4 transition-all duration-300 ${
                    task.completed
                      ? 'bg-zinc-950/30 border-white/5 text-zinc-500 opacity-60'
                      : 'bg-black/40 border-white/5 hover:border-orange-600/30 text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleTaskToggle(task.id, task.completed)}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                        task.completed
                          ? 'bg-orange-600 border-orange-500 text-black'
                          : 'border-white/10 bg-black/60 hover:border-orange-500'
                      }`}
                    >
                      {task.completed && <Check className="w-3.5 h-3.5 stroke-[3] text-black" />}
                    </button>

                    <span className={`text-sm font-medium truncate ${task.completed ? 'line-through text-zinc-600' : 'text-neutral-100'}`}>
                      {task.title}
                    </span>
                  </div>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 rounded hover:bg-zinc-900 text-zinc-600 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MANA FARM (Easy / Quick Tasks) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1.5 border-b border-emerald-950/20">
            <SquareTerminal className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold font-mono text-emerald-400 tracking-wider uppercase">
              MANA FARM (Việc vặt / Thói quen hỗ trợ)
            </h3>
            <span className="text-[10px] bg-emerald-950/40 border border-emerald-600/30 text-emerald-400 px-2 py-0.5 rounded-full font-mono ml-auto">
              +10 XP
            </span>
          </div>

          <div className="space-y-3">
            {getTasksByTier('MANA').length === 0 ? (
              <div className="text-center py-6 bg-zinc-950/20 border border-white/5 rounded-lg text-xs text-zinc-500 font-mono">
                SẠCH SẼ! HỌC VIỆC, KHAI THÁC LÀM VIỆC VẶT LÀ CHÌA KHÓA CỦA KỶ LUẬT.
              </div>
            ) : (
              getTasksByTier('MANA').map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border flex items-center justify-between gap-4 transition-all duration-300 ${
                    task.completed
                      ? 'bg-zinc-950/30 border-white/5 text-zinc-500 opacity-60'
                      : 'bg-black/40 border-white/5 hover:border-emerald-600/30 text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleTaskToggle(task.id, task.completed)}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                        task.completed
                          ? 'bg-emerald-600 border-emerald-500 text-black'
                          : 'border-white/10 bg-black/60 hover:border-emerald-500'
                      }`}
                    >
                      {task.completed && <Check className="w-3.5 h-3.5 stroke-[3] text-black" />}
                    </button>

                    <span className={`text-sm font-medium truncate ${task.completed ? 'line-through text-zinc-600' : 'text-neutral-100'}`}>
                      {task.title}
                    </span>
                  </div>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 rounded hover:bg-zinc-900 text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
