import React from 'react';
import { Zap, Target, ChevronRight, ChevronLeft } from 'lucide-react';
import { WhyCard, WhyCardType } from '../types';

interface OnboardingModalProps {
  onComplete: (name: string, firstTask: string, whyCard: WhyCard) => void;
  onSkip: () => void;
  onShowAuth?: () => void;
}

const WHY_TYPE_OPTIONS: { type: WhyCardType; emoji: string; label: string; desc: string; activeCls: string }[] = [
  { type: 'PAIN',    emoji: '💔', label: 'Nỗi đau',  desc: 'Điều bạn không muốn tiếp diễn',   activeCls: 'border-red-500/50 text-red-400 bg-red-950/20' },
  { type: 'FAILURE', emoji: '❌', label: 'Thất bại', desc: 'Điều bạn muốn lật ngược',          activeCls: 'border-amber-500/50 text-amber-400 bg-amber-950/20' },
  { type: 'GOAL',    emoji: '🔥', label: 'Mục tiêu', desc: 'Điều bạn khao khát nhất',          activeCls: 'border-orange-500/50 text-orange-400 bg-orange-950/20' },
];

// Mobile: autoFocus bật keyboard ngay khi vào app, che nửa màn hình onboarding
// (device test iPhone). Chỉ autofocus trên pointer mịn (chuột/trackpad).
const isCoarsePointer = typeof window !== 'undefined'
  && window.matchMedia?.('(pointer: coarse)').matches;

