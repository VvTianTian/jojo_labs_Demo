import { useState } from "react";
import { useFlowchartStore } from "../../store/useFlowchartStore";
import type { FlowNode, ProductInstance, DragData } from "../../types/flowchart";
import { Port } from "./Port";
import { NODE_WIDTH } from "../../constants/defaults";
import { getOutputPortPosition, getInputPortPosition } from "../../utils/geometry";
import { Play, Presentation, Video, FolderOpen, FileText, Image, Mic, Sparkles } from "lucide-react";

interface CanvasNodeProps {
  node: FlowNode;
  isSelected: boolean;
  onDragStart: (nodeId: string, e: React.PointerEvent) => void;
  onPortDragStart: (nodeId: string, startX: number, startY: number, e: React.PointerEvent) => void;
  onSelect: (nodeId: string) => void;
}

/** 根据产物 templateId 返回对应图标 */
function ProductIcon({ templateId, size = 14 }: { templateId: string; size?: number }) {
  const cls = "text-neutral-500";
  switch (templateId) {
    case "video_time": return <Play size={size} className={cls} />;
    case "ppt": return <Presentation size={size} className={cls} />;
    case "record_video": return <Video size={size} className={cls} />;
    case "supplement_material": return <FolderOpen size={size} className={cls} />;
    case "exercise_requirement": return <FileText size={size} className={cls} />;
    case "exercise_image": return <Image size={size} className={cls} />;
    case "exercise_audio": return <Mic size={size} className={cls} />;
    case "exercise_animation": return <Sparkles size={size} className={cls} />;
    default: return <FileText size={size} className={cls} />;
  }
}

/** 按环节分组产物 */
function groupByStage(products: ProductInstance[]) {
  const map = new Map<string, ProductInstance[]>();
  for (const p of products) {
    const key = p.stageName;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return Array.from(map.entries());
}

export function CanvasNode({ node, isSelected, onDragStart, onPortDragStart, onSelect }: CanvasNodeProps) {
  const isProduction = node.type === "production";
  const badgeColor = isProduction ? "bg-brand-500" : "bg-warning-500";
  const badgeLabel = isProduction ? "生产" : "审校";
  const assigneeLabel = isProduction ? "生产人" : "审校人";
  const addProductToNode = useFlowchartStore((s) => s.addProductToNode);
  const [isDragOver, setIsDragOver] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    onSelect(node.id);
    onDragStart(node.id, e);
  };

  const outputPos = getOutputPortPosition(node);
  const inputPos = getInputPortPosition(node);
  const stageGroups = groupByStage(node.products);

  return (
    <div
      onPointerDown={handlePointerDown}
      className={`absolute rounded-lg bg-white shadow-sm border transition-all ${
        isSelected
          ? "border-brand-500 shadow-md"
          : "border-neutral-200 opacity-75 hover:opacity-100 hover:shadow-md"
      }`}
      style={{ left: node.position.x, top: node.position.y, width: NODE_WIDTH }}
    >
      <div className="p-3">
        {/* 头部: badge + 标题 */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`${badgeColor} text-white text-[10px] font-medium px-1.5 py-0.5 rounded-sm leading-none`}>
            {badgeLabel}
          </span>
          <span className="text-sm font-semibold text-neutral-800 truncate">{node.name}</span>
        </div>

        {/* 生产人/审校人 */}
        <div className="flex items-center justify-between text-xs mb-3">
          <span className="text-neutral-400">{assigneeLabel}</span>
          <span className={node.assignee ? "text-neutral-700 font-medium" : "text-neutral-300"}>
            {node.assignee || "-"}
          </span>
        </div>

        {/* 产物区域 */}
        {node.products.length > 0 ? (
          <div className="space-y-2.5">
            {stageGroups.map(([stageName, products]) => (
              <div key={stageName}>
                {/* 环节标题 */}
                <div className="flex items-center gap-1 mb-1.5">
                  <span className="text-[10px] text-neutral-400 font-medium">{stageName}</span>
                  {/* 显示分组名（取第一个产物的 group）*/}
                  <span className="text-[10px] text-neutral-300">{products[0]?.group}</span>
                </div>

                {/* 产物块列表 */}
                <div className="space-y-1">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center gap-2 rounded-base px-2.5 py-1.5 border transition-colors ${
                        isSelected
                          ? "border-brand-200 bg-brand-50/50"
                          : "border-neutral-200 bg-neutral-50"
                      }`}
                    >
                      <ProductIcon templateId={p.templateId} />
                      <span className="text-xs text-neutral-700 truncate">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* 空状态 - 生产节点支持拖入产物 */
          <div
            className={`border border-dashed rounded-base py-3 flex items-center justify-center transition-colors ${
              isDragOver
                ? "border-brand-500 bg-brand-50"
                : "border-neutral-300"
            }`}
            onDragOver={(e) => {
              if (!isProduction) return;
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = "copy";
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragOver(false);
              if (!isProduction) return;
              try {
                const data: DragData = JSON.parse(e.dataTransfer.getData("application/json"));
                if (data.kind === "product") {
                  addProductToNode(node.id, {
                    templateId: data.template.id,
                    name: data.template.name,
                    stageName: data.template.stageName,
                    group: data.template.group,
                  });
                }
              } catch { /* ignore */ }
            }}
          >
            <span className={`text-xs ${isDragOver ? "text-brand-500 font-medium" : "text-neutral-400"}`}>
              {isDragOver ? "松开即可添加产物" : "+ 请从左侧拖入产物"}
            </span>
          </div>
        )}
      </div>

      {/* 端口 */}
      <Port
        type="input"
        x={inputPos.x - node.position.x}
        y={inputPos.y - node.position.y}
      />
      <Port
        type="output"
        x={outputPos.x - node.position.x}
        y={outputPos.y - node.position.y}
        onDragStart={(e) => onPortDragStart(node.id, outputPos.x, outputPos.y, e)}
      />
    </div>
  );
}
