// ─── 节点类型 ───
export type NodeType = "production" | "review";

// ─── 节点状态 ───
export type NodeStatus = "empty" | "filled" | "complete";

// ─── 产物模板（左侧产物库中的条目）───
export interface ProductTemplate {
  id: string;
  name: string;
  stage: number;
  stageName: string;
  group: string; // 产物分组名，如"视频"、"题组"
}

// ─── 产物实例（节点中包含的产物）───
export interface ProductInstance {
  id: string;
  templateId: string;
  name: string;
  stageName: string;
  group: string;
}

// ─── 流程节点 ───
export interface FlowNode {
  id: string;
  type: NodeType;
  name: string;
  position: { x: number; y: number };
  assignee: string;
  products: ProductInstance[];
  upstreamNodeIds: string[];
  status: NodeStatus;
}

// ─── 连线 ───
export interface Connection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
}

// ─── 画布视口 ───
export interface Viewport {
  offsetX: number;
  offsetY: number;
}

// ─── 连线绘制中的临时状态 ───
export interface PendingConnection {
  sourceNodeId: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

// ─── 左侧拖拽数据 ───
export type DragData =
  | { kind: "blank-node"; nodeType: NodeType }
  | { kind: "product"; template: ProductTemplate };
