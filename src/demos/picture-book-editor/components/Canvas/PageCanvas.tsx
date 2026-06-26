import { useRef } from "react";
import { useBookStore } from "../../store/useBookStore";
import { useRoleStore } from "../../store/useRoleStore";
import { ImageUploader } from "../common/ImageUploader";
import { RequirementTextarea } from "../common/RequirementTextarea";
import { RequirementHint } from "../common/RequirementHint";
import { Trash2, Plus } from "lucide-react";

export function PageCanvas() {
  const {
    book, updatePageImage, updateTextBlock, addTextBlock,
    updatePageRequirement,
    setSelection,
  } = useBookStore();
  const { currentRole } = useRoleStore();
  const isEditorial = currentRole === "editorial";
  const currentPage = book.pages[book.currentPageIndex];
  const imageRef = useRef<HTMLDivElement>(null);

  if (!currentPage) return null;

  const bgColor =
    currentPage.settings.backgroundColor ??
    book.globalSettings.defaultBackgroundColor;
  const fontSize = currentPage.settings.fontSize ?? 18;
  const textAlign = currentPage.settings.textAlign ?? "center";
  const fontFamily = book.globalSettings.defaultFontFamily;
  const { selection } = book;

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelection({ type: "image" });
  };

  const handleTextBlockClick = (blockId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelection({ type: "textBlock", textBlockId: blockId });
  };

  const handleCanvasClick = () => {
    setSelection({ type: "none" });
  };

  return (
    <div className="flex items-center justify-center h-full p-6" onClick={handleCanvasClick}>
      <div
        className="w-full max-w-[720px] rounded-lg shadow-sm border border-neutral-200 overflow-hidden transition-colors duration-150"
        style={{ backgroundColor: bgColor }}
      >
        {/* Image area */}
        <div
          ref={imageRef}
          className={`relative aspect-[16/9] w-full ${isEditorial ? "cursor-default" : "cursor-pointer"} transition-all`}
          onClick={(e) => !isEditorial && handleImageClick(e)}
        >
          {currentPage.imageUrl ? (
            <>
              <img
                src={currentPage.imageUrl}
                alt={`第 ${book.currentPageIndex + 1} 页`}
                className="w-full h-full object-cover"
              />
              {/* 操作按钮仅制作角色可见 */}
              {!isEditorial && (
                <div className="absolute top-3 right-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <ImageUploader
                    onImageUpload={(d) => updatePageImage(currentPage.id, d)}
                    compact
                  />
                  <button
                    onClick={() => updatePageImage(currentPage.id, null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-error-50 hover:bg-error-100 text-error-600 rounded-button text-sm font-medium transition-all backdrop-blur-sm"
                  >
                    <Trash2 size={14} />
                    删除
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full p-6" onClick={(e) => e.stopPropagation()}>
              {isEditorial ? (
                <RequirementTextarea
                  value={currentPage.imageRequirement}
                  onChange={(v) => updatePageRequirement(currentPage.id, "imageRequirement", v)}
                  type="image"
                />
              ) : (
                <>
                  <RequirementHint text={currentPage.imageRequirement} type="image" />
                  <ImageUploader onImageUpload={(d) => updatePageImage(currentPage.id, d)} />
                </>
              )}
            </div>
          )}
        </div>

        {/* Text blocks */}
        <div className="p-6 pt-4 space-y-2">
          {currentPage.textBlocks.map((block) => {
            const isSelected =
              selection.type === "textBlock" && selection.textBlockId === block.id;
            return (
              <div
                key={block.id}
                onClick={(e) => isEditorial && handleTextBlockClick(block.id, e)}
                className={`group relative rounded-base p-3 transition-all ${
                  isEditorial ? "cursor-pointer" : "cursor-default"
                } ${
                  isSelected
                    ? "bg-brand-50 ring-2 ring-brand-500"
                    : "hover:bg-white/50 ring-1 ring-transparent hover:ring-neutral-200"
                }`}
              >
                <textarea
                  value={block.content}
                  onChange={(e) =>
                    updateTextBlock(currentPage.id, block.id, { content: e.target.value })
                  }
                  onClick={(e) => isEditorial && e.stopPropagation()}
                  onFocus={() => isEditorial && setSelection({ type: "textBlock", textBlockId: block.id })}
                  readOnly={!isEditorial}
                  placeholder="输入正文内容..."
                  className={`w-full min-h-[40px] bg-transparent border-none outline-none resize-none placeholder:text-neutral-400 ${
                    !isEditorial ? "cursor-default" : ""
                  }`}
                  style={{
                    fontSize: `${fontSize}px`,
                    textAlign,
                    fontFamily,
                    color: "#353D42",
                    lineHeight: 1.6,
                  }}
                />
                {/* Translation preview */}
                {block.translation && (
                  <div className="mt-1 text-xs text-brand-500/70 italic border-t border-neutral-200/50 pt-1">
                    {block.translation}
                  </div>
                )}
                {/* Audio indicator */}
                {block.audioUrl && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-success-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[8px] text-white">♪</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add text block button - 仅教研可见 */}
          {isEditorial && (
            <button
              onClick={() => addTextBlock(currentPage.id)}
              className="w-full flex items-center justify-center gap-1.5 py-2 border-2 border-dashed border-neutral-200 rounded-base text-xs text-neutral-500 hover:border-brand-300 hover:text-neutral-700 transition-all"
            >
              <Plus size={14} />
              添加文字块
            </button>
          )}
        </div>

        {/* Page indicator */}
        <div className="px-6 pb-4 flex justify-between items-center">
          <span className="text-xs text-neutral-500 font-medium">
            — 第 {book.currentPageIndex + 1} 页 / 共 {book.pages.length} 页 —
          </span>
        </div>
      </div>
    </div>
  );
}
