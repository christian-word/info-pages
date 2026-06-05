import { useState, useCallback, useEffect } from 'react';
import { FileDropZone } from './FileDropZone';
import { FileInfo } from './FileInfo';
import { useFFmpeg } from '@/hooks/useFFmpeg';
import { ProgressPanel } from './ProgressPanel';
import { Clapperboard } from 'lucide-react';

export function VideoTab() {
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState('720');

  const {
    result,
    convertVideo,
    cancel,
    reset,
    getVideoDuration,
  } = useFFmpeg();

  const isConverting = result.status === 'converting';
  isConverting;
  const isSuccess = result.status === 'success';

  useEffect(() => {
    return () => {
      if (result.outputUrl) {
        URL.revokeObjectURL(result.outputUrl);
      }
    };
  }, [result.outputUrl]);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    const dur = await getVideoDuration(selectedFile);
    setDuration(dur);
  }, [getVideoDuration]);

  const handleRemove = useCallback(() => {
    setFile(null);
    setDuration(0);
    reset();
  }, [reset]);

  const handleConvert = useCallback(() => {
    if (!file) return;
    convertVideo(file, targetHeight);
  }, [file, targetHeight, convertVideo]);

  const handleCancel = useCallback(() => {
    cancel();
    // Keep file selected but allow re-conversion
  }, [cancel]);

  return (
    <div className="p-6 space-y-5">
      {/* Drop Zone */}
      {!file && (
        <FileDropZone
          accept="video/*"
          onFileSelect={handleFileSelect}
          disabled={result.status === 'loading'}
          type="video"
        />
      )}

      {/* File Info */}
      {file && (
        <FileInfo
          file={file}
          duration={duration}
          type="video"
          onRemove={handleRemove}
          disabled={isConverting}
        />
      )}

      {/* Settings */}
      {file && !isSuccess && (
        <div className="animate-slide-up space-y-3">
          <label className="block text-sm font-medium text-[#8b8bb0]">
            Разрешение выходного видео
          </label>
          <select
            value={targetHeight}
            onChange={(e) => setTargetHeight(e.target.value)}
            disabled={isConverting}
            className="w-full px-4 py-3 bg-[#1e1e3a] border border-[#2a2a4a] rounded-xl
                       text-[#e8e8f0] text-sm
                       focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            <option value="original">Оригинальное разрешение</option>
            <option value="720">720p (HD) — оптимальный баланс</option>
            <option value="480">480p (SD) — компактный размер</option>
            <option value="360">360p — минимальный размер</option>
          </select>
        </div>
      )}

      {/* Convert Button */}
      {file && !isSuccess && (
        <button
          onClick={isConverting ? handleCancel : handleConvert}
          disabled={result.status === 'loading' || result.status === 'idle'}
          className={`
            w-full py-3.5 px-6 rounded-xl font-bold text-sm
            transition-all duration-200
            ${isConverting
              ? 'bg-red-400/15 text-red-400 border border-red-400/30 hover:bg-red-400/25'
              : 'gradient-accent text-[#0b0b14] hover:brightness-110 hover:-translate-y-0.5'
            }
            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          `}
        >
          {isConverting ? 'Отменить' : 'Конвертировать в MP4'}
        </button>
      )}

      {/* Progress */}
      {isConverting && (
        <ProgressPanel
          progress={result.progress}
          message={result.message}
          logs={result.logs}
        />
      )}

      {/* Success State */}
      {isSuccess && result.outputUrl && (
        <div className="animate-slide-up text-center py-6">
          <div className="w-16 h-16 rounded-full bg-emerald-400/15 flex items-center justify-center mx-auto mb-4">
            <Clapperboard className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-emerald-400 mb-2">
            Видео готово!
          </h3>
          <p className="text-[#8b8bb0] text-sm mb-4">
            {result.outputFilename}
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href={result.outputUrl}
              download={result.outputFilename}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl
                         gradient-accent text-[#0b0b14] font-semibold text-sm
                         hover:brightness-110 transition-all"
            >
              Скачать файл
            </a>
            <button
              onClick={handleRemove}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl
                         bg-[#1e1e3a] text-[#e8e8f0] font-medium text-sm
                         border border-[#2a2a4a] hover:border-[#3d3d6a]
                         transition-all"
            >
              Новый файл
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {result.status === 'error' && (
        <div className="animate-slide-up text-center py-6">
          <div className="w-16 h-16 rounded-full bg-red-400/15 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-400 mb-2">
            Ошибка
          </h3>
          <p className="text-[#8b8bb0] text-sm mb-4 max-w-md mx-auto">
            {result.error}
          </p>
          <button
            onClick={handleRemove}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl
                       bg-[#1e1e3a] text-[#e8e8f0] font-medium text-sm
                       border border-[#2a2a4a] hover:border-[#3d3d6a]
                       transition-all"
          >
            Попробовать другой файл
          </button>
        </div>
      )}
    </div>
  );
}
