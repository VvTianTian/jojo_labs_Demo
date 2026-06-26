import type { FlowNode, Connection as ConnectionType } from "../../types/flowchart";
import { ConnectionLine } from "./ConnectionLine";

interface ConnectionsLayerProps {
  nodes: FlowNode[];
  connections: ConnectionType[];
}

export function ConnectionsLayer({ nodes, connections }: ConnectionsLayerProps) {
  return (
    <svg
      className="absolute pointer-events-none"
      style={{ overflow: "visible", left: 0, top: 0, width: 1, height: 1 }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#B0B3B5" />
        </marker>
        <marker
          id="arrowhead-hover"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#0090D9" />
        </marker>
      </defs>

      {connections.map((conn) => (
        <ConnectionLine key={conn.id} connection={conn} nodes={nodes} />
      ))}
    </svg>
  );
}
