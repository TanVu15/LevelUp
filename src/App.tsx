import React from 'react';
import { Map, Coins, History } from 'lucide-react';
import StatusHeader from './components/StatusHeader';
import { AppBackdrop, AppHeader, AppFooter } from './components/AppChrome';
import QuestBoard from './components/QuestBoard';
import TreasuryBoard from './components/TreasuryBoard';
import Timeline from './components/Timeline';
import LevelUpModal, { LevelUpInfo } from './components/LevelUpModal';
import OnboardingModal from './components/OnboardingModal';
import BootIntro from './components/BootIntro';
import CelebrationToast from './components/CelebrationToast';
import MonthlyReviewModal, { MonthlyReviewState } from './components/MonthlyReviewModal';
import { Task, Transaction, DayLog, Achievement, TaskTier, ExpenseCategory, WhyCard } from './types';
import { playClickSound, playLevelUpSound, playQuestSuccessSound } from './utils/audio';
import { loadAvatar, loadAllBodyPhotos, saveAvatar, saveBodyPhoto, deleteBodyPhoto, compressImage } from './utils/imageDB';
import { isConfigured, loadFirebase } from './firebase';
import { GameState } from './utils/firestoreSync';
import { useFirebaseSync } from './hooks/useFirebaseSync';
const AuthModal = React.lazy(() => import('./components/AuthModal'));
import ImportConfirmModal from './components/ImportConfirmModal';
import { exportBackup, migrate, SCHEMA_VERSION, BackupData } from './utils/schema';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { getTodayDateString, getCurrentYearMonth } from './utils/date';
import { getRankForLevel, getXpNeeded, applyXpGain, DAILY_TASK_XP_CAP, DAILY_TIER_CAPS } from './utils/xp';
import { getDailyChallenge, checkChallengeCondition } from './utils/challenge';
import { getStreakMilestoneMsg, computeStreakRollover } from './utils/streak';
import { usePersistedState, codecs, Codec } from './hooks/usePersistedState';

// ── PROGRESSION REDUCER ──────────────────────────────────────────────────────
// {level, xp} live together so multi-level rollover (applyXpGain) is atomic and
// the reducer stays PURE — no setState/sound/setTimeout inside it (those live in
// a level-watching effect). See .sdd/specs/feat-xp-progression-hardening/SPEC.md.
interface Progress { level: number; xp: number; }
type ProgressAction =
  | { type: 'addXp'; amount: number }
  | { type: 'set'; level: number; xp: number };

function progressReducer(state: Progress, action: ProgressAction): Progress {
  if (action.type === 'set') return { level: action.level, xp: action.xp };
  const res = applyXpGain(state.xp, state.level, action.amount);
  return { level: res.level, xp: res.xp };
}

