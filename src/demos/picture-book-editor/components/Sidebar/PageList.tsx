import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useBookStore } from "../../store/useBookStore";
import { PageThumbnail } from "./PageThumbnail";
import { Plus, BookOpen, Mic } from "lucide-react";

export function PageList() {
  const { book, setCurrentPage, setViewingNarration, reorderPages, addPage } = useBookStore();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const fromIndex = book.pages.findIndex((p) => p.id === active.id);
      const toIndex = book.pages.findIndex((p) => p.id === over.id);
      reorderPages(fromIndex, toIndex);
    }
  };

  const isCoverActive = book.currentPageIndex === -1;

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3 border-b border-neutral-200">
        <h3 className="text-sm font-semibold text-neutral-700">
          页面列表
        </h3>
        <p className="text-xs text-neutral-500 mt-0.5">
          共 {book.pages.length} 页 · 拖拽可排序
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0">
        {/* Cover entry */}
        <div
          onClick={() => setCurrentPage(-1)}
          className={`
            flex gap-2 p-2 rounded-md cursor-pointer transition-all duration-150
            ${isCoverActive
              ? "bg-brand-50 ring-2 ring-brand-500 shadow-xs"
              : "hover:bg-neutral-100"
            }
          `}
        >
          <div className="w-14 h-14 rounded-base overflow-hidden bg-neutral-100 flex-shrink-0 border border-neutral-200">
            {book.cover.imageUrl ? (
              <img
                src={book.cover.imageUrl}
                alt="封面"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen size={18} className="text-neutral-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-neutral-700">封面</div>
            <div className="text-xs text-neutral-500 mt-0.5 truncate">
              {book.cover.title || "未设置标题"}
            </div>
          </div>
        </div>

        {/* Narration between cover and page 1 */}
        {book.pages.length > 0 && (
          <NarrationSlot
            index={0}
            label="封面 → 第1页"
            hasAudio={!!book.pages[0].audioUrl}
            isActive={book.viewMode === "narration" && book.currentPageIndex === 0}
            onClick={() => setViewingNarration(0)}
          />
        )}

        {/* Page list */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={book.pages.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {book.pages.map((page, index) => (
              <div key={page.id}>
                <PageThumbnail
                  page={page}
                  index={index}
                  isActive={index === book.currentPageIndex}
                  onClick={() => setCurrentPage(index)}
                />
                {/* Narration between pages (not after the last page) */}
                {index < book.pages.length - 1 && (
                  <NarrationSlot
                    index={index + 1}
                    label={`第${index + 1}页 → 第${index + 2}页`}
                    hasAudio={!!book.pages[index + 1].audioUrl}
                    isActive={book.viewMode === "narration" && book.currentPageIndex === index + 1}
                    onClick={() => setViewingNarration(index + 1)}
                  />
                )}
              </div>
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <div className="px-3 py-3 border-t border-neutral-200">
        <button
          onClick={addPage}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-button text-sm font-semibold transition-all active:scale-[0.98] shadow-xs"
        >
          <Plus size={16} />
          添加新页
        </button>
      </div>
    </div>
  );
}

/* ---------- Narration Slot (between pages) ---------- */

interface NarrationSlotProps {
  index: number;
  label: string;
  hasAudio: boolean;
  isActive: boolean;
  onClick: () => void;
}

function NarrationSlot({ label, hasAudio, isActive, onClick }: NarrationSlotProps) {
  return (
    <div className="flex items-center gap-1.5 py-1 px-1">
      {/* Connector line */}
      <div className="flex flex-col items-center w-4 flex-shrink-0">
        <div className="w-px h-2 bg-neutral-200" />
        <Mic size={10} className={hasAudio ? "text-brand-500" : "text-neutral-400"} />
        <div className="w-px h-2 bg-neutral-200" />
      </div>

      <button
        onClick={onClick}
        className={`flex-1 min-w-0 flex items-center gap-1.5 px-2 py-1.5 rounded-base text-[11px] transition-all ${
          isActive
            ? "bg-brand-50 ring-1 ring-brand-500 text-brand-700 font-medium"
            : hasAudio
              ? "bg-neutral-0 border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
              : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100"
        }`}
      >
        <Mic size={10} className={isActive ? "text-brand-500" : hasAudio ? "text-brand-500" : "text-neutral-400"} />
        <span className="truncate">{label}</span>
        {hasAudio && (
          <span className={`ml-auto flex-shrink-0 w-1.5 h-1.5 rounded-full ${isActive ? "bg-brand-500" : "bg-brand-400"}`} />
        )}
      </button>
    </div>
  );
}
