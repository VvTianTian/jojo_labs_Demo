import type { DragData } from "../../types/flowchart";

interface DraggableItemProps {
  id: string;
  data: DragData;
  children: React.ReactNode;
}

export function DraggableItem({ id, data, children }: DraggableItemProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/json", JSON.stringify(data));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      data-drag-item-id={id}
      className="cursor-grab active:cursor-grabbing select-none"
    >
      {children}
    </div>
  );
}
