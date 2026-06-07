import {
  Utensils, Brain, Dumbbell, BookOpen, Briefcase, Moon,
  Droplet, Target, SquareTerminal, HeartPulse, Sun, PenLine,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { RoutineDef } from '../types';

// Icon registry for routines. State stores only `iconName` (string); rendering
// looks it up here. Full Tailwind class strings (v4 purge-safe — no templates).
export interface RoutineIcon { Icon: LucideIcon; color: string; }

export const ROUTINE_ICONS: Record<string, RoutineIcon> = {
  utensils:  { Icon: Utensils,       color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
  brain:     { Icon: Brain,          color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  dumbbell:  { Icon: Dumbbell,       color: 'text-red-500 bg-red-500/10 border-red-500/30' },
  book:      { Icon: BookOpen,       color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
  briefcase: { Icon: Briefcase,      color: 'text-violet-400 bg-violet-500/10 border-violet-500/30' },
  moon:      { Icon: Moon,           color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
  droplet:   { Icon: Droplet,        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  target:    { Icon: Target,         color: 'text-orange-500 bg-orange-500/10 border-orange-500/30' },
  code:      { Icon: SquareTerminal, color: 'text-green-400 bg-green-500/10 border-green-500/30' },
  heart:     { Icon: HeartPulse,     color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  sun:       { Icon: Sun,            color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  pen:       { Icon: PenLine,        color: 'text-pink-400 bg-pink-500/10 border-pink-500/30' },
};

export const ROUTINE_ICON_KEYS = Object.keys(ROUTINE_ICONS);
export const FALLBACK_ICON = 'target';

export function getRoutineIcon(iconName: string): RoutineIcon {
  return ROUTINE_ICONS[iconName] ?? ROUTINE_ICONS[FALLBACK_ICON];
}

export const MAX_ROUTINES = 8;

// The default 6-routine template — also used by "restore default" (preserves the
// original ids so existing streak/XP keyed by id stay valid).
export const DEFAULT_ROUTINES: RoutineDef[] = [
  { id: 'eat',   label: 'EAT CLEAN',  desc: 'Ăn đủ protein + rau củ, uống đủ 2L nước',            iconName: 'utensils' },
  { id: 'pray',  label: 'CLEAR MIND', desc: '10 phút thiền / nhật ký / viết 3 mục tiêu hôm nay',  iconName: 'brain' },
  { id: 'train', label: 'MOVE BODY',  desc: '30 phút vận động: gym, chạy, đạp xe, yoga...',       iconName: 'dumbbell' },
  { id: 'study', label: 'SKILL UP',   desc: 'Đọc 20 trang sách hoặc học kỹ năng mới 30 phút',     iconName: 'book' },
  { id: 'work',  label: 'DEEP WORK',  desc: '2h tập trung sâu: tắt thông báo, một việc duy nhất', iconName: 'briefcase' },
  { id: 'sleep', label: 'SLEEP WELL', desc: 'Ngủ đủ 7-8 tiếng + chặn ánh sáng xanh',              iconName: 'moon' },
];

export function makeRoutineId(): string {
  return `r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// Build a routine list from the default template, applying any legacy
// label/desc override maps (migration for users who predate custom routines).
export function buildRoutinesFromLegacy(
  labels?: Record<string, string>,
  descs?: Record<string, string>,
): RoutineDef[] {
  return DEFAULT_ROUTINES.map(r => ({
    ...r,
    label: labels?.[r.id] ?? r.label,
    desc: descs?.[r.id] ?? r.desc,
  }));
}
