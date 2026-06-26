import { useRef, useCallback } from "react";
import { useFlowchartStore } from "../store/useFlowchartStore";
import { NodeLibrary } from "./Sidebar/NodeLibrary";
import { ProductLibrary } from "./Sidebar/ProductLibrary";
import { FlowchartCanvas, type FlowchartCanvasHandle } from "./Canvas/FlowchartCanvas";
import { NodeEditor } from "./RightPanel/NodeEditor";
import type { DragData } from "../types/flowchart";

export function FlowchartEditor() {
  const canvasHandleRef = useRef<FlowchartCanvasHandle>(null);
  const { addNode, addNodeWithProduct, selectNode } = useFlowchartStore();
  const viewport = useFlowchartStore((s) => s.data.viewport);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      let data: DragData;
      try {
        data = JSON.parse(e.dataTransfer.getData("application/json"));
      } catch {
        return;
      }

      const canvasEl = canvasHandleRef.current?.getElement();
      if (!canvasEl) return;
      const rect = canvasEl.getBoundingClientRect();
      const x = e.clientX - rect.left - viewport.offsetX;
      const y = e.clientY - rect.top - viewport.offsetY;

      let newNodeId: string | undefined;
      if (data.kind === "blank-node") {
        newNodeId = addNode(data.nodeType, { x, y });
      } else if (data.kind === "product") {
        newNodeId = addNodeWithProduct(
          { templateId: data.template.id, name: data.template.name, stageName: data.template.stageName, group: data.template.group },
          { x, y }
        );
      }
      if (newNodeId) selectNode(newNodeId);
    },
    [viewport, addNode, addNodeWithProduct, selectNode]
  );

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* 左栏 */}
      <div className="w-[240px] flex-shrink-0 bg-white border-r border-neutral-200 overflow-y-auto">
        <NodeLibrary />
        <div className="border-t border-neutral-200" />
        <ProductLibrary />
      </div>

      {/* 中间画布 */}
      <div
        className="flex-1 relative overflow-hidden"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <FlowchartCanvas ref={canvasHandleRef} />
      </div>

      {/* 右栏 */}
      <div className="w-[300px] flex-shrink-0 bg-white border-l border-neutral-200 overflow-hidden">
        <NodeEditor />
      </div>
    </div>
  );
}
