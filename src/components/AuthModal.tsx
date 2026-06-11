import React from 'react';
import { X, Mail, Lock, Zap, LogIn, UserPlus } from 'lucide-react';
import {
  GoogleAuthProvider, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, sendEmailVerification,
} from 'firebase/auth';
import type { Auth, AuthError } from 'firebase/auth';
import { loadFirebase } from '../firebase';
import { warmupAudio } from '../utils/audio';

interface AuthModalProps {
  onClose: () => void;
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// iOS standalone (app cài từ Safari): KHÔNG có cách đăng nhập Google tin cậy —
// popup không quay về app (round 1), redirect thì Google sập "Đã xảy ra lỗi" vì
// iOS cô lập storage của tấm trình duyệt nhúng (round 4, đã thử cả 2). Đây là giới
// hạn Apple, không phải config. UI: ẩn nút Google, hiện hướng dẫn dùng Email/Mật khẩu.
// Desktop + Android + Safari thường: popup chạy tốt (đã xác nhận desktop).
const isIosStandalone = typeof window !== 'undefined'
  && /iPad|iPhone|iPod/.test(navigator.userAgent)
  && (
    window.matchMedia?.('(display-mode: standalone)').matches
    || (navigator as unknown as { standalone?: boolean }).standalone === true
  );

function getFriendlyError(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':   return 'Email hoặc mật khẩu không đúng.';
    case 'auth/wrong-password':        return 'Mật khẩu không đúng.';
    case 'auth/email-already-in-use':  return 'Email này đã được sử dụng.';
    case 'auth/invalid-email':         return 'Email không hợp lệ.';
    case 'auth/weak-password':         return 'Mật khẩu quá yếu — tối thiểu 6 ký tự.';
    case 'auth/too-many-requests':     return 'Quá nhiều lần thử. Vui lòng thử lại sau.';
    case 'auth/popup-closed-by-user':  return '';
    case 'auth/cancelled-popup-request': return '';
    case 'auth/network-request-failed':return 'Lỗi mạng. Kiểm tra kết nối internet.';
    case 'auth/unauthorized-domain':   return 'Domain chưa được phép. Thêm domain này vào Firebase Console → Authentication → Settings → Authorized domains.';
    case 'auth/operation-not-allowed': return 'Đăng nhập Google chưa được bật. Bật ở Firebase Console → Authentication → Sign-in method → Google.';
    case 'auth/popup-blocked':         return 'Trình duyệt chặn popup. Cho phép popup cho trang này rồi thử lại.';
    case 'auth/internal-error':        return 'Lỗi nội bộ Firebase. Kiểm tra cấu hình OAuth.';
    default:                           return `Đã có lỗi xảy ra (${code || 'không rõ'}). Vui lòng thử lại.`;
  }
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [tab, setTab]                         = React.useState<'login' | 'register'>('login');
  const [email, setEmail]                     = React.useState('');
  const [password, setPassword]               = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading]                 = React.useState(false);
  const [error, setError]                     = React.useState('');
  const [info, setInfo]                       = React.useState(''); // thông báo trung tính (reset password)
  const [auth, setAuth]                       = React.useState<Auth | null>(null);

  const clearError = () => { setError(''); setInfo(''); };

  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  React.useEffect(() => {
    let mounted = true;
    const p = loadFirebase();
    if (p) p.then(fb => { if (mounted) setAuth(fb.auth); });
    return () => { mounted = false; };
  }, []);

  const handleGoogle = async () => {
    if (!auth) return;
    warmupAudio(); // prime audio on this gesture so the intro spark fires instantly
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      warmupAudio(); // popup may have suspended the audio ctx — resume now so the
                     // AWAKEN intro spark fires the instant onboarding mounts
      onClose();
    } catch (e) {
      console.error('[Google sign-in]', (e as AuthError).code, e);
      const msg = getFriendlyError((e as AuthError).code ?? '');
      if (msg) setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!auth) return;
    if (!email.trim()) { setError('Nhập email trước khi đặt lại mật khẩu.'); return; }
    setLoading(true);
    setError('');
    setInfo('');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo('Nếu email tồn tại, link đặt lại mật khẩu đã được gửi. Kiểm tra hộp thư (cả mục spam).');
    } catch (e) {
      const code = (e as AuthError).code ?? '';
      // Cùng thông báo trung tính khi email không tồn tại — chống dò email (REQ-01).
      if (code === 'auth/user-not-found') {
        setInfo('Nếu email tồn tại, link đặt lại mật khẩu đã được gửi. Kiểm tra hộp thư (cả mục spam).');
      } else {
        setError(getFriendlyError(code));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    warmupAudio(); // prime audio on this gesture so the intro spark fires instantly
    if (!email.trim()) { setError('Vui lòng nhập email.'); return; }
    if (!password) { setError('Vui lòng nhập mật khẩu.'); return; }
    if (password.length < 6) { setError('Mật khẩu tối thiểu 6 ký tự.'); return; }
    if (tab === 'register' && password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setLoading(true);
    setError('');
    setInfo('');
    try {
      if (tab === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        // Xác minh email — fire-and-forget, KHÔNG chặn dùng app (local-first).
        sendEmailVerification(cred.user).catch(() => {});
      }
      onClose();
    } catch (e) {
      setError(getFriendlyError((e as AuthError).code ?? ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(234,88,12,0.12)]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-orange-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-black" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[9px] font-mono text-orange-500 uppercase tracking-widest leading-none">LevelUp</p>
              <p className="text-xs font-black text-white font-mono uppercase italic leading-tight">Bắt đầu hành trình</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Đóng — chơi không cần tài khoản" className="text-zinc-600 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hook line */}
        <div className="px-6 pt-5 pb-1">
          <p className="text-[11px] font-mono text-zinc-500 text-center">
            Mọi chiến công xứng đáng được ghi nhớ — trên mọi thiết bị.
          </p>
        </div>

        <div className="px-6 py-4 space-y-3">
          {/* Google — ẩn trong app iOS đã cài (Apple chặn flow, xem isIosStandalone) */}
          {isIosStandalone ? (
            <p className="text-[10px] font-mono text-zinc-500 bg-zinc-900/60 border border-white/5 rounded-lg px-3 py-2.5 leading-relaxed">
              <span className="text-zinc-300">Đăng nhập Google không khả dụng trong app đã cài trên iOS</span> (giới hạn của Apple).
              Dùng Email/Mật khẩu bên dưới — cùng tài khoản, cùng dữ liệu.
            </p>
          ) : (
            <>
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-sm rounded-lg transition-all disabled:opacity-50"
              >
                <GoogleIcon />
                Tiếp tục với Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-[10px] font-mono text-zinc-700 uppercase">hoặc</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>
            </>
          )}

          {/* Tabs */}
          <div className="flex rounded-lg bg-black/50 border border-white/5 p-0.5">
            {(['login', 'register'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); clearError(); setConfirmPassword(''); }}
                className={`flex-1 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  tab === t
                    ? 'bg-orange-600 text-black'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t === 'login' ? <><LogIn className="w-3 h-3" /> Đăng nhập</> : <><UserPlus className="w-3 h-3" /> Đăng ký</>}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); clearError(); }}
                placeholder="Email"
                autoComplete="email"
                className="w-full bg-black/60 border border-white/5 focus:border-orange-500 focus:outline-none rounded-lg pl-9 pr-3 py-2.5 text-sm text-neutral-200 font-mono transition-colors"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); clearError(); }}
                placeholder="Mật khẩu"
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                className="w-full bg-black/60 border border-white/5 focus:border-orange-500 focus:outline-none rounded-lg pl-9 pr-3 py-2.5 text-sm text-neutral-200 font-mono transition-colors"
              />
            </div>

            {/* Confirm password — register only */}
            {tab === 'register' && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); clearError(); }}
                  placeholder="Xác nhận mật khẩu"
                  autoComplete="new-password"
                  className="w-full bg-black/60 border border-white/5 focus:border-orange-500 focus:outline-none rounded-lg pl-9 pr-3 py-2.5 text-sm text-neutral-200 font-mono transition-colors"
                />
              </div>
            )}

            {tab === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="text-[10px] font-mono text-zinc-600 hover:text-orange-400 transition-colors disabled:opacity-50"
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}

            {error && (
              <p className="text-[11px] text-red-400 font-mono bg-red-950/20 border border-red-800/30 rounded px-3 py-2">
                {error}
              </p>
            )}
            {info && (
              <p className="text-[11px] text-emerald-400 font-mono bg-emerald-950/20 border border-emerald-800/30 rounded px-3 py-2">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-black font-black italic text-sm uppercase tracking-widest rounded-lg transition-all disabled:opacity-50"
            >
              {loading ? '...' : tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>
          </form>

          {/* Guest */}
          <button
            onClick={onClose}
            className="w-full text-[10px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors py-1 border-t border-white/5 pt-3"
          >
            Chơi không cần tài khoản →
          </button>

          <p className="text-[9px] font-mono text-zinc-700 text-center leading-relaxed">
            Tiếp tục nghĩa là bạn đồng ý với{' '}
            <a href="/privacy.html" target="_blank" rel="noopener" className="text-zinc-500 hover:text-orange-400 underline transition-colors">
              Chính sách quyền riêng tư
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}
