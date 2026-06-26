import { useRef, useState } from "react";
import { useBookStore } from "../../store/useBookStore";
import { useRoleStore } from "../../store/useRoleStore";
import { RequirementTextarea } from "../common/RequirementTextarea";
import { RequirementHint } from "../common/RequirementHint";
import {
  Languages, Mic, Play, Pause, Trash2, Upload,
  ArrowUp, ArrowDown, X,
} from "lucide-react";

export function TextBlockSettings() {
  const { book, updateTextBlock, removeTextBlock, moveTextBlock, updateTextBlockRequirement } = useBookStore();
  const { currentRole } = useRoleStore();
  const isEditorial = currentRole === "editorial";
  const currentPage = book.pages[book.currentPageIndex];
  const blockId = book.selection.textBlockId;

  if (!currentPage || !blockId) return null;

  const blockIndex = currentPage.textBlocks.findIndex((b) => b.id === blockId);
  const block = currentPage.textBlocks[blockIndex];
  if (!block) return null;

  const totalBlocks = currentPage.textBlocks.length;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-700">文字块设置</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            第 {book.currentPageIndex + 1} 页 · 第 {blockIndex + 1} 条
          </p>
        </div>
        <div className="flex items-center gap-1">
          {/* 排序/删除仅教研可见 */}
          {isEditorial && (
            <>
              <button
                onClick={() => moveTextBlock(currentPage.id, blockIndex, blockIndex - 1)}
                disabled={blockIndex === 0}
                className="p-1 rounded-base hover:bg-neutral-100 disabled:opacity-30 transition-all"
              >
                <ArrowUp size={14} className="text-neutral-500" />
              </button>
              <button
                onClick={() => moveTextBlock(currentPage.id, blockIndex, blockIndex + 1)}
                disabled={blockIndex === totalBlocks - 1}
                className="p-1 rounded-base hover:bg-neutral-100 disabled:opacity-30 transition-all"
              >
                <ArrowDown size={14} className="text-neutral-500" />
              </button>
              {totalBlocks > 1 && (
                <button
                  onClick={() => removeTextBlock(currentPage.id, blockId)}
                  className="p-1 rounded-base hover:bg-error-50 text-error-500 transition-all ml-1"
                >
                  <X size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Content preview */}
        <div>
          <label className="text-xs font-medium text-neutral-700 mb-1.5 block">正文内容</label>
          <div className="bg-neutral-100 rounded-base px-3 py-2 text-xs text-neutral-500 leading-relaxed max-h-20 overflow-y-auto">
            {block.content || <span className="italic opacity-50">暂无内容</span>}
          </div>
        </div>

        {/* Translation */}
        <div>
          <label className="text-xs font-medium text-neutral-700 mb-1.5 flex items-center gap-1.5">
            <Languages size={12} className="text-brand-500" />
            翻译
          </label>
          <textarea
            value={block.translation}
            onChange={(e) =>
              updateTextBlock(currentPage.id, blockId, { translation: e.target.value })
            }
            readOnly={!isEditorial}
            placeholder="输入翻译内容..."
            rows={3}
            className={`w-full bg-neutral-0 border border-neutral-200 rounded-base px-3 py-2 text-sm text-neutral-700 outline-none focus:border-brand-500 resize-none transition-colors placeholder:text-neutral-400 ${
              !isEditorial ? "cursor-default bg-neutral-50" : ""
            }`}
          />
        </div>

        {/* Narration audio */}
        <div>
          <label className="text-xs font-medium text-neutral-700 mb-1.5 flex items-center gap-1.5">
            <Mic size={12} className="text-success-500" />
            领读语音
          </label>
          {isEditorial ? (
            block.audioUrl ? (
              <AudioPreview audioUrl={block.audioUrl} />
            ) : (
              <RequirementTextarea
                value={block.audioRequirement}
                onChange={(v) => updateTextBlockRequirement(currentPage.id, blockId, "audioRequirement", v)}
                type="audio"
                minHeight="min-h-[60px]"
              />
            )
          ) : (
            <>
              <RequirementHint text={block.audioRequirement} type="audio" />
              <AudioControl
                audioUrl={block.audioUrl}
                onUpload={(url) => updateTextBlock(currentPage.id, blockId, { audioUrl: url })}
                onRemove={() => updateTextBlock(currentPage.id, blockId, { audioUrl: null })}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- Inline audio control ---- */

function AudioControl({
  audioUrl,
  onUpload,
  onRemove,
}: {
  audioUrl: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("audio/")) return;
    const reader = new FileReader();
    reader.onload = () => onUpload(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

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

  if (audioUrl) {
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
        <span className="text-xs text-neutral-500 flex-1">已上传语音</span>
        <button
          onClick={() => inputRef.current?.click()}
          className="p-1.5 rounded-base bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-all"
        >
          <Upload size={12} />
        </button>
        <button
          onClick={onRemove}
          className="p-1.5 rounded-base bg-error-50 text-error-500 hover:bg-error-100 transition-all"
        >
          <Trash2 size={12} />
        </button>
        <input ref={inputRef} type="file" accept="audio/*" onChange={handleChange} className="hidden" />
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-neutral-200 rounded-base text-xs text-neutral-500 hover:border-brand-300 hover:text-neutral-700 transition-all"
      >
        <Mic size={14} />
        上传领读语音
      </button>
      <input ref={inputRef} type="file" accept="audio/*" onChange={handleChange} className="hidden" />
    </>
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
