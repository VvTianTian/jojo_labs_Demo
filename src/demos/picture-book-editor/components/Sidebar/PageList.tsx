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
import { Plus, BookOpen } from "lucide-react";

export function PageList() {
  const { book, setCurrentPage, reorderPages, addPage } = useBookStore();
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
      {/* Header */}
      <div className="px-3 py-3 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-brand-50 text-brand-600 text-xs font-medium rounded-base">
            动画书
          </span>
        </div>
        <p className="text-xs text-neutral-400 mt-1.5">
          共 {book.pages.length} 页 · 拖拽可排序
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
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
              <div className="w-full h-full flex flex-col items-center justify-center">
                <BookOpen size={14} className="text-neutral-300 mb-0.5" />
                <span className="text-[8px] text-neutral-400">暂无封面</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="text-xs font-semibold text-neutral-700">封面</div>
            <div className="text-[10px] text-neutral-400 mt-0.5 truncate">
              {book.cover.title || "未命名标题"}
            </div>
          </div>
        </div>

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
              <PageThumbnail
                key={page.id}
                page={page}
                index={index}
                isActive={index === book.currentPageIndex}
                onClick={() => setCurrentPage(index)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Add page button */}
      <div className="px-3 py-3 border-t border-neutral-200">
        <button
          onClick={addPage}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-neutral-0 hover:bg-neutral-50 text-neutral-700 border border-neutral-200 hover:border-brand-300 rounded-button text-sm font-medium transition-all active:scale-[0.98]"
        >
          <Plus size={15} className="text-neutral-500" />
          添加页面
        </button>
      </div>
    </div>
  );
}
