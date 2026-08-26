import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  FlowNode, Connection, NodeType, ProductInstance,
  PendingConnection, Viewport, NodeStatus,
} from "../types/flowchart";
import { computeNodeStatus } from "../constants/defaults";

interface FlowchartData {
  nodes: FlowNode[];
  connections: Connection[];
  viewport: Viewport;
  selectedNodeId: string | null;
  pendingConnection: PendingConnection | null;
  isDefaultFlow: boolean;
}

interface FlowchartStore {
  data: FlowchartData;

  // ── 节点 ──
  addNode: (type: NodeType, position: { x: number; y: number }) => string;
  addNodeWithProduct: (product: Omit<ProductInstance, "id">, position: { x: number; y: number }) => string;
  deleteNode: (nodeId: string) => void;
  updateNode: (nodeId: string, patch: Partial<Pick<FlowNode, "type" | "name" | "assignee">>) => void;
  moveNode: (nodeId: string, position: { x: number; y: number }) => void;

  // ── 产物 ──
  addProductToNode: (nodeId: string, product: Omit<ProductInstance, "id">) => void;
  removeProductFromNode: (nodeId: string, productId: string) => void;

  // ── 连线 ──
  addConnection: (sourceNodeId: string, targetNodeId: string) => void;
  deleteConnection: (connectionId: string) => void;

  // ── 上游节点 ──
  addUpstream: (nodeId: string, upstreamNodeId: string) => void;
  removeUpstream: (nodeId: string, upstreamNodeId: string) => void;

  // ── 选中 ──
  selectNode: (nodeId: string | null) => void;

  // ── 视口 ──
  setViewport: (viewport: Partial<Viewport>) => void;

  // ── 连线绘制中 ──
  startConnection: (sourceNodeId: string, startX: number, startY: number) => void;
  updatePendingConnection: (x: number, y: number) => void;
  endConnection: (targetNodeId: string) => void;
  cancelConnection: () => void;

  // ── 全局 ──
  toggleDefaultFlow: () => void;
  resetFlowchart: () => void;
}

const initialData: FlowchartData = {
  nodes: [],
  connections: [],
  viewport: { offsetX: 0, offsetY: 0 },
  selectedNodeId: null,
  pendingConnection: null,
  isDefaultFlow: false,
};

function getNodeName(type: NodeType, nodes: FlowNode[]): string {
  const label = type === "production" ? "生产节点" : "审校节点";
  const count = nodes.filter((n) => n.type === type).length;
  return `${label} ${count + 1}`;
}

function recomputeStatus(node: FlowNode): NodeStatus {
  return computeNodeStatus(node.products, node.assignee);
}

