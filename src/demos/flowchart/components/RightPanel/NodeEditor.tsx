import { useFlowchartStore } from "../../store/useFlowchartStore";
import { ProductList } from "./ProductList";
import { UpstreamList } from "./UpstreamList";
import { ToggleLeft, ToggleRight, BookOpen, Trash2 } from "lucide-react";

export function NodeEditor() {
  const { data, updateNode, deleteNode, toggleDefaultFlow } = useFlowchartStore();
  const { selectedNodeId, nodes, isDefaultFlow } = data;
  const node = nodes.find((n) => n.id === selectedNodeId);

  if (!node) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-700">节点编辑</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDefaultFlow}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700"
            >
              {isDefaultFlow ? <ToggleRight size={16} className="text-brand-500" /> : <ToggleLeft size={16} />}
              <span>默认流程</span>
            </button>
            <button className="p-1 rounded-sm hover:bg-neutral-100 text-neutral-400" title="操作手册">
              <BookOpen size={14} />
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400">
                <rect x="3" y="3" width="6" height="6" rx="1" />
                <rect x="15" y="3" width="6" height="6" rx="1" />
                <rect x="9" y="15" width="6" height="6" rx="1" />
              </svg>
            </div>
            <p className="text-sm text-neutral-500">请在画布中选择一个节点</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-700">节点编辑</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDefaultFlow}
            className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700"
          >
            {isDefaultFlow ? <ToggleRight size={16} className="text-brand-500" /> : <ToggleLeft size={16} />}
            <span>默认流程</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 节点名称 */}
        <div>
          <label className="text-xs text-neutral-500 mb-1 block">节点名称</label>
          <input
            type="text"
            value={node.name}
            onChange={(e) => updateNode(node.id, { name: e.target.value })}
            className="w-full text-sm border border-neutral-200 rounded-base px-2.5 py-1.5 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* 节点类型 */}
        <div>
          <label className="text-xs text-neutral-500 mb-1 block">节点类型</label>
          <select
            value={node.type}
            onChange={(e) => updateNode(node.id, { type: e.target.value as "production" | "review" })}
            className="w-full text-sm border border-neutral-200 rounded-base px-2.5 py-1.5 focus:outline-none focus:border-brand-500 bg-white"
          >
            <option value="production">生产</option>
            <option value="review">审校</option>
          </select>
        </div>

        {/* 负责人 */}
        <div>
          <label className="text-xs text-neutral-500 mb-1 block">
            {node.type === "production" ? "生产人" : "审校人"}
          </label>
          <input
            type="text"
            value={node.assignee}
            onChange={(e) => updateNode(node.id, { assignee: e.target.value })}
            placeholder="点击激活输入框"
            className="w-full text-sm border border-neutral-200 rounded-base px-2.5 py-1.5 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* 本次产物 */}
        <ProductList nodeId={node.id} products={node.products} />

        {/* 上游节点 */}
        <UpstreamList nodeId={node.id} upstreamNodeIds={node.upstreamNodeIds} />

        {/* 删除按钮 */}
        <div className="pt-2 border-t border-neutral-200">
          <button
            onClick={() => deleteNode(node.id)}
            className="w-full flex items-center justify-center gap-1.5 text-sm text-error-500 border border-error-100 rounded-base py-2 hover:bg-error-50 transition-colors"
          >
            <Trash2 size={14} />
            <span>删除节点</span>
          </button>
        </div>
      </div>
    </div>
  );
}
