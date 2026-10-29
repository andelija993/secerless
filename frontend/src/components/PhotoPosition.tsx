import { posStyle } from '../lib/image';

interface Props {
  url: string;
  value: number;
  onChange: (y: number) => void;
}

export default function PhotoPosition({ url, value, onChange }: Props) {
  return (
    <div className="rounded-2xl border border-base-300 bg-base-200/50 p-4 flex flex-col items-center gap-3">
      <div className="aspect-square w-full max-w-xs overflow-hidden rounded-xl bg-base-300">
        <img src={url} alt="" className="h-full w-full object-cover" style={posStyle(value)} />
      </div>
      <label className="flex w-full max-w-xs items-center gap-3 text-xs">
        <span className="shrink-0 font-medium">Top</span>
        <input
          type="range" min={0} max={100} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="range range-primary range-xs flex-1"
          aria-label="Photo position (top to bottom)"
        />
        <span className="shrink-0 font-medium">Bottom</span>
      </label>
    </div>
  );
}

