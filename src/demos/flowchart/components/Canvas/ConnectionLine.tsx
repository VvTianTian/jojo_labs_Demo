import { useState } from "react";
import type { FlowNode, Connection } from "../../types/flowchart";
import { getOutputPortPosition, getInputPortPosition, cubicBezierPath } from "../../utils/geometry";
import { useFlowchartStore } from "../../store/useFlowchartStore";

interface ConnectionLineProps {
  connection: Connection;
  nodes: FlowNode[];
}

export function ConnectionLine({ connection, nodes }: ConnectionLineProps) {
  const [hovered, setHovered] = useState(false);
  const deleteConnection = useFlowchartStore((s) => s.deleteConnection);

  const sourceNode = nodes.find((n) => n.id === connection.sourceNodeId);
  const targetNode = nodes.find((n) => n.id === connection.targetNodeId);
  if (!sourceNode || !targetNode) return null;

  const start = getOutputPortPosition(sourceNode);
  const end = getInputPortPosition(targetNode);
  const path = cubicBezierPath(start.x, start.y, end.x, end.y);

  return (
    <g>
      {/* 加宽不可见命中区 */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
        className="pointer-events-auto cursor-pointer"
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={() => deleteConnection(connection.id)}
      />
      <path
        d={path}
        fill="none"
        stroke={hovered ? "#0090D9" : "#B0B3B5"}
        strokeWidth={2}
        markerEnd={hovered ? "url(#arrowhead-hover)" : "url(#arrowhead)"}
        className="pointer-events-none transition-colors"
      />
    </g>
  );
}
