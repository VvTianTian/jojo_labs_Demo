import { useState } from "react";
import { useBookStore } from "../../store/useBookStore";
import { ImageUploader } from "../common/ImageUploader";
import { AudioUploader } from "../common/AudioUploader";
import { Trash2, Mic, ChevronDown, ChevronUp, Image, FileText } from "lucide-react";

export function CoverCanvas() {
  const { book, updateCover, updateCoverRequirement } = useBookStore();
  const { cover } = book;
  const fontFamily = book.globalSettings.defaultFontFamily;
  const [showNarration, setShowNarration] = useState(!!cover.narrationAudioUrl);

  return (
    <div className="flex items-start justify-center h-full p-6 overflow-auto">
      <div className="w-full max-w-[900px] bg-neutral-0 rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        {/* Main area: Left image + Right metadata */}
        <div className="flex min-h-[420px]">
          {/* Left: Image upload area */}
          <div className="w-[55%] relative bg-neutral-50 border-r border-neutral-200 flex flex-col">
            {/* Image tag */}
            <div className="px-4 pt-3 pb-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-pink-50 text-pink-600 text-xs font-medium rounded-base border border-pink-200">
                <Image size={10} />
                图片
              </span>
            </div>

            {cover.imageUrl ? (
              /* Has image */
              <div className="flex-1 p-4 pt-0 flex flex-col">
                <div className="relative flex-1 rounded-md overflow-hidden border border-neutral-200">
                  <img
                    src={cover.imageUrl}
                    alt="封面"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <ImageUploader
                      onImageUpload={(d) => updateCover({ imageUrl: d })}
                      compact
                    />
                    <button
                      onClick={() => updateCover({ imageUrl: null })}
                      className="p-1.5 bg-error-50 hover:bg-error-100 text-error-600 rounded-button transition-all backdrop-blur-sm"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* No image: upload zone */
              <div className="flex-1 p-4 pt-0 flex flex-col gap-3">
                <div className="flex-1">
                  <ImageUploader
                    onImageUpload={(d) => updateCover({ imageUrl: d })}
                  />
                </div>
              </div>
            )}

            {/* Requirement section (collapsible) */}
            <div className="border-t border-neutral-200">
              <button
                onClick={() => {
                  const el = document.getElementById("cover-req-textarea");
                  if (el) el.focus();
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100/50 transition-all"
              >
                <span className="flex items-center gap-1.5">
                  <FileText size={12} />
                  {cover.imageRequirement || "需求描述"}
                </span>
              </button>
              <div className="px-4 pb-3">
                <textarea
                  id="cover-req-textarea"
                  value={cover.imageRequirement}
                  onChange={(e) => updateCoverRequirement("imageRequirement", e.target.value)}
                  placeholder="描述对封面图片的需求，如场景、风格、色调等..."
                  rows={2}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-base px-3 py-2 text-xs text-neutral-700 outline-none focus:border-brand-500 resize-none transition-colors placeholder:text-neutral-400"
                />
              </div>
            </div>
          </div>

          {/* Right: Metadata fields */}
          <div className="w-[45%] flex flex-col justify-center p-8 space-y-5" style={{ backgroundColor: "#FAFCFD" }}>
            <div>
              <label className="text-xs font-medium text-neutral-400 mb-1.5 block">标题</label>
              <input
                value={cover.title}
                onChange={(e) => updateCover({ title: e.target.value })}
                placeholder="请输入标题"
                className="w-full bg-transparent text-neutral-700 text-xl font-bold outline-none border-b-2 border-neutral-200 focus:border-brand-500 pb-2 transition-colors placeholder:text-neutral-300"
                style={{ fontFamily }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-400 mb-1.5 block">作者</label>
              <input
                value={cover.author}
                onChange={(e) => updateCover({ author: e.target.value })}
                placeholder="请输入内容"
                className="w-full bg-transparent text-neutral-700 text-sm outline-none border-b border-neutral-200 focus:border-brand-500 pb-1.5 transition-colors placeholder:text-neutral-300"
                style={{ fontFamily }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-400 mb-1.5 block">蓝思值</label>
              <input
                value={cover.lexile}
                onChange={(e) => updateCover({ lexile: e.target.value })}
                placeholder="请输入内容"
                className="w-full bg-transparent text-neutral-700 text-sm outline-none border-b border-neutral-200 focus:border-brand-500 pb-1.5 transition-colors placeholder:text-neutral-300"
                style={{ fontFamily }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-400 mb-1.5 block">是否是虚构</label>
              <input
                value={cover.isFictional}
                onChange={(e) => updateCover({ isFictional: e.target.value })}
                placeholder="请输入内容"
                className="w-full bg-transparent text-neutral-700 text-sm outline-none border-b border-neutral-200 focus:border-brand-500 pb-1.5 transition-colors placeholder:text-neutral-300"
                style={{ fontFamily }}
              />
            </div>
          </div>
        </div>

        {/* Bottom: Narration section */}
        <div className="border-t border-neutral-200 bg-neutral-0">
          <button
            onClick={() => setShowNarration(!showNarration)}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-neutral-50 transition-all"
          >
            <span className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                <Mic size={12} className="text-amber-600" />
              </span>
              <span className="text-sm font-medium text-neutral-700">讲解语音</span>
              {cover.narrationAudioUrl && (
                <span className="px-1.5 py-0.5 bg-success-50 text-success-600 text-xs font-medium rounded-base">
                  已添加
                </span>
              )}
            </span>
            {showNarration ? <ChevronUp size={16} className="text-neutral-400" /> : <ChevronDown size={16} className="text-neutral-400" />}
          </button>

          {showNarration && (
            <div className="px-5 pb-4 space-y-3">
              {/* Timing */}
              <div>
                <label className="text-xs font-medium text-neutral-500 mb-2 block">播放时机</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateCover({ narrationTiming: "start" })}
                    className={`flex-1 py-2 rounded-base text-sm font-medium transition-all ${
                      cover.narrationTiming === "start"
                        ? "bg-brand-500 text-white shadow-xs"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    开头
                  </button>
                  <button
                    onClick={() => updateCover({ narrationTiming: "end" })}
                    className={`flex-1 py-2 rounded-base text-sm font-medium transition-all ${
                      cover.narrationTiming === "end"
                        ? "bg-brand-500 text-white shadow-xs"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    结尾
                  </button>
                </div>
              </div>

              {/* Audio upload */}
              <div>
                <label className="text-xs font-medium text-neutral-500 mb-2 block">语音文件</label>
                <AudioUploader
                  audioUrl={cover.narrationAudioUrl}
                  onUpload={(dataUrl) => updateCover({ narrationAudioUrl: dataUrl })}
                  onRemove={() => updateCover({ narrationAudioUrl: null })}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
