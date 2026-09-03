export type BookLanguage = "zh" | "en";
export type CoverLayout = "split" | "fullscreen";
export type UserRole = "research" | "production";
export type ElementType = "text" | "image" | "motion" | "bubble";
export type RequirementType = "image" | "motion" | "audio";
export type RequirementStatus = "pending" | "uploaded" | "failed";
export type BubbleDirection = "left" | "right";
export type TextAlign = "left" | "center" | "right" | "justify";
export type TextAnnotationType = "word" | "sentence" | "note";
export type PronunciationMode = "pinyin" | "phonetic";
export type PlaybackDisplayMode = "always" | "onPlayback";

export interface TextAnnotation {
  id: string;
  type: TextAnnotationType;
  start: number;
  end: number;
  text: string;
  pronunciationMode: PronunciationMode;
  pinyin: string;
  translations: string[];
  explanation: string;
  note: string;
  voiceRequest: string;
  voiceSupplement: string;
}

export interface ElementBase {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface TextElement extends ElementBase {
  type: "text";
  content: string;
  fontSize: number;
  color: string;
  fontWeight: "regular" | "medium" | "bold";
  textAlign?: TextAlign;
  italic?: boolean;
  underline?: boolean;
  audioUrl: string | null;
  annotations: TextAnnotation[];
}

export interface ImageElement extends ElementBase {
  type: "image";
  src: string;
  alt: string;
  objectFit: "cover" | "contain";
}

export interface MotionElement extends ElementBase {
  type: "motion";
  src: string | null;
  fileName: string;
  objectFit: "cover" | "contain";
}

export interface BubbleElement extends ElementBase {
  type: "bubble";
  content: string;
  direction: BubbleDirection;
  tailX: number;
  tailY: number;
  audioUrl: string | null;
}

export type BookElement = TextElement | ImageElement | MotionElement | BubbleElement;

export interface RichTextDocument {
  html: string;
  text: string;
}

export type RequirementTarget =
  { kind: "element"; elementId: string };

export interface ProductionAsset {
  url: string;
  fileName: string;
  mimeType: string;
  uploadedAt: string;
}

export interface ProductionRequirement {
  id: string;
  type: RequirementType;
  title: string;
  brief: RichTextDocument;
  target: RequirementTarget | null;
  asset: ProductionAsset | null;
  status: RequirementStatus;
  errorMessage?: string;
}

export interface PlaybackOrderItem {
  elementId: string;
  displayMode: PlaybackDisplayMode;
}

export interface AnimationBookPage {
  id: string;
  label: string;
  kind: "cover" | "page";
  backgroundColor: string;
  elements: BookElement[];
  appearanceOrder: string[];
  playbackOrder: PlaybackOrderItem[];
  requirements: ProductionRequirement[];
}

export interface AnimationBook {
  id: string;
  title: string;
  language: BookLanguage;
  coverLayout: CoverLayout;
  cover: AnimationBookPage;
  pages: AnimationBookPage[];
}

export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;
export const EDITOR_WIDTH = 640;
export const EDITOR_HEIGHT = 360;
