import type { Book } from "../types/book";

export const DEFAULT_BOOK_TITLE = "我的绘本";

export const PRESET_COLORS = [
  "#F4F8FA", // 页面底色
  "#EBF9FF", // 品牌浅背景
  "#DBF3FF", // 品牌辅助浅色
  "#D2F7C6", // 成功辅助浅色
  "#EFFAEB", // 成功浅背景
  "#FCF9DE", // 警告浅背景
  "#FFF2F0", // 错误浅背景
  "#E6EEF2", // 中性浅底色
];

export const FONT_OPTIONS = [
  { label: "系统默认", value: "PingFang SC, Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { label: "Inter", value: "Inter" },
];

export const FONT_SIZE_OPTIONS = [14, 16, 18, 20, 24, 28, 32];

export function createDefaultBook(): Book {
  return {
    id: crypto.randomUUID(),
    title: DEFAULT_BOOK_TITLE,
    cover: {
      layout: "split",
      imageUrl: null,
      title: DEFAULT_BOOK_TITLE,
      author: "",
      synopsis: "",
      imageRequirement: "",
    },
    globalSettings: {
      defaultFontFamily: "PingFang SC, Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      defaultBackgroundColor: "#F4F8FA",
      globalAudioUrl: null,
    },
    pages: [
      {
        id: crypto.randomUUID(),
        imageUrl: null,
        textBlocks: [
          {
            id: crypto.randomUUID(),
            content: "从前，在一个遥远的地方……",
            translation: "",
            audioUrl: null,
            audioRequirement: "",
          },
        ],
        hotspots: [],
        audioUrl: null,
        settings: {
          backgroundColor: null,
          fontSize: null,
          textAlign: null,
        },
        imageRequirement: "",
        audioRequirement: "",
      },
    ],
    currentPageIndex: -1,
    viewMode: "canvas",
    selection: { type: "none" },
  };
}
