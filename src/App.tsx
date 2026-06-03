import React from 'react';
import {
  Zap,
  Map,
  Coins,
  History,
  Shield,
  Compass
} from 'lucide-react';
import StatusHeader from './components/StatusHeader';
import QuestBoard from './components/QuestBoard';
import TreasuryBoard from './components/TreasuryBoard';
import JourneyLogs from './components/JourneyLogs';
import { Task, Transaction, DayLog, Achievement, TaskTier, ExpenseCategory } from './types';
import { playClickSound, playLevelUpSound, playQuestSuccessSound } from './utils/audio';

// Dynamic helper to format current date as YYYY-MM-DD
const getTodayDateString = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

export default function App() {
  // ---- STATE INITIALIZATION FROM LOCALSTORAGE WITH ENGAGING SEED DATA ----
  const [hunterName, setHunterName] = React.useState<string>(() => {
    return localStorage.getItem('ironwill_hunter_name') || 'Challenger';
  });

  const [level, setLevel] = React.useState<number>(() => {
    return parseInt(localStorage.getItem('ironwill_level') || '3');
  });

  const [xp, setXp] = React.useState<number>(() => {
    return parseInt(localStorage.getItem('ironwill_xp') || '45');
  });

  const [streak, setStreak] = React.useState<number>(() => {
    return parseInt(localStorage.getItem('ironwill_streak') || '14');
  });

  const [disciplineMode, setDisciplineMode] = React.useState<boolean>(() => {
    const saved = localStorage.getItem('ironwill_discipline_mode');
    return saved !== null ? saved === 'true' : true;
  });

  const [soundEnabled, setSoundEnabled] = React.useState<boolean>(() => {
    const saved = localStorage.getItem('ironwill_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  // Today's active habits tracker settings
  const [dailyRoutines, setDailyRoutines] = React.useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('ironwill_daily_routines');
    if (saved) return JSON.parse(saved);
    // Initial routines seed state
    return { eat: true, pray: false, train: true, study: false, work: true, sleep: false };
  });

  // Todo tasks state
  const [tasks, setTasks] = React.useState<Task[]>(() => {
    const saved = localStorage.getItem('ironwill_tasks');
    if (saved) return JSON.parse(saved);
    // Seeding demo tasks
    return [
      { id: 't1', title: 'Hoàn thành 100 cái chống đẩy x Squat gánh tạ 80kg', tier: 'BOSS', completed: false, createdAt: getTodayDateString() },
      { id: 't2', title: 'Quét sạch deadline dự án Web App full-stack bán hàng', tier: 'BOSS', completed: true, createdAt: getTodayDateString() },
      { id: 't3', title: 'Cân đối sổ sách dòng tiền rò rỉ tuần này', tier: 'DUNGEON', completed: false, createdAt: getTodayDateString() },
      { id: 't4', title: 'Đọc 15 trang sách rèn luyện tư duy kinh doanh', tier: 'DUNGEON', completed: true, createdAt: getTodayDateString() },
      { id: 't5', title: 'Uống đủ 3 lít nước lọc', tier: 'MANA', completed: false, createdAt: getTodayDateString() },
      { id: 't6', title: 'Dọn dẹp bàn làm việc tối giản', tier: 'MANA', completed: true, createdAt: getTodayDateString() },
    ];
  });

  // Financial Ledger entries
  const [transactions, setTransactions] = React.useState<Transaction[]>(() => {
    const saved = localStorage.getItem('ironwill_transactions');
    if (saved) return JSON.parse(saved);
    // Seed financials (VND denominations)
    return [
      { id: 'tr1', title: 'Thù lao Freelance dự án Android', amount: 8500000, type: 'INCOME', category: 'Income Source', date: getTodayDateString() },
      { id: 'tr2', title: 'Hũ Whey Protein 5lbs', amount: 1650000, type: 'EXPENSE', category: 'Gym & Nutrition', date: getTodayDateString() },
      { id: 'tr3', title: 'Sách Nghĩ Giàu Làm Giàu bìa cứng', amount: 150000, type: 'EXPENSE', category: 'Books & Growth', date: getTodayDateString() },
      { id: 'tr4', title: 'Thuê Server Cloud hàng tháng', amount: 250000, type: 'EXPENSE', category: 'Work & Gear', date: getTodayDateString() },
      { id: 'tr5', title: 'Mua gói nạp game linh tinh', amount: 450000, type: 'EXPENSE', category: 'Unnecessary Leaks', date: getTodayDateString() },
    ];
  });

  // Weight bio checkoffs
  const [weightLogs, setWeightLogs] = React.useState<{ date: string; weight: number }[]>(() => {
    const saved = localStorage.getItem('ironwill_weight_logs');
    if (saved) return JSON.parse(saved);
    // Seed weight changes showing stable bulking rate
    return [
      { date: '21 May', weight: 74.5 },
      { date: '25 May', weight: 75.1 },
      { date: '29 May', weight: 75.6 },
      { date: '02 Jun', weight: 76.2 },
    ];
  });

  // Past contribution DayLogs seed settings (lights up the contribution map instantly!)
  const [logs, setLogs] = React.useState<DayLog[]>(() => {
    const saved = localStorage.getItem('ironwill_logs');
    if (saved) return JSON.parse(saved);

    // Seed realistic daily routine checkoffs for past days.
    // Quality represents score from 0 to 6
    const pastLogs: DayLog[] = [];
    const seedValues = [5, 6, 2, 4, 6, 3, 5, 6, 1, 4, 5, 6, 3, 2, 6, 4, 5, 6, 5, 6, 4, 3, 6, 5, 6, 3, 5, 6];

    for (let i = 27; i >= 1; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const routineScore = seedValues[i % seedValues.length];

      const routinesMap: Record<string, boolean> = {};
      const routineKeys = ['eat', 'pray', 'train', 'study', 'work', 'sleep'];
      routineKeys.forEach((key, idx) => {
        routinesMap[key] = idx < routineScore;
      });

      pastLogs.push({
        date: ds,
        routines: routinesMap,
        note: `Day ${i} System cleared`,
        weight: 74 + (i % 20) * 0.1
      });
    }
    return pastLogs;
  });

  // System RPG Achievements
  const [achievements, setAchievements] = React.useState<Achievement[]>(() => {
    const saved = localStorage.getItem('ironwill_achievements');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'ach1', title: 'CHẶNG ĐƯỜNG KỶ LUẬT', description: 'Kích hoạt hệ thống Mindset Kỷ Luật (Discipline Mode Active). Vứt bỏ mọi lý do trì hoãn.', badge: '🛡️', unlockedAt: getTodayDateString() },
      { id: 'ach2', title: 'APEX BOSS RAID', description: 'Tiêu diệt thành công 1 BOSS RAID (Công việc độ khó đặc biệt cực lớn).', badge: '👑', unlockedAt: getTodayDateString() },
      { id: 'ach3', title: 'CHỐNG RÒ RỈ HOÀN HẢO', description: 'Ghi nhận sổ sách hơn 3 dòng tiền mà không có giao dịch Lỗ Rò Rỉ Vô Ích nào.', badge: '💎', unlockedAt: null },
      { id: 'ach4', title: 'CHIẾN THẦN THỂ HÌNH', description: 'Ghi nhận cân nặng cơ thể thành công lần đầu tiên trên chặng đường rèn luyện.', badge: '🏋️', unlockedAt: getTodayDateString() },
    ];
  });

  // Current UI Active Tab
  const [activeTab, setActiveTab] = React.useState<'QUEST' | 'TREASURY' | 'JOURNEY'>('QUEST');

  // ---- COMPUTE SYSTEM XP METRICS ----
  // XP formula: XP required = Level * 120
  const xpNeeded = level * 120;

  const totalTasksCompleted = tasks.filter(t => t.completed).length;

  // ---- DYNAMIC PERSISTENCE LAYER CORRELATION ----
  React.useEffect(() => {
    localStorage.setItem('ironwill_hunter_name', hunterName);
    localStorage.setItem('ironwill_level', String(level));
    localStorage.setItem('ironwill_xp', String(xp));
    localStorage.setItem('ironwill_streak', String(streak));
    localStorage.setItem('ironwill_discipline_mode', String(disciplineMode));
    localStorage.setItem('ironwill_sound_enabled', String(soundEnabled));
    localStorage.setItem('ironwill_daily_routines', JSON.stringify(dailyRoutines));
    localStorage.setItem('ironwill_tasks', JSON.stringify(tasks));
    localStorage.setItem('ironwill_transactions', JSON.stringify(transactions));
    localStorage.setItem('ironwill_weight_logs', JSON.stringify(weightLogs));
    localStorage.setItem('ironwill_logs', JSON.stringify(logs));
    localStorage.setItem('ironwill_achievements', JSON.stringify(achievements));
  }, [hunterName, level, xp, streak, disciplineMode, soundEnabled, dailyRoutines, tasks, transactions, weightLogs, logs, achievements]);

  // ---- CORE SYSTEM XP LEVEL-UP LOGIC ----
  const addXP = React.useCallback((amount: number) => {
    setXp(prevXp => {
      let currentXp = prevXp + amount;
      let currentLevel = level;
      const needed = currentLevel * 120;

      if (currentXp >= needed) {
        currentXp -= needed;
        currentLevel += 1;
        setLevel(currentLevel);

        // Trigger epic Sound FX & Notification
        setTimeout(() => {
          if (soundEnabled) playLevelUpSound();
          alert(`👑 LEVEL UP! Bro vừa đột phá lên LEVEL ${currentLevel}! Hệ thống thể chất x tinh thần được cường hóa rực rỡ!`);
        }, 100);
      }
      return currentXp;
    });
  }, [level, soundEnabled]);

  // Unlock achievements trigger
  const unlockAchievement = React.useCallback((id: string) => {
    setAchievements(prev => prev.map(a => {
      if (a.id === id && a.unlockedAt === null) {
        if (soundEnabled) setTimeout(() => playQuestSuccessSound(), 200);
        return { ...a, unlockedAt: getTodayDateString() };
      }
      return a;
    }));
  }, [soundEnabled]);

  // ---- MUTATIONS & HANDLERS ----
  const addTask = (title: string, tier: TaskTier) => {
    const newTask: Task = {
      id: `task_${Date.now()}`,
      title,
      tier,
      completed: false,
      createdAt: getTodayDateString()
    };
    setTasks(prev => [...prev, newTask]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextState = !t.completed;
        if (nextState) {
          // Task completed awards XP based on Intensity tier
          const reward = t.tier === 'BOSS' ? 40 : t.tier === 'DUNGEON' ? 20 : 10;
          addXP(reward);

          if (t.tier === 'BOSS') {
            unlockAchievement('ach2');
          }
        }
        return { ...t, completed: nextState };
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addTransaction = (
    title: string,
    amount: number,
    type: 'INCOME' | 'EXPENSE',
    category: ExpenseCategory | 'Income Source'
  ) => {
    const newTr: Transaction = {
      id: `tr_${Date.now()}`,
      title,
      amount,
      type,
      category,
      date: getTodayDateString()
    };
    setTransactions(prev => [...prev, newTr]);

    // Check achievement ach3 logic: perfect financer (over 3 non-leak transactions)
    const currentLeaks = transactions.filter(t => t.type === 'EXPENSE' && t.category === 'Unnecessary Leaks').length;
    const totalTrs = transactions.length;
    if (totalTrs > 3 && currentLeaks === 0 && category !== 'Unnecessary Leaks') {
      unlockAchievement('ach3');
    }
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const toggleRoutine = (routineId: string) => {
    setDailyRoutines(prev => {
      const nextDone = !prev[routineId];
      if (nextDone) {
        // Awards +5 XP
        addXP(5);
      }

      const updated = { ...prev, [routineId]: nextDone };

      // Update or create today's historical log in array
      const today = getTodayDateString();
      setLogs(prevLogs => {
        const exists = prevLogs.some(l => l.date === today);
        if (exists) {
          return prevLogs.map(l => {
            if (l.date === today) {
              return { ...l, routines: updated };
            }
            return l;
          });
        } else {
          return [...prevLogs, {
            date: today,
            routines: updated,
            note: 'Today system logs synchronized'
          }];
        }
      });

      return updated;
    });
  };

  const addWeightLog = (weight: number) => {
    const newLog = {
      date: new Date().toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
      weight
    };
    setWeightLogs(prev => [...prev, newLog]);
    unlockAchievement('ach4');
  };

  // Switch Theme styling based on status header mindset selection:
  // discipline: Intense neon on black canvas
  // motivation: Glowing yellowish amber warm energy
  const themeStyle = disciplineMode ? 'discipline' : 'motivation';

  return (
    <div className="min-h-screen transition-all duration-500 bg-[#0F0F12] artistic-grid-bg font-sans text-neutral-300 selection:bg-orange-950 selection:text-orange-100">

      {/* GLOWING ORBITS AESTHETIC BACKGROUND DESIGN */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-950/5 via-transparent to-transparent pointer-events-none select-none z-0 overflow-hidden">
        <div className={`absolute top-[-250px] left-[50%] translate-x-[-51%] w-[600px] h-[600px] rounded-full filter blur-[120px] opacity-10 transition-all duration-1000 ${
          themeStyle === 'discipline' ? 'bg-orange-600' : 'bg-amber-600'
        }`}></div>
      </div>

      {/* SIDE DECORATIVE PANELS FOR DESKTOP (OUTER MARGINS) — original gradient sigils */}
      {/* Left Column: The Operator */}
      <div className="fixed left-4 2xl:left-12 top-[120px] bottom-[120px] w-48 hidden xl:flex flex-col justify-between pointer-events-none select-none z-0">
        <div className="relative w-full h-[55%] rounded-2xl overflow-hidden border border-white/5 bg-zinc-950/20 backdrop-blur-[1px] p-3 flex flex-col justify-between opacity-15 hover:opacity-35 transition-all duration-700">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-700/40 via-zinc-950 to-black flex items-center justify-center">
            <Zap className="w-16 h-16 text-orange-500/30" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10" />
          <div className="relative z-20 text-[9px] font-mono text-orange-500 font-bold tracking-widest bg-black/60 px-1.5 py-0.5 rounded border border-white/5 w-max">
            SYSTEM S-RANK
          </div>
          <div className="relative z-20">
            <span className="text-[10px] font-mono text-zinc-500 block">SUBJECT:</span>
            <span className="text-xs font-black text-white font-sans tracking-tight uppercase">THE ASCENDANT</span>
            <p className="text-[8px] font-mono text-orange-600 mt-1 uppercase tracking-tight">THE APEX OPERATIVE</p>
          </div>
        </div>

        {/* Supporting lore panel */}
        <div className="border border-white/5 bg-zinc-950/10 p-4 rounded-xl opacity-15 text-left">
          <span className="text-[8px] font-mono text-zinc-500 block tracking-widest">// COGNIZANCE</span>
          <p className="text-[10px] font-sans text-zinc-400 italic leading-normal mt-1">
            "Sự lười biếng là một vết nứt, nó sẽ nuốt chửng toàn bộ vương quốc nếu không được rèn luyện."
          </p>
        </div>
      </div>

      {/* Right Column: The Guardian Ally */}
      <div className="fixed right-4 2xl:right-12 top-[120px] bottom-[120px] w-48 hidden xl:flex flex-col justify-between pointer-events-none select-none z-0">
        <div className="relative w-full h-[55%] rounded-2xl overflow-hidden border border-white/5 bg-zinc-950/20 backdrop-blur-[1px] p-3 flex flex-col justify-between opacity-15 hover:opacity-35 transition-all duration-700">
          <div className="absolute inset-0 bg-gradient-to-br from-red-800/40 via-zinc-950 to-black flex items-center justify-center">
            <Shield className="w-16 h-16 text-red-500/30" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10" />
          <div className="relative z-20 text-[9px] font-mono text-red-500 font-bold tracking-widest bg-black/60 px-1.5 py-0.5 rounded border border-white/5 w-max">
            GENERAL GUARD
          </div>
          <div className="relative z-20">
            <span className="text-[10px] font-mono text-zinc-500 block">GUARDIAN:</span>
            <span className="text-xs font-black text-red-400 font-sans tracking-tight uppercase">CRIMSON SENTINEL</span>
            <p className="text-[8px] font-mono text-red-500/80 mt-1 uppercase tracking-tight">VỆ BINH TIÊN PHONG</p>
          </div>
        </div>

        {/* Supporting lore panel */}
        <div className="border border-white/5 bg-zinc-950/10 p-4 rounded-xl opacity-15 text-left">
          <span className="text-[8px] font-mono text-zinc-500 block tracking-widest">// MANDATE</span>
          <p className="text-[10px] font-sans text-zinc-400 italic leading-normal mt-1">
            "Luôn đứng dậy chuẩn bị chiến đấu. Thức tỉnh là tiếng gọi cứu rỗi cuối cùng của kẻ gục ngã."
          </p>
        </div>
      </div>

      {/* PRIMARY RESPONSIVE CONTENT CONTAINER */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* LOGO TITLE GRID */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-4 select-none">
            <div className={`w-12 h-12 rounded-sm flex items-center justify-center font-bold text-black text-xl italic transition-all ${
              themeStyle === 'discipline'
                ? 'bg-orange-600 text-black'
                : 'bg-amber-500 text-black'
            }`}>
              L
            </div>
            <div>
              <h1 className="text-sm font-black font-sans leading-none text-white tracking-widest uppercase">
                PROJECT: DISCIPLINED LIFE <span className="text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded ml-1 bg-black text-orange-600 border border-white/10 uppercase">SYS 3.5</span>
              </h1>
              <p className="text-[10px] font-mono text-orange-600 tracking-tighter uppercase mt-1">
                Operator: {hunterName} / Level {level}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-zinc-900/80 p-2.5 rounded-lg border border-white/10 text-xs font-mono">
            <Compass className="w-3.5 h-3.5 text-orange-600 mr-1 ml-0.5" />
            <span className="text-zinc-500 uppercase">SERVER STATE:</span>
            <span className="text-white font-bold ml-1 animate-pulse">WARRIOR ACTIVE</span>
          </div>
        </header>

        {/* CHARACTER RPG STAT SHEET PANEL */}
        <StatusHeader
          hunterName={hunterName}
          setHunterName={setHunterName}
          level={level}
          xp={xp}
          xpNeeded={xpNeeded}
          rank={level >= 51 ? 'S-Rank' : level >= 36 ? 'A-Rank' : level >= 21 ? 'B-Rank' : level >= 11 ? 'C-Rank' : level >= 6 ? 'D-Rank' : 'E-Rank'}
          streak={streak}
          disciplineMode={disciplineMode}
          setDisciplineMode={setDisciplineMode}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          totalTasksCompleted={totalTasksCompleted}
          themeStyle={themeStyle}
        />

        {/* NAVIGATION TAB CHANGER BAR */}
        <nav className="grid grid-cols-3 gap-2 bg-zinc-900/80 p-1.5 rounded-xl border border-white/10">
          <button
            onClick={() => { if (soundEnabled) playClickSound(); setActiveTab('QUEST'); }}
            className={`py-3.5 px-3 rounded-lg text-xs font-mono font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
              activeTab === 'QUEST'
                ? 'bg-orange-600 text-black font-black italic shadow-[0_0_12px_rgba(234,88,12,0.2)]'
                : 'text-zinc-500 hover:text-neutral-400'
            }`}
          >
            <Map className="w-4 h-4" /> QUEST BOARD (Rèn luyện)
          </button>

          <button
            onClick={() => { if (soundEnabled) playClickSound(); setActiveTab('TREASURY'); }}
            className={`py-3.5 px-3 rounded-lg text-xs font-mono font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
              activeTab === 'TREASURY'
                ? 'bg-orange-600 text-black font-black italic shadow-[0_0_12px_rgba(234,88,12,0.2)]'
                : 'text-zinc-500 hover:text-neutral-400'
            }`}
          >
            <Coins className="w-4 h-4" /> TREASURY LEDGER (Chi tiêu)
          </button>

          <button
            onClick={() => { if (soundEnabled) playClickSound(); setActiveTab('JOURNEY'); }}
            className={`py-3.5 px-3 rounded-lg text-xs font-mono font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
              activeTab === 'JOURNEY'
                ? 'bg-orange-600 text-black font-black italic shadow-[0_0_12px_rgba(234,88,12,0.2)]'
                : 'text-zinc-500 hover:text-neutral-400'
            }`}
          >
            <History className="w-4 h-4" /> JOURNEY & STREAKS (Lịch sử)
          </button>
        </nav>

        {/* COMPONENT BOARD MATRIX RENDERER */}
        <main className="outline-none focus:outline-none">
          {activeTab === 'QUEST' && (
            <QuestBoard
              tasks={tasks}
              addTask={addTask}
              toggleTask={toggleTask}
              deleteTask={deleteTask}
              dailyRoutines={dailyRoutines}
              toggleRoutine={toggleRoutine}
              disciplineMode={disciplineMode}
              soundEnabled={soundEnabled}
              addXP={addXP}
            />
          )}

          {activeTab === 'TREASURY' && (
            <TreasuryBoard
              transactions={transactions}
              addTransaction={addTransaction}
              deleteTransaction={deleteTransaction}
              soundEnabled={soundEnabled}
              addXP={addXP}
            />
          )}

          {activeTab === 'JOURNEY' && (
            <JourneyLogs
              logs={logs}
              achievements={achievements}
              weightLogs={weightLogs}
              addWeightLog={addWeightLog}
              soundEnabled={soundEnabled}
              addXP={addXP}
            />
          )}
        </main>

        {/* SYSTEM FOOTER */}
        <footer className="pt-8 border-t border-white/10 flex justify-between items-center font-mono text-[10px] text-zinc-600 select-none">
          <div className="flex gap-6">
            <span>SYS_STABLE: 100%</span>
            <span>DATA_SYNC: 0.04ms</span>
          </div>
          <p className="uppercase tracking-widest">
            BECOME THE STRONGEST VERSION OF YOURSELF
          </p>
        </footer>

      </div>
    </div>
  );
}
