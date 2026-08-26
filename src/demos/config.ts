import { BookOpen, GitBranch, CheckSquare, ListChecks, Image, WandSparkles } from "lucide-react";

export interface DemoConfig {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}

export const demos: DemoConfig[] = [
  {
    id: "animation-book",
    name: "动画书生产工具",
    description: "教研人员与制作人员协作的 16:9 动画书生产 Demo",
    path: "/animation-book",
    icon: WandSparkles,
    color: "brand",
  },
  {
    id: "picture-book",
    name: "翻翻书编辑器",
    description: "支持封面/页面/语音/多角色协作的绘本制作工具",
    path: "/picture-book",
    icon: BookOpen,
    color: "brand",
  },
  {
    id: "flowchart",
    name: "流程图绘制",
    description: "可视化拖拽绘制流程图，支持多种节点类型",
    path: "/flowchart",
    icon: GitBranch,
    color: "success",
  },
  {
    id: "tree-checkbox",
    name: "树形多选框",
    description: "支持 Shift+Click 批量框选、父子联动的树形复选框",
    path: "/tree-checkbox",
    icon: CheckSquare,
    color: "warning",
  },
  {
    id: "cascader-select",
    name: "级联多选下拉",
    description: "支持多层级树形结构的多选级联下拉框，含互斥逻辑",
    path: "/cascader-select",
    icon: ListChecks,
    color: "info",
  },
  {
    id: "cover-generator",
    name: "封面图生成工具",
    description: "在线生成项目/项目组封面图，支持多种布局、背景色、纹理和人物素材",
    path: "/cover-generator",
    icon: Image,
    color: "brand",
  },
];
