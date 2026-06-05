import { useState } from 'react';
import { Film, Clapperboard, Music } from 'lucide-react';
import { VideoTab } from '@/sections/VideoTab';
import { AudioTab } from '@/sections/AudioTab';

type TabType = 'video' | 'audio';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('video');

  return (
    <div className="min-h-screen bg-[#0b0b14] text-[#e8e8f0]">
      <div className="max-w-[720px] mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Film className="w-7 h-7 text-purple-400" />
            <h1 className="text-2xl md:text-3xl font-bold gradient-accent-text">
              Медиа Конвертер
            </h1>
          </div>
          <p className="text-sm text-[#6b6b9b] max-w-md mx-auto">
            Всё происходит в браузере — файлы не загружаются на сервер
          </p>
        </header>

        {/* Main Card */}
        <div className="bg-[#16162a] border border-[#2a2a4a] rounded-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex bg-[#1e1e3a] p-1.5 gap-1">
            <button
              onClick={() => setActiveTab('video')}
              className={`
                flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                font-semibold text-sm transition-all duration-200
                ${activeTab === 'video'
                  ? 'bg-purple-400 text-[#0b0b14]'
                  : 'text-[#6b6b9b] hover:text-[#e8e8f0] hover:bg-white/[0.04]'
                }
              `}
            >
              <Clapperboard className="w-4 h-4" />
              Видео
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`
                flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                font-semibold text-sm transition-all duration-200
                ${activeTab === 'audio'
                  ? 'bg-purple-400 text-[#0b0b14]'
                  : 'text-[#6b6b9b] hover:text-[#e8e8f0] hover:bg-white/[0.04]'
                }
              `}
            >
              <Music className="w-4 h-4" />
              Аудио
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'video' && <VideoTab />}
            {activeTab === 'audio' && <AudioTab />}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-10 text-center">
          <p className="text-xs text-[#4a4a6a]">
            Сделано для внутреннего пользования в церкви 2026 г.
          </p>
        </footer>
      </div>
    </div>
  );
}
