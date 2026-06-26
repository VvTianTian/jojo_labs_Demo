import type { PendingConnection } from "../../types/flowchart";
import { cubicBezierPath } from "../../utils/geometry";

interface TempConnectionProps {
  pending: PendingConnection;
}

export function TempConnection({ pending }: TempConnectionProps) {
  const path = cubicBezierPath(pending.startX, pending.startY, pending.currentX, pending.currentY);

  return (
    <svg
      className="absolute pointer-events-none"
      style={{ overflow: "visible", left: 0, top: 0, width: 1, height: 1 }}
    >
      <path
        d={path}
        fill="none"
        stroke="#33BBFF"
        strokeWidth={2}
        strokeDasharray="6 4"
      />
    </svg>
  );
}
