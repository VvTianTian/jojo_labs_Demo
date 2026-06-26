import type { ProductTemplate } from "../types/flowchart";

// ─── 节点尺寸常量 ───
export const NODE_WIDTH = 240;
export const NODE_HEIGHT_BASE = 72;   // badge + title + 生产人 + 环节标题
export const NODE_HEIGHT_PER_PRODUCT = 40; // 每个产物块的高度
export const PORT_RADIUS = 5;
export const PORT_HIT_RADIUS = 20;

// ─── 产物库 ───
export const PRODUCT_TEMPLATES: ProductTemplate[] = [
  // 环节1
  { id: "video_time", name: "视频及互动时间", stage: 1, stageName: "环节1", group: "视频" },
  { id: "ppt", name: "教研PPT", stage: 1, stageName: "环节1", group: "视频" },
  { id: "record_video", name: "录课视频 (剪辑版)", stage: 1, stageName: "环节1", group: "视频" },
  { id: "supplement_material", name: "补录素材", stage: 1, stageName: "环节1", group: "视频" },
  // 环节2 练一练
  { id: "exercise_requirement", name: "题目需求", stage: 2, stageName: "环节2 练一练", group: "题组" },
  { id: "exercise_image", name: "题目图片", stage: 2, stageName: "环节2 练一练", group: "题组" },
  { id: "exercise_audio", name: "题目语音", stage: 2, stageName: "环节2 练一练", group: "题组" },
  { id: "exercise_animation", name: "题目动效", stage: 2, stageName: "环节2 练一练", group: "题组" },
];

// ─── 按环节分组的产物 ───
export interface ProductGroup {
  stageName: string;
  stage: number;
  groups: { name: string; products: ProductTemplate[] }[];
}

export function getGroupedProducts(): ProductGroup[] {
  const stageMap = new Map<number, ProductGroup>();

  for (const t of PRODUCT_TEMPLATES) {
    if (!stageMap.has(t.stage)) {
      stageMap.set(t.stage, { stageName: t.stageName, stage: t.stage, groups: [] });
    }
    const group = stageMap.get(t.stage)!;
    const existing = group.groups.find((g) => g.name === t.group);
    if (existing) {
      existing.products.push(t);
    } else {
      group.groups.push({ name: t.group, products: [t] });
    }
  }

  return Array.from(stageMap.values());
}

// ─── 计算节点状态 ───
export function computeNodeStatus(products: unknown[], assignee: string): "empty" | "filled" | "complete" {
  if (products.length === 0) return "empty";
  if (assignee) return "complete";
  return "filled";
}
