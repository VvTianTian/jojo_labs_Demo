import { useBookStore } from "../../store/useBookStore";
import { AudioUploader } from "../common/AudioUploader";
import { Mic } from "lucide-react";

export function PageNarrationSettings() {
  const { book, updatePageNarrationAudio, updatePageNarrationTiming, updatePageNarrationRequirement } = useBookStore();
  const currentPage = book.pages[book.currentPageIndex];

  if (!currentPage) return null;

  const { narrationAudioUrl, narrationAudioRequirement, narrationTiming } = currentPage;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-neutral-200">
        <h3 className="text-sm font-semibold text-neutral-700">讲解语音</h3>
        <p className="text-xs text-neutral-500 mt-0.5">
          第 {book.currentPageIndex + 1} 页
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Audio upload */}
        <div>
          <label className="text-xs font-medium text-neutral-700 mb-2 block">语音文件</label>

          {/* Requirement textarea */}
          <textarea
            value={narrationAudioRequirement}
            onChange={(e) => updatePageNarrationRequirement(currentPage.id, e.target.value)}
            placeholder="描述讲解语音的风格、内容重点、语气等需求..."
            rows={2}
            className="w-full bg-neutral-0 border border-neutral-200 rounded-base px-3 py-2 text-xs text-neutral-700 outline-none focus:border-brand-500 resize-none transition-colors placeholder:text-neutral-400 mb-2"
          />

          {narrationAudioUrl ? (
            <AudioUploader
              audioUrl={narrationAudioUrl}
              onUpload={(dataUrl) => updatePageNarrationAudio(currentPage.id, dataUrl)}
              onRemove={() => updatePageNarrationAudio(currentPage.id, null)}
            />
          ) : (
            <div className="space-y-2">
              <div className="flex flex-col items-center justify-center gap-2 py-5 border-2 border-dashed border-neutral-200 rounded-lg text-center">
                <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center">
                  <Mic size={16} className="text-neutral-400" />
                </div>
                <p className="text-xs text-neutral-500">可为此页添加讲解语音</p>
              </div>
              <AudioUploader
                audioUrl={null}
                onUpload={(dataUrl) => updatePageNarrationAudio(currentPage.id, dataUrl)}
                onRemove={() => updatePageNarrationAudio(currentPage.id, null)}
              />
            </div>
          )}
        </div>

        {/* Playback timing */}
        <div>
          <label className="text-xs font-medium text-neutral-700 mb-2 block">播放时机</label>
          <div className="flex gap-2">
            <button
              onClick={() => updatePageNarrationTiming(currentPage.id, "start")}
              className={`flex-1 py-2 rounded-base text-sm font-medium transition-all ${
                narrationTiming === "start"
                  ? "bg-brand-500 text-white shadow-xs"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              页面开头
            </button>
            <button
              onClick={() => updatePageNarrationTiming(currentPage.id, "end")}
              className={`flex-1 py-2 rounded-base text-sm font-medium transition-all ${
                narrationTiming === "end"
                  ? "bg-brand-500 text-white shadow-xs"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              页面结尾
            </button>
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            {narrationTiming === "start"
              ? "进入此页时自动播放讲解语音"
              : "页面内容展示结束后播放讲解语音"}
          </p>
        </div>
      </div>
    </div>
  );
}
