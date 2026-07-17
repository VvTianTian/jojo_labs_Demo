export type CoverLayout = "fullscreen" | "split";

export interface Cover {
  layout: CoverLayout;
  imageUrl: string | null;
  title: string;
  author: string;
  synopsis: string;
  lexile: string;
  isFictional: string;
  imageRequirement: string;
  narrationAudioUrl: string | null;
  narrationTiming: "start" | "end";
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
  narrationAudioUrl: string | null; // 每页讲解语音
  narrationAudioRequirement: string; // 讲解语音需求描述
  narrationTiming: "start" | "end";  // 播放时机
  imageRequirement: string;
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
  selection: Selection;
}
