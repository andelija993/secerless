// ImageFramer — admin tool to choose how a photo sits inside its frames.
// Drag the photo to move it, use the sliders / arrow buttons for fine control,
// and see live previews of every frame shape the site uses.

import { useRef } from 'react';
import { DEFAULT_FRAMING, frameStyle, type Framing } from '../lib/imageFrame';

interface Props {
  url: string;
  value: Framing;
  onChange: (f: Framing) => void;
  /** Which previews to show. Cover images appear in all three, gallery photos only square. */
  previews?: ('square' | 'card' | 'wide')[];
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const round = (f: Framing): Framing => ({
  x: Math.round(clamp(f.x, 0, 100)),
  y: Math.round(clamp(f.y, 0, 100)),
  zoom: Math.round(clamp(f.zoom, 1, 3) * 100) / 100,
});

const PREVIEW = {
  square: { label: 'This is how the photo will look on the site', className: 'aspect-square w-full max-w-sm' },
  card: { label: 'Recipe card', className: 'aspect-[4/3] w-48' },
  wide: { label: 'Homepage slider', className: 'aspect-[16/9] w-64' },
} as const;

export default function ImageFramer({ url, value, onChange, previews = ['square'] }: Props) {
  const drag = useRef<{ px: number; py: number; w: number; h: number; start: Framing } | null>(null);

  const set = (patch: Partial<Framing>) => onChange(round({ ...value, ...patch }));

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, w: rect.width, h: rect.height, start: value };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    // Dragging the photo down reveals more of its top → focus point moves up (smaller %)
    const speed = 1.4 / d.start.zoom;
    onChange(round({
      ...d.start,
      x: d.start.x - ((e.clientX - d.px) / d.w) * 100 * speed,
      y: d.start.y - ((e.clientY - d.py) / d.h) * 100 * speed,
    }));
  }

  function onPointerUp() {
    drag.current = null;
  }

  const style = frameStyle(value);

  return (
    <div className="rounded-2xl border border-base-300 bg-base-200/50 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">🖼️ Photo framing</span>
        <span className="text-xs opacity-60">Drag the photo to move it</span>
      </div>

      {/* Live previews */}
      <div className="flex flex-col items-center gap-4">
        {previews.map((p) => (
          <div key={p} className="flex w-full flex-col items-center gap-1">
            <div
              className={`${PREVIEW[p].className} relative overflow-hidden rounded-xl bg-base-300 cursor-grab active:cursor-grabbing touch-none select-none ring-1 ring-base-300`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <img src={url} alt="" draggable={false} className="h-full w-full object-cover pointer-events-none" style={style} />
              {/* rule-of-thirds guide */}
              <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-0 hover:opacity-100">
                {Array.from({ length: 9 }).map((_, i) => <div key={i} className="border border-white/30" />)}
              </div>
            </div>
            <span className="text-[11px] opacity-60">{PREVIEW[p].label}</span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-center">
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 text-xs">
            <span className="w-24 shrink-0 font-medium">🔍 Size</span>
            <input
              type="range" min={1} max={3} step={0.05} value={value.zoom}
              onChange={(e) => set({ zoom: Number(e.target.value) })}
              className="range range-primary range-xs flex-1"
            />
            <span className="w-12 text-right tabular-nums">{Math.round(value.zoom * 100)}%</span>
          </label>
          <label className="flex items-center gap-3 text-xs">
            <span className="w-24 shrink-0 font-medium" title="Left = show the top of the photo, right = show the bottom">↕ Top ↔ Bottom</span>
            <input
              type="range" min={0} max={100} step={1} value={value.y}
              onChange={(e) => set({ y: Number(e.target.value) })}
              className="range range-secondary range-xs flex-1"
            />
            <span className="w-12 text-right tabular-nums">{value.y}%</span>
          </label>
          <label className="flex items-center gap-3 text-xs">
            <span className="w-24 shrink-0 font-medium" title="Left = show the left side, right = show the right side">↔ Left ↔ Right</span>
            <input
              type="range" min={0} max={100} step={1} value={value.x}
              onChange={(e) => set({ x: Number(e.target.value) })}
              className="range range-accent range-xs flex-1"
            />
            <span className="w-12 text-right tabular-nums">{value.x}%</span>
          </label>
        </div>

        {/* Nudge pad */}
        <div className="flex items-center gap-3 justify-center">
          <div className="grid grid-cols-3 gap-1">
            <span />
            <button type="button" className="btn btn-xs btn-square" title="Move photo up" onClick={() => set({ y: value.y + 5 })}>↑</button>
            <span />
            <button type="button" className="btn btn-xs btn-square" title="Move photo left" onClick={() => set({ x: value.x + 5 })}>←</button>
            <button type="button" className="btn btn-xs btn-square btn-ghost" title="Reset" onClick={() => onChange(DEFAULT_FRAMING)}>⟲</button>
            <button type="button" className="btn btn-xs btn-square" title="Move photo right" onClick={() => set({ x: value.x - 5 })}>→</button>
            <span />
            <button type="button" className="btn btn-xs btn-square" title="Move photo down" onClick={() => set({ y: value.y - 5 })}>↓</button>
            <span />
          </div>
          <div className="flex flex-col gap-1">
            <button type="button" className="btn btn-xs btn-square" title="Zoom in" onClick={() => set({ zoom: value.zoom + 0.1 })}>＋</button>
            <button type="button" className="btn btn-xs btn-square" title="Zoom out" onClick={() => set({ zoom: value.zoom - 0.1 })}>－</button>
          </div>
        </div>
      </div>
    </div>
  );
}

