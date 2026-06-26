export type CoverLayout = "fullscreen" | "split";
export type ViewMode = "canvas" | "narration";
export type EditorRole = "editorial" | "production";

export interface Cover {
  layout: CoverLayout;
  imageUrl: string | null;
  title: string;
  author: string;
  synopsis: string;
  imageRequirement: string;
}

export interface PageSettings {
  backgroundColor: string | null;
  fontSize: number | null;
  textAlign: "left" | "center" | "right" | null;
}

export interface GlobalSettings {
  defaultFontFamily: string;
  defaultBackgroundColor: string;
  globalAudioUrl: string | null;
}

/** 文字块：每条正文是一个独立可操作单元 */
export interface TextBlock {
  id: string;
  content: string;
  translation: string;
  audioUrl: string | null;
  audioRequirement: string;
}

/** 图片互动热点 */
export type HotspotAction = "popup_card" | "play_video";

export interface Hotspot {
  id: string;
  x: number; // 0-100 百分比
  y: number; // 0-100 百分比
  action: HotspotAction;
  content: string; // 卡牌文本 或 视频URL
}

export interface Page {
  id: string;
  imageUrl: string | null;
  textBlocks: TextBlock[];
  hotspots: Hotspot[];
  audioUrl: string | null; // 页间讲解语音
  settings: PageSettings;
  imageRequirement: string;
  audioRequirement: string;
}

/** 选中状态：当前编辑的元素类型 */
export type SelectionType = "none" | "textBlock" | "image";

export interface Selection {
  type: SelectionType;
  textBlockId?: string;
}

export interface Book {
  id: string;
  title: string;
  cover: Cover;
  globalSettings: GlobalSettings;
  pages: Page[];
  currentPageIndex: number; // -1 = cover view
  viewMode: ViewMode;
  selection: Selection;
}
