import { useBookStore } from "../../store/useBookStore";
import { useRoleStore } from "../../store/useRoleStore";
import { ColorPicker } from "../common/ColorPicker";
import { FONT_SIZE_OPTIONS } from "../../constants/defaults";
import { AlignLeft, AlignCenter, AlignRight, RotateCcw, Check } from "lucide-react";

export function PageSettings() {
  const { book, updatePageSettings } = useBookStore();
  const { currentRole } = useRoleStore();
  const isEditorial = currentRole === "editorial";
  const currentPage = book.pages[book.currentPageIndex];

  if (!currentPage) return null;

  const { settings } = currentPage;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-neutral-200">
        <h3 className="text-sm font-semibold text-neutral-700">
          页面设置
        </h3>
        <p className="text-xs text-neutral-500 mt-0.5">
          第 {book.currentPageIndex + 1} 页
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Background Color */}
        <div>
          <label className="text-xs font-medium text-neutral-700 mb-2 flex items-center justify-between">
            背景色
            {settings.backgroundColor !== null && isEditorial && (
              <button
                onClick={() => updatePageSettings(currentPage.id, { backgroundColor: null })}
                className="text-neutral-500 hover:text-brand-500 transition-colors"
                title="重置为继承全局"
              >
                <RotateCcw size={12} />
              </button>
            )}
          </label>
          <div className={isEditorial ? "" : "opacity-50 pointer-events-none"}>
            <ColorPicker
              value={settings.backgroundColor}
              onChange={(color) =>
                updatePageSettings(currentPage.id, { backgroundColor: color })
              }
              showInherit
            />
          </div>
        </div>

        {/* Font Size */}
        <div>
          <label className="text-xs font-medium text-neutral-700 mb-2 flex items-center justify-between">
            文字大小
            {settings.fontSize !== null && isEditorial && (
              <button
                onClick={() => updatePageSettings(currentPage.id, { fontSize: null })}
                className="text-neutral-500 hover:text-brand-500 transition-colors"
                title="重置为继承全局"
              >
                <RotateCcw size={12} />
              </button>
            )}
          </label>
          <div className={`flex flex-wrap gap-1.5 ${!isEditorial ? "opacity-50 pointer-events-none" : ""}`}>
            <button
              onClick={() => updatePageSettings(currentPage.id, { fontSize: null })}
              className={`px-2.5 py-1.5 rounded-base text-xs font-medium transition-all ${
                settings.fontSize === null
                  ? "bg-brand-500 text-white shadow-xs"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
              }`}
            >
              {settings.fontSize === null && <Check size={12} className="inline mr-1" />}
              自动
            </button>
            {FONT_SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                onClick={() => updatePageSettings(currentPage.id, { fontSize: size })}
                className={`px-2.5 py-1.5 rounded-base text-xs font-medium transition-all ${
                  settings.fontSize === size
                    ? "bg-brand-500 text-white shadow-xs"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Text Align */}
        <div>
          <label className="text-xs font-medium text-neutral-700 mb-2 flex items-center justify-between">
            文字对齐
            {settings.textAlign !== null && isEditorial && (
              <button
                onClick={() => updatePageSettings(currentPage.id, { textAlign: null })}
                className="text-neutral-500 hover:text-brand-500 transition-colors"
                title="重置为继承全局"
              >
                <RotateCcw size={12} />
              </button>
            )}
          </label>
          <div className={`flex gap-1.5 ${!isEditorial ? "opacity-50 pointer-events-none" : ""}`}>
            <button
              onClick={() => updatePageSettings(currentPage.id, { textAlign: null })}
              className={`px-2.5 py-1.5 rounded-base text-xs font-medium transition-all ${
                settings.textAlign === null
                  ? "bg-brand-500 text-white shadow-xs"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
              }`}
            >
              自动
            </button>
            {([
              { value: "left" as const, icon: AlignLeft, label: "左对齐" },
              { value: "center" as const, icon: AlignCenter, label: "居中" },
              { value: "right" as const, icon: AlignRight, label: "右对齐" },
            ]).map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => updatePageSettings(currentPage.id, { textAlign: value })}
                className={`p-2 rounded-base transition-all ${
                  settings.textAlign === value
                    ? "bg-brand-500 text-white shadow-xs"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
                title={label}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="px-4 py-3 border-t border-neutral-200">
        <div className="bg-info-50 rounded-base px-3 py-2">
          <p className="text-xs text-neutral-500 leading-relaxed">
            选择「自动」将继承全局设置。修改全局设置不影响已自定义的页面。
          </p>
        </div>
      </div>
    </div>
  );
}
