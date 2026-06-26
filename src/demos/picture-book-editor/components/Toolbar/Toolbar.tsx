import { useState } from "react";
import { useBookStore } from "../../store/useBookStore";
import { useRoleStore } from "../../store/useRoleStore";
import { BookOpen, Plus, Trash2, Settings, ChevronLeft, ChevronRight, UserCog, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { GlobalSettings } from "../Settings/GlobalSettings";

export function Toolbar() {
  const { book, setBookTitle, addPage, deletePage, setCurrentPage, setViewingNarration } = useBookStore();
  const { currentRole, toggleRole } = useRoleStore();
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const isEditorial = currentRole === "editorial";

  const isCoverView = book.currentPageIndex === -1 && book.viewMode === "canvas";
  const isNarrationView = book.viewMode === "narration";
  const currentPage = isCoverView || isNarrationView ? null : book.pages[book.currentPageIndex];

  const canGoPrev = !isCoverView;
  const canGoNext = (() => {
    if (isCoverView) return true;
    if (isNarrationView) return book.currentPageIndex < book.pages.length - 1;
    return book.currentPageIndex < book.pages.length - 1;
  })();

  const handlePrev = () => {
    if (isCoverView) return;
    if (isNarrationView) {
      if (book.currentPageIndex === 0) {
        setCurrentPage(-1); // cover
      } else {
        setViewingNarration(book.currentPageIndex - 1);
      }
    } else if (book.currentPageIndex === 0) {
      setViewingNarration(0); // narration between cover and page 1
    } else {
      setCurrentPage(book.currentPageIndex - 1);
    }
  };

  const handleNext = () => {
    if (isCoverView) {
      setViewingNarration(0); // narration between cover and page 1
    } else if (isNarrationView) {
      if (book.currentPageIndex < book.pages.length - 1) {
        setViewingNarration(book.currentPageIndex + 1);
      } else {
        setCurrentPage(book.currentPageIndex); // last narration -> page
      }
    } else if (book.currentPageIndex < book.pages.length - 1) {
      setCurrentPage(book.currentPageIndex + 1);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between px-5 py-3 bg-neutral-0 border-b border-neutral-200 shadow-xs">
        {/* Left: Back + Book title */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/"
            className="p-1.5 rounded-base hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-all"
            title="返回首页"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
            <BookOpen size={18} className="text-brand-500" />
          </div>
          {isEditingTitle && isEditorial ? (
            <input
              autoFocus
              value={book.title}
              onChange={(e) => setBookTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
              className="text-lg font-semibold text-neutral-700 bg-transparent border-b-2 border-brand-500 outline-none max-w-[200px]"
            />
          ) : (
            <h1
              onClick={() => isEditorial && setIsEditingTitle(true)}
              className={`text-lg font-semibold text-neutral-700 transition-colors truncate ${
                isEditorial ? "cursor-pointer hover:text-brand-500" : "cursor-default"
              }`}
              title={isEditorial ? "点击编辑书名" : book.title}
            >
              {book.title}
            </h1>
          )}
        </div>

        {/* Center: Page navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={!canGoPrev}
            className="p-1.5 rounded-base hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={18} className="text-neutral-600" />
          </button>
          <span className="text-sm font-medium text-neutral-700 min-w-[120px] text-center">
            {isCoverView
              ? "封面"
              : isNarrationView
                ? `讲解: ${book.currentPageIndex === 0 ? "封面" : `第${book.currentPageIndex}页`} → 第${book.currentPageIndex + 1}页`
                : `${book.currentPageIndex + 1} / ${book.pages.length}`
            }
          </span>
          <button
            onClick={handleNext}
            disabled={!canGoNext && !isCoverView}
            className="p-1.5 rounded-base hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={18} className="text-neutral-600" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Role toggle */}
          <button
            onClick={toggleRole}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-button text-sm font-medium transition-all ${
              currentRole === "editorial"
                ? "bg-blue-50 hover:bg-blue-100 text-blue-700"
                : "bg-green-50 hover:bg-green-100 text-green-700"
            }`}
            title="切换角色"
          >
            <UserCog size={15} />
            <span>{currentRole === "editorial" ? "教研" : "制作"}</span>
          </button>

          <div className="h-5 w-px bg-neutral-200" />

          <button
            onClick={addPage}
            disabled={!isEditorial}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-button text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">新页</span>
          </button>
          <button
            onClick={() => currentPage && deletePage(currentPage.id)}
            disabled={!currentPage || book.pages.length <= 1 || !isEditorial}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-error-50 hover:bg-error-100 text-error-600 rounded-button text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 size={15} />
            <span className="hidden sm:inline">删除</span>
          </button>
          <button
            onClick={() => isEditorial && setShowGlobalSettings(!showGlobalSettings)}
            disabled={!isEditorial}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-button text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
              showGlobalSettings && isEditorial
                ? "bg-brand-500 text-white"
                : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
            }`}
          >
            <Settings size={15} />
            <span className="hidden sm:inline">设置</span>
          </button>
        </div>
      </div>

      {/* Global Settings Dropdown */}
      {showGlobalSettings && (
        <div className="bg-neutral-0 border-b border-neutral-200 shadow-sm">
          <GlobalSettings onClose={() => setShowGlobalSettings(false)} />
        </div>
      )}
    </>
  );
}
