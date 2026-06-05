import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import type { ConversionProgress } from '@/hooks/useFFmpeg';

interface ProgressPanelProps {
  progress: ConversionProgress;
  message: string;
  logs: string[];
}

export function ProgressPanel({ progress, message, logs }: ProgressPanelProps) {
  const logsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  const percent = progress.percent || 0;

  return (
    <div className="animate-slide-up space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            <span className="text-sm text-[#8b8bb0]">{message}</span>
          </div>
          <span className="font-mono text-sm text-cyan-400">
            {percent}%
          </span>
        </div>

        <div className="h-2 bg-[#1e1e3a] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full gradient-accent transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        {progress.time !== undefined && (
          <p className="font-mono text-xs text-[#6b6b9b]">
            Обработано: {progress.time}с
          </p>
        )}
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div
          ref={logsRef}
          className="max-h-[140px] overflow-y-auto rounded-lg bg-[#0a0a12] p-3
                     font-mono text-xs text-[#6b6b9b] leading-relaxed"
        >
          {logs.slice(-50).map((log, i) => (
            <div key={i} className="truncate">{log}</div>
          ))}
        </div>
      )}
    </div>
  );
}
