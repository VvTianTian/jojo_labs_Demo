import { useBookStore } from "../../store/useBookStore";
import { useRoleStore } from "../../store/useRoleStore";

export function CoverSettings() {
  const { book, updateCover } = useBookStore();
  const { currentRole } = useRoleStore();
  const isEditorial = currentRole === "editorial";
  const { cover } = book;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-neutral-200">
        <h3 className="text-sm font-semibold text-neutral-700">
          封面设置
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Layout selector */}
        <div>
          <label className="text-xs font-medium text-neutral-700 mb-3 block">
            封面布局
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => isEditorial && updateCover({ layout: "fullscreen" })}
              disabled={!isEditorial}
              className={`flex flex-col items-center gap-2 p-3 rounded-md border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                cover.layout === "fullscreen"
                  ? "border-brand-500 bg-brand-50 shadow-xs"
                  : "border-neutral-200 hover:border-brand-200 bg-neutral-0"
              }`}
            >
              {/* Mini preview: fullscreen */}
              <div className="w-full aspect-[16/9] rounded-base bg-neutral-100 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-700/30 to-transparent" />
                <div className="absolute bottom-1 left-1 right-1">
                  <div className="h-1 bg-white/60 rounded w-2/3" />
                </div>
              </div>
              <span className="text-xs font-medium text-neutral-700">全屏封面</span>
            </button>

            <button
              onClick={() => isEditorial && updateCover({ layout: "split" })}
              disabled={!isEditorial}
              className={`flex flex-col items-center gap-2 p-3 rounded-md border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                cover.layout === "split"
                  ? "border-brand-500 bg-brand-50 shadow-xs"
                  : "border-neutral-200 hover:border-brand-200 bg-neutral-0"
              }`}
            >
              {/* Mini preview: split */}
              <div className="w-full aspect-[16/9] rounded-base bg-neutral-100 flex overflow-hidden">
                <div className="w-1/2 bg-neutral-300" />
                <div className="w-1/2 p-1 space-y-0.5 flex flex-col justify-center">
                  <div className="h-1 bg-neutral-400 rounded w-3/4" />
                  <div className="h-0.5 bg-neutral-300 rounded w-1/2" />
                  <div className="h-0.5 bg-neutral-200 rounded w-full" />
                </div>
              </div>
              <span className="text-xs font-medium text-neutral-700">左右布局</span>
            </button>
          </div>
        </div>

        {/* Cover info */}
        <div className="bg-info-50 rounded-base px-3 py-2">
          <p className="text-xs text-neutral-500 leading-relaxed">
            在中央画布中上传封面图片和编辑文字信息。布局切换会实时生效。
          </p>
        </div>
      </div>
    </div>
  );
}
