import { DraggableItem } from "./DraggableItem";
import { Cog, CheckSquare } from "lucide-react";

export function NodeLibrary() {
  return (
    <div className="px-3 py-3">
      <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
        独立节点
      </h3>
      <div className="flex gap-2">
        <DraggableItem
          id="blank-production"
          data={{ kind: "blank-node", nodeType: "production" }}
        >
          <div className="flex-1 rounded-md border border-neutral-200 bg-white p-2.5 hover:border-brand-500 hover:shadow-sm transition-all">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-sm bg-brand-500 flex items-center justify-center">
                <Cog size={12} className="text-white" />
              </div>
              <span className="text-xs font-medium text-neutral-700">生产节点</span>
            </div>
          </div>
        </DraggableItem>

        <DraggableItem
          id="blank-review"
          data={{ kind: "blank-node", nodeType: "review" }}
        >
          <div className="flex-1 rounded-md border border-neutral-200 bg-white p-2.5 hover:border-warning-500 hover:shadow-sm transition-all">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-sm bg-warning-500 flex items-center justify-center">
                <CheckSquare size={12} className="text-white" />
              </div>
              <span className="text-xs font-medium text-neutral-700">审校节点</span>
            </div>
          </div>
        </DraggableItem>
      </div>
    </div>
  );
}
