import { useState } from "react";
import { Eye, Maximize2, X } from "lucide-react";

export function BottomActionBar() {
  const [toast, setToast] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <>
      <div className="flex items-center justify-between px-5 py-2.5 bg-neutral-0 border-t border-neutral-200">
        {/* Left: Preview + Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-neutral-600 hover:text-neutral-700 hover:bg-neutral-100 rounded-base text-sm font-medium transition-all"
          >
            <Eye size={15} />
            预览
          </button>
          <button
            onClick={() => showToast("全屏预览功能开发中")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-neutral-600 hover:text-neutral-700 hover:bg-neutral-100 rounded-base text-sm font-medium transition-all"
          >
            <Maximize2 size={15} />
            全屏
          </button>
        </div>

        {/* Right: Cancel + Save */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast("已取消")}
            className="flex items-center gap-1.5 px-5 py-1.5 bg-neutral-0 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-button text-sm font-medium transition-all"
          >
            取消
          </button>
          <button
            onClick={() => showToast("已保存")}
            className="flex items-center gap-1.5 px-5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-button text-sm font-medium transition-all shadow-xs"
          >
            保存
          </button>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-neutral-800 text-white text-sm rounded-lg shadow-lg animate-fade-in">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="p-0.5 hover:bg-white/10 rounded">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Preview modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={() => setShowPreview(false)}>
          <div className="bg-neutral-0 rounded-xl shadow-2xl w-[90%] max-w-[800px] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-700">预览模式</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 rounded-base hover:bg-neutral-100 text-neutral-500 transition-all"
              >
                <X size={18} />
              </button>
            </div>
            <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-8 flex flex-col items-center justify-center min-h-[300px]">
              <Eye size={32} className="text-neutral-300 mb-3" />
              <p className="text-sm text-neutral-500">预览功能开发中...</p>
              <p className="text-xs text-neutral-400 mt-1">保存后可查看完整的绘本效果</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
