import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Image, Mic } from "lucide-react";
import type { Page } from "../../types/book";

interface PageThumbnailProps {
  page: Page;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

export function PageThumbnail({ page, index, isActive, onClick }: PageThumbnailProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasImage = !!page.imageUrl;
  const hasText = page.textBlocks.some((b) => b.content.trim().length > 0);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative flex gap-2 p-2 rounded-md cursor-pointer transition-all duration-150
        ${isActive
          ? "bg-brand-50 ring-2 ring-brand-500 shadow-xs"
          : "hover:bg-neutral-100"
        }
        ${isDragging ? "z-50" : ""}
      `}
      onClick={onClick}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={14} className="text-neutral-400" />
      </div>

      {/* Thumbnail preview */}
      <div className="relative w-14 h-14 rounded-base overflow-hidden bg-neutral-100 flex-shrink-0 border border-neutral-200">
        {hasImage ? (
          <img
            src={page.imageUrl!}
            alt={`正文 ${index + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <Image size={14} className="text-neutral-300 mb-0.5" />
            <span className="text-[8px] text-neutral-400">暂无图片</span>
          </div>
        )}
        {/* Narration indicator */}
        {page.narrationAudioUrl && (
          <div className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center">
            <Mic size={8} className="text-white" />
          </div>
        )}
      </div>

      {/* Page info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-neutral-700">
            正文 {index + 1}
          </span>
          {/* Warning indicator if no content */}
          {(!hasImage || !hasText) && (
            <span className="text-[10px] text-amber-500 font-bold">!!</span>
          )}
        </div>
        <div className="text-[10px] text-neutral-400 mt-0.5 truncate">
          {hasText
            ? (page.textBlocks.find((b) => b.content.trim())?.content || "")
            : "暂无文案"
          }
        </div>
      </div>
    </div>
  );
}
