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
        {page.imageUrl ? (
          <img
            src={page.imageUrl}
            alt={`第 ${index + 1} 页`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image size={18} className="text-neutral-400" />
          </div>
        )}
        {page.audioUrl && (
          <div className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center">
            <Mic size={8} className="text-white" />
          </div>
        )}
      </div>

      {/* Page info */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-neutral-700">
          第 {index + 1} 页
        </div>
        <div className="text-xs text-neutral-500 mt-0.5 truncate">
          {page.textBlocks[0]?.content || "暂无文字"}
        </div>
      </div>
    </div>
  );
}
