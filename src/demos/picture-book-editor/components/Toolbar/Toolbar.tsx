import { useState } from "react";
import { useBookStore } from "../../store/useBookStore";
import { BookOpen, ArrowLeft, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { GlobalSettings } from "../Settings/GlobalSettings";

export function Toolbar() {
  const { book, setBookTitle } = useBookStore();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-0 border-b border-neutral-200 shadow-xs">
        {/* Left: Back + Book icon + Title */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            to="/"
            className="p-1.5 rounded-base hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-all flex-shrink-0"
            title="返回首页"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
            <BookOpen size={14} className="text-brand-500" />
          </div>
          {isEditingTitle ? (
            <input
              autoFocus
              value={book.title}
              onChange={(e) => setBookTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
              className="text-sm font-semibold text-neutral-700 bg-transparent border-b-2 border-brand-500 outline-none max-w-[200px]"
            />
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              className="text-sm font-semibold text-neutral-700 transition-colors truncate cursor-pointer hover:text-brand-500 max-w-[200px]"
              title="点击编辑书名"
            >
              {book.title}
            </h1>
          )}
        </div>

        {/* Right: Global settings */}
        <button
          onClick={() => setShowGlobalSettings(!showGlobalSettings)}
          className={`p-1.5 rounded-base transition-all ${
            showGlobalSettings
              ? "bg-brand-500 text-white"
              : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600"
          }`}
          title="全局设置"
        >
          <Settings size={15} />
        </button>
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
