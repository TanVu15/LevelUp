import React from 'react';
import { Check, X } from 'lucide-react';

interface Props {
  dataURL: string;
  onConfirm: (croppedDataURL: string) => void;
  onCancel: () => void;
}

const PREVIEW = 280; // crop window size in UI (px)
const OUTPUT  = 400; // canvas output size (px)

export default function AvatarCropModal({ dataURL, onConfirm, onCancel }: Props) {
  const [position, setPosition] = React.useState(50);
  const [natural, setNatural] = React.useState<{ w: number; h: number } | null>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);

  const onLoad = () => {
    if (imgRef.current)
      setNatural({ w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight });
  };

  const isPortrait  = natural ? natural.h > natural.w : false;
  const isLandscape = natural ? natural.w > natural.h : false;

  // Scale so the shorter side = PREVIEW
  const scale   = natural ? PREVIEW / Math.min(natural.w, natural.h) : 1;
  const scaledW = natural ? natural.w * scale : PREVIEW;
  const scaledH = natural ? natural.h * scale : PREVIEW;

  const xShift = isLandscape ? -((position / 100) * (scaledW - PREVIEW)) : 0;
  const yShift = isPortrait  ? -((position / 100) * (scaledH - PREVIEW)) : 0;

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img || !natural) return;

    const outScale = OUTPUT / Math.min(natural.w, natural.h);
    const outW     = natural.w * outScale;
    const outH     = natural.h * outScale;

    const xOff = isLandscape ? (position / 100) * (outW - OUTPUT) : 0;
    const yOff = isPortrait  ? (position / 100) * (outH - OUTPUT) : 0;

    // Convert display-space offset back to source image coordinates
    const srcX    = xOff  / outScale;
    const srcY    = yOff  / outScale;
    const srcSize = OUTPUT / outScale;

    const canvas = document.createElement('canvas');
    canvas.width  = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT, OUTPUT);
    onConfirm(canvas.toDataURL('image/jpeg', 0.88));
  };

  const label = isPortrait ? ['↑ Lên trên', '↓ Xuống dưới'] : isLandscape ? ['← Trái', '→ Phải'] : null;

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-white/15 rounded-2xl p-6 w-full max-w-sm space-y-5 shadow-2xl">

        <div>
          <h3 className="text-xs font-bold font-mono tracking-widest text-orange-500 uppercase">// CHỌN VÙNG AVATAR</h3>
          <p className="text-xs text-zinc-400 mt-1">
            {label ? 'Kéo thanh trượt để chọn phần ảnh muốn hiển thị.' : 'Ảnh sẽ được cắt thành hình vuông.'}
          </p>
        </div>

        {/* Crop preview window */}
        <div className="flex justify-center">
          <div
            className="overflow-hidden rounded-xl border-2 border-orange-500/60 shadow-[0_0_20px_rgba(234,88,12,0.25)] bg-zinc-950"
            style={{ width: PREVIEW, height: PREVIEW }}
          >
            {/* Grid guide lines */}
            <div className="relative w-full h-full">
              <img
                ref={imgRef}
                src={dataURL}
                onLoad={onLoad}
                alt="Crop preview"
                draggable={false}
                style={{
                  position: 'absolute',
                  width:  scaledW,
                  height: scaledH,
                  transform: `translate(${xShift}px, ${yShift}px)`,
                  userSelect: 'none',
                }}
              />
              {/* Rule-of-thirds guides */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-[33%] top-0 bottom-0 w-px bg-white/10" />
                <div className="absolute left-[66%] top-0 bottom-0 w-px bg-white/10" />
                <div className="absolute top-[33%] left-0 right-0 h-px bg-white/10" />
                <div className="absolute top-[66%] left-0 right-0 h-px bg-white/10" />
              </div>
            </div>
          </div>
        </div>

        {/* Position slider — only when image isn't square */}
        {label && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 px-0.5">
              <span>{label[0]}</span>
              <span className="text-zinc-600">VỊ TRÍ</span>
              <span>{label[1]}</span>
            </div>
            <input
              type="range" min={0} max={100} value={position}
              onChange={e => setPosition(Number(e.target.value))}
              className="w-full h-1.5 rounded accent-orange-500 cursor-pointer"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-white/10 text-zinc-400 text-sm font-mono hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" /> Hủy
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-black font-black italic text-sm uppercase flex items-center justify-center gap-2 transition-all"
          >
            <Check className="w-4 h-4" /> Cắt & Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
