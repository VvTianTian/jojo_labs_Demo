import type { FlowNode } from "../types/flowchart";
import { NODE_WIDTH, NODE_HEIGHT_BASE, NODE_HEIGHT_PER_PRODUCT, PORT_HIT_RADIUS } from "../constants/defaults";

export function getNodeHeight(node: FlowNode): number {
  return NODE_HEIGHT_BASE + node.products.length * NODE_HEIGHT_PER_PRODUCT;
}

/** 输入端口坐标（节点左侧中点）*/
export function getInputPortPosition(node: FlowNode): { x: number; y: number } {
  return {
    x: node.position.x,
    y: node.position.y + getNodeHeight(node) / 2,
  };
}

/** 输出端口坐标（节点右侧中点）*/
export function getOutputPortPosition(node: FlowNode): { x: number; y: number } {
  return {
    x: node.position.x + NODE_WIDTH,
    y: node.position.y + getNodeHeight(node) / 2,
  };
}

/** 三次贝塞尔曲线路径 */
export function cubicBezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.abs(x2 - x1);
  const controlOffset = Math.max(dx * 0.5, 60);
  const cx1 = x1 + controlOffset;
  const cy1 = y1;
  const cx2 = x2 - controlOffset;
  const cy2 = y2;
  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
}

/** 在节点列表中查找鼠标附近的输入端口 */
export function findTargetPort(
  mouseX: number,
  mouseY: number,
  nodes: FlowNode[],
  excludeNodeId: string
): string | null {
  for (const node of nodes) {
    if (node.id === excludeNodeId) continue;
    const port = getInputPortPosition(node);
    const dist = Math.hypot(mouseX - port.x, mouseY - port.y);
    if (dist <= PORT_HIT_RADIUS) return node.id;
  }
  return null;
}
