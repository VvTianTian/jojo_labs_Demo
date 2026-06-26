import { useBookStore } from "../../store/useBookStore";
import { useRoleStore } from "../../store/useRoleStore";
import { ImageUploader } from "../common/ImageUploader";
import { RequirementTextarea } from "../common/RequirementTextarea";
import { RequirementHint } from "../common/RequirementHint";
import { Trash2 } from "lucide-react";
import type { Cover } from "../../types/book";

export function CoverCanvas() {
  const { book, updateCover, updateCoverRequirement } = useBookStore();
  const { currentRole } = useRoleStore();
  const isEditorial = currentRole === "editorial";
  const { cover } = book;
  const fontFamily = book.globalSettings.defaultFontFamily;

  const handleImageUpload = (dataUrl: string) => {
    updateCover({ imageUrl: dataUrl });
  };

  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="w-full max-w-[800px]">
        {cover.layout === "fullscreen" ? (
          <FullscreenCover
            cover={cover}
            fontFamily={fontFamily}
            isEditorial={isEditorial}
            onImageUpload={handleImageUpload}
            onRemoveImage={() => updateCover({ imageUrl: null })}
            onUpdateCover={updateCover}
            onRequirementChange={(v) => updateCoverRequirement("imageRequirement", v)}
          />
        ) : (
          <SplitCover
            cover={cover}
            fontFamily={fontFamily}
            isEditorial={isEditorial}
            onImageUpload={handleImageUpload}
            onRemoveImage={() => updateCover({ imageUrl: null })}
            onUpdateCover={updateCover}
            onRequirementChange={(v) => updateCoverRequirement("imageRequirement", v)}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- Fullscreen Cover ---------- */

interface CoverViewProps {
  cover: Cover;
  fontFamily: string;
  isEditorial: boolean;
  onImageUpload: (dataUrl: string) => void;
  onRemoveImage: () => void;
  onUpdateCover: (cover: Partial<Cover>) => void;
  onRequirementChange: (value: string) => void;
}

function FullscreenCover({ cover, fontFamily, isEditorial, onImageUpload, onRemoveImage, onUpdateCover, onRequirementChange }: CoverViewProps) {
  return (
    <div className="relative aspect-[16/9] w-full rounded-lg shadow-sm border border-neutral-200 overflow-hidden bg-neutral-100">
      {cover.imageUrl ? (
        <>
          <img
            src={cover.imageUrl}
            alt="封面"
            className="w-full h-full object-cover"
          />
          {/* 操作按钮仅制作角色可见 */}
          {!isEditorial && (
            <div className="absolute top-3 right-3 flex gap-2">
              <ImageUploader onImageUpload={onImageUpload} compact />
              <button
                onClick={onRemoveImage}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-error-50 hover:bg-error-100 text-error-600 rounded-button text-sm font-medium transition-all backdrop-blur-sm"
              >
                <Trash2 size={14} />
                删除
              </button>
            </div>
          )}
          {/* Title overlay only */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-8 pt-16">
            <input
              value={cover.title}
              onChange={(e) => onUpdateCover({ title: e.target.value })}
              readOnly={!isEditorial}
              placeholder="绘本标题"
              className={`w-full bg-transparent text-white text-3xl font-bold outline-none placeholder:text-white/40 ${
                !isEditorial ? "cursor-default" : ""
              }`}
              style={{ fontFamily }}
            />
          </div>
        </>
      ) : (
        <div className="w-full h-full flex flex-col">
          <div className="flex-1 p-6">
            {isEditorial ? (
              <RequirementTextarea
                value={cover.imageRequirement}
                onChange={onRequirementChange}
                type="image"
              />
            ) : (
              <>
                <RequirementHint text={cover.imageRequirement} type="image" />
                <ImageUploader onImageUpload={onImageUpload} />
              </>
            )}
          </div>
          <div className="px-8 pb-6">
            <input
              value={cover.title}
              onChange={(e) => onUpdateCover({ title: e.target.value })}
              readOnly={!isEditorial}
              placeholder="绘本标题"
              className={`w-full bg-transparent text-neutral-700 text-2xl font-bold outline-none border-b-2 border-neutral-200 focus:border-brand-500 pb-2 transition-colors placeholder:text-neutral-400 ${
                !isEditorial ? "cursor-default" : ""
              }`}
              style={{ fontFamily }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Split Cover (Left image, Right text) ---------- */

function SplitCover({ cover, fontFamily, isEditorial, onImageUpload, onRemoveImage, onUpdateCover, onRequirementChange }: CoverViewProps) {
  return (
    <div className="flex aspect-[16/9] w-full rounded-lg shadow-sm border border-neutral-200 overflow-hidden bg-neutral-0">
      {/* Left: Image */}
      <div className="w-1/2 relative bg-neutral-100">
        {cover.imageUrl ? (
          <>
            <img
              src={cover.imageUrl}
              alt="封面"
              className="w-full h-full object-cover"
            />
            {/* 操作按钮仅制作角色可见 */}
            {!isEditorial && (
              <div className="absolute top-3 right-3 flex gap-2">
                <ImageUploader onImageUpload={onImageUpload} compact />
                <button
                  onClick={onRemoveImage}
                  className="p-1.5 bg-error-50 hover:bg-error-100 text-error-600 rounded-button transition-all backdrop-blur-sm"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full p-4">
            {isEditorial ? (
              <RequirementTextarea
                value={cover.imageRequirement}
                onChange={onRequirementChange}
                type="image"
              />
            ) : (
              <>
                <RequirementHint text={cover.imageRequirement} type="image" />
                <ImageUploader onImageUpload={onImageUpload} />
              </>
            )}
          </div>
        )}
      </div>

      {/* Right: Text */}
      <div className="w-1/2 flex flex-col justify-center p-8 space-y-5" style={{ backgroundColor: "#F4F8FA" }}>
        <div>
          <label className="text-xs font-medium text-neutral-500 mb-1.5 block">标题</label>
          <input
            value={cover.title}
            onChange={(e) => onUpdateCover({ title: e.target.value })}
            readOnly={!isEditorial}
            placeholder="绘本标题"
            className={`w-full bg-transparent text-neutral-700 text-2xl font-bold outline-none border-b-2 border-neutral-200 focus:border-brand-500 pb-2 transition-colors placeholder:text-neutral-400 ${
              !isEditorial ? "cursor-default" : ""
            }`}
            style={{ fontFamily }}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500 mb-1.5 block">作者</label>
          <input
            value={cover.author}
            onChange={(e) => onUpdateCover({ author: e.target.value })}
            readOnly={!isEditorial}
            placeholder="作者名字"
            className={`w-full bg-transparent text-neutral-700 text-base outline-none border-b border-neutral-200 focus:border-brand-500 pb-1 transition-colors placeholder:text-neutral-400 ${
              !isEditorial ? "cursor-default" : ""
            }`}
            style={{ fontFamily }}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500 mb-1.5 block">内容简介</label>
          <textarea
            value={cover.synopsis}
            onChange={(e) => onUpdateCover({ synopsis: e.target.value })}
            readOnly={!isEditorial}
            placeholder="写一段简短的故事简介..."
            rows={4}
            className={`w-full bg-transparent text-neutral-500 text-sm outline-none resize-none border border-neutral-200 rounded-base p-3 focus:border-brand-500 transition-colors placeholder:text-neutral-400 leading-relaxed ${
              !isEditorial ? "cursor-default" : ""
            }`}
            style={{ fontFamily }}
          />
        </div>
      </div>
    </div>
  );
}
