import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { BackupData } from '../utils/schema';

interface ImportConfirmModalProps {
  backup: BackupData;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ImportConfirmModal({ backup, onConfirm, onCancel }: ImportConfirmModalProps) {
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-zinc-950 border border-red-800/40 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(239,68,68,0.08)]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-red-600/20 border border-red-500/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-xs font-black text-white font-mono uppercase italic">Xác Nhận Ghi Đè Dữ Liệu</p>
          </div>
          <button onClick={onCancel} aria-label="Hủy import" className="text-zinc-600 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-xs font-mono text-zinc-400">
            Hành động này sẽ <span className="text-red-400 font-bold">xóa toàn bộ dữ liệu hiện tại</span> và thay thế bằng file backup. Không thể hoàn tác.
          </p>

          <div className="bg-black/50 border border-white/8 rounded-xl p-4 space-y-2 text-[11px] font-mono">
            <div className="flex justify-between">
              <span className="text-zinc-500">Tên chiến binh</span>
              <span className="text-white font-bold">{backup.hunterName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Level</span>
              <span className="text-orange-400 font-bold">{backup.level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Ngày export</span>
              <span className="text-zinc-300">{backup.exportedAt ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Số nhiệm vụ</span>
              <span className="text-zinc-300">{backup.tasks?.length ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Số ảnh</span>
              <span className="text-zinc-300">{(backup.avatarUrl ? 1 : 0) + Object.keys(backup.bodyPhotos ?? {}).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Schema version</span>
              <span className="text-zinc-500">v{backup.schemaVersion}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-widest rounded-lg transition-all"
            >
              Hủy
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 bg-red-700 hover:bg-red-600 text-white font-black italic text-xs uppercase tracking-widest rounded-lg transition-all"
            >
              Ghi Đè Ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
