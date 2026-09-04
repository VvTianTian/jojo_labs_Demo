export type BookLanguage = "zh" | "en";
export type CoverLayout = "split" | "fullscreen";
export type CoverTextField = "title" | "topic" | "wordCount" | "fiction";
export type UserRole = "research" | "production";
export type ElementType = "text" | "image" | "motion" | "bubble" | "question";
export type RequirementType = "image" | "motion" | "audio";
export type RequirementStatus = "pending" | "uploaded" | "failed";
export type BubbleDirection = "left" | "right";
export type TextAlign = "left" | "center" | "right" | "justify";
export type TextAnnotationType = "word" | "sentence" | "note";
export type PronunciationMode = "pinyin" | "phonetic";
export type PlaybackDisplayMode = "always" | "onPlayback";
export type QuestionOptionMode = "text" | "image";

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
  /** Hidden elements remain in the page model and layer list but are not rendered on the canvas. */
  hidden?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface TextElement extends ElementBase {
  type: "text";
  /** Fixed input slot used by the cover template; body text has no cover field. */
  coverField?: CoverTextField;
  content: string;
  fontSize: number;
  color: string;
  fontWeight: "regular" | "medium" | "bold";
  textAlign?: TextAlign;
  italic?: boolean;
  underline?: boolean;
  audioUrl: string | null;
  voiceSupplement: string;
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
  voiceSupplement: string;
}

export interface QuestionOption {
  id: string;
  content: string;
  isCorrect: boolean;
}

export interface QuestionElement extends ElementBase {
  type: "question";
  stem: string;
  optionMode: QuestionOptionMode;
  options: QuestionOption[];
}

export type BookElement = TextElement | ImageElement | MotionElement | BubbleElement | QuestionElement;

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
  supplementalBrief?: RichTextDocument;
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
