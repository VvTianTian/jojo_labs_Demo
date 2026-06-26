import { forwardRef, useRef, useState, useCallback, useImperativeHandle } from "react";
import { useFlowchartStore } from "../../store/useFlowchartStore";
import { CanvasNode } from "./CanvasNode";
import { ConnectionsLayer } from "./ConnectionsLayer";
import { TempConnection } from "./TempConnection";
import { findTargetPort } from "../../utils/geometry";

export interface FlowchartCanvasHandle {
  getElement: () => HTMLDivElement | null;
}

export const FlowchartCanvas = forwardRef<FlowchartCanvasHandle>(function FlowchartCanvas(_, ref) {
  const canvasRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    getElement: () => canvasRef.current,
  }));

  const { data, moveNode, selectNode, setViewport, startConnection, updatePendingConnection, endConnection, cancelConnection } = useFlowchartStore();
  const { nodes, connections, viewport, pendingConnection } = data;

  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const [spacePressed, setSpacePressed] = useState(false);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.code === "Space" && !spacePressed) { e.preventDefault(); setSpacePressed(true); }
  }, [spacePressed]);

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    if (e.code === "Space") setSpacePressed(false);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 1 || (e.button === 0 && spacePressed)) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY, offsetX: viewport.offsetX, offsetY: viewport.offsetY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (e.button === 0 && !spacePressed) selectNode(null);
  }, [spacePressed, viewport, selectNode]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isPanning) {
      setViewport({
        offsetX: panStartRef.current.offsetX + e.clientX - panStartRef.current.x,
        offsetY: panStartRef.current.offsetY + e.clientY - panStartRef.current.y,
      });
    }
  }, [isPanning, setViewport]);

  const handlePointerUp = useCallback(() => setIsPanning(false), []);

  const handleNodeDragStart = useCallback((nodeId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const startX = e.clientX - node.position.x - viewport.offsetX;
    const startY = e.clientY - node.position.y - viewport.offsetY;
    function onMove(ev: PointerEvent) {
      moveNode(nodeId, { x: ev.clientX - startX - viewport.offsetX, y: ev.clientY - startY - viewport.offsetY });
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [nodes, viewport, moveNode]);

  const handlePortDragStart = useCallback((nodeId: string, startX: number, startY: number, e: React.PointerEvent) => {
    e.stopPropagation();
    startConnection(nodeId, startX, startY);
    const el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    function onMove(ev: PointerEvent) {
      updatePendingConnection(ev.clientX - rect.left - viewport.offsetX, ev.clientY - rect.top - viewport.offsetY);
    }
    function onUp(ev: PointerEvent) {
      const mx = ev.clientX - rect.left - viewport.offsetX;
      const my = ev.clientY - rect.top - viewport.offsetY;
      const currentNodes = useFlowchartStore.getState().data.nodes;
      const sourceId = useFlowchartStore.getState().data.pendingConnection?.sourceNodeId;
      if (!sourceId) { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); return; }
      const targetId = findTargetPort(mx, my, currentNodes, sourceId);
      if (targetId) endConnection(targetId); else cancelConnection();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [viewport, startConnection, updatePendingConnection, endConnection, cancelConnection]);

  return (
    <div
      ref={canvasRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
      className="relative w-full h-full overflow-hidden outline-none bg-neutral-50"
      style={{ cursor: isPanning || spacePressed ? "grab" : "default" }}
    >
      {/* 网格 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #D8E4EB 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          backgroundPosition: `${viewport.offsetX % 20}px ${viewport.offsetY % 20}px`,
        }}
      />

      {/* 内容层 - 必须有明确尺寸，否则 absolute 子元素会被裁剪 */}
      <div className="absolute inset-0" style={{ transform: `translate(${viewport.offsetX}px, ${viewport.offsetY}px)` }}>
        <ConnectionsLayer nodes={nodes} connections={connections} />
        {pendingConnection && <TempConnection pending={pendingConnection} />}
        {nodes.map((node) => (
          <CanvasNode
            key={node.id}
            node={node}
            isSelected={data.selectedNodeId === node.id}
            onDragStart={handleNodeDragStart}
            onPortDragStart={handlePortDragStart}
            onSelect={(id) => selectNode(id)}
          />
        ))}
      </div>

      {/* 空状态 */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm text-neutral-400">从左侧拖入节点或产物开始搭建</p>
        </div>
      )}
    </div>
  );
});
