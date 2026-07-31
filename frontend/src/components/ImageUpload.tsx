// ImageUpload — drag-and-drop / click file picker that immediately uploads the
// chosen image to POST /api/upload (Cloudinary) and calls onUpload(url) on success.
// Drop-in replacement for the old plain <input type="url"> fields in RecipeForm / BlogForm.

import { useRef, useState } from 'react';

const API_URL = (import.meta as any).env?.PUBLIC_API_URL ?? 'http://localhost:4000/api';

interface Props {
  /** Current image URL (pre-filled when editing an existing record). */
  value: string;
  /** Called once the upload completes successfully with the Cloudinary secure URL. */
  onUpload: (url: string) => void;
}

export default function ImageUpload({ value, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File) {
    if (!file) return;
    setError('');
    setUploading(true);

    const form = new FormData();
    form.append('image', file);

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: form,
        credentials: 'include', // send the auth cookie
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? `Upload failed (${res.status})`);
      } else {
        onUpload(data.url);
      }
    } catch {
      setError('Network error — is the backend running?');
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="label-text font-semibold">Cover Image</span>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-base-300 rounded-xl p-4 text-center cursor-pointer hover:border-primary transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <span className="loading loading-spinner loading-md text-primary" />
            <span className="text-sm opacity-60">Uploading…</span>
          </div>
        ) : value ? (
          <div className="relative group">
            <img
              src={value}
              alt="Cover preview"
              className="h-40 w-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-medium">Click or drop to replace</span>
            </div>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center gap-2 opacity-60">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm">Drag & drop an image here, or <span className="text-primary font-medium">click to browse</span></p>
            <p className="text-xs">PNG, JPG, WEBP — max 10 MB</p>
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-error text-sm py-2">
          <span>{error}</span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

