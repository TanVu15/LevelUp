import React from 'react';
import { CloudDownload, HardDrive, RefreshCw } from 'lucide-react';
import { GameState } from '../utils/firestoreSync';
import { readLocalUpdatedAt } from '../utils/syncMeta';

// Hiện khi login mà dữ liệu local MỚI HƠN cloud (feat-sync-hardening REQ-03).
// Bắt buộc chọn 1 trong 2 — không có nút đóng để tránh trạng thái 2 nguồn lệch nhau.

interface SyncConflictModalProps {
  cloud: GameState;
  local: GameState;
  onUseCloud: () => void;
  onUseLocal: () => void;
}

function formatStamp(ms: number | undefined): string {
  if (!ms) return 'không rõ';
  return new Date(ms).toLocaleString('vi-VN', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function Summary({ s, stamp }: { s: GameState; stamp: number | undefined }) {
  return (
    <div className="space-y-1.5 text-[11px] font-mono">
      <div className="flex justify-between"><span className="text-zinc-500">Level</span><span className="text-orange-400 font-bold">{s.level}</span></div>
      <div className="flex justify-between"><span className="text-zinc-500">Streak</span><span className="text-white font-bold">{s.streak} ngày</span></div>
      <div className="flex justify-between"><span className="text-zinc-500">Nhiệm vụ</span><span className="text-zinc-300">{(s.tasks?.length ?? 0) + (s.archivedTasks?.length ?? 0)}</span></div>
      <div className="flex justify-between"><span className="text-zinc-500">Giao dịch</span><span className="text-zinc-300">{s.transactions?.length ?? 0}</span></div>
      <div className="flex justify-between"><span className="text-zinc-500">Cập nhật</span><span className="text-zinc-300">{formatStamp(stamp)}</span></div>
    </div>
  );
}

export default function SyncConflictModal({ cloud, local, onUseCloud, onUseLocal }: SyncConflictModalProps) {
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-zinc-950 border border-orange-800/40 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(234,88,12,0.12)]">

        <div className="flex items-center gap-2 px-6 py-4 border-b border-white/8">
          <div className="w-7 h-7 bg-orange-600/20 border border-orange-500/30 rounded-lg flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-xs font-black text-white font-mono uppercase italic">Dữ liệu hai nơi khác nhau</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-xs font-mono text-zinc-400">
            Dữ liệu trên <span className="text-white font-bold">máy này</span> mới hơn bản trên{' '}
            <span className="text-white font-bold">cloud</span> (có thể phiên trước chưa kịp đồng bộ).
            Chọn bản muốn giữ — bản còn lại sẽ bị <span className="text-red-400 font-bold">ghi đè</span>.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/50 border border-white/8 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-sky-400">
                <CloudDownload className="w-3.5 h-3.5" /> Cloud
              </div>
              <Summary s={cloud} stamp={cloud.updatedAt} />
            </div>
            <div className="bg-black/50 border border-white/8 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-orange-400">
                <HardDrive className="w-3.5 h-3.5" /> Máy này
              </div>
              <Summary s={local} stamp={readLocalUpdatedAt() || undefined} />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onUseCloud}
              className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-widest rounded-lg transition-all"
            >
              Dùng bản Cloud
            </button>
            <button
              onClick={onUseLocal}
              className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-black font-black italic text-xs uppercase tracking-widest rounded-lg transition-all"
            >
              Giữ bản máy này
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
