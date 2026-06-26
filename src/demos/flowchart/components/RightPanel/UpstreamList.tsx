import { useState } from "react";
import { useFlowchartStore } from "../../store/useFlowchartStore";
import { ArrowUp, X, Plus } from "lucide-react";

interface UpstreamListProps {
  nodeId: string;
  upstreamNodeIds: string[];
}

export function UpstreamList({ nodeId, upstreamNodeIds }: UpstreamListProps) {
  const { data, addUpstream, removeUpstream, addConnection } = useFlowchartStore();
  const [showSelect, setShowSelect] = useState(false);

  const upstreamNodes = data.nodes.filter((n) => upstreamNodeIds.includes(n.id));
  const availableNodes = data.nodes.filter((n) => n.id !== nodeId && !upstreamNodeIds.includes(n.id));

  const handleAdd = (upstreamId: string) => {
    addUpstream(nodeId, upstreamId);
    addConnection(upstreamId, nodeId);
    setShowSelect(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs text-neutral-500">上游节点</label>
        {availableNodes.length > 0 && (
          <button
            onClick={() => setShowSelect(!showSelect)}
            className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-0.5"
          >
            <Plus size={12} />
            <span>添加</span>
          </button>
        )}
      </div>

      {upstreamNodes.length === 0 ? (
        <div className="text-xs text-neutral-400 italic py-2">暂无上游节点</div>
      ) : (
        <div className="space-y-1">
          {upstreamNodes.map((n) => (
            <div key={n.id} className="flex items-center justify-between bg-neutral-50 rounded-base px-2.5 py-1.5">
              <div className="flex items-center gap-1.5 text-xs text-neutral-700 min-w-0">
                <ArrowUp size={11} className="text-neutral-400 flex-shrink-0" />
                <span className="truncate">{n.name}</span>
              </div>
              <button
                onClick={() => removeUpstream(nodeId, n.id)}
                className="p-0.5 rounded-sm hover:bg-neutral-200 text-neutral-400 hover:text-neutral-600 flex-shrink-0"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 添加选择下拉 */}
      {showSelect && availableNodes.length > 0 && (
        <div className="mt-2 border border-neutral-200 rounded-base bg-white max-h-32 overflow-y-auto">
          {availableNodes.map((n) => (
            <button
              key={n.id}
              onClick={() => handleAdd(n.id)}
              className="w-full text-left text-xs px-2.5 py-1.5 hover:bg-neutral-50 text-neutral-700 flex items-center gap-1.5"
            >
              <span className={`w-2 h-2 rounded-full ${n.type === "production" ? "bg-brand-500" : "bg-warning-500"}`} />
              <span className="truncate">{n.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
