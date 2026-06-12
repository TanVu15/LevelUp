import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

// Xóa tài khoản — bước xác nhận cuối (feat-account-lifecycle REQ-02).
// Gõ đúng "XOA" mới enable nút; onConfirm trả lỗi (string) nếu fail để hiển thị tại chỗ.

interface DeleteAccountModalProps {
  email: string | null;
  onConfirm: () => Promise<string | null>; // null = thành công (caller tự reload)
  onCancel: () => void;
}

export default function DeleteAccountModal({ email, onConfirm, onCancel }: DeleteAccountModalProps) {
  const [phrase, setPhrase]   = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError]     = React.useState('');
  const armed = phrase.trim().toUpperCase() === 'XOA';

  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel, loading]);

  const handleConfirm = async () => {
    if (!armed || loading) return;
    setLoading(true);
    setError('');
    const err = await onConfirm();
    if (err) { setError(err); setLoading(false); }
    // Thành công: caller clear local + reload — modal không cần tự đóng.
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-zinc-950 border border-red-800/40 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(239,68,68,0.08)]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-red-600/20 border border-red-500/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-xs font-black text-white font-mono uppercase italic">Xóa Tài Khoản Vĩnh Viễn</p>
          </div>
          <button onClick={onCancel} disabled={loading} aria-label="Đóng" className="text-zinc-600 hover:text-white transition-colors disabled:opacity-50">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-xs font-mono text-zinc-400 leading-relaxed">
            Hành động này sẽ xóa <span className="text-red-400 font-bold">vĩnh viễn, không thể hoàn tác</span>:
          </p>
          <ul className="text-[11px] font-mono text-zinc-400 space-y-1.5 bg-black/50 border border-white/8 rounded-xl p-4">
            <li>• Tài khoản{email ? <span className="text-white"> {email}</span> : ''}</li>
            <li>• Toàn bộ dữ liệu trên cloud (level, streak, quest, tài chính…)</li>
            <li>• Toàn bộ dữ liệu trên máy này (kể cả ảnh)</li>
          </ul>
          <p className="text-[11px] font-mono text-zinc-500">
            Muốn giữ bản sao? Hãy <span className="text-zinc-300">Export file backup</span> trước khi xóa.
          </p>

          <div className="space-y-1.5">
            <label htmlFor="delete-confirm-phrase" className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Gõ <span className="text-red-400 font-bold">XOA</span> để xác nhận
            </label>
            <input
              id="delete-confirm-phrase"
              value={phrase}
              onChange={e => setPhrase(e.target.value)}
              autoComplete="off"
              className="w-full bg-black/60 border border-white/5 focus:border-red-500 focus:outline-none rounded-lg px-3 py-2.5 text-sm text-neutral-200 font-mono transition-colors"
            />
          </div>

          {error && (
            <p className="text-[11px] text-red-400 font-mono bg-red-950/20 border border-red-800/30 rounded px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-widest rounded-lg transition-all disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={!armed || loading}
              className="flex-1 py-2.5 bg-red-700 hover:bg-red-600 text-white font-black italic text-xs uppercase tracking-widest rounded-lg transition-all disabled:opacity-40"
            >
              {loading ? 'Đang xóa…' : 'Xóa Vĩnh Viễn'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
