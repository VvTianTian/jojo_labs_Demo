import type { ProductInstance } from "../../types/flowchart";
import { useFlowchartStore } from "../../store/useFlowchartStore";
import { Package, X } from "lucide-react";

interface ProductListProps {
  nodeId: string;
  products: ProductInstance[];
}

export function ProductList({ nodeId, products }: ProductListProps) {
  const removeProductFromNode = useFlowchartStore((s) => s.removeProductFromNode);

  return (
    <div>
      <label className="text-xs text-neutral-500 mb-1.5 block">本次产物</label>
      {products.length === 0 ? (
        <div className="text-xs text-neutral-400 italic py-2">暂无产物</div>
      ) : (
        <div className="space-y-1">
          {products.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-neutral-50 rounded-base px-2.5 py-1.5">
              <div className="flex items-center gap-1.5 text-xs text-neutral-700 min-w-0">
                <Package size={11} className="text-neutral-400 flex-shrink-0" />
                <span className="truncate">{p.name}</span>
                {p.stageName && (
                  <span className="text-neutral-400 flex-shrink-0">{p.stageName}</span>
                )}
              </div>
              <button
                onClick={() => removeProductFromNode(nodeId, p.id)}
                className="p-0.5 rounded-sm hover:bg-neutral-200 text-neutral-400 hover:text-neutral-600 flex-shrink-0"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
