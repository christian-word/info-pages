import { useState, useRef, useCallback, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export type ConversionStatus = 'idle' | 'loading' | 'ready' | 'converting' | 'success' | 'error';

export interface ConversionProgress {
  percent: number;
  time?: number;
}

export interface ConversionResult {
  status: ConversionStatus;
  progress: ConversionProgress;
  message: string;
  logs: string[];
  error: string | null;
  outputUrl: string | null;
  outputFilename: string | null;
}

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

const initialState: ConversionResult = {
  status: 'idle',
  progress: { percent: 0 },
  message: 'Инициализация...',
  logs: [],
  error: null,
  outputUrl: null,
  outputFilename: null,
};

export function useFFmpeg() {
  const [result, setResult] = useState<ConversionResult>(initialState);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const abortRef = useRef(false);

  // Initialize FFmpeg on mount
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        setResult(prev => ({ ...prev, status: 'loading', message: 'Загрузка FFmpeg...' }));

        const ffmpeg = new FFmpeg();
        ffmpegRef.current = ffmpeg;

        // Progress handler
        ffmpeg.on('progress', ({ progress, time }) => {
          if (!abortRef.current) {
            setResult(prev => ({
              ...prev,
              progress: {
                percent: Math.min(Math.round(progress * 100), 99),
                time: time ? Math.round(time / 1000000) : undefined,
              },
            }));
          }
        });

        // Log handler
        ffmpeg.on('log', ({ type, message }) => {
          setResult(prev => ({
            ...prev,
            logs: [...prev.logs.slice(-200), `[${type}] ${message}`],
          }));
        });

        await ffmpeg.load();

        if (mounted) {
          setResult(prev => ({
            ...prev,
            status: 'ready',
            message: 'FFmpeg готов к работе. Выберите файл для конвертации.',
          }));
        }
      } catch (err) {
        console.error('FFmpeg init error:', err);
        if (mounted) {
          setResult(prev => ({
            ...prev,
            status: 'error',
            message: 'Ошибка загрузки FFmpeg',
            error: 'Не удалось загрузить FFmpeg. Попробуйте обновить страницу.',
          }));
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size === 0) {
      return 'Файл пустой. Выберите другой файл.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Файл слишком большой (${(file.size / 1024 / 1024).toFixed(0)} МБ). Максимальный размер: 500 МБ.`;
    }
    return null;
  }, []);

  const getVideoDuration = useCallback((file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(0);
      };
      video.src = URL.createObjectURL(file);
    });
  }, []);

  const getAudioDuration = useCallback((file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(audio.src);
        resolve(audio.duration);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audio.src);
        resolve(0);
      };
      audio.src = URL.createObjectURL(file);
    });
  }, []);

  const convertVideo = useCallback(async (
    file: File,
    targetHeight: string
  ): Promise<void> => {
    const validationError = validateFile(file);
    if (validationError) {
      setResult(prev => ({ ...prev, status: 'error', error: validationError, message: 'Ошибка валидации' }));
      return;
    }

    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg) {
      setResult(prev => ({ ...prev, status: 'error', error: 'FFmpeg не загружен', message: 'Ошибка' }));
      return;
    }

    abortRef.current = false;

    try {
      setResult({
        ...initialState,
        status: 'converting',
        message: 'Чтение видео файла...',
        logs: [],
      });

      const inputName = 'input_video';
      const outputName = 'output.mp4';

      // Write file to FFmpeg FS
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      if (abortRef.current) throw new Error('Cancelled');

      setResult(prev => ({ ...prev, message: 'Конвертация видео...' }));

      // Build ffmpeg args
      const args = ['-i', inputName];

      if (targetHeight !== 'original') {
        args.push('-vf', `scale=-2:${targetHeight}`);
      }

      args.push(
        '-c:v', 'libx264',
        '-crf', '23',
        '-preset', 'medium',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        outputName
      );

      await ffmpeg.exec(args);

      if (abortRef.current) throw new Error('Cancelled');

      setResult(prev => ({ ...prev, message: 'Финализация...', progress: { percent: 100 } }));

      // Read output
      const data = await ffmpeg.readFile(outputName) as Uint8Array;
      const blob = new Blob([data.buffer as ArrayBuffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);

      // Cleanup FS
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const heightLabel = targetHeight === 'original' ? 'original' : `${targetHeight}p`;

      setResult(prev => ({
        ...prev,
        status: 'success',
        message: 'Видео успешно сконвертировано!',
        outputUrl: url,
        outputFilename: `${baseName}_${heightLabel}.mp4`,
        progress: { percent: 100 },
      }));
    } catch (err: any) {
      if (err.message === 'Cancelled' || abortRef.current) {
        setResult(prev => ({
          ...prev,
          status: 'error',
          message: 'Конвертация отменена',
          error: 'Конвертация была отменена пользователем.',
          progress: { percent: 0 },
        }));
      } else {
        console.error('Conversion error:', err);
        setResult(prev => ({
          ...prev,
          status: 'error',
          message: 'Ошибка конвертации',
          error: err.message?.includes('out of memory')
            ? 'Недостаточно памяти. Попробуйте файл меньшего размера или низкое разрешение.'
            : 'Произошла ошибка при конвертации. Проверьте формат файла и попробуйте снова.',
        }));
      }

      // Cleanup on error
      try {
        await ffmpeg?.deleteFile('input_video');
        await ffmpeg?.deleteFile('output.mp4');
      } catch { /* ignore cleanup errors */ }
    }
  }, [validateFile]);

  const convertAudio = useCallback(async (
    file: File,
    format: string,
    bitrate: string,
    sampleRate?: string
  ): Promise<void> => {
    const validationError = validateFile(file);
    if (validationError) {
      setResult(prev => ({ ...prev, status: 'error', error: validationError, message: 'Ошибка валидации' }));
      return;
    }

    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg) {
      setResult(prev => ({ ...prev, status: 'error', error: 'FFmpeg не загружен', message: 'Ошибка' }));
      return;
    }

    abortRef.current = false;

    try {
      setResult({
        ...initialState,
        status: 'converting',
        message: 'Чтение аудио файла...',
        logs: [],
      });

      const inputName = 'input_audio';
      const outputName = `output.${format}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      if (abortRef.current) throw new Error('Cancelled');

      setResult(prev => ({ ...prev, message: 'Конвертация аудио...' }));

      // Build args based on format
      const args = ['-i', inputName];

      switch (format) {
        case 'mp3':
          args.push('-c:a', 'libmp3lame', '-b:a', bitrate);
          break;
        case 'm4a':
          args.push('-c:a', 'aac', '-b:a', bitrate);
          break;
        case 'wav':
          args.push('-c:a', 'pcm_s16le');
          if (sampleRate) {
            args.push('-ar', sampleRate);
          }
          break;
        case 'ogg':
          args.push('-c:a', 'libvorbis', '-q:a', bitrate === '320k' ? '7' : bitrate === '192k' ? '5' : '3');
          break;
        case 'flac':
          args.push('-c:a', 'flac');
          break;
        default:
          args.push('-c:a', 'copy');
      }

      args.push(outputName);

      await ffmpeg.exec(args);

      if (abortRef.current) throw new Error('Cancelled');

      setResult(prev => ({ ...prev, message: 'Финализация...', progress: { percent: 100 } }));

      const data = await ffmpeg.readFile(outputName) as Uint8Array;

      let mimeType = 'audio/mpeg';
      if (format === 'm4a') mimeType = 'audio/mp4';
      else if (format === 'wav') mimeType = 'audio/wav';
      else if (format === 'ogg') mimeType = 'audio/ogg';
      else if (format === 'flac') mimeType = 'audio/flac';

      const blob = new Blob([data.buffer as ArrayBuffer], { type: mimeType });
      const url = URL.createObjectURL(blob);

      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

      setResult(prev => ({
        ...prev,
        status: 'success',
        message: 'Аудио успешно сконвертировано!',
        outputUrl: url,
        outputFilename: `${baseName}.${format}`,
        progress: { percent: 100 },
      }));
    } catch (err: any) {
      if (err.message === 'Cancelled' || abortRef.current) {
        setResult(prev => ({
          ...prev,
          status: 'error',
          message: 'Конвертация отменена',
          error: 'Конвертация была отменена пользователем.',
          progress: { percent: 0 },
        }));
      } else {
        console.error('Audio conversion error:', err);
        setResult(prev => ({
          ...prev,
          status: 'error',
          message: 'Ошибка конвертации',
          error: err.message?.includes('out of memory')
            ? 'Недостаточно памяти. Попробуйте файл меньшего размера.'
            : 'Произошла ошибка при конвертации. Проверьте формат файла.',
        }));
      }

      try {
        await ffmpeg?.deleteFile('input_audio');
        await ffmpeg?.deleteFile(`output.${format}`);
      } catch { /* ignore */ }
    }
  }, [validateFile]);

  const cancel = useCallback(async () => {
    abortRef.current = true;

    const ffmpeg = ffmpegRef.current;
    if (ffmpeg) {
      try {
        await ffmpeg.terminate();
      } catch { /* ignore */ }

      // Re-initialize FFmpeg
      try {
        const newFfmpeg = new FFmpeg();
        ffmpegRef.current = newFfmpeg;

        newFfmpeg.on('progress', ({ progress, time }) => {
          if (!abortRef.current) {
            setResult(prev => ({
              ...prev,
              progress: {
                percent: Math.min(Math.round(progress * 100), 99),
                time: time ? Math.round(time / 1000000) : undefined,
              },
            }));
          }
        });

        newFfmpeg.on('log', ({ type, message }) => {
          setResult(prev => ({
            ...prev,
            logs: [...prev.logs.slice(-200), `[${type}] ${message}`],
          }));
        });

        await newFfmpeg.load();

        setResult(prev => ({
          ...prev,
          status: 'ready',
          message: 'Готов к работе. Выберите файл для конвертации.',
          progress: { percent: 0 },
        }));
      } catch (err) {
        console.error('FFmpeg re-init error:', err);
        setResult(prev => ({
          ...prev,
          status: 'error',
          error: 'Ошибка перезагрузки FFmpeg. Обновите страницу.',
        }));
      }
    }
  }, []);

  const reset = useCallback(() => {
    // Revoke any existing object URL
    if (result.outputUrl) {
      URL.revokeObjectURL(result.outputUrl);
    }
    setResult({
      ...initialState,
      status: ffmpegRef.current ? 'ready' : 'idle',
      message: ffmpegRef.current ? 'Готов к работе. Выберите файл для конвертации.' : 'Инициализация...',
    });
  }, [result.outputUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (result.outputUrl) {
        URL.revokeObjectURL(result.outputUrl);
      }
    };
  }, [result.outputUrl]);

  return {
    result,
    convertVideo,
    convertAudio,
    cancel,
    reset,
    getVideoDuration,
    getAudioDuration,
  };
}
