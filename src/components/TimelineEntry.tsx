import React from 'react';
import { Scale, Camera, X, Star } from 'lucide-react';

export interface Entry {
  isoDate: string;
  displayDate: string;
  note: string;
  score: number;
  routines: Record<string, boolean>;
  weight?: number;
  photo?: string;
  milestones: string[];
  isToday: boolean;
}

interface Props {
  entry: Entry;
  noteText: string;
  onNoteChange: (text: string) => void;
  onNoteBlur: () => void;
  onPhotoUpload: (date: string) => void;
  onPhotoDelete: (date: string) => void;
  onLightbox: (url: string) => void;
}

export default function TimelineEntry({
  entry, noteText, onNoteChange, onNoteBlur,
  onPhotoUpload, onPhotoDelete, onLightbox,
}: Props) {
  const routineVals = Object.values(entry.routines);
  // Include photo in hasContent so photo-only days show up
  const hasContent = entry.note || entry.weight !== undefined || entry.photo || entry.milestones.length > 0 || entry.score > 0;
  if (!hasContent && !entry.isToday) return null;

  return (
    <div className="relative pl-8">
      {/* Timeline dot */}
      <div className={`absolute left-0 top-3 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
        entry.isToday
          ? 'border-orange-500 bg-orange-500 shadow-[0_0_8px_rgba(234,88,12,0.5)]'
          : entry.score === 6
            ? 'border-orange-400 bg-orange-400/30'
            : entry.photo
              ? 'border-sky-500/60 bg-sky-500/10'
              : 'border-zinc-600 bg-zinc-900'
      }`}>
        {entry.score === 6 && !entry.isToday && <Star className="w-2 h-2 text-orange-400" />}
      </div>

      <div className={`mb-2 rounded-xl border p-4 transition-all ${
        entry.isToday ? 'bg-orange-950/10 border-orange-500/25' : 'bg-zinc-900/40 border-white/5'
      }`}>
        {/* Date + routine dots */}
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <span className={`text-[10px] font-mono uppercase tracking-widest ${entry.isToday ? 'text-orange-400' : 'text-zinc-500'}`}>
            {entry.isToday ? '◉ HÔM NAY —' : '○'} {entry.displayDate}
          </span>
          {routineVals.length > 0 && (
            <div className="flex items-center gap-1.5">
              {routineVals.map((done, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${done ? 'bg-orange-500' : 'bg-zinc-800'}`} />
              ))}
              <span className="text-[9px] font-mono text-zinc-600 ml-1">{entry.score}/6</span>
            </div>
          )}
        </div>

        {/* Milestone badges */}
        {entry.milestones.map((m, i) => (
          <div key={i} className="mb-2 px-3 py-1.5 rounded bg-amber-950/30 border border-amber-600/30 text-xs font-mono text-amber-400 font-bold">
            🏆 ACHIEVEMENT UNLOCKED — {m}
          </div>
        ))}

        {/* Note */}
        {entry.isToday ? (
          <textarea
            value={noteText} onChange={e => onNoteChange(e.target.value)} onBlur={onNoteBlur}
            placeholder="Hôm nay cảm giác thế nào? Điều gì đáng ghi nhớ?"
            rows={2} maxLength={200}
            className="w-full bg-black/40 border border-white/5 focus:border-orange-500/50 focus:outline-none rounded-lg px-3 py-2 text-sm text-neutral-200 resize-none mb-3"
          />
        ) : entry.note ? (
          <p className="text-sm text-zinc-300 italic mb-3 leading-snug">"{entry.note}"</p>
        ) : null}

        {/* Weight (independent of photo) */}
        {entry.weight !== undefined && (
          <div className="flex items-center gap-2 bg-black/30 border border-white/5 rounded-lg px-3 py-2 w-fit mb-3">
            <Scale className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-sm font-mono font-bold text-white">{entry.weight} kg</span>
          </div>
        )}

        {/* Body photo — always shown for all entries */}
        <div className="flex items-center gap-3">
          {entry.photo ? (
            <div className="relative group flex-shrink-0">
              <img
                src={entry.photo} alt="Body check"
                onClick={() => onLightbox(entry.photo!)}
                className="w-20 h-20 object-cover rounded-xl border border-white/10 cursor-pointer hover:border-sky-400/60 transition-all shadow-md"
              />
              <button
                onClick={() => onPhotoDelete(entry.isoDate)}
                className="absolute -top-1.5 -right-1.5 bg-red-600 rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-2.5 h-2.5 text-white" />
              </button>
              <span className="text-[8px] font-mono text-zinc-600 block text-center mt-1">Body check</span>
            </div>
          ) : (
            <button
              onClick={() => onPhotoUpload(entry.isoDate)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-zinc-700 text-zinc-600 hover:border-sky-500/50 hover:text-sky-400 transition-all text-xs font-mono"
            >
              <Camera className="w-3.5 h-3.5" />
              {entry.isToday ? 'Check body hôm nay' : 'Thêm ảnh ngày này'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