export const useFlowchartStore = create<FlowchartStore>()(
  persist(
    (set) => ({
      data: { ...initialData },

      addNode: (type, position) => {
        const id = crypto.randomUUID();
        set((s) => ({
          data: {
            ...s.data,
            nodes: [
              ...s.data.nodes,
              {
                id,
                type,
                name: getNodeName(type, s.data.nodes),
                position,
                assignee: "",
                products: [],
                upstreamNodeIds: [],
                status: "empty",
              },
            ],
            selectedNodeId: id,
          },
        }));
        return id;
      },

      addNodeWithProduct: (product, position) => {
        const id = crypto.randomUUID();
        const productId = crypto.randomUUID();
        set((s) => {
          const instance: ProductInstance = { ...product, id: productId };
          return {
            data: {
              ...s.data,
              nodes: [
                ...s.data.nodes,
                {
                  id,
                  type: "production" as NodeType,
                  name: product.name,
                  position,
                  assignee: "",
                  products: [instance],
                  upstreamNodeIds: [],
                  status: "filled" as NodeStatus,
                },
              ],
              selectedNodeId: id,
            },
          };
        });
        return id;
      },

      deleteNode: (nodeId) =>
        set((s) => ({
          data: {
            ...s.data,
            nodes: s.data.nodes.filter((n) => n.id !== nodeId),
            connections: s.data.connections.filter(
              (c) => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId
            ),
            selectedNodeId: s.data.selectedNodeId === nodeId ? null : s.data.selectedNodeId,
          },
        })),

      updateNode: (nodeId, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            nodes: s.data.nodes.map((n) => {
              if (n.id !== nodeId) return n;
              const updated = { ...n, ...patch };
              return { ...updated, status: recomputeStatus(updated) };
            }),
          },
        })),

      moveNode: (nodeId, position) =>
        set((s) => ({
          data: {
            ...s.data,
            nodes: s.data.nodes.map((n) =>
              n.id === nodeId ? { ...n, position } : n
            ),
          },
        })),

      // ── 产物 ──
      addProductToNode: (nodeId, product) =>
        set((s) => ({
          data: {
            ...s.data,
            nodes: s.data.nodes.map((n) => {
              if (n.id !== nodeId) return n;
              const instance: ProductInstance = { ...product, id: crypto.randomUUID() };
              const updated = { ...n, products: [...n.products, instance] };
              return { ...updated, status: recomputeStatus(updated), name: product.name };
            }),
          },
        })),

      removeProductFromNode: (nodeId, productId) =>
        set((s) => ({
          data: {
            ...s.data,
            nodes: s.data.nodes.map((n) => {
              if (n.id !== nodeId) return n;
              const updated = { ...n, products: n.products.filter((p) => p.id !== productId) };
              return { ...updated, status: recomputeStatus(updated) };
            }),
          },
        })),

      // ── 连线 ──
      addConnection: (sourceNodeId, targetNodeId) =>
        set((s) => {
          // 去重
          const exists = s.data.connections.some(
            (c) => c.sourceNodeId === sourceNodeId && c.targetNodeId === targetNodeId
          );
          if (exists || sourceNodeId === targetNodeId) return s;
          return {
            data: {
              ...s.data,
              connections: [
                ...s.data.connections,
                { id: crypto.randomUUID(), sourceNodeId, targetNodeId },
              ],
            },
          };
        }),

      deleteConnection: (connectionId) =>
        set((s) => ({
          data: {
            ...s.data,
            connections: s.data.connections.filter((c) => c.id !== connectionId),
          },
        })),

      // ── 上游节点 ──
      addUpstream: (nodeId, upstreamNodeId) =>
        set((s) => ({
          data: {
            ...s.data,
            nodes: s.data.nodes.map((n) => {
              if (n.id !== nodeId) return n;
              if (n.upstreamNodeIds.includes(upstreamNodeId)) return n;
              return { ...n, upstreamNodeIds: [...n.upstreamNodeIds, upstreamNodeId] };
            }),
          },
        })),

      removeUpstream: (nodeId, upstreamNodeId) =>
        set((s) => ({
          data: {
            ...s.data,
            nodes: s.data.nodes.map((n) => {
              if (n.id !== nodeId) return n;
              return { ...n, upstreamNodeIds: n.upstreamNodeIds.filter((id) => id !== upstreamNodeId) };
            }),
          },
        })),

      // ── 选中 ──
      selectNode: (nodeId) =>
        set((s) => ({ data: { ...s.data, selectedNodeId: nodeId } })),

      // ── 视口 ──
      setViewport: (viewport) =>
        set((s) => ({
          data: { ...s.data, viewport: { ...s.data.viewport, ...viewport } },
        })),

      // ── 连线绘制中 ──
      startConnection: (sourceNodeId, startX, startY) =>
        set((s) => ({
          data: {
            ...s.data,
            pendingConnection: { sourceNodeId, startX, startY, currentX: startX, currentY: startY },
          },
        })),

      updatePendingConnection: (x, y) =>
        set((s) => {
          if (!s.data.pendingConnection) return s;
          return {
            data: {
              ...s.data,
              pendingConnection: { ...s.data.pendingConnection, currentX: x, currentY: y },
            },
          };
        }),

      endConnection: (targetNodeId) =>
        set((s) => {
          if (!s.data.pendingConnection) return s;
          const sourceNodeId = s.data.pendingConnection.sourceNodeId;
          const exists = s.data.connections.some(
            (c) => c.sourceNodeId === sourceNodeId && c.targetNodeId === targetNodeId
          );
          if (exists || sourceNodeId === targetNodeId) {
            return { data: { ...s.data, pendingConnection: null } };
          }
          return {
            data: {
              ...s.data,
              connections: [
                ...s.data.connections,
                { id: crypto.randomUUID(), sourceNodeId, targetNodeId },
              ],
              pendingConnection: null,
            },
          };
        }),

      cancelConnection: () =>
        set((s) => ({ data: { ...s.data, pendingConnection: null } })),

      // ── 全局 ──
      toggleDefaultFlow: () =>
        set((s) => ({ data: { ...s.data, isDefaultFlow: !s.data.isDefaultFlow } })),

      resetFlowchart: () => set({ data: { ...initialData } }),
    }),
    { name: "flowchart-data" }
  )
);
