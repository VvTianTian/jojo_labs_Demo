import { useBookStore } from "../../store/useBookStore";
import { useRoleStore } from "../../store/useRoleStore";
import { MapPin, X } from "lucide-react";

export function ImageSettings() {
  const { book, updatePageImage } = useBookStore();
  const { currentRole } = useRoleStore();
  const isEditorial = currentRole === "editorial";
  const currentPage = book.pages[book.currentPageIndex];

  if (!currentPage) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-neutral-200">
        <h3 className="text-sm font-semibold text-neutral-700">图片设置</h3>
        <p className="text-xs text-neutral-500 mt-0.5">
          第 {book.currentPageIndex + 1} 页 · 互动交互
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Image preview */}
        {currentPage.imageUrl && (
          <div className="relative rounded-md overflow-hidden border border-neutral-200">
            <img
              src={currentPage.imageUrl}
              alt="页面图片"
              className="w-full aspect-video object-cover"
            />
            {/* 删除按钮仅制作角色可见 */}
            {!isEditorial && (
              <button
                onClick={() => updatePageImage(currentPage.id, null)}
                className="absolute top-1.5 right-1.5 p-1 bg-error-50 text-error-600 rounded-full hover:bg-error-100 transition-all"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}

        {/* Tip */}
        <div className="bg-info-50 rounded-base px-3 py-2">
          <p className="text-xs text-neutral-500 leading-relaxed">
            <MapPin size={10} className="inline mr-1" />
            互动功能暂未开放
          </p>
        </div>
      </div>
    </div>
  );
}
