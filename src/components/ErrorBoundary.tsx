import React from 'react';

// Class component because React error boundaries must be class-based. Catches
// render errors in the tree below and shows a rescue screen instead of a blank
// page — data stays safe in localStorage. See .sdd/specs/feat-error-boundary/SPEC.md.

interface Props { children: React.ReactNode; }
interface State { error: Error | null; }

function rescueExport(): void {
  try {
    const dump: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ironwill_')) dump[key] = localStorage.getItem(key) ?? '';
    }
    const today = new Date().toISOString().split('T')[0]; // raw — schema-independent rescue file
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `levelup-rescue-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Rescue export failed', e);
  }
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('App crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen bg-[#0F0F12] text-neutral-300 font-sans flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-950/40 border border-white/10 rounded-2xl p-6 space-y-4 text-center">
          <div className="text-3xl">🛡️</div>
          <h1 className="text-base font-black text-white tracking-wide uppercase">Đã xảy ra lỗi</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Ứng dụng gặp sự cố hiển thị, nhưng <span className="text-emerald-400 font-medium">dữ liệu của bạn vẫn an toàn</span> trong
            trình duyệt. Hãy tải lại; nếu vẫn lỗi, xuất dữ liệu ra file để giữ an toàn.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-2.5 rounded-lg bg-orange-600 text-black font-bold text-sm hover:bg-orange-500 transition-colors"
            >
              Tải lại
            </button>
            <button
              onClick={rescueExport}
              className="flex-1 py-2.5 rounded-lg border border-white/15 text-neutral-200 font-mono text-sm hover:bg-zinc-900 transition-colors"
            >
              Xuất dữ liệu (.json)
            </button>
          </div>
          <p className="text-[10px] font-mono text-zinc-600 break-words pt-1">{this.state.error.message}</p>
        </div>
      </div>
    );
  }
}