export default function App() {
  // ── ONBOARDING ─────────────────────────────────────────────────────────────
  const [showOnboarding] = React.useState<boolean>(() => {
    const done = localStorage.getItem('ironwill_onboarding_done');
    const hasData = localStorage.getItem('ironwill_level') !== null;
    if (hasData && done === null) {
      // Existing user before onboarding feature — mark as done silently
      localStorage.setItem('ironwill_onboarding_done', 'true');
    }
    return done === null && !hasData;
  });
  const [onboardingDone, setOnboardingDone] = React.useState(!showOnboarding);

  // ── CORE STATE (persisted via usePersistedState — key prefix ironwill_) ──────
  const hunterNameCodec: Codec<string> = { parse: (r) => r || 'Challenger', serialize: (v) => v };
  const [hunterName, setHunterName] = usePersistedState('ironwill_hunter_name', 'Challenger', hunterNameCodec);

  const [{ level, xp }, dispatchProgress] = React.useReducer(
    progressReducer,
    undefined,
    (): Progress => ({
      level: parseInt(localStorage.getItem('ironwill_level') || '1'),
      xp: parseInt(localStorage.getItem('ironwill_xp') || '0'),
    })
  );
  // Set true right before a 'set' dispatch (login/import/onboarding) so the
  // level-watching effect doesn't pop a level-up modal for non-gameplay changes.
  const suppressLevelUpRef = React.useRef(false);
  // Persist reducer-owned level/xp (the other state persists itself via the hook).
  React.useEffect(() => {
    localStorage.setItem('ironwill_level', String(level));
    localStorage.setItem('ironwill_xp', String(xp));
  }, [level, xp]);

  const [streak, setStreak] = usePersistedState('ironwill_streak', 0, codecs.int);
  const [shields, setShields] = usePersistedState('ironwill_shields', 0, codecs.int);
  const [disciplineMode, setDisciplineMode] = usePersistedState('ironwill_discipline_mode', true, codecs.bool);
  const [soundEnabled, setSoundEnabled] = usePersistedState('ironwill_sound_enabled', true, codecs.bool);
  const [whyCards, setWhyCards] = usePersistedState<WhyCard[]>('ironwill_why_cards', [], codecs.json());
  const [monthlyBudgets, setMonthlyBudgets] = usePersistedState<Record<string, number>>('ironwill_monthly_budgets', {}, codecs.json());
  const [monthlyReview, setMonthlyReview] = React.useState<MonthlyReviewState | null>(null);
  const [routineLabels, setRoutineLabels] = usePersistedState<Record<string, string>>(
    'ironwill_routine_labels',
    { eat: 'EAT CLEAN', pray: 'CLEAR MIND', train: 'MOVE BODY', study: 'SKILL UP', work: 'DEEP WORK', sleep: 'SLEEP WELL' },
    codecs.json(),
  );
  const [routineDescs, setRoutineDescs] = usePersistedState<Record<string, string>>('ironwill_routine_descs', {}, codecs.json());
  const [dailyRoutines, setDailyRoutines] = usePersistedState<Record<string, boolean>>(
    'ironwill_daily_routines',
    { eat: false, pray: false, train: false, study: false, work: false, sleep: false },
    codecs.json(),
  );
  const [tasks, setTasks] = usePersistedState<Task[]>('ironwill_tasks', [], codecs.json());
  // Tasks auto-dọn từ ngày cũ — không xóa hẳn (đếm achievement + xem Lịch sử)
  const [archivedTasks, setArchivedTasks] = usePersistedState<Task[]>('ironwill_archived_tasks', [], codecs.json());
  const [transactions, setTransactions] = usePersistedState<Transaction[]>('ironwill_transactions', [], codecs.json());
  const [weightLogs, setWeightLogs] = usePersistedState<{ date: string; weight: number }[]>('ironwill_weight_logs', [], codecs.json());
  const [logs, setLogs] = usePersistedState<DayLog[]>('ironwill_logs', [], codecs.json());
  const [achievements, setAchievements] = usePersistedState<Achievement[]>('ironwill_achievements', [
    { id: 'ach1', title: 'CHẶNG ĐƯỜNG KỶ LUẬT',   description: 'Duy trì chuỗi kỷ luật 7 ngày liên tiếp không gián đoạn.',              badge: '🛡️', unlockedAt: null },
    { id: 'ach2', title: 'APEX BOSS RAID',          description: 'Hoàn thành 5 BOSS RAID — chứng minh bản lĩnh trước thử thách tối thượng.', badge: '👑', unlockedAt: null },
    { id: 'ach3', title: 'CHỐNG RÒ RỈ HOÀN HẢO',  description: 'Ghi nhận hơn 3 giao dịch mà không có khoản chi discretionary nào.',       badge: '💎', unlockedAt: null },
    { id: 'ach4', title: 'CHIẾN THẦN THỂ HÌNH',    description: 'Theo dõi cân nặng cơ thể 4 lần — cam kết với hành trình thể hình dài hạn.',badge: '🏋️', unlockedAt: null },
  ], codecs.json());

  const [activeTab, setActiveTab] = React.useState<'QUEST' | 'TREASURY' | 'JOURNEY'>('QUEST');
  const [levelUpInfo, setLevelUpInfo] = React.useState<LevelUpInfo | null>(null);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [bodyPhotos, setBodyPhotos] = React.useState<Record<string, string>>({});

  // ── AUTH STATE ──────────────────────────────────────────────────────────────
  // currentUser is provided by useFirebaseSync (declared after applyGameState below).
  const [showAuthModal, setShowAuthModal] = React.useState<boolean>(() => {
    if (!isConfigured) return false;
    // Show auth gate unless user explicitly chose guest mode (ironwill_guest_mode = 'true').
    // Cleared on sign-out → auth gate reappears. Let onAuthStateChanged hide it for
    // returning Firebase users once their session is restored.
    return localStorage.getItem('ironwill_guest_mode') !== 'true';
  });

  const [pendingImport, setPendingImport] = React.useState<BackupData | null>(null);

  // ── AWAKEN BOOT INTRO ─────────────────────────────────────────────────────
  // Glitch + electric-zap intro shown once per session the moment the user
  // enters the app (after login / guest entry), independent of onboarding.
  const [showIntro, setShowIntro] = React.useState(false);
  const introPlayedRef = React.useRef(false);
  React.useEffect(() => {
    if (showAuthModal || introPlayedRef.current) return;
    introPlayedRef.current = true;
    setShowIntro(true);
  }, [showAuthModal]);

  // ── DATE-BASED RESET (chạy 1 lần khi mount) ────────────────────────────
  React.useEffect(() => {
    const today = getTodayDateString();
    const lastOpenDate = localStorage.getItem('ironwill_last_open_date');

    if (lastOpenDate && lastOpenDate !== today) {
      const daysDiff = Math.floor(
        (new Date(today).getTime() - new Date(lastOpenDate).getTime()) / 86400000
      );
      const yesterdayLog = logs.find(l => l.date === lastOpenDate);
      const score = yesterdayLog ? Object.values(yesterdayLog.routines).filter(Boolean).length : 0;

      // Pure rollover (streak/shields) — see utils/streak.ts. Side-effects applied here.
      const result = computeStreakRollover(streak, shields, score, daysDiff);
      setStreak(result.streak);
      setShields(result.shields);
      if (result.milestoneReached) setToastMsg(getStreakMilestoneMsg(result.streak));
      if (result.streak >= 7) {
        setAchievements(prev => prev.map(a =>
          a.id === 'ach1' && a.unlockedAt === null ? { ...a, unlockedAt: today } : a
        ));
      }
      setDailyRoutines({ eat: false, pray: false, train: false, study: false, work: false, sleep: false });

      // Auto-archive task ngày cũ — board fresh mỗi ngày (REQ-01).
      // Giữ lại: incomplete có deadline hôm nay/tương lai. Archive: phần còn lại.
      // Functional updates + dedupe theo id → idempotent dưới React 19 StrictMode
      // (effect chạy 2 lần) và không bị migration effect (cũng setTasks) ghi đè.
      const isRelevantToday = (t: Task) => !t.completed && !!t.dueDate && t.dueDate >= today;
      setTasks(prev => prev.filter(isRelevantToday));
      setArchivedTasks(prev => {
        const have = new Set(prev.map(t => t.id));
        const toArchive = tasks.filter(t => !isRelevantToday(t) && !have.has(t.id));
        return toArchive.length ? [...toArchive, ...prev] : prev;
      });

      // Month transition check
      const lastOpenYM = lastOpenDate.slice(0, 7);
      const currentYM  = today.slice(0, 7);
      if (lastOpenYM !== currentYM) {
        const lastMonthSpend = transactions
          .filter(t => t.type === 'EXPENSE' && t.date.startsWith(lastOpenYM))
          .reduce((sum, t) => sum + t.amount, 0);
        const lastMonthBudget = monthlyBudgets[lastOpenYM] || 0;

        let xpReward = 0;
        if (lastMonthBudget > 0) {
          const savedPct = (lastMonthBudget - lastMonthSpend) / lastMonthBudget;
          if (savedPct >= 0.30) xpReward = 200;
          else if (savedPct >= 0.15) xpReward = 120;
          else if (savedPct > 0) xpReward = 60;
        }
        if (xpReward > 0) setTimeout(() => addXP(xpReward), 300);

        setMonthlyReview({
          lastMonth: lastOpenYM,
          spend: lastMonthSpend,
          budget: lastMonthBudget,
          xpAwarded: xpReward,
          defaultNewBudget: lastMonthBudget,
        });
      }
    }

    localStorage.setItem('ironwill_last_open_date', today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── INDEXEDDB LOAD (avatar + body photos) ──────────────────────────────────
  React.useEffect(() => {
    loadAvatar().then(url => { if (url) setAvatarUrl(url); });
    loadAllBodyPhotos().then(setBodyPhotos);
  }, []);

  // ── LOCALSTORAGE MIGRATION (chạy 1 lần khi mount) ────────────────────────
  // Migrate tasks đã hoàn thành nhưng chưa có xpClaimed → đặt xpClaimed=true
  // để chặn double-earn khi user toggle lại (Known Issue CLAUDE.md)
  React.useEffect(() => {
    const savedVersion = parseInt(localStorage.getItem('ironwill_schema_version') || '0');
    if (savedVersion >= SCHEMA_VERSION) return;
    // Migrate qua functional update trên STATE hiện tại (không đọc lại localStorage gốc)
    // → tránh ghi đè kết quả auto-archive của date-reset effect chạy trước đó.
    setTasks(prev => {
      try {
        const fakeDoc = { schemaVersion: savedVersion, tasks: prev } as Parameters<typeof migrate>[0];
        return migrate(fakeDoc).tasks;
      } catch { return prev; /* ignore malformed data */ }
    });
    localStorage.setItem('ironwill_schema_version', String(SCHEMA_VERSION));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── FIREBASE AUTH ───────────────────────────────────────────────────────────
  const applyGameState = React.useCallback((s: GameState) => {
    const today = getTodayDateString();
    const isNewDay = !s.lastOpenDate || s.lastOpenDate !== today;
    const blankRoutines = { eat: false, pray: false, train: false, study: false, work: false, sleep: false };

    setHunterName(s.hunterName ?? 'Challenger');
    suppressLevelUpRef.current = true; // cloud level change is not gameplay — no modal
    dispatchProgress({ type: 'set', level: s.level ?? 1, xp: s.xp ?? 0 });
    setStreak(s.streak ?? 0);
    setShields(s.shields ?? 0);
    setDisciplineMode(s.disciplineMode ?? true);
    setSoundEnabled(s.soundEnabled ?? true);
    setOnboardingDone(s.onboardingDone ?? true);
    setRoutineLabels(s.routineLabels ?? {});
    setRoutineDescs(s.routineDescs ?? {});
    setWhyCards(s.whyCards ?? []);
    setMonthlyBudgets(s.monthlyBudgets ?? {});
    // Reset routines when cloud state is from a previous day — prevents stale ticks showing on new day
    setDailyRoutines(isNewDay ? blankRoutines : (s.dailyRoutines ?? blankRoutines));
    setTasks(s.tasks ?? []);
    setArchivedTasks(s.archivedTasks ?? []);
    setTransactions(s.transactions ?? []);
    setWeightLogs(s.weightLogs ?? []);
    setLogs(s.logs ?? []);
    if (s.achievements?.length) setAchievements(s.achievements);
    // Always write today as the last-open date so the mount effect doesn't re-trigger yesterday's logic
    localStorage.setItem('ironwill_last_open_date', today);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Current snapshot for cloud sync. Memoized so its identity changes only when a
  // real field changes → useFirebaseSync's debounce timer doesn't reset every render.
  const gameState = React.useMemo<GameState>(() => ({
    hunterName, level, xp, streak, shields, disciplineMode, soundEnabled,
    onboardingDone, routineLabels, routineDescs, whyCards, monthlyBudgets, dailyRoutines,
    tasks, archivedTasks, transactions, weightLogs, logs, achievements,
    lastOpenDate: localStorage.getItem('ironwill_last_open_date') ?? getTodayDateString(),
  }), [
    hunterName, level, xp, streak, shields, disciplineMode, soundEnabled,
    onboardingDone, routineLabels, routineDescs, whyCards, monthlyBudgets, dailyRoutines,
    tasks, archivedTasks, transactions, weightLogs, logs, achievements,
  ]);

  const currentUser = useFirebaseSync({
    state: gameState,
    applyState: applyGameState,
    onUserChange: (user) => { if (user) setShowAuthModal(false); }, // close auth gate on login
  });

  // Persistence is handled per-key by usePersistedState; level/xp by the effect
  // above; schema_version by the migration effect. (Old mega-effect removed.)

  // ── XP & LEVEL-UP ─────────────────────────────────────────────────────────
  const xpNeeded = getXpNeeded(level);
  const todayStr = getTodayDateString();
  const todayChallenge = getDailyChallenge(todayStr);
  const isChallengeConditionMet = checkChallengeCondition(todayChallenge, dailyRoutines, tasks, todayStr);
  const isChallengeAlreadyClaimed = logs.find(l => l.date === todayStr)?.dailyChallengeClaimed ?? false;
  const totalTasksCompleted = [...tasks, ...archivedTasks].filter(t => t.completed).length;

  // Pure dispatch — multi-level rollover handled in the reducer. Stable identity.
  const addXP = React.useCallback((amount: number) => {
    dispatchProgress({ type: 'addXp', amount });
  }, []);

  // Level-up modal + sound react to `level` increasing from gameplay. Changes
  // caused by login/import/onboarding are suppressed via suppressLevelUpRef so
  // they don't pop a spurious modal. Showing the FINAL level covers multi-level
  // jumps with a single modal.
  const prevLevelRef = React.useRef(level);
  React.useEffect(() => {
    const prevLevel = prevLevelRef.current;
    prevLevelRef.current = level;
    if (suppressLevelUpRef.current) { suppressLevelUpRef.current = false; return; }
    if (level <= prevLevel) return;
    const prevRank = getRankForLevel(prevLevel);
    const newRank  = getRankForLevel(level);
    if (soundEnabled) playLevelUpSound();
    setLevelUpInfo({ level, rank: newRank, rankChanged: prevRank !== newRank, prevRank });
  }, [level, soundEnabled]);

  // ── ACHIEVEMENTS ───────────────────────────────────────────────────────────
  const unlockAchievement = React.useCallback((id: string) => {
    setAchievements(prev => prev.map(a => {
      if (a.id === id && a.unlockedAt === null) {
        if (soundEnabled) setTimeout(() => playQuestSuccessSound(), 200);
        return { ...a, unlockedAt: getTodayDateString() };
      }
      return a;
    }));
  }, [soundEnabled]);

  // ── HANDLERS ───────────────────────────────────────────────────────────────
  const addTask = (title: string, tier: TaskTier, dueDate?: string) => {
    const newTask: Task = {
      id: `task_${Date.now()}`, title, tier, completed: false,
      createdAt: getTodayDateString(),
      ...(dueDate ? { dueDate } : {}),
    };
    setTasks(prev => [...prev, newTask]);
  };

  const toggleTask = (id: string) => {
    const today = getTodayDateString();
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const nextCompleted = !task.completed;

    if (nextCompleted && !task.xpClaimed) {
      // First-ever completion — guard against re-earn exploit
      const reward = task.tier === 'BOSS' ? 50 : task.tier === 'DUNGEON' ? 20 : 10;

      // Both caps read from DayLog — immune to task deletion exploit
      const todayLog = logs.find(l => l.date === today);
      const earnedToday   = todayLog?.taskXpEarned ?? 0;
      const tierUsedToday = todayLog?.taskCountByTier?.[task.tier] ?? 0;
      const tierCapHit    = tierUsedToday >= DAILY_TIER_CAPS[task.tier];

      const xpToAdd = tierCapHit || earnedToday >= DAILY_TASK_XP_CAP
        ? 0
        : Math.min(reward, DAILY_TASK_XP_CAP - earnedToday);

      if (xpToAdd > 0) {
        addXP(xpToAdd);
        setLogs(prevLogs => {
          const entry = prevLogs.find(l => l.date === today);
          const updated: DayLog = {
            ...(entry ?? { date: today, routines: {}, note: '' }),
            taskXpEarned: (entry?.taskXpEarned ?? 0) + xpToAdd,
            taskCountByTier: {
              ...(entry?.taskCountByTier ?? {}),
              [task.tier]: (entry?.taskCountByTier?.[task.tier] ?? 0) + 1,
            },
          };
          return prevLogs.some(l => l.date === today)
            ? prevLogs.map(l => l.date === today ? updated : l)
            : [...prevLogs, updated];
        });
      }

      if (task.tier === 'BOSS') {
        const bossCount = [...tasks, ...archivedTasks].filter(x => x.tier === 'BOSS' && x.completed).length + 1;
        if (bossCount >= 5) unlockAchievement('ach2');
      }

      setTasks(prev => prev.map(t =>
        t.id === id ? { ...t, completed: true, xpClaimed: true, completedAt: today, ...(xpToAdd > 0 ? { claimedAt: today } : {}) } : t
      ));
    } else {
      // Re-toggle (uncomplete or re-complete already-claimed) — no XP either way
      setTasks(prev => prev.map(t => {
        if (t.id !== id) return t;
        if (nextCompleted) return { ...t, completed: true, completedAt: today };
        const { completedAt: _removed, ...rest } = t; // clear on un-complete
        return { ...rest, completed: false };
      }));
    }
  };

  const deleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

  const addTransaction = (
    title: string, amount: number,
    type: 'INCOME' | 'EXPENSE',
    category: ExpenseCategory | 'Income Source'
  ) => {
    const today = getTodayDateString();
    // +10 XP chỉ cho lần ghi đầu tiên trong ngày — reward habit tracking, không reward volume
    const isFirstLogToday = !transactions.some(t => t.date === today);
    const newTr: Transaction = { id: `tr_${Date.now()}`, title, amount, type, category, date: today };
    setTransactions(prev => {
      const updated = [...prev, newTr];
      const leaks = updated.filter(t => t.type === 'EXPENSE' && t.category === 'Unnecessary Leaks').length;
      if (updated.length > 3 && leaks === 0 && category !== 'Unnecessary Leaks') unlockAchievement('ach3');
      return updated;
    });
    if (isFirstLogToday) addXP(10);
  };

  const deleteTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));

  const toggleRoutine = (routineId: string) => {
    const today = getTodayDateString();
    const nextDone = !dailyRoutines[routineId];
    const wasAllDone = Object.values(dailyRoutines).every(Boolean);
    const updated = { ...dailyRoutines, [routineId]: nextDone };
    const nowAllDone = Object.values(updated).every(Boolean);

    // Read today's XP claim flags from logs (fresh per render)
    const todayLog = logs.find(l => l.date === today);
    const claimedRoutines = todayLog?.routineXpClaimed || {};
    const overdriveAlreadyClaimed = todayLog?.overdriveXpClaimed || false;

    // Routine XP: only if first time this routine is checked today
    if (nextDone && !claimedRoutines[routineId]) {
      addXP(5);
      if (soundEnabled) playQuestSuccessSound();
    } else if (!nextDone) {
      if (soundEnabled) playClickSound();
    }

    // OVERDRIVE: only first time all 6 complete today
    const overdriveFires = !wasAllDone && nowAllDone && !overdriveAlreadyClaimed;
    if (overdriveFires) setTimeout(() => addXP(50), 150);

    setDailyRoutines(updated);

    setLogs(prevLogs => {
      const newXpClaimed = nextDone
        ? { ...claimedRoutines, [routineId]: true }
        : claimedRoutines; // keep claimed even when unchecked
      const newOverdriveXpClaimed = overdriveAlreadyClaimed || overdriveFires;

      // Use prevLogs (not closure todayLog) so concurrent setLogs calls from toggleTask
      // don't get overwritten — preserves taskCountByTier / taskXpEarned
      const prevEntry = prevLogs.find(l => l.date === today);
      const entry: DayLog = {
        ...(prevEntry ?? { date: today, routines: {}, note: '' }),
        routines: updated,
        routineXpClaimed: newXpClaimed,
        overdriveXpClaimed: newOverdriveXpClaimed,
      };

      if (prevLogs.some(l => l.date === today)) {
        return prevLogs.map(l => l.date === today ? entry : l);
      }
      return [...prevLogs, entry];
    });
  };

  const setRoutineLabel = (id: string, label: string) =>
    setRoutineLabels(prev => ({ ...prev, [id]: label }));

  const setRoutineDesc = (id: string, desc: string) =>
    setRoutineDescs(prev => ({ ...prev, [id]: desc }));

  const claimDailyChallenge = () => {
    const today = getTodayDateString();
    if (logs.find(l => l.date === today)?.dailyChallengeClaimed) return;
    addXP(todayChallenge.xp);
    if (soundEnabled) playQuestSuccessSound();
    setLogs(prevLogs => {
      const entry = prevLogs.find(l => l.date === today);
      const updated: DayLog = {
        ...(entry ?? { date: today, routines: {}, note: '' }),
        dailyChallengeClaimed: true,
      };
      return prevLogs.some(l => l.date === today)
        ? prevLogs.map(l => l.date === today ? updated : l)
        : [...prevLogs, updated];
    });
  };

  const setCurrentMonthBudget = (amount: number) => {
    const ym = getCurrentYearMonth();
    setMonthlyBudgets(prev => ({ ...prev, [ym]: amount }));
  };

  const handleMonthlyReviewConfirm = (newBudget: number) => {
    const ym = getCurrentYearMonth();
    setMonthlyBudgets(prev => ({ ...prev, [ym]: newBudget }));
    setMonthlyReview(null);
  };

  const addWeightLog = (weight: number) => {
    const today = getTodayDateString();
    const isFirstToday = !weightLogs.some(w => w.date === today);
    setWeightLogs(prev => {
      const updated = isFirstToday
        ? [...prev, { date: today, weight }]
        : prev.map(w => w.date === today ? { ...w, weight } : w);
      if (updated.length >= 4) unlockAchievement('ach4');
      return updated;
    });
    if (isFirstToday) addXP(5);
  };

  const updateTodayNote = (note: string) => {
    const today = getTodayDateString();
    setLogs(prev => {
      const exists = prev.some(l => l.date === today);
      if (exists) return prev.map(l => l.date === today ? { ...l, note } : l);
      return [...prev, { date: today, routines: dailyRoutines, note }];
    });
  };

  // ── IMAGE HANDLERS ─────────────────────────────────────────────────────────
  const handleAvatarChange = async (dataURL: string) => {
    try {
      await saveAvatar(dataURL);
      setAvatarUrl(dataURL);
    } catch { /* silently ignore — unsupported browser */ }
  };

  const handleSignOut = async () => {
    const fb = isConfigured ? await loadFirebase() : null;
    if (fb) {
      try {
        const { signOut } = await import('firebase/auth');
        await signOut(fb.auth);
      } catch { /* ignore */ }
    }
    // Clear all local game data so next session starts fresh (includes ironwill_guest_mode)
    Object.keys(localStorage)
      .filter(k => k.startsWith('ironwill_'))
      .forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  // Closing the auth modal without signing in → mark as guest so modal doesn't re-show
  const handleCloseAuthModal = () => {
    localStorage.setItem('ironwill_guest_mode', 'true');
    setShowAuthModal(false);
  };

  // ── EXPORT / IMPORT ───────────────────────────────────────────────────────
  const handleExport = () => {
    exportBackup({
      hunterName, level, xp, streak, shields, disciplineMode, soundEnabled,
      onboardingDone, whyCards, monthlyBudgets, routineLabels, routineDescs, dailyRoutines,
      tasks, archivedTasks, transactions, weightLogs, logs, achievements,
      lastOpenDate: localStorage.getItem('ironwill_last_open_date') ?? getTodayDateString(),
      avatarUrl, bodyPhotos, // ảnh đi kèm file backup (không vào Firestore — xem feat-backup-photos)
    });
  };

  const handleImportRequest = (backup: BackupData) => {
    setPendingImport(backup);
  };

  const handleImportConfirm = () => {
    if (!pendingImport) return;
    const s = pendingImport;
    // Apply all state
    setHunterName(s.hunterName ?? 'Challenger');
    suppressLevelUpRef.current = true; // imported level change is not gameplay — no modal
    dispatchProgress({ type: 'set', level: s.level ?? 1, xp: s.xp ?? 0 });
    setStreak(s.streak ?? 0);
    setShields(s.shields ?? 0);
    setDisciplineMode(s.disciplineMode ?? true);
    setSoundEnabled(s.soundEnabled ?? true);
    setOnboardingDone(s.onboardingDone ?? true);
    setRoutineLabels(s.routineLabels ?? {});
    setRoutineDescs(s.routineDescs ?? {});
    setWhyCards(s.whyCards ?? []);
    setMonthlyBudgets(s.monthlyBudgets ?? {});
    setDailyRoutines(s.dailyRoutines ?? {});
    setTasks(s.tasks ?? []);
    setArchivedTasks(s.archivedTasks ?? []);
    setTransactions(s.transactions ?? []);
    setWeightLogs(s.weightLogs ?? []);
    setLogs(s.logs ?? []);
    if (s.achievements?.length) setAchievements(s.achievements);
    // Restore images into IndexedDB + state (overlay; non-destructive of photos not in backup).
    if (s.avatarUrl) { setAvatarUrl(s.avatarUrl); saveAvatar(s.avatarUrl).catch(() => {}); }
    if (s.bodyPhotos) {
      setBodyPhotos(s.bodyPhotos);
      Object.entries(s.bodyPhotos).forEach(([date, url]) => { saveBodyPhoto(date, url).catch(() => {}); });
    }
    if (s.lastOpenDate) localStorage.setItem('ironwill_last_open_date', s.lastOpenDate);
    localStorage.setItem('ironwill_schema_version', String(SCHEMA_VERSION));
    setPendingImport(null);
  };

  const handleBodyPhotoSave = async (date: string, file: File) => {
    try {
      const compressed = await compressImage(file);
      await saveBodyPhoto(date, compressed);
      setBodyPhotos(prev => ({ ...prev, [date]: compressed }));
    } catch { /* silently ignore */ }
  };

  const handleBodyPhotoDelete = async (date: string) => {
    await deleteBodyPhoto(date);
    setBodyPhotos(prev => { const next = { ...prev }; delete next[date]; return next; });
  };

  // ── ONBOARDING COMPLETE ────────────────────────────────────────────────────
  const handleOnboardingComplete = (name: string, firstTask: string, whyCard: WhyCard) => {
    setHunterName(name);
    if (firstTask) addTask(firstTask, 'BOSS');
    setWhyCards([whyCard]);
    dispatchProgress({ type: 'set', level: 1, xp: 30 }); // Endowed progress — phần thưởng khởi hành
    localStorage.setItem('ironwill_onboarding_done', 'true');
    setOnboardingDone(true);
  };

  const handleOnboardingSkip = () => {
    localStorage.setItem('ironwill_onboarding_done', 'true');
    setOnboardingDone(true);
  };

  const themeStyle = disciplineMode ? 'discipline' : 'motivation';

  return (
    <div className="min-h-screen transition-all duration-500 bg-[#0F0F12] font-sans text-neutral-300 selection:bg-orange-950 selection:text-orange-100">

      {/* Modals & toasts */}
      {showIntro && <BootIntro onDone={() => setShowIntro(false)} />}
      {!onboardingDone && !showAuthModal && <OnboardingModal onComplete={handleOnboardingComplete} onSkip={handleOnboardingSkip} onShowAuth={isConfigured ? () => setShowAuthModal(true) : undefined} />}
      <LevelUpModal info={levelUpInfo} onClose={() => setLevelUpInfo(null)} />
      <CelebrationToast message={toastMsg} onClose={() => setToastMsg(null)} />
      <MonthlyReviewModal review={monthlyReview} onConfirm={handleMonthlyReviewConfirm} />

      <AppBackdrop themeStyle={themeStyle} />

      {/* Main content — safe-area insets so header/footer clear notch + home bar (standalone) */}
      <div
        className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8"
        style={{
          paddingTop: 'calc(2rem + env(safe-area-inset-top))',
          paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))',
        }}
      >

        <AppHeader themeStyle={themeStyle} hunterName={hunterName} level={level} />

        <StatusHeader
          hunterName={hunterName} setHunterName={setHunterName}
          level={level} xp={xp} xpNeeded={xpNeeded}
          rank={getRankForLevel(level)} streak={streak} shields={shields}
          disciplineMode={disciplineMode} setDisciplineMode={setDisciplineMode}
          soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled}
          totalTasksCompleted={totalTasksCompleted} themeStyle={themeStyle}
          avatarUrl={avatarUrl} onAvatarChange={handleAvatarChange}
          achievements={achievements}
          authUserEmail={currentUser?.email ?? null}
          onShowAuth={() => setShowAuthModal(true)}
          onSignOut={handleSignOut}
        />
        {showAuthModal && (
          <React.Suspense fallback={null}>
            <AuthModal onClose={handleCloseAuthModal} />
          </React.Suspense>
        )}

        <nav className="grid grid-cols-3 gap-2 bg-zinc-900/80 p-1.5 rounded-xl border border-white/10">
          {(['QUEST', 'TREASURY', 'JOURNEY'] as const).map(tab => {
            const icons = { QUEST: Map, TREASURY: Coins, JOURNEY: History };
            const labels = { QUEST: 'QUEST BOARD (Rèn luyện)', TREASURY: 'TREASURY LEDGER (Chi tiêu)', JOURNEY: 'TIMELINE (Nhật ký)' };
            const shortLabels = { QUEST: 'QUEST', TREASURY: 'TREASURY', JOURNEY: 'JOURNEY' };
            const Icon = icons[tab];
            return (
              <button key={tab}
                onClick={() => { if (soundEnabled) playClickSound(); setActiveTab(tab); }}
                className={`py-3.5 px-3 rounded-lg text-xs font-mono font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab ? 'bg-orange-600 text-black font-black italic shadow-[0_0_12px_rgba(234,88,12,0.2)]' : 'text-zinc-500 hover:text-neutral-400'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">{labels[tab]}</span>
                <span className="sm:hidden truncate">{shortLabels[tab]}</span>
              </button>
            );
          })}
        </nav>

        <main>
          {activeTab === 'QUEST' && (
            <QuestBoard
              tasks={tasks} archivedTasks={archivedTasks}
              addTask={addTask} toggleTask={toggleTask} deleteTask={deleteTask}
              dailyRoutines={dailyRoutines} toggleRoutine={toggleRoutine}
              disciplineMode={disciplineMode} soundEnabled={soundEnabled} addXP={addXP}
              whyCards={whyCards} setWhyCards={setWhyCards}
              routineLabels={routineLabels} setRoutineLabel={setRoutineLabel}
              routineDescs={routineDescs} setRoutineDesc={setRoutineDesc}
              taskTierCountsToday={
                logs.find(l => l.date === getTodayDateString())?.taskCountByTier ?? {}
              }
              dailyChallenge={todayChallenge}
              isChallengeConditionMet={isChallengeConditionMet}
              isChallengeAlreadyClaimed={isChallengeAlreadyClaimed}
              claimDailyChallenge={claimDailyChallenge}
            />
          )}
          {activeTab === 'TREASURY' && (
            <TreasuryBoard
              transactions={transactions} addTransaction={addTransaction}
              deleteTransaction={deleteTransaction} soundEnabled={soundEnabled}
              currentMonthBudget={monthlyBudgets[getCurrentYearMonth()] || 0}
              setCurrentMonthBudget={setCurrentMonthBudget}
            />
          )}
          {activeTab === 'JOURNEY' && (
            <Timeline
              logs={logs} achievements={achievements}
              weightLogs={weightLogs} addWeightLog={addWeightLog}
              bodyPhotos={bodyPhotos} soundEnabled={soundEnabled}
              onUpdateNote={updateTodayNote}
              onSaveBodyPhoto={handleBodyPhotoSave}
              onDeleteBodyPhoto={handleBodyPhotoDelete}
              onExport={handleExport}
              onImportRequest={handleImportRequest}
              isLoggedIn={!!currentUser}
              userEmail={currentUser?.email ?? null}
              onShowAuth={isConfigured ? () => setShowAuthModal(true) : undefined}
            />
          )}
          {pendingImport && (
            <ImportConfirmModal
              backup={pendingImport}
              onConfirm={handleImportConfirm}
              onCancel={() => setPendingImport(null)}
            />
          )}
        </main>

        <AppFooter />
      </div>
      <PWAInstallPrompt />
    </div>
  );
}
