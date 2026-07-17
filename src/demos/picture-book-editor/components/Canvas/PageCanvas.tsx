import { useState } from "react";
import { useBookStore } from "../../store/useBookStore";
import { ImageUploader } from "../common/ImageUploader";
import { AudioUploader } from "../common/AudioUploader";
import {
  Trash2, Plus, Image, Mic,
  MapPin, ToggleLeft, ToggleRight,
} from "lucide-react";

type TabType = "text" | "narration" | "hotspot";

export function PageCanvas() {
  const {
    book, updatePageImage, updateTextBlock, addTextBlock,
    updatePageRequirement, setSelection, removeTextBlock,
    updatePageNarrationAudio, updatePageNarrationTiming, updatePageNarrationRequirement,
  } = useBookStore();
  const currentPage = book.pages[book.currentPageIndex];
  const [activeTab, setActiveTab] = useState<TabType>("text");
  const [narrationEnabled, setNarrationEnabled] = useState(
    () => !!currentPage?.narrationAudioUrl
  );

  if (!currentPage) return null;

  const bgColor = book.globalSettings.defaultBackgroundColor;
  const fontFamily = book.globalSettings.defaultFontFamily;
  const { selection } = book;

  const handleTextBlockClick = (blockId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelection({ type: "textBlock", textBlockId: blockId });
  };

  const handleCanvasClick = () => {
    setSelection({ type: "none" });
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: "text", label: "文本" },
    { key: "narration", label: "讲解语音" },
    { key: "hotspot", label: "互动点" },
  ];

  return (
    <div className="flex items-start justify-center h-full p-6 overflow-auto" onClick={handleCanvasClick}>
      <div
        className="w-full max-w-[800px] rounded-lg shadow-sm border border-neutral-200 overflow-hidden transition-colors duration-150"
        style={{ backgroundColor: bgColor }}
      >
        {/* Header: Page title + Narration toggle */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200/60">
          <span className="text-sm font-semibold text-neutral-700">
            正文 {book.currentPageIndex + 1}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setNarrationEnabled(!narrationEnabled);
            }}
            className="flex items-center gap-1.5 text-xs font-medium transition-all"
          >
            <span className="text-neutral-500">讲解语音</span>
            {narrationEnabled ? (
              <ToggleRight size={20} className="text-brand-500" />
            ) : (
              <ToggleLeft size={20} className="text-neutral-400" />
            )}
          </button>
        </div>

        {/* Image area */}
        <div className="relative">
          {/* Image tag */}
          <div className="px-4 pt-3 pb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-pink-50 text-pink-600 text-xs font-medium rounded-base border border-pink-200">
              <Image size={10} />
              图片
            </span>
          </div>

          {currentPage.imageUrl ? (
            <div className="px-4 pb-3">
              <div className="relative rounded-md overflow-hidden border border-neutral-200">
                <img
                  src={currentPage.imageUrl}
                  alt={`第 ${book.currentPageIndex + 1} 页`}
                  className="w-full aspect-[16/9] object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <ImageUploader
                    onImageUpload={(d) => updatePageImage(currentPage.id, d)}
                    compact
                  />
                  <button
                    onClick={() => updatePageImage(currentPage.id, null)}
                    className="p-1.5 bg-error-50 hover:bg-error-100 text-error-600 rounded-button transition-all backdrop-blur-sm"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 pb-3" onClick={(e) => e.stopPropagation()}>
              <div className="aspect-[16/9] rounded-md overflow-hidden">
                <ImageUploader
                  onImageUpload={(d) => updatePageImage(currentPage.id, d)}
                />
              </div>
            </div>
          )}

          {/* Image requirement */}
          <div className="px-4 pb-3" onClick={(e) => e.stopPropagation()}>
            <textarea
              value={currentPage.imageRequirement}
              onChange={(e) => updatePageRequirement(currentPage.id, "imageRequirement", e.target.value)}
              placeholder="描述对此页图片的需求，如场景、角色动作、色调等..."
              rows={2}
              className="w-full bg-white/60 border border-neutral-200 rounded-base px-3 py-2 text-xs text-neutral-700 outline-none focus:border-brand-500 resize-none transition-colors placeholder:text-neutral-400"
            />
          </div>
        </div>

        {/* Tab bar */}
        <div className="px-4 border-t border-neutral-200/60">
          <div className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab(tab.key);
                }}
                className={`px-5 py-2.5 text-sm font-medium transition-all border-b-2 ${
                  activeTab === tab.key
                    ? "text-brand-500 border-brand-500"
                    : "text-neutral-500 border-transparent hover:text-neutral-700 hover:border-neutral-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="min-h-[200px]">
          {activeTab === "text" && (
            <TextTab
              page={currentPage}
              fontFamily={fontFamily}
              selection={selection}
              onTextBlockClick={handleTextBlockClick}
              onUpdateTextBlock={updateTextBlock}
              onAddTextBlock={() => addTextBlock(currentPage.id)}
              onRemoveTextBlock={(blockId) => removeTextBlock(currentPage.id, blockId)}
              onSetSelection={setSelection}
            />
          )}

          {activeTab === "narration" && (
            <NarrationTab
              page={currentPage}
              enabled={narrationEnabled}
              onToggleEnabled={() => setNarrationEnabled(!narrationEnabled)}
              onAudioUpload={(url) => updatePageNarrationAudio(currentPage.id, url)}
              onAudioRemove={() => updatePageNarrationAudio(currentPage.id, null)}
              onTimingChange={(timing) => updatePageNarrationTiming(currentPage.id, timing)}
              onRequirementChange={(value) => updatePageNarrationRequirement(currentPage.id, value)}
            />
          )}

          {activeTab === "hotspot" && (
            <HotspotTab />
          )}
        </div>

        {/* Page indicator */}
        <div className="px-5 py-3 flex justify-between items-center border-t border-neutral-200/60">
          <span className="text-xs text-neutral-400 font-medium">
            — 第 {book.currentPageIndex + 1} 页 / 共 {book.pages.length} 页 —
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Text Tab
   ============================================================ */

function TextTab({
  page,
  fontFamily,
  selection,
  onTextBlockClick,
  onUpdateTextBlock,
  onAddTextBlock,
  onRemoveTextBlock,
  onSetSelection,
}: {
  page: any;
  fontFamily: string;
  selection: any;
  onTextBlockClick: (blockId: string, e: React.MouseEvent) => void;
  onUpdateTextBlock: (pageId: string, blockId: string, patch: any) => void;
  onAddTextBlock: () => void;
  onRemoveTextBlock: (blockId: string) => void;
  onSetSelection: (selection: any) => void;
}) {
  return (
    <div className="p-4 space-y-3">
      {page.textBlocks.map((block: any, index: number) => {
        const isSelected =
          selection.type === "textBlock" && selection.textBlockId === block.id;
        return (
          <div
            key={block.id}
            onClick={(e) => onTextBlockClick(block.id, e)}
            className={`group relative rounded-lg p-4 cursor-pointer transition-all ${
              isSelected
                ? "bg-brand-50 ring-2 ring-brand-500 shadow-xs"
                : "bg-white/70 hover:bg-white ring-1 ring-neutral-200/60 hover:ring-neutral-300"
            }`}
          >
            {/* Block number badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-neutral-200 text-neutral-600 text-xs font-bold flex items-center justify-center">
                {index + 1}
              </span>
              {/* Requirement tag */}
              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-medium rounded-base border border-blue-200">
                需
              </span>
              {/* Audio indicator */}
              {block.audioUrl && (
                <span className="px-1.5 py-0.5 bg-success-50 text-success-600 text-[10px] font-medium rounded-base border border-success-500/30">
                  音频
                </span>
              )}
              {/* Delete button */}
              {page.textBlocks.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveTextBlock(block.id);
                  }}
                  className="ml-auto p-1 rounded-base opacity-0 group-hover:opacity-100 hover:bg-error-50 text-error-400 hover:text-error-500 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>

            {/* English content */}
            <textarea
              value={block.content}
              onChange={(e) => onUpdateTextBlock(page.id, block.id, { content: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              onFocus={() => onSetSelection({ type: "textBlock", textBlockId: block.id })}
              placeholder="输入英文正文内容..."
              className="w-full min-h-[36px] bg-transparent border-none outline-none resize-none placeholder:text-neutral-400"
              style={{
                fontSize: "15px",
                fontFamily,
                color: "#353D42",
                lineHeight: 1.7,
              }}
            />

            {/* Translation */}
            <div className="mt-2 pt-2 border-t border-neutral-200/50 flex items-start gap-2">
              <span className="text-[10px] text-brand-500 font-medium mt-0.5 flex-shrink-0">翻译</span>
              <textarea
                value={block.translation}
                onChange={(e) => onUpdateTextBlock(page.id, block.id, { translation: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                onFocus={() => onSetSelection({ type: "textBlock", textBlockId: block.id })}
                placeholder="输入中文翻译..."
                rows={1}
                className="flex-1 min-h-[24px] bg-transparent border-none outline-none resize-none text-xs text-neutral-500 placeholder:text-neutral-300 leading-relaxed"
              />
            </div>
          </div>
        );
      })}

      {/* Add text block button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddTextBlock();
        }}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 border-2 border-dashed border-neutral-200 rounded-lg text-xs text-neutral-500 hover:border-brand-300 hover:text-neutral-700 transition-all"
      >
        <Plus size={14} />
        添加文本
      </button>
    </div>
  );
}

/* ============================================================
   Narration Tab
   ============================================================ */

function NarrationTab({
  page,
  enabled,
  onToggleEnabled,
  onAudioUpload,
  onAudioRemove,
  onTimingChange,
  onRequirementChange,
}: {
  page: any;
  enabled: boolean;
  onToggleEnabled: () => void;
  onAudioUpload: (url: string) => void;
  onAudioRemove: () => void;
  onTimingChange: (timing: "start" | "end") => void;
  onRequirementChange: (value: string) => void;
}) {
  return (
    <div className="p-4 space-y-4">
      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-700">讲解语音</span>
        <button
          onClick={onToggleEnabled}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            enabled ? "bg-brand-500" : "bg-neutral-300"
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {enabled && (
        <>
          {/* Timing */}
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-2 block">播放时机</label>
            <div className="flex gap-2">
              <button
                onClick={() => onTimingChange("start")}
                className={`flex-1 py-2 rounded-base text-sm font-medium transition-all ${
                  page.narrationTiming === "start"
                    ? "bg-brand-500 text-white shadow-xs"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                开头
              </button>
              <button
                onClick={() => onTimingChange("end")}
                className={`flex-1 py-2 rounded-base text-sm font-medium transition-all ${
                  page.narrationTiming === "end"
                    ? "bg-brand-500 text-white shadow-xs"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                结尾
              </button>
            </div>
          </div>

          {/* Narration text requirement */}
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-2 block">语音需求描述</label>
            <textarea
              value={page.narrationAudioRequirement}
              onChange={(e) => onRequirementChange(e.target.value)}
              placeholder="描述讲解语音的风格、内容重点、语气等需求..."
              rows={3}
              className="w-full bg-white/70 border border-neutral-200 rounded-base px-3 py-2 text-xs text-neutral-700 outline-none focus:border-brand-500 resize-none transition-colors placeholder:text-neutral-400"
            />
          </div>

          {/* Audio upload */}
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-2 block">语音文件</label>
            <AudioUploader
              audioUrl={page.narrationAudioUrl}
              onUpload={onAudioUpload}
              onRemove={onAudioRemove}
            />
          </div>
        </>
      )}

      {!enabled && (
        <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
          <Mic size={24} className="mb-2" />
          <p className="text-xs">开启讲解语音后可为此页配置语音</p>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Hotspot Tab
   ============================================================ */

function HotspotTab() {
  return (
    <div className="p-4 flex flex-col items-center justify-center py-12 text-neutral-400">
      <MapPin size={24} className="mb-2" />
      <p className="text-sm font-medium text-neutral-500">互动功能暂未开放</p>
      <p className="text-xs mt-1">后续将支持弹出卡牌、播放视频等互动点配置</p>
    </div>
  );
}
