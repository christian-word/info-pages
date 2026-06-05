import { FileVideo, FileAudio, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FileInfoProps {
  file: File;
  duration?: number;
  type: 'video' | 'audio';
  onRemove: () => void;
  disabled?: boolean;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds === Infinity) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 Б';
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function FileInfo({ file, duration, type, onRemove, disabled }: FileInfoProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const Icon = type === 'video' ? FileVideo : FileAudio;

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <div className="animate-slide-up">
      {/* Preview */}
      {previewUrl && type === 'video' && (
        <div className="mb-4 rounded-xl overflow-hidden bg-black/40 max-h-[240px]">
          <video
            src={previewUrl}
            controls
            className="w-full max-h-[240px] object-contain"
          />
        </div>
      )}
      {previewUrl && type === 'audio' && (
        <div className="mb-4 rounded-xl overflow-hidden bg-[#1e1e3a] p-4">
          <audio
            src={previewUrl}
            controls
            className="w-full"
          />
        </div>
      )}

      {/* File info card */}
      <div className="flex items-center gap-4 p-4 bg-[#1e1e3a] rounded-xl border border-[#2a2a4a]">
        <div className="w-10 h-10 rounded-lg bg-purple-400/15 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-purple-400" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[#e8e8f0] text-sm font-medium truncate">
            {file.name}
          </p>
          <p className="text-[#6b6b9b] text-xs mt-0.5">
            {formatSize(file.size)}
            {duration ? ` • ${formatDuration(duration)}` : ''}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          disabled={disabled}
          className="w-8 h-8 rounded-lg flex items-center justify-center
                     text-[#6b6b9b] hover:text-red-400 hover:bg-red-400/10
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
