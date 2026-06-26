import { DraggableItem } from "./DraggableItem";
import { getGroupedProducts } from "../../constants/defaults";
import { Film, HelpCircle } from "lucide-react";

const groupedProducts = getGroupedProducts();

export function ProductLibrary() {
  return (
    <div className="px-3 py-3">
      <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
        产物
      </h3>

      {groupedProducts.map((stage) => (
        <div key={stage.stage} className="mb-3">
          <div className="text-xs text-neutral-500 mb-1.5">{stage.stageName}</div>

          {stage.groups.map((group) => (
            <div key={group.name} className="mb-2">
              <div className="flex items-center gap-1 text-xs text-neutral-600 mb-1">
                {group.name === "视频" ? <Film size={12} /> : <HelpCircle size={12} />}
                <span>{group.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {group.products.map((product) => (
                  <DraggableItem
                    key={product.id}
                    id={`product-${product.id}`}
                    data={{ kind: "product", template: product }}
                  >
                    <div className="rounded-md border border-neutral-200 bg-white px-2 py-1.5 hover:border-brand-300 hover:shadow-sm transition-all text-center">
                      <span className="text-xs text-neutral-700 leading-tight">{product.name}</span>
                    </div>
                  </DraggableItem>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