export default function OnboardingModal({ onComplete, onSkip, onShowAuth }: OnboardingModalProps) {
  const [step, setStep] = React.useState(1);
  const [name, setName] = React.useState('');
  const [whyType, setWhyType] = React.useState<WhyCardType>('PAIN');
  const [whyTitle, setWhyTitle] = React.useState('');
  const [whyStory, setWhyStory] = React.useState('');
  const [firstTask, setFirstTask] = React.useState('');

  const canNext1 = name.trim().length >= 2;
  const canNext2 = whyTitle.trim().length >= 3;
  const canFinish = firstTask.trim().length >= 5;

  const handleComplete = () => {
    if (!canFinish) return;
    const whyCard: WhyCard = {
      id: 'why_initial',
      type: whyType,
      title: whyTitle.trim(),
      story: whyStory.trim(),
    };
    onComplete(name.trim(), firstTask.trim(), whyCard);
  };

  const stepLabel = ['', 'Tên chiến binh', 'Lý do của bạn', 'Boss Raid đầu tiên'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-md">

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-orange-500' : i < step ? 'w-4 bg-orange-700' : 'w-4 bg-zinc-700'
              }`}
            />
          ))}
        </div>

        <div className="bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(234,88,12,0.15)]">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-black" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-orange-500 uppercase tracking-widest">Step {step} / 3</p>
                <p className="text-sm font-bold text-white font-mono uppercase">{stepLabel[step]}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-6 min-h-[260px]">

            {/* Step 1: Name */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-zinc-400 text-sm font-sans leading-relaxed">
                  Chào mừng đến với hành trình rèn luyện bản thân.<br />
                  Bạn muốn được gọi là gì, chiến binh?
                </p>
                <input
                  type="text"
                  autoFocus={!isCoarsePointer}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && canNext1 && setStep(2)}
                  maxLength={20}
                  placeholder="Nhập tên của bạn..."
                  className="w-full bg-black/60 border border-white/10 focus:border-orange-500 focus:outline-none rounded-xl px-4 py-3.5 text-lg font-black text-white font-sans italic uppercase tracking-wide transition-colors"
                />
                <p className="text-[10px] font-mono text-zinc-600">Tên này sẽ hiển thị trên profile của bạn.</p>
              </div>
            )}

            {/* Step 2: WHY card */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-zinc-400 text-sm font-sans leading-relaxed">
                  Điều gì thôi thúc bạn mỗi ngày?<br />
                  <span className="text-zinc-500 text-xs">Viết lý do đầu tiên để luôn nhớ tại sao bạn bắt đầu.</span>
                </p>

                {/* Type selector */}
                <div className="grid grid-cols-3 gap-2">
                  {WHY_TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.type}
                      onClick={() => setWhyType(opt.type)}
                      className={`p-3 rounded-xl border text-center transition-all duration-200 ${
                        whyType === opt.type
                          ? opt.activeCls + ' shadow-[0_0_12px_rgba(234,88,12,0.08)]'
                          : 'border-white/5 bg-zinc-900/50 text-zinc-500 hover:border-white/10'
                      }`}
                    >
                      <div className="text-xl mb-1">{opt.emoji}</div>
                      <p className={`text-[10px] font-bold font-mono uppercase ${whyType === opt.type ? '' : 'text-zinc-500'}`}>{opt.label}</p>
                      <p className="text-[9px] text-zinc-600 mt-0.5 font-sans leading-tight">{opt.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Title */}
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5">Tiêu đề *</label>
                  <input
                    autoFocus={!isCoarsePointer}
                    type="text"
                    value={whyTitle}
                    onChange={e => setWhyTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && canNext2 && setStep(3)}
                    maxLength={60}
                    placeholder="Ví dụ: Không muốn tiếp tục sống bình thường"
                    className="w-full bg-black/60 border border-white/10 focus:border-orange-500 focus:outline-none rounded-xl px-4 py-3 text-sm text-neutral-200 font-sans transition-colors"
                  />
                </div>

                {/* Story */}
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5">Chi tiết (tuỳ chọn)</label>
                  <textarea
                    value={whyStory}
                    onChange={e => setWhyStory(e.target.value)}
                    maxLength={150}
                    rows={2}
                    placeholder="Điều này ảnh hưởng đến bạn như thế nào..."
                    className="w-full bg-black/60 border border-white/10 focus:border-orange-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-neutral-300 font-sans transition-colors resize-none"
                  />
                </div>

                <p className="text-[10px] font-mono text-zinc-600">Bạn có thể thêm 2 lý do nữa trong Quest Board sau.</p>
              </div>
            )}

            {/* Step 3: First BOSS RAID */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-zinc-400 text-sm font-sans leading-relaxed">
                  Mục tiêu lớn nhất bạn muốn chinh phục là gì?<br />
                  <span className="text-orange-500 font-mono text-xs">Đây sẽ là BOSS RAID đầu tiên của bạn.</span>
                </p>
                <textarea
                  autoFocus={!isCoarsePointer}
                  value={firstTask}
                  onChange={e => setFirstTask(e.target.value)}
                  maxLength={120}
                  rows={3}
                  placeholder="Ví dụ: Hoàn thành 30 ngày tập gym liên tục..."
                  className="w-full bg-black/60 border border-white/10 focus:border-orange-500 focus:outline-none rounded-xl px-4 py-3 text-sm text-neutral-200 font-sans transition-colors resize-none"
                />
                <div className="p-3 rounded-lg bg-orange-950/20 border border-orange-600/20">
                  <p className="text-[10px] font-mono text-orange-400">
                    💡 Bạn sẽ nhận <span className="font-bold">30 XP</span> ngay khi bắt đầu — phần thưởng khởi hành của hệ thống.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 pb-8 flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <button
                onClick={onSkip}
                className="text-[11px] font-mono text-zinc-600 hover:text-zinc-400 uppercase tracking-widest transition-colors text-left"
              >
                Bỏ qua
              </button>
              {onShowAuth && step === 1 && (
                <button
                  onClick={onShowAuth}
                  className="text-[11px] font-mono text-orange-600 hover:text-orange-400 transition-colors text-left"
                >
                  Đã có tài khoản? Đăng nhập →
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {step > 1 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white font-mono text-xs uppercase flex items-center gap-1.5 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </button>
              )}

              {step < 3 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={(step === 1 && !canNext1) || (step === 2 && !canNext2)}
                  className={`px-6 py-2.5 rounded-xl font-black italic text-sm uppercase flex items-center gap-2 transition-all ${
                    (step === 1 && !canNext1) || (step === 2 && !canNext2)
                      ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                      : 'bg-orange-600 hover:bg-orange-500 text-black shadow-[0_0_16px_rgba(234,88,12,0.3)]'
                  }`}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={!canFinish}
                  className={`px-6 py-2.5 rounded-xl font-black italic text-sm uppercase flex items-center gap-2 transition-all ${
                    !canFinish
                      ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                      : 'bg-orange-600 hover:bg-orange-500 text-black shadow-[0_0_20px_rgba(234,88,12,0.4)]'
                  }`}
                >
                  <Target className="w-4 h-4" /> AWAKEN
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
