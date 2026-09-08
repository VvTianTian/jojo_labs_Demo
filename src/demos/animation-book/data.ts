import { participatesInPlayback } from "./types";
import type { AnimationBook, AnimationBookPage, BookElement, CoverTextField, TextElement } from "./types";

export const BUBBLE_DEFAULT_GEOMETRY = {
  width: 298,
  height: 120,
  tailAngle: 90,
  widthMode: "auto",
} as const;

type LegacyBubbleFields = {
  widthMode?: unknown;
  tailAngle?: unknown;
  direction?: unknown;
  tailX?: unknown;
  tailY?: unknown;
};

const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360;

const migrateBubbleElement = (element: BookElement): BookElement => {
  if (element.type !== "bubble") return element;

  const legacy = element as BookElement & LegacyBubbleFields;
  const widthMode = legacy.widthMode === "manual" ? "manual" : "auto";
  if (typeof legacy.tailAngle === "number" && Number.isFinite(legacy.tailAngle)) {
    return { ...element, widthMode, tailAngle: normalizeAngle(legacy.tailAngle) };
  }

  const hasLegacyPosition = typeof legacy.tailX === "number" || typeof legacy.tailY === "number" || legacy.direction === "left" || legacy.direction === "right";
  if (!hasLegacyPosition) return { ...element, widthMode, tailAngle: BUBBLE_DEFAULT_GEOMETRY.tailAngle };
  const x = typeof legacy.tailX === "number" ? Math.min(Math.max(legacy.tailX, 0), 100) : legacy.direction === "left" ? 0 : legacy.direction === "right" ? 100 : 50;
  const y = typeof legacy.tailY === "number" ? Math.min(Math.max(legacy.tailY, 0), 100) : 50;
  const angle = Math.atan2(y - 50, x - 50) * (180 / Math.PI);
  return { ...element, widthMode, tailAngle: normalizeAngle(angle) };
};

export const normalizeAnimationBook = (book: AnimationBook): AnimationBook => {
  const normalizePage = (page: AnimationBookPage): AnimationBookPage => ({
    ...page,
    elements: page.elements.map(migrateBubbleElement),
    playbackOrder: page.playbackOrder.filter((item) => page.elements.some((element) => element.id === (typeof item === "string" ? item : item.elementId) && participatesInPlayback(element))),
  });

  return {
    ...book,
    cover: normalizePage(book.cover),
    pages: book.pages.map(normalizePage),
  };
};

const createEmptyPage = (
  id: string,
  label: string,
  kind: AnimationBookPage["kind"],
): AnimationBookPage => ({
  id,
  label,
  kind,
  backgroundColor: "#fefcf8",
  elements: [],
  appearanceOrder: [],
  playbackOrder: [],
  requirements: [],
});

const coverTextSlots: { field: CoverTextField; id: string; y: number }[] = [
  { field: "title", id: "cover-title", y: 330 },
  { field: "topic", id: "cover-topic", y: 528 },
  { field: "wordCount", id: "cover-word-count", y: 600 },
  { field: "fiction", id: "cover-fiction", y: 672 },
];

// Empty content retains the fixed cover template and its production bindings.
const createEmptyCover = (): AnimationBookPage => ({
  ...createEmptyPage("cover", "封面", "cover"),
  elements: [
    { id: "cover-image", type: "image", x: 286, y: 201, width: 678, height: 678, zIndex: 1, src: "", alt: "封面图片", objectFit: "cover" },
    { id: "cover-motion", type: "motion", x: 0, y: 0, width: 1920, height: 1080, zIndex: 1, src: null, fileName: "", objectFit: "cover", hidden: true },
    ...coverTextSlots.map(({ field, id, y }): TextElement => ({
      id, type: "text", coverField: field, x: 994, y, width: 640,
      height: field === "title" ? 90 : 72, zIndex: field === "title" ? 2 : 3,
      content: "", fontSize: field === "title" ? 60 : 40,
      color: field === "title" ? "#404040" : "#353e42",
      fontWeight: field === "title" ? "bold" : "regular",
      audioUrl: null, voiceSupplement: "", annotations: [],
    })),
  ],
  requirements: [
    { id: "cover-image-brief", type: "image", title: "封面图片需求", target: { kind: "element", elementId: "cover-image" } },
    { id: "cover-motion-brief", type: "motion", title: "封面动效需求", target: { kind: "element", elementId: "cover-motion" } },
    { id: "cover-audio-brief", type: "audio", title: "封面语音", target: null },
  ].map((slot) => ({ ...slot, brief: { html: "", text: "" }, asset: null, status: "pending" })) as AnimationBookPage["requirements"],
});

export const initialAnimationBook: AnimationBook = {
  id: "animation-book-demo",
  title: "我是有用的鹅卵石",
  language: "zh",
  coverLayout: "split",
  cover: createEmptyCover(),
  pages: [
    createEmptyPage("page-1", "正文 1", "page"),
  ],
};

export const getElementLabel = (type: AnimationBookPage["elements"][number]["type"]) => {
  if (type === "text") return "文本";
  if (type === "image") return "图片";
  if (type === "motion") return "动效";
  if (type === "question") return "题";
  if (type === "interaction") return "互动";
  return "气泡";
};
