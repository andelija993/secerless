import { useRef, useState } from 'react';
import { API_URL } from '../lib/api';

interface Props {
  value: string;
  onUpload: (url: string) => void;
  label?: string;
  hint?: string;
}

export default function ImageUpload({ value, onUpload, label = 'Cover Image', hint }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function upload(file?: File) {
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const body = new FormData();
      body.append('image', file);
      const res = await fetch(`${API_URL}/upload`, { method: 'POST', body, credentials: 'include' });
      const data = await res.json();
      if (res.ok) onUpload(data.url);
      else setError(data.error ?? `Upload failed (${res.status})`);
    } catch {
      setError('Network error — is the backend running?');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="fieldset-legend justify-start">{label}</span>
      {hint && <span className="text-xs opacity-60 -mt-1">{hint}</span>}

      <div
        className="border-2 border-dashed border-base-300 rounded-xl p-4 text-center cursor-pointer hover:border-primary transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          upload(e.dataTransfer.files?.[0]);
        }}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <span className="loading loading-spinner loading-md text-primary" />
            <span className="text-sm opacity-60">Uploading…</span>
          </div>
        ) : value ? (
          <div className="flex items-center gap-4 text-left">
            <img src={value} alt="Current photo" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">✓ Photo uploaded</span>
              <span className="text-xs opacity-60">Click here or drop a new file to replace it</span>
              <span className="btn btn-xs btn-outline btn-primary w-fit mt-1">Replace photo</span>
            </div>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center gap-2 opacity-60">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm">Drag & drop an image here, or <span className="text-primary font-medium">click to browse</span></p>
            <p className="text-xs">PNG, JPG, WEBP — max 25 MB</p>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error text-sm py-2"><span>{error}</span></div>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
    </div>
  );
}

