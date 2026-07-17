import { Info } from "lucide-react";

export function CoverSettings() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-neutral-200">
        <h3 className="text-sm font-semibold text-neutral-700">
          封面设置
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Info */}
        <div className="flex items-start gap-2 bg-info-50 rounded-base px-3 py-2.5">
          <Info size={14} className="text-brand-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-neutral-500 leading-relaxed">
            在中央画布中直接编辑封面图片、元数据和讲解语音。修改会实时生效。
          </p>
        </div>

        {/* Layout hint */}
        <div>
          <label className="text-xs font-medium text-neutral-700 mb-2 block">当前布局</label>
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-base border border-neutral-200">
            <div className="w-16 aspect-[16/9] rounded-base bg-neutral-100 flex overflow-hidden flex-shrink-0">
              <div className="w-1/2 bg-neutral-300" />
              <div className="w-1/2 p-1 space-y-0.5 flex flex-col justify-center">
                <div className="h-1 bg-neutral-400 rounded w-3/4" />
                <div className="h-0.5 bg-neutral-300 rounded w-1/2" />
              </div>
            </div>
            <span className="text-xs text-neutral-600 font-medium">左图右信息</span>
          </div>
        </div>
      </div>
    </div>
  );
}
