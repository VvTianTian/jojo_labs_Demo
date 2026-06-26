import { PORT_RADIUS } from "../../constants/defaults";

interface PortProps {
  type: "input" | "output";
  x: number; // 相对于节点的坐标
  y: number;
  onDragStart?: (e: React.PointerEvent) => void;
}

export function Port({ type, x, y, onDragStart }: PortProps) {
  const isOutput = type === "output";

  return (
    <div
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        onDragStart?.(e);
      }}
      className={`absolute rounded-full border-2 border-white shadow-sm transition-all ${isOutput ? "bg-brand-500 hover:bg-brand-600 hover:scale-125 cursor-crosshair" : "bg-neutral-400"}`}
      style={{
        width: PORT_RADIUS * 2,
        height: PORT_RADIUS * 2,
        left: x - PORT_RADIUS,
        top: y - PORT_RADIUS,
      }}
    />
  );
}
