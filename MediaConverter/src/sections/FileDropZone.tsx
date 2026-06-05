import { useState, useRef, useCallback } from 'react';
import { Upload, FileVideo, FileAudio } from 'lucide-react';

interface FileDropZoneProps {
  accept: string;
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  type: 'video' | 'audio';
}

export function FileDropZone({ accept, onFileSelect, disabled, type }: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [disabled, onFileSelect]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const Icon = type === 'video' ? FileVideo : FileAudio;

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative flex flex-col items-center justify-center
        border-2 border-dashed rounded-xl p-10
        transition-all duration-250 cursor-pointer
        ${isDragOver
          ? 'border-purple-400 bg-purple-400/5'
          : 'border-[#2a2a4a] hover:border-[#3d3d6a] hover:bg-white/[0.02]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />

      <div className={`
        w-14 h-14 rounded-xl flex items-center justify-center mb-4
        ${isDragOver ? 'bg-purple-400/20' : 'bg-[#1e1e3a]'}
        transition-colors duration-250
      `}>
        {isDragOver ? (
          <Upload className="w-7 h-7 text-purple-400" />
        ) : (
          <Icon className="w-7 h-7 text-[#6b6b9b]" />
        )}
      </div>

      <p className="text-[#e8e8f0] text-sm font-medium mb-1 text-center">
        {isDragOver ? 'Отпустите файл здесь' : 'Перетащите файл сюда или нажмите'}
      </p>
      <p className="text-[#6b6b9b] text-xs text-center">
        Максимальный размер: 500 МБ
      </p>
    </div>
  );
}
