import { useRef, useState } from "react";
import { useBookStore } from "../../store/useBookStore";
import { useRoleStore } from "../../store/useRoleStore";
import { AudioUploader } from "../common/AudioUploader";
import { RequirementTextarea } from "../common/RequirementTextarea";
import { RequirementHint } from "../common/RequirementHint";
import { Mic, ArrowRight, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";

export function NarrationCanvas() {
  const { book, setViewingNarration, updatePageAudio, updatePageRequirement, setCurrentPage } = useBookStore();
  const { currentRole } = useRoleStore();
  const isEditorial = currentRole === "editorial";

  const slotIndex = book.currentPageIndex;
  const page = book.pages[slotIndex];
  if (!page) return null;

  const audioUrl = page.audioUrl;
  const totalSlots = book.pages.length;

  // Transition label
  const fromLabel = slotIndex === 0 ? "封面" : `第${slotIndex}页`;
  const toLabel = `第${slotIndex + 1}页`;

  const canGoNext = slotIndex < totalSlots - 1;

  const handlePrev = () => {
    if (slotIndex === 0) {
      setCurrentPage(-1); // go to cover
    } else {
      setViewingNarration(slotIndex - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setViewingNarration(slotIndex + 1);
    } else {
      setCurrentPage(slotIndex); // go to the page after last narration
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8">
      {/* Header card */}
      <div className="w-full max-w-[560px] bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-brand-50 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <Mic size={16} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-neutral-700">讲解语音</span>
          </div>
          <span className="text-xs text-neutral-500">
            第 {slotIndex + 1} / {totalSlots} 段
          </span>
        </div>

        {/* Transition visual */}
        <div className="px-6 py-6">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-lg">
              <span className="text-sm font-medium text-neutral-700">{fromLabel}</span>
            </div>
            <ArrowRight size={18} className="text-neutral-400 flex-shrink-0" />
            <div className="flex items-center gap-2 px-4 py-2 bg-brand-50 rounded-lg ring-1 ring-brand-200">
              <span className="text-sm font-medium text-brand-700">{toLabel}</span>
            </div>
          </div>

          {/* Audio upload/play area */}
          <div className="bg-neutral-50 rounded-lg border border-neutral-200 px-6 py-5">
            {isEditorial ? (
              <>
                {/* 已上传的语音可播放但不可更换/删除 */}
                {audioUrl ? (
                  <AudioPreview audioUrl={audioUrl} />
                ) : (
                  <RequirementTextarea
                    value={page.audioRequirement}
                    onChange={(v) => updatePageRequirement(page.id, "audioRequirement", v)}
                    type="audio"
                    minHeight="min-h-[80px]"
                  />
                )}
              </>
            ) : (
              <>
                <div className="text-xs text-neutral-500 mb-3">
                  {audioUrl ? "已上传讲解语音，可播放或更换：" : "点击上传此段过渡讲解语音："}
                </div>
                <RequirementHint text={page.audioRequirement} type="audio" />
                <AudioUploader
                  audioUrl={audioUrl}
                  onUpload={(dataUrl) => updatePageAudio(page.id, dataUrl)}
                  onRemove={() => updatePageAudio(page.id, null)}
                />
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-200 bg-neutral-50">
          <button
            onClick={handlePrev}
            disabled={book.currentPageIndex === 0 && slotIndex === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-base text-sm text-neutral-600 hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={16} />
            上一段
          </button>
          <button
            onClick={() => setCurrentPage(slotIndex)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-base text-sm text-brand-700 hover:bg-brand-50 transition-all"
          >
            跳转到{toLabel}
          </button>
          <button
            onClick={handleNext}
            disabled={!canGoNext && slotIndex === totalSlots - 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-base text-sm text-neutral-600 hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            下一段
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Read-only audio preview for editorial role ---- */

function AudioPreview({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-neutral-0 border border-neutral-200 rounded-base px-3 py-2">
      <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
      <button
        onClick={togglePlay}
        className={`p-1.5 rounded-base transition-all ${
          isPlaying ? "bg-brand-500 text-white" : "bg-success-50 text-neutral-700 hover:bg-success-50/80"
        }`}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <span className="text-xs text-neutral-500">已上传语音（只读）</span>
    </div>
  );
}
