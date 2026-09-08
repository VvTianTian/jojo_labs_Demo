import { participatesInPlayback } from "./types";
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  Bold,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  CircleX,
  Eye,
  EyeOff,
  FileAudio,
  FileImage,
  Film,
  Gamepad2,
  Hand,
  GripVertical,
  Image as ImageIcon,
  ImagePlus,
  Layers3,
  Menu,
  Maximize2,
  MessageCircle,
  MousePointer2,
  Pause,
  Plus,
  Play,
  Redo2,
  Save,
  ShieldCheck,
  Trash2,
  Type,
  Undo2,
  Underline,
  Upload,
  X,
  Italic,
} from "lucide-react";
import { Link } from "react-router-dom";
import { BUBBLE_DEFAULT_GEOMETRY, getElementLabel, initialAnimationBook, normalizeAnimationBook } from "./data";
import {
  ANNOTATION_LABELS,
  buildAnnotationSegments,
  createAnnotation,
  getTextSelectionRange,
  hasAnnotationContent,
  normalizeAnnotations,
  readPlainTextFromContentEditable,
  replaceContentEditableSelection,
  selectTextRange,
  setTextCaret,
  type TextSelectionRange,
  writePlainTextToContentEditable,
} from "./annotation-utils";
import { RequirementsPanel } from "./components/RequirementsPanel";
import { RequirementRichText, RichTextPreview } from "./components/RequirementRichText";
import { TextAnnotationPanel, type AnnotationPanelTab, type VoiceItem } from "./components/TextAnnotationPanel";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  EDITOR_WIDTH,
  type AnimationBook,
  type AnimationBookPage,
  type BookElement,
  type BubbleElement,
  type CoverLayout,
  type CoverTextField,
  type ImageElement,
  type MotionElement,
  type ProductionAsset,
  type ProductionRequirement,
  type PlaybackDisplayMode,
  type PlaybackOrderItem,
  type InteractionElement,
  type InteractionDraft,
  type QuestionElement,
  type QuestionOption,
  type RequirementType,
  type TextAnnotation,
  type TextAnnotationType,
  type TextElement,
  type UserRole,
} from "./types";
import "./animation-book.css";

type ViewId = "cover" | string;
type PanelTab = "requirements" | AnnotationPanelTab;
const getDefaultPanelTab = (role: UserRole): PanelTab => role === "research" ? "voice" : "requirements";
type CanvasRequirementMode = "editing" | "preview";
type CanvasRequirementModes = Record<string, CanvasRequirementMode>;
type ResizeCorner = "top-left" | "top-right" | "middle-left" | "middle-right" | "bottom-left" | "bottom-right";
type ElementGeometryPatch = Partial<Pick<BookElement, "x" | "y" | "width" | "height">> & Partial<Pick<BubbleElement, "widthMode" | "tailAngle">>;

interface PointerDrag {
  id: string;
  mode: "move" | "resize" | "tail";
  corner?: ResizeCorner;
  pointerX: number;
  pointerY: number;
  origin: Pick<BookElement, "x" | "y" | "width" | "height">;
}

interface PendingDelete {
  id: string;
  type: BookElement["type"];
  name: string;
}

interface PendingPageDelete {
  id: string;
  label: string;
}

interface PendingAnnotationDelete {
  id: string;
  text: string;
  type: TextAnnotationType;
}

interface PageAnnotation extends TextAnnotation {
  elementId: string;
}

type PageDropPosition = "before" | "after";
type LayerDropPosition = "before" | "after";
type PlaybackDropPosition = "before" | "after";

const BASIC_INFO_MUSIC_OPTIONS = [
  { id: "cicada", title: "静静引路--Cicada", duration: "03:54" },
  { id: "spring", title: "春风亲吻我像蛋挞--麦兜", duration: "03:54" },
  { id: "fengshen", title: "风神125--交工乐队", duration: "09:47" },
  { id: "spring-garden", title: "春田花花幼稚园园歌--小墨鱼装死班合唱团", duration: "02:08" },
  { id: "pacific", title: "太平洋的风--胡德夫", duration: "04:43" },
];

const ANIMATION_BOOK_GRID_ASSET = "/animation-book/assets/animation-book-grid-system.png";
const BODY_TEXT_FONT_FAMILY = '"PingFang SC", "PingFang TC", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
const BODY_TEXT_PARAGRAPH_INDENT = "32px";
const TEXT_ELEMENT_PLACEHOLDER = "双击编辑文字";
const BUBBLE_ELEMENT_PLACEHOLDER = "请输入对话";
const BUBBLE_EDITOR_SCALE = CANVAS_WIDTH / EDITOR_WIDTH;
const BUBBLE_MIN_WIDTH = BUBBLE_DEFAULT_GEOMETRY.width;
const BUBBLE_MIN_HEIGHT = BUBBLE_DEFAULT_GEOMETRY.height;
const BUBBLE_OUTER_CHROME_PX = 8;
const BUBBLE_NATURAL_WIDTH_BUFFER_PX = 4;
const QUESTION_CANVAS_X = 1044;
const QUESTION_CANVAS_Y = 198;
const QUESTION_CANVAS_WIDTH = 540;
const QUESTION_CANVAS_HEIGHT = 612;
const QUESTION_MIN_OPTIONS = 2;
const QUESTION_MAX_OPTIONS = 4;
const COVER_SPLIT_IMAGE = { x: 286, y: 201, width: 678, height: 678 } as const;
const COVER_SPLIT_TEXT = { x: 994, y: 270, width: 640, height: 540 } as const;
const COVER_FULLSCREEN_MEDIA = { x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT } as const;
const COVER_TEXT_GEOMETRY: Record<CoverTextField, { x: number; y: number; width: number; height: number }> = {
  title: { x: COVER_SPLIT_TEXT.x, y: 330, width: COVER_SPLIT_TEXT.width, height: 90 },
  topic: { x: COVER_SPLIT_TEXT.x, y: 528, width: COVER_SPLIT_TEXT.width, height: 72 },
  wordCount: { x: COVER_SPLIT_TEXT.x, y: 600, width: COVER_SPLIT_TEXT.width, height: 72 },
  fiction: { x: COVER_SPLIT_TEXT.x, y: 672, width: COVER_SPLIT_TEXT.width, height: 72 },
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360;

const getBubbleTailPosition = (width: number, height: number, angle: number) => {
  const radians = normalizeAngle(angle) * (Math.PI / 180);
  const dx = Math.cos(radians);
  const dy = Math.sin(radians);
  const halfWidth = Math.max(width / 2, 1);
  const halfHeight = Math.max(height / 2, 1);
  const distance = 1 / Math.max(Math.abs(dx) / halfWidth, Math.abs(dy) / halfHeight);
  return {
    left: clamp(50 + ((dx * distance) / width) * 100, 0, 100),
    top: clamp(50 + ((dy * distance) / height) * 100, 0, 100),
  };
};

const elementName = (element: BookElement) => {
  if (element.type === "text") return element.content.split("\n")[0] || "未命名文本";
  if (element.type === "image") return element.alt || "未命名图片";
  if (element.type === "motion") return element.fileName || "未命名动效";
  if (element.type === "interaction") return element.title || "投票互动";
  if (element.type === "question") return element.stem.split("\n")[0] || "题目";
  return element.content.split("\n")[0] || "未命名气泡";
};

const getLayerTypeLabel = (type: string) => {
  if (type === "text") return "文本";
  if (type === "image") return "图片";
  if (type === "motion") return "动效";
  if (type === "bubble") return "对话";
  if (type === "question") return "题";
  if (type === "interaction") return "互动";
  return "元素";
};

const getLayerTypeIcon = (type: string) => {
  if (type === "text") return <Type size={14} aria-hidden="true" />;
  if (type === "image") return <FileImage size={14} aria-hidden="true" />;
  if (type === "motion") return <Film size={14} aria-hidden="true" />;
  if (type === "question") return <Gamepad2 size={14} aria-hidden="true" />;
  if (type === "interaction") return <Hand size={14} aria-hidden="true" />;
  return <MessageCircle size={14} aria-hidden="true" />;
};

const getPage = (book: AnimationBook, viewId: ViewId) =>
  viewId === "cover" ? book.cover : book.pages.find((page) => page.id === viewId) ?? book.pages[0];

const updatePage = (
  book: AnimationBook,
  viewId: ViewId,
  updater: (page: AnimationBookPage) => AnimationBookPage,
): AnimationBook => {
  if (viewId === "cover") return { ...book, cover: updater(book.cover) };
  return {
    ...book,
    pages: book.pages.map((page) => (page.id === viewId ? updater(page) : page)),
  };
};

const replaceElement = (
  page: AnimationBookPage,
  elementId: string,
  updater: (element: BookElement) => BookElement,
) => ({
  ...page,
  elements: page.elements.map((element) =>
    element.id === elementId ? updater(element) : element,
  ),
});

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;

const getVisualRequirement = (
  page: AnimationBookPage | undefined,
  element: ImageElement | MotionElement,
) => page?.requirements.find(
  (requirement) =>
    requirement.type === element.type &&
    requirement.target?.kind === "element" &&
    requirement.target.elementId === element.id,
);

const createVisualRequirement = (element: ImageElement | MotionElement): ProductionRequirement => ({
  id: createId(`${element.type}-requirement`),
  type: element.type,
  title: element.type === "image" ? "图片制作需求" : "动效制作需求",
  brief: { html: "", text: "" },
  target: { kind: "element", elementId: element.id },
  asset: null,
  status: "pending",
});

const getDefaultCanvasRequirementModes = (
  page: AnimationBookPage | undefined,
): CanvasRequirementModes =>
  Object.fromEntries(
    (page?.requirements ?? [])
      .filter((requirement) => {
        if (requirement.type !== "image" && requirement.type !== "motion") return false;
        if (requirement.target?.kind !== "element") return false;
        const targetElement = page?.elements.find((element) => element.id === requirement.target?.elementId);
        if (!targetElement || (targetElement.type !== "image" && targetElement.type !== "motion")) return false;
        return targetElement.type === requirement.type && !targetElement.src;
      })
      .map((requirement) => [requirement.id, "preview" as const]),
  );

const readFileAsDataUrl = (file: File, onReady: (dataUrl: string) => void, onError?: () => void) => {
  const reader = new FileReader();
  reader.onload = () => onReady(reader.result as string);
  reader.onerror = onError ?? null;
  reader.readAsDataURL(file);
};

const getVoiceItems = (page: AnimationBookPage): VoiceItem[] => {
  const typeCounts: Record<"text" | "bubble", number> = { text: 0, bubble: 0 };
  return page.elements
    .filter((element): element is TextElement | BubbleElement => element.type === "text" || element.type === "bubble")
    .map((element) => {
      typeCounts[element.type] += 1;
      return {
        id: element.id,
        type: element.type,
        label: (element.type === "text" ? "文本" : "对话") + typeCounts[element.type],
        content: element.content,
        voiceSupplement: element.voiceSupplement ?? "",
      };
    });
};

const createPlaybackOrder = (elements: BookElement[]): PlaybackOrderItem[] => elements
  .filter((element) => participatesInPlayback(element))
  .map((element) => ({
    elementId: element.id,
    displayMode: "always",
  }));

const normalizePlaybackOrder = (page: AnimationBookPage): PlaybackOrderItem[] => {
  const elementsById = new Map(page.elements
    .filter((element) => participatesInPlayback(element))
    .map((element) => [element.id, element]));
  const rawItems = (page.playbackOrder ?? []) as Array<PlaybackOrderItem | string>;
  const normalized = rawItems
    .map((item) => {
      if (typeof item === "string") return { elementId: item, displayMode: "always" as const };
      return {
        elementId: item.elementId,
        displayMode: item.displayMode === "onPlayback" ? "onPlayback" as const : "always" as const,
      };
    })
    .filter((item) => elementsById.has(item.elementId));
  const uniqueItems = normalized.filter((item, index) => normalized.findIndex((candidate) => candidate.elementId === item.elementId) === index);
  const existingIds = new Set(uniqueItems.map((item) => item.elementId));
  return [
    ...uniqueItems,
    ...page.elements
      .filter((element) => participatesInPlayback(element) && !existingIds.has(element.id))
      .map((element) => ({ elementId: element.id, displayMode: "always" as const })),
  ];
};

const needsDeleteConfirmation = (element: BookElement) =>
  (element.type === "text" && element.content.trim().length > 0) ||
  (element.type === "bubble" && element.content.trim().length > 0) ||
  (element.type === "image" && element.src.trim().length > 0) ||
  (element.type === "motion" && Boolean(element.src)) ||
  element.type === "question" || element.type === "interaction";

export function AnimationBookEditor() {
  const [book, setBook] = useState<AnimationBook>(() => structuredClone(normalizeAnimationBook(initialAnimationBook)));
  const [role, setRole] = useState<UserRole>("research");
  const [viewId, setViewId] = useState<ViewId>("page-1");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [canvasRequirementModes, setCanvasRequirementModes] = useState<CanvasRequirementModes>(() =>
    getDefaultCanvasRequirementModes(initialAnimationBook.pages[0]),
  );
  const [panelTab, setPanelTab] = useState<PanelTab>(() => getDefaultPanelTab("research"));
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; position: PageDropPosition } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [pendingCoverChange, setPendingCoverChange] = useState<{ kind: "layout"; value: CoverLayout } | { kind: "media"; value: "image" | "motion" } | null>(null);
  const coverConfirmRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (pendingCoverChange) coverConfirmRef.current?.showModal();
    else coverConfirmRef.current?.close();
  }, [pendingCoverChange]);
  const [pendingPageDelete, setPendingPageDelete] = useState<PendingPageDelete | null>(null);
  const [pendingAnnotationDelete, setPendingAnnotationDelete] = useState<PendingAnnotationDelete | null>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [textSelection, setTextSelection] = useState<(TextSelectionRange & { elementId: string }) | null>(null);
  const [showBasicInfo, setShowBasicInfo] = useState(false);
  const [backgroundMusicChoice, setBackgroundMusicChoice] = useState("spring");
  const [backgroundMusicStyle, setBackgroundMusicStyle] = useState("安静");
  const [showSafeArea, setShowSafeArea] = useState(true);
  const [autoHeightElementId, setAutoHeightElementId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const imageUploadInputRef = useRef<HTMLInputElement>(null);
  const [imageUploadTargetId, setImageUploadTargetId] = useState<string | null>(null);
  const coverMediaUploadInputRef = useRef<HTMLInputElement>(null);
  const [coverMediaUploadTargetId, setCoverMediaUploadTargetId] = useState<string | null>(null);
  const [coverMediaUploadAccept, setCoverMediaUploadAccept] = useState("image/*");
  const pointerDragRef = useRef<PointerDrag | null>(null);
  const bubbleNaturalWidthRef = useRef<Record<string, number>>({});

  const currentPage = getPage(book, viewId);
  const isResearch = role === "research";
  const selectedElement = currentPage?.elements.find((element) => element.id === selectedId) ?? null;
  const currentQuestion = currentPage?.elements.find(
    (element): element is QuestionElement | InteractionElement => element.type === "question" || element.type === "interaction",
  ) ?? null;
  const hasQuestion = currentQuestion?.type === "question";
  const hasInteraction = currentQuestion?.type === "interaction";
  const interactionBaselines = useRef(new Map<string, InteractionDraft>());
  const isTextToolActive = isResearch && selectedElement?.type === "text" && editingTextId === selectedElement.id;
  const sortedElements = useMemo(
    () => [...(currentPage?.elements ?? [])]
      .filter((element) => element.hidden !== true)
      .filter((element) => currentPage?.kind !== "cover" || (book.coverLayout === "split"
        ? element.id !== "cover-motion"
        : element.id === "cover-image" || element.id === "cover-motion"))
      .sort((a, b) => a.zIndex - b.zIndex),
    [book.coverLayout, currentPage],
  );
  const layerElements = useMemo(
    () => [...(currentPage?.elements ?? [])].sort((a, b) => b.zIndex - a.zIndex),
    [currentPage],
  );
  const pageIndex = book.pages.findIndex((page) => page.id === viewId);
  const currentVoiceItems = useMemo(
    () => getVoiceItems(currentPage),
    [currentPage],
  );
  const currentPlaybackOrder = useMemo(
    () => currentPage.kind === "page" ? normalizePlaybackOrder(currentPage) : [],
    [currentPage],
  );
  const currentAnnotations = useMemo<PageAnnotation[]>(
    () => currentPage?.elements
      .filter((element): element is TextElement => element.type === "text")
      .flatMap((element) => element.annotations.map((annotation) => ({ ...annotation, elementId: element.id }))) ?? [],
    [currentPage],
  );

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const changeCoverLayout = (layout: CoverLayout, confirmed = false) => {
    if (!isResearch || layout === book.coverLayout) return;
    const hasText = book.cover.elements.some((element) => element.type === "text" && element.content.trim());
    if (layout === "fullscreen" && hasText && !confirmed) {
      setPendingCoverChange({ kind: "layout", value: layout });
      return;
    }
    const currentMediaType = book.cover.elements.some(
      (element) => element.id === "cover-motion" && element.hidden !== true,
    ) ? "motion" : "image";
    setBook((previous) => updatePage(
      { ...previous, coverLayout: layout },
      "cover",
      (page) => ({
        ...page,
        elements: page.elements.map((element) => {
          if (element.id === "cover-image" && element.type === "image") {
            return { ...element, ...COVER_SPLIT_IMAGE, hidden: layout === "fullscreen" && currentMediaType !== "image" };
          }
          if (element.id === "cover-motion" && element.type === "motion") {
            return { ...element, ...COVER_FULLSCREEN_MEDIA, hidden: layout !== "fullscreen" || currentMediaType !== "motion" };
          }
          if (element.type === "text" && element.coverField) {
            return {
              ...element,
              ...COVER_TEXT_GEOMETRY[element.coverField],
              content: layout === "fullscreen" ? "" : element.content,
            };
          }
          return element;
        }),
      }),
    ));
    setSelectedId(layout === "fullscreen" ? "cover-image" : "cover-title");
    setEditingTextId(null);
  };

  const changeCoverMedia = (type: "image" | "motion", confirmed = false) => {
    if (!isResearch || book.coverLayout !== "fullscreen") return;
    const current = book.cover.elements.find((element) => element.id === "cover-motion" && element.hidden !== true) ? "motion" : "image";
    if (current === type) return;
    if (!confirmed) {
      setPendingCoverChange({ kind: "media", value: type });
      return;
    }
    setBook((previous) => ({ ...previous, cover: {
      ...previous.cover,
      elements: previous.cover.elements.map((element) => element.id === "cover-image" && element.type === "image"
        ? { ...element, ...COVER_FULLSCREEN_MEDIA, hidden: type !== "image", src: type === "image" ? element.src : "" }
        : element.id === "cover-motion" && element.type === "motion" ? { ...element, ...COVER_FULLSCREEN_MEDIA, hidden: type !== "motion", src: type === "motion" ? element.src : null } : element),
      requirements: previous.cover.requirements.map((item) => item.type === type ? item : item.type === "image" || item.type === "motion" ? {
        ...item,
        brief: { html: "", text: "" },
        supplementalBrief: undefined,
        asset: null,
        status: "pending" as const,
        errorMessage: undefined,
      } : item),
    }}));
  };

  const selectView = (nextViewId: ViewId) => {
    const nextPage = getPage(book, nextViewId);
    const nextVisibleElement = nextPage?.elements.find((element) => element.hidden !== true) ?? nextPage?.elements[0];
    setViewId(nextViewId);
    setSelectedId(nextVisibleElement?.id ?? null);
    setSelectedRequirementId(nextPage?.requirements[0]?.id ?? null);
    setEditingTextId(null);
    setCanvasRequirementModes(getDefaultCanvasRequirementModes(nextPage));
    setPendingDelete(null);
    setPendingPageDelete(null);
    setPendingAnnotationDelete(null);
    setSelectedAnnotationId(null);
    setTextSelection(null);
    setShowBasicInfo(false);
    const defaultText = nextPage?.elements.find((element): element is TextElement => element.type === "text");
    setPanelTab(getDefaultPanelTab(role));
    if (role === "research" && nextPage?.kind === "page" && defaultText && defaultText.content.length > 0) {
      setSelectedId(defaultText.id);
      setEditingTextId(defaultText.id);
      setTextSelection({ elementId: defaultText.id, start: 0, end: Math.min(4, defaultText.content.length) });
    }
  };

  const selectRole = (nextRole: UserRole) => {
    setRole(nextRole);
    setPanelTab(getDefaultPanelTab(nextRole));
    setEditingTextId(null);
    setCanvasRequirementModes(getDefaultCanvasRequirementModes(currentPage));
    setPendingDelete(null);
    setPendingPageDelete(null);
    setPendingAnnotationDelete(null);
    setSelectedAnnotationId(null);
    setTextSelection(null);
    setShowBasicInfo(false);
    if (nextRole === "research") {
      const defaultText = currentPage?.elements.find((element): element is TextElement => element.type === "text");
      if (currentPage?.kind === "page" && defaultText && defaultText.content.length > 0) {
        setSelectedId(defaultText.id);
        setEditingTextId(defaultText.id);
        setTextSelection({ elementId: defaultText.id, start: 0, end: Math.min(4, defaultText.content.length) });
      }
    }
    if (nextRole === "production") setSelectedRequirementId(currentPage?.requirements[0]?.id ?? null);
  };

  const modifyCurrentPage = (updater: (page: AnimationBookPage) => AnimationBookPage) => {
    setBook((previous) => updatePage(previous, viewId, updater));
  };

  const setCanvasRequirementMode = (requirementId: string, mode: CanvasRequirementMode | null) => {
    setCanvasRequirementModes((current) => {
      const next = { ...current };
      if (mode === null) {
        delete next[requirementId];
        return next;
      }
      if (mode === "editing") {
        Object.keys(next).forEach((id) => {
          if (id !== requirementId && next[id] === "editing") next[id] = "preview";
        });
      }
      next[requirementId] = mode;
      return next;
    });
  };

  const finishActiveCanvasRequirementEdit = () => {
    const editingRequirementId = Object.entries(canvasRequirementModes)
      .find(([, mode]) => mode === "editing")?.[0];
    if (editingRequirementId) setCanvasRequirementMode(editingRequirementId, "preview");
  };

  useEffect(() => {
    if (!Object.values(canvasRequirementModes).includes("editing")) return undefined;
    const handleDocumentPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest(".ab-canvas-requirement.is-editing")) return;
      setCanvasRequirementModes((current) => {
        const editingRequirementId = Object.entries(current)
          .find(([, mode]) => mode === "editing")?.[0];
        if (!editingRequirementId) return current;
        return { ...current, [editingRequirementId]: "preview" };
      });
    };
    document.addEventListener("pointerdown", handleDocumentPointerDown);
    return () => document.removeEventListener("pointerdown", handleDocumentPointerDown);
  }, [canvasRequirementModes]);

  const selectElement = (elementId: string) => {
    finishActiveCanvasRequirementEdit();
    setSelectedId(elementId);
    const nextElement = currentPage?.elements.find((element) => element.id === elementId);
    if ((nextElement?.type === "question" || nextElement?.type === "interaction")) setPanelTab("question");
    if (nextElement?.type !== "text") {
      setTextSelection(null);
      setSelectedAnnotationId(null);
    }
  };

  const toggleElementRequirement = (element: BookElement) => {
    if (element.type !== "image" && element.type !== "motion") return;
    const currentRequirement = getVisualRequirement(currentPage, element);
    const requirement = currentRequirement ?? createVisualRequirement(element);
    if (!currentRequirement) {
      modifyCurrentPage((page) => ({
        ...page,
        requirements: [...page.requirements, requirement],
      }));
    }
    setSelectedId(element.id);
    setSelectedRequirementId(requirement.id);
    const currentMode = canvasRequirementModes[requirement.id];
    setCanvasRequirementMode(requirement.id, currentMode ? null : "preview");
  };

  const openElementRequirementPanel = (element: BookElement) => {
    if (element.type !== "image" && element.type !== "motion") return;
    const currentRequirement = getVisualRequirement(currentPage, element);
    const requirement = currentRequirement ?? createVisualRequirement(element);
    if (!currentRequirement) {
      modifyCurrentPage((page) => ({
        ...page,
        requirements: [...page.requirements, requirement],
      }));
    }
    setSelectedId(element.id);
    setSelectedRequirementId(requirement.id);
    setPanelTab("requirements");
  };

  const updateCanvasRequirement = (requirementId: string, brief: ProductionRequirement["brief"]) => {
    if (!isResearch) return;
    modifyCurrentPage((page) => ({
      ...page,
      requirements: page.requirements.map((requirement) =>
        requirement.id === requirementId ? { ...requirement, brief } : requirement,
      ),
    }));
  };

  const finishCanvasRequirementEdit = (requirementId: string) => {
    setCanvasRequirementMode(requirementId, "preview");
  };

  const updateElementById = (elementId: string, patch: Partial<BookElement>) => {
    if (!isResearch) return;
    const contentPatch = (patch as Partial<TextElement>).content;
    if (currentPage.kind === "cover") {
      const element = currentPage.elements.find((candidate) => candidate.id === elementId);
      if (element?.type !== "text" || !element.coverField || Object.keys(patch).some((key) => key !== "content")) return;
    }
    modifyCurrentPage((page) =>
      replaceElement(page, elementId, (element) => {
        if (page.kind === "cover") {
          return element.type === "text" && element.coverField && typeof contentPatch === "string"
            ? { ...element, content: contentPatch }
            : element;
        }
        return { ...element, ...patch } as BookElement;
      }),
    );
  };

  const updateQuestion = (
    elementId: string,
    patch: Partial<Pick<QuestionElement, "stem" | "optionMode">>,
  ) => {
    if (!isResearch) return;
    modifyCurrentPage((page) => replaceElement(page, elementId, (element) =>
      element.type === "question" ? { ...element, ...patch } : element,
    ));
  };

  const updateQuestionOption = (
    elementId: string,
    optionId: string,
    patch: Partial<Pick<QuestionOption, "content" | "isCorrect">>,
  ) => {
    if (!isResearch) return;
    modifyCurrentPage((page) => replaceElement(page, elementId, (element) =>
      element.type === "question"
        ? {
            ...element,
            options: element.options.map((option) => option.id === optionId ? { ...option, ...patch } : option),
          }
        : element,
    ));
  };

  const addQuestionOption = (elementId: string) => {
    if (!isResearch) return;
    modifyCurrentPage((page) => replaceElement(page, elementId, (element) => {
      if (element.type !== "question" || element.options.length >= QUESTION_MAX_OPTIONS) return element;
      return {
        ...element,
        options: [...element.options, { id: createId("question-option"), content: "", isCorrect: false }],
      };
    }));
  };

  const removeQuestionOption = (elementId: string, optionId: string) => {
    if (!isResearch) return;
    modifyCurrentPage((page) => replaceElement(page, elementId, (element) => {
      if (element.type !== "question" || element.options.length <= QUESTION_MIN_OPTIONS) return element;
      return {
        ...element,
        options: element.options.filter((option) => option.id !== optionId),
      };
    }));
  };

  const updateTextContent = (elementId: string, content: string) => {
    if (!isResearch) return;
    modifyCurrentPage((page) => replaceElement(page, elementId, (element) => {
      if (element.type !== "text") return element;
      if (page.kind === "cover") {
        return element.coverField ? { ...element, content } : element;
      }
      return {
        ...element,
        content,
        annotations: normalizeAnnotations(content, element.annotations),
      };
    }));
  };

  const updateVoiceSupplement = (elementId: string, voiceSupplement: string) => {
    if (!isResearch || currentPage.kind === "cover") return;
    modifyCurrentPage((page) => replaceElement(page, elementId, (element) => {
      if (element.type !== "text" && element.type !== "bubble") return element;
      return { ...element, voiceSupplement };
    }));
  };

  const updateAnnotation = (annotationId: string, patch: Partial<TextAnnotation>) => {
    if (!isResearch || currentPage.kind === "cover") return;
    modifyCurrentPage((page) => ({
      ...page,
      elements: page.elements.map((element) => {
        if (element.type !== "text") return element;
        return {
          ...element,
          annotations: element.annotations.map((annotation) =>
            annotation.id === annotationId ? { ...annotation, ...patch } : annotation,
          ),
        };
      }),
    }));
  };

  const handleTextSelection = (elementId: string, selectionRange: TextSelectionRange | null) => {
    if (!isResearch || currentPage.kind === "cover") return;
    if (!selectionRange || selectionRange.start === selectionRange.end) {
      setTextSelection(null);
      return;
    }
    setSelectedId(elementId);
    setEditingTextId(elementId);
    setTextSelection({ elementId, ...selectionRange });
    setPanelTab("voice");
  };

  const addTextAnnotation = (type: TextAnnotationType) => {
    if (!isResearch || currentPage.kind === "cover" || !textSelection) return;
    const element = currentPage?.elements.find((candidate) => candidate.id === textSelection.elementId);
    if (!element || element.type !== "text") return;
    const annotation = createAnnotation(
      createId(`annotation-${type}`),
      type,
      textSelection,
      element.content,
    );
    modifyCurrentPage((page) => replaceElement(page, element.id, (candidate) => {
      if (candidate.type !== "text") return candidate;
      return { ...candidate, annotations: [...candidate.annotations, annotation] };
    }));
    setSelectedAnnotationId(annotation.id);
    setPanelTab(type);
    setEditingTextId(null);
    setTextSelection(null);
    notify(`已添加${ANNOTATION_LABELS[type]}`);
  };

  const selectAnnotation = (annotationId: string) => {
    const annotation = currentAnnotations.find((candidate) => candidate.id === annotationId);
    if (!annotation) return;
    setSelectedAnnotationId(annotation.id);
    setSelectedId(annotation.elementId);
    setPanelTab(annotation.type);
  };

  const selectAnnotationTab = (tab: AnnotationPanelTab) => {
    setPanelTab(tab);
    if (tab === "question") {
      if (currentQuestion) selectElement(currentQuestion.id);
      setEditingTextId(null);
      setTextSelection(null);
      setSelectedAnnotationId(null);
      return;
    }
    if (tab === "voice" || tab === "standard" || tab === "playback") return;
    const firstAnnotation = currentAnnotations.find((annotation) => annotation.type === tab);
    setSelectedAnnotationId(firstAnnotation?.id ?? null);
  };

  const removeAnnotation = (annotationId: string) => {
    if (!isResearch || currentPage.kind === "cover") return;
    modifyCurrentPage((page) => ({
      ...page,
      elements: page.elements.map((element) => element.type === "text"
        ? { ...element, annotations: element.annotations.filter((annotation) => annotation.id !== annotationId) }
        : element),
    }));
    setPendingAnnotationDelete(null);
    if (selectedAnnotationId === annotationId) {
      setSelectedAnnotationId(null);
      setPanelTab("voice");
    }
    notify("标注已删除");
  };

  const requestRemoveAnnotation = (annotationId: string) => {
    if (!isResearch || currentPage.kind === "cover") return;
    const annotation = currentAnnotations.find((candidate) => candidate.id === annotationId);
    if (!annotation) return;
    if (hasAnnotationContent(annotation)) {
      setPendingAnnotationDelete({ id: annotation.id, text: annotation.text, type: annotation.type });
      return;
    }
    removeAnnotation(annotationId);
  };

  const quickFillAnnotationVoice = (annotationId: string) => {
    const annotation = currentAnnotations.find((candidate) => candidate.id === annotationId);
    if (annotation) updateAnnotation(annotationId, { voiceRequest: annotation.text });
  };

  const updateElementGeometry = (elementId: string, patch: ElementGeometryPatch) => {
    const element = currentPage?.elements.find((candidate) => candidate.id === elementId);
    if (!element || currentPage.kind === "cover" || (element.type === "question" || element.type === "interaction") || (!isResearch && !["image", "motion", "bubble", "text"].includes(element.type))) return;
    modifyCurrentPage((page) =>
      replaceElement(page, elementId, (candidate) => ({ ...candidate, ...patch } as BookElement)),
    );
  };

  const addElement = (element: BookElement) => {
    if (!isResearch || currentPage.kind === "cover") return;
    const elementToAdd = { ...element, hidden: element.hidden === true };
    const visualRequirement = elementToAdd.type === "image" || elementToAdd.type === "motion"
      ? createVisualRequirement(elementToAdd)
      : null;
    modifyCurrentPage((page) => ({
      ...page,
      elements: [...page.elements, elementToAdd],
      appearanceOrder: [...page.appearanceOrder, elementToAdd.id],
      requirements: visualRequirement
        ? [...page.requirements, visualRequirement]
        : page.requirements,
      playbackOrder: page.kind === "page" && participatesInPlayback(elementToAdd)
        ? [...normalizePlaybackOrder(page), {
            elementId: elementToAdd.id,
            displayMode: "always" as const,
          }]
        : page.playbackOrder,
    }));
    setSelectedId(elementToAdd.id);
    setEditingTextId(elementToAdd.type === "text" ? elementToAdd.id : null);
    if (visualRequirement) {
      setSelectedRequirementId(visualRequirement.id);
      setCanvasRequirementMode(visualRequirement.id, "preview");
    }
    setSelectedAnnotationId(null);
    setTextSelection(null);
    if (elementToAdd.type === "text" || elementToAdd.type === "bubble") setPanelTab("voice");
    if ((elementToAdd.type === "question" || elementToAdd.type === "interaction")) setPanelTab("question");
  };

  const addText = () => {
    addElement({
      id: createId("text"),
      type: "text",
      x: 710,
      y: 230,
      width: 640,
      height: 220,
      zIndex: Math.max(0, ...currentPage.elements.map((element) => element.zIndex)) + 1,
      content: "",
      fontSize: 48,
      color: "#404040",
      fontWeight: "regular",
      audioUrl: null,
      voiceSupplement: "",
      annotations: [],
    });
  };

  const addBubble = () => {
    addElement({
      id: createId("bubble"),
      type: "bubble",
      x: 820,
      y: 620,
      zIndex: Math.max(0, ...currentPage.elements.map((element) => element.zIndex)) + 1,
      content: "",
      ...BUBBLE_DEFAULT_GEOMETRY,
      audioUrl: null,
      voiceSupplement: "",
    });
  };

  const addImagePlaceholder = () => {
    addElement({
      id: createId("image"),
      type: "image",
      x: 700,
      y: 170,
      width: 720,
      height: 560,
      zIndex: Math.max(0, ...currentPage.elements.map((element) => element.zIndex)) + 1,
      src: "",
      alt: "待制作图片",
      objectFit: "contain",
    });
  };

  const addMotion = () => {
    if (currentPage.elements.some((element) => element.type === "motion")) {
      notify("每页最多添加一个动效占位");
      return;
    }
    addElement({
      id: createId("motion"),
      type: "motion",
      x: 720,
      y: 180,
      width: 620,
      height: 360,
      zIndex: Math.max(0, ...currentPage.elements.map((element) => element.zIndex)) + 1,
      src: null,
      fileName: "待上传动效",
      objectFit: "contain",
    });
  };

  const addQuestion = () => {
    if (!isResearch || currentPage.kind !== "page") return;
    if (currentQuestion?.type === "interaction") return;
    if (currentQuestion) {
      selectElement(currentQuestion.id);
      setPanelTab("question");
      return;
    }
    const question: QuestionElement = {
      id: createId("question"),
      type: "question",
      x: QUESTION_CANVAS_X,
      y: QUESTION_CANVAS_Y,
      width: QUESTION_CANVAS_WIDTH,
      height: QUESTION_CANVAS_HEIGHT,
      zIndex: Math.max(0, ...currentPage.elements.map((element) => element.zIndex)) + 1,
      hidden: false,
      stem: "",
      optionMode: "text",
      options: Array.from({ length: 4 }, (_, index) => ({
        id: createId(`question-option-${String.fromCharCode(65 + index)}`),
        content: "",
        isCorrect: false,
      })),
    };
    addElement(question);
    setPanelTab("question");
  };

  const addInteraction = () => {
    if (!isResearch || currentPage.kind !== "page" || hasQuestion) return;
    if (currentQuestion) { selectElement(currentQuestion.id); setPanelTab("question"); return; }
    addElement({
      id: createId("interaction"), type: "interaction", title: "",
      x: 1044, y: 197.7235107421875, width: 540, height: 380,
      zIndex: Math.max(0, ...currentPage.elements.map((element) => element.zIndex)) + 1,
      audioUrl: null, voiceSupplement: "",
      options: [
        { id: createId("vote-option"), content: "", proportion: "large" },
        { id: createId("vote-option"), content: "", proportion: "small" },
      ],
    });
  };

  const updateInteraction = (elementId: string, patch: Partial<InteractionDraft>) => {
    if (!isResearch) return;
    const element = currentPage.elements.find((item) => item.id === elementId);
    if (element?.type !== "interaction") return;
    if (!interactionBaselines.current.has(elementId)) {
      interactionBaselines.current.set(elementId, structuredClone({ title: element.title, options: element.options, voiceSupplement: element.voiceSupplement }));
    }
    const title = Array.from(patch.title ?? element.title).slice(0, 18).join("");
    const options = (patch.options ?? element.options).map((option) => ({ ...option, content: Array.from(option.content).slice(0, 9).join("") })) as InteractionElement["options"];
    modifyCurrentPage((page) => replaceElement(page, elementId, (item) => item.type === "interaction"
      ? { ...item, ...patch, title, options, height: Array.from(title).length > 10 ? 440 : 380 } : item));
  };

  const cancelInteraction = (elementId: string) => {
    if (!isResearch) return;
    const baseline = interactionBaselines.current.get(elementId);
    if (!baseline) return;
    modifyCurrentPage((page) => replaceElement(page, elementId, (item) => item.type === "interaction"
      ? { ...item, ...structuredClone(baseline), height: Array.from(baseline.title).length > 10 ? 440 : 380 } : item));
    interactionBaselines.current.delete(elementId);
    notify("已取消互动修改");
  };

  const saveInteraction = (elementId: string) => {
    if (!isResearch) return;
    const element = currentPage.elements.find((item) => item.id === elementId);
    if (element?.type !== "interaction") return;
    if (!element.title.trim() || element.options.some((option) => !option.content.trim())) {
      notify("请填写投票标题和两个选项"); return;
    }
    interactionBaselines.current.delete(elementId);
    notify("互动已保存");
  };

  const updateRequirement = (requirementId: string, patch: Partial<ProductionRequirement>) => {
    if (!isResearch) return;
    modifyCurrentPage((page) => ({
      ...page,
      requirements: page.requirements.map((requirement) =>
        requirement.id === requirementId ? { ...requirement, ...patch } : requirement,
      ),
    }));
  };

  const addRequirement = (type: RequirementType) => {
    if (!isResearch) return;
    const id = createId(`${type}-requirement`);
    const requirement: ProductionRequirement = {
      id,
      type,
      title: type === "image" ? "图片制作需求" : type === "motion" ? "动效制作需求" : "音频制作需求",
      brief: { html: "<p>请填写制作要求。</p>", text: "请填写制作要求。" },
      target: null,
      asset: null,
      status: "pending",
    };
    modifyCurrentPage((page) => ({ ...page, requirements: [...page.requirements, requirement] }));
    setSelectedRequirementId(id);
    setPanelTab("requirements");
  };

  const deleteRequirement = (requirementId: string) => {
    if (!isResearch) return;
    modifyCurrentPage((page) => ({
      ...page,
      requirements: page.requirements.filter((requirement) => requirement.id !== requirementId),
    }));
    setSelectedRequirementId(null);
  };

  const updateRequirementTargetAsset = (
    page: AnimationBookPage,
    requirement: ProductionRequirement,
    asset: ProductionAsset,
  ): AnimationBookPage => {
    let nextPage = {
      ...page,
      requirements: page.requirements.map((candidate) =>
        candidate.id === requirement.id
          ? { ...candidate, asset, status: "uploaded" as const, errorMessage: undefined }
          : candidate,
      ),
    };
    if (!requirement.target) return nextPage;
    const targetElementId = requirement.target.elementId;
    nextPage = {
      ...nextPage,
      elements: nextPage.elements.map((element) => {
        if (element.id !== targetElementId) return element;
        if (requirement.type === "image" && element.type === "image") {
          return { ...element, src: asset.url, alt: asset.fileName };
        }
        if (requirement.type === "motion" && element.type === "motion") {
          return { ...element, src: asset.url, fileName: asset.fileName };
        }
        if (requirement.type === "audio" && (element.type === "text" || element.type === "bubble")) {
          return { ...element, audioUrl: asset.url };
        }
        return element;
      }),
    };
    return nextPage;
  };

  const handleRequirementUpload = (requirementId: string, file: File) => {
    if (isResearch) {
      notify("请切换到制作人员上传产物");
      return;
    }
    const requirement = currentPage.requirements.find((candidate) => candidate.id === requirementId);
    if (!requirement) return;
    const isValid = requirement.type === "image"
      ? file.type.startsWith("image/")
      : requirement.type === "motion"
        ? file.type.startsWith("image/") || file.type.startsWith("video/")
        : file.type.startsWith("audio/");
    if (!isValid) {
      modifyCurrentPage((page) => ({
        ...page,
        requirements: page.requirements.map((candidate) => candidate.id === requirementId ? { ...candidate, status: "failed", errorMessage: `文件类型不匹配，请上传${requirement.type === "audio" ? "音频" : requirement.type === "motion" ? "动效" : "图片"}文件` } : candidate),
      }));
      notify("文件类型不匹配，未覆盖原有产物");
      return;
    }
    readFileAsDataUrl(file, (url) => {
      const asset: ProductionAsset = {
        url,
        fileName: file.name,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
      };
      modifyCurrentPage((page) => {
        const currentRequirement = page.requirements.find((candidate) => candidate.id === requirementId);
        return currentRequirement ? updateRequirementTargetAsset(page, currentRequirement, asset) : page;
      });
      setCanvasRequirementMode(requirementId, null);
      notify("产物已上传");
    }, () => {
      modifyCurrentPage((page) => ({
        ...page,
        requirements: page.requirements.map((candidate) => candidate.id === requirementId ? { ...candidate, status: "failed", errorMessage: "文件读取失败，请重试" } : candidate),
      }));
      notify("文件读取失败，请重试");
    });
  };

  const requestImageUpload = (elementId: string) => {
    if (isResearch) return;
    setSelectedId(elementId);
    setImageUploadTargetId(elementId);
    if (imageUploadInputRef.current) {
      imageUploadInputRef.current.value = "";
      imageUploadInputRef.current.click();
    }
  };

  const requestCoverMediaUpload = (elementId: string) => {
    if (isResearch) return;
    const element = currentPage?.elements.find(
      (candidate): candidate is ImageElement | MotionElement =>
        candidate.id === elementId && (candidate.type === "image" || candidate.type === "motion"),
    );
    if (!element) return;
    setSelectedId(elementId);
    setCoverMediaUploadTargetId(elementId);
    setCoverMediaUploadAccept(element.type === "image" ? "image/*" : "image/*,video/*");
    if (coverMediaUploadInputRef.current) {
      coverMediaUploadInputRef.current.value = "";
      coverMediaUploadInputRef.current.click();
    }
  };

  const handleImageUploadChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const elementId = imageUploadTargetId;
    setImageUploadTargetId(null);
    if (!file || !elementId) return;
    const imageElement = currentPage?.elements.find(
      (element): element is ImageElement => element.id === elementId && element.type === "image",
    );
    const requirement = imageElement ? getVisualRequirement(currentPage, imageElement) : undefined;
    if (!requirement) {
      notify("当前图片框暂未绑定图片需求");
      return;
    }
    handleRequirementUpload(requirement.id, file);
  };

  const handleCoverMediaUploadChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const elementId = coverMediaUploadTargetId;
    setCoverMediaUploadTargetId(null);
    if (!file || !elementId) return;
    const mediaElement = currentPage?.elements.find(
      (element): element is ImageElement | MotionElement =>
        element.id === elementId && (element.type === "image" || element.type === "motion"),
    );
    const requirement = mediaElement ? getVisualRequirement(currentPage, mediaElement) : undefined;
    if (!requirement) {
      notify("当前封面媒体暂未绑定对应需求");
      return;
    }
    handleRequirementUpload(requirement.id, file);
  };

  const clearImageAsset = (elementId: string) => {
    if (isResearch) return;
    const imageElement = currentPage?.elements.find(
      (element): element is ImageElement => element.id === elementId && element.type === "image",
    );
    const requirementId = imageElement ? getVisualRequirement(currentPage, imageElement)?.id ?? null : null;
    modifyCurrentPage((page) => {
      const imageElement = page.elements.find(
        (element): element is ImageElement => element.id === elementId && element.type === "image",
      );
      if (!imageElement) return page;
      const requirement = getVisualRequirement(page, imageElement);
      return {
        ...page,
        elements: page.elements.map((element) =>
          element.id === elementId && element.type === "image"
            ? { ...element, src: "" }
            : element,
        ),
        requirements: requirement
          ? page.requirements.map((candidate) => candidate.id === requirement.id
            ? { ...candidate, asset: null, status: "pending" as const, errorMessage: undefined }
            : candidate)
          : page.requirements,
      };
    });
    if (requirementId) setCanvasRequirementMode(requirementId, "preview");
    setSelectedId(elementId);
    notify("图片已删除，可重新上传");
  };

  const clearMotionAsset = (elementId: string) => {
    if (isResearch) return;
    const motionElement = currentPage?.elements.find(
      (element): element is MotionElement => element.id === elementId && element.type === "motion",
    );
    const requirementId = motionElement ? getVisualRequirement(currentPage, motionElement)?.id ?? null : null;
    modifyCurrentPage((page) => {
      const motionElement = page.elements.find(
        (element): element is MotionElement => element.id === elementId && element.type === "motion",
      );
      if (!motionElement) return page;
      const requirement = getVisualRequirement(page, motionElement);
      return {
        ...page,
        elements: page.elements.map((element) =>
          element.id === elementId && element.type === "motion"
            ? { ...element, src: null, fileName: "待上传动效" }
            : element,
        ),
        requirements: requirement
          ? page.requirements.map((candidate) => candidate.id === requirement.id
            ? { ...candidate, asset: null, status: "pending" as const, errorMessage: undefined }
            : candidate)
        : page.requirements,
      };
    });
    if (requirementId) setCanvasRequirementMode(requirementId, "preview");
    setSelectedId(elementId);
    notify("动效已删除，可重新上传");
  };

  const removeElement = (elementId: string) => {
    if (!isResearch || currentPage.kind === "cover") return;
    const removedElement = currentPage?.elements.find((element) => element.id === elementId);
    const removedRequirementId = currentPage?.requirements.find(
      (requirement) => requirement.target?.kind === "element" && requirement.target.elementId === elementId,
    )?.id;
    modifyCurrentPage((page) => ({
      ...page,
      elements: page.elements.filter((element) => element.id !== elementId),
      appearanceOrder: page.appearanceOrder.filter((id) => id !== elementId),
      playbackOrder: normalizePlaybackOrder(page).filter((item) => item.elementId !== elementId),
      requirements: page.requirements.filter(
        (requirement) => requirement.target?.kind !== "element" || requirement.target.elementId !== elementId,
      ),
    }));
    setSelectedId(null);
    setEditingTextId(null);
    if (removedRequirementId) setCanvasRequirementMode(removedRequirementId, null);
    setSelectedAnnotationId(null);
    setTextSelection(null);
    setPendingDelete(null);
    if (removedElement?.type === "interaction") interactionBaselines.current.delete(elementId);
    if ((removedElement?.type === "question" || removedElement?.type === "interaction")) setPanelTab("voice");
  };

  const requestRemoveElement = (elementId: string) => {
    if (!isResearch || currentPage.kind === "cover") return;
    const element = currentPage?.elements.find((candidate) => candidate.id === elementId);
    if (!element) return;
    if (needsDeleteConfirmation(element)) {
      setPendingDelete({
        id: element.id,
        type: element.type,
        name: elementName(element),
      });
      return;
    }
    removeElement(elementId);
  };

  const confirmRemoveElement = () => {
    if (pendingDelete) removeElement(pendingDelete.id);
  };

  const addPage = () => {
    if (!isResearch) return;
    const id = createId("page");
    const newPage: AnimationBookPage = {
      id,
      label: `正文 ${book.pages.length + 1}`,
      kind: "page",
      backgroundColor: "#fefcf8",
      elements: [],
      appearanceOrder: [],
      playbackOrder: [],
      requirements: [],
    };
    newPage.appearanceOrder = newPage.elements.map((element) => element.id);
    newPage.playbackOrder = createPlaybackOrder(newPage.elements);
    setBook((previous) => ({ ...previous, pages: [...previous.pages, newPage] }));
    setViewId(id);
    setPanelTab(getDefaultPanelTab(role));
    setSelectedAnnotationId(null);
    setTextSelection(null);
    setSelectedId(null);
    setSelectedRequirementId(null);
    setCanvasRequirementModes({});
    setEditingTextId(null);
    notify("已添加新页面");
  };

  const deletePage = (pageId: string) => {
    if (!isResearch) return;
    if (book.pages.length <= 1) {
      notify("至少保留一个正文页面");
      return;
    }
    const index = book.pages.findIndex((page) => page.id === pageId);
    if (index < 0) return;
    const nextPage = book.pages[index + 1] ?? book.pages[index - 1];
    const isCurrentPage = viewId === pageId;
    setBook((previous) => ({
      ...previous,
      pages: previous.pages
        .filter((page) => page.id !== pageId)
        .map((page, pageIndex) => ({ ...page, label: `正文 ${pageIndex + 1}` })),
    }));
    if (isCurrentPage) {
      setPanelTab(getDefaultPanelTab(role));
      setViewId(nextPage?.id ?? "cover");
      setSelectedId(nextPage?.elements[0]?.id ?? null);
      setSelectedRequirementId(nextPage?.requirements[0]?.id ?? null);
      setCanvasRequirementModes(getDefaultCanvasRequirementModes(nextPage));
      setEditingTextId(null);
      setSelectedAnnotationId(null);
      setTextSelection(null);
    }
    setPendingPageDelete(null);
    notify("页面已删除");
  };

  const requestDeletePage = (pageId: string) => {
    if (!isResearch) return;
    if (book.pages.length <= 1) {
      notify("至少保留一个正文页面");
      return;
    }
    const page = book.pages.find((candidate) => candidate.id === pageId);
    if (page) setPendingPageDelete({ id: page.id, label: page.label });
  };

  const confirmDeletePage = () => {
    if (pendingPageDelete) deletePage(pendingPageDelete.id);
  };

  const reorderPages = (fromId: string, toId: string, position: PageDropPosition = "before") => {
    if (!isResearch) return;
    if (fromId === toId) return;
    setBook((previous) => {
      const fromIndex = previous.pages.findIndex((page) => page.id === fromId);
      const toIndex = previous.pages.findIndex((page) => page.id === toId);
      if (fromIndex < 0 || toIndex < 0) return previous;
      const pages = [...previous.pages];
      const [moved] = pages.splice(fromIndex, 1);
      const insertionIndex = fromIndex < toIndex
        ? toIndex + (position === "after" ? 0 : -1)
        : toIndex + (position === "after" ? 1 : 0);
      pages.splice(clamp(insertionIndex, 0, pages.length), 0, moved);
      return {
        ...previous,
        pages: pages.map((page, index) => ({ ...page, label: `正文 ${index + 1}` })),
      };
    });
  };

  const handlePageDragStart = (event: React.DragEvent<HTMLButtonElement>, pageId: string) => {
    if (!isResearch) {
      event.preventDefault();
      return;
    }
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", pageId);
    setDraggedPageId(pageId);
    setDropTarget(null);
  };

  const handlePageDragOver = (event: React.DragEvent<HTMLDivElement>, pageId: string) => {
    if (!isResearch || !draggedPageId || draggedPageId === pageId) {
      setDropTarget(null);
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const overRect = event.currentTarget.getBoundingClientRect();
    const position: PageDropPosition = event.clientY > overRect.top + overRect.height / 2
      ? "after"
      : "before";
    setDropTarget({ id: pageId, position });
  };

  const resetPageDrag = () => {
    setDraggedPageId(null);
    setDropTarget(null);
  };

  const handlePageDrop = (event: React.DragEvent<HTMLDivElement>, pageId: string) => {
    event.preventDefault();
    if (isResearch && draggedPageId && draggedPageId !== pageId) {
      const position = dropTarget?.id === pageId ? dropTarget.position : "before";
      reorderPages(draggedPageId, pageId, position);
    }
    resetPageDrag();
  };

  const beginPointerDrag = (
    event: ReactPointerEvent<HTMLElement>,
    element: BookElement,
    mode: "move" | "resize" | "tail",
    corner?: ResizeCorner,
  ) => {
    event.stopPropagation();
    if (currentPage?.kind === "cover") {
      setSelectedId(element.id);
      return;
    }
    if ((mode === "tail" && element.type !== "bubble") || (!isResearch && !["image", "motion", "bubble", "text"].includes(element.type))) {
      setSelectedId(element.id);
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    setAutoHeightElementId(
      mode === "resize" && (element.type === "text" || element.type === "bubble") && (corner === "middle-left" || corner === "middle-right")
        ? element.id
        : null,
    );
    pointerDragRef.current = {
      id: element.id,
      mode,
      corner,
      pointerX: event.clientX,
      pointerY: event.clientY,
      origin: {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
      },
    };
    setSelectedId(element.id);
  };

  const handleCanvasPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = pointerDragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const deltaX = (event.clientX - drag.pointerX) * scaleX;
    const deltaY = (event.clientY - drag.pointerY) * scaleY;
    const draggedElement = currentPage?.elements.find((element) => element.id === drag.id);
    if (drag.mode === "tail" && draggedElement?.type === "bubble") {
      const pointerX = (event.clientX - rect.left) * scaleX;
      const pointerY = (event.clientY - rect.top) * scaleY;
      const centerX = draggedElement.x + draggedElement.width / 2;
      const centerY = draggedElement.y + draggedElement.height / 2;
      const tailAngle = normalizeAngle(Math.atan2(pointerY - centerY, pointerX - centerX) * (180 / Math.PI));
      updateElementGeometry(drag.id, { tailAngle });
      return;
    }
    const minWidth = draggedElement?.type === "bubble" ? BUBBLE_MIN_WIDTH : 80;
    const minHeight = 54;
    const next = {
      x: drag.origin.x,
      y: drag.origin.y,
      width: drag.origin.width,
      height: drag.origin.height,
    };

    if (drag.mode === "move") {
      next.x = clamp(drag.origin.x + deltaX, 0, CANVAS_WIDTH - drag.origin.width);
      next.y = clamp(drag.origin.y + deltaY, 0, CANVAS_HEIGHT - drag.origin.height);
    } else if (drag.corner) {
      if (draggedElement?.type === "bubble") {
        const right = drag.origin.x + drag.origin.width;
        const naturalWidth = draggedElement.content.trim()
          ? (bubbleNaturalWidthRef.current[draggedElement.id] ?? Number.POSITIVE_INFINITY)
          : Number.POSITIVE_INFINITY;
        if (drag.corner === "middle-left") {
          const maxWidth = Math.min(naturalWidth, right);
          const safeMinWidth = Math.min(minWidth, maxWidth);
          next.width = clamp(drag.origin.width - deltaX, safeMinWidth, maxWidth);
          next.x = right - next.width;
        } else {
          const maxWidth = Math.min(naturalWidth, CANVAS_WIDTH - drag.origin.x);
          const safeMinWidth = Math.min(minWidth, maxWidth);
          next.width = clamp(drag.origin.width + deltaX, safeMinWidth, maxWidth);
        }
        next.height = drag.origin.height;
      } else {
        const fromLeft = drag.corner.includes("left");
        const fromTop = drag.corner.includes("top");
        const isHorizontalResize = drag.corner === "middle-left" || drag.corner === "middle-right";
        const right = drag.origin.x + drag.origin.width;
        const bottom = drag.origin.y + drag.origin.height;
        if (fromLeft) {
          next.x = clamp(drag.origin.x + deltaX, 0, right - minWidth);
          next.width = right - next.x;
        } else {
          next.width = clamp(drag.origin.width + deltaX, minWidth, CANVAS_WIDTH - drag.origin.x);
        }
        if (!isHorizontalResize) {
          if (fromTop) {
            next.y = clamp(drag.origin.y + deltaY, 0, bottom - minHeight);
            next.height = bottom - next.y;
          } else {
            next.height = clamp(drag.origin.height + deltaY, minHeight, CANVAS_HEIGHT - drag.origin.y);
          }
        }
      }
    }
    const geometryPatch: ElementGeometryPatch = next;
    if (draggedElement?.type === "bubble" && drag.mode === "resize") geometryPatch.widthMode = "manual";
    updateElementGeometry(drag.id, geometryPatch);
  };

  const endPointerDrag = () => {
    pointerDragRef.current = null;
    setAutoHeightElementId(null);
  };

  const applyLayerOrder = (page: AnimationBookPage, ordered: BookElement[]) => {
    const zIndexById = new Map(ordered.map((element, index) => [element.id, ordered.length - index]));
    return {
      ...page,
      elements: page.elements.map((element) => ({
        ...element,
        zIndex: zIndexById.get(element.id) ?? element.zIndex,
      })),
    };
  };

  const moveLayer = (elementId: string, direction: "up" | "down" | "top" | "bottom") => {
    if (!isResearch || currentPage.kind === "cover") return;
    modifyCurrentPage((page) => {
      const ordered = [...page.elements].sort((a, b) => b.zIndex - a.zIndex);
      const index = ordered.findIndex((element) => element.id === elementId);
      if (index < 0) return page;
      let targetIndex = index;
      if (direction === "up") targetIndex = Math.max(index - 1, 0);
      if (direction === "down") targetIndex = Math.min(index + 1, ordered.length - 1);
      if (direction === "top") targetIndex = 0;
      if (direction === "bottom") targetIndex = ordered.length - 1;
      if (targetIndex === index) return page;
      const [moved] = ordered.splice(index, 1);
      ordered.splice(targetIndex, 0, moved);
      return applyLayerOrder(page, ordered);
    });
  };

  const reorderLayer = (elementId: string, targetElementId: string, position: LayerDropPosition) => {
    if (!isResearch || currentPage.kind === "cover" || elementId === targetElementId) return;
    modifyCurrentPage((page) => {
      const ordered = [...page.elements].sort((a, b) => b.zIndex - a.zIndex);
      const sourceIndex = ordered.findIndex((element) => element.id === elementId);
      if (sourceIndex < 0) return page;
      const [moved] = ordered.splice(sourceIndex, 1);
      const targetIndex = ordered.findIndex((element) => element.id === targetElementId);
      if (targetIndex < 0) return page;
      const insertionIndex = targetIndex + (position === "after" ? 1 : 0);
      ordered.splice(clamp(insertionIndex, 0, ordered.length), 0, moved);
      return applyLayerOrder(page, ordered);
    });
  };

  const toggleElementVisibility = (elementId: string) => {
    if (!isResearch || currentPage.kind === "cover") return;
    const element = currentPage?.elements.find((candidate) => candidate.id === elementId);
    if (!element) return;
    const hidden = element.hidden !== true;
    const visualRequirement = element.type === "image" || element.type === "motion"
      ? getVisualRequirement(currentPage, element)
      : undefined;
    modifyCurrentPage((page) => replaceElement(page, elementId, (candidate) => ({ ...candidate, hidden })));
    if (hidden && selectedId === elementId) {
      setEditingTextId(null);
      if (visualRequirement) setCanvasRequirementMode(visualRequirement.id, null);
      setTextSelection(null);
    }
  };

  const updatePlaybackDisplayMode = (elementId: string, displayMode: PlaybackDisplayMode) => {
    if (!isResearch) return;
    modifyCurrentPage((page) => {
      const items = normalizePlaybackOrder(page);
      const index = items.findIndex((item) => item.elementId === elementId);
      if (index < 0 || items[index].displayMode === displayMode) return page;
      items[index] = { ...items[index], displayMode };
      return { ...page, playbackOrder: items };
    });
  };

  const movePlaybackOrderItem = (elementId: string, direction: -1 | 1) => {
    if (!isResearch) return;
    modifyCurrentPage((page) => {
      const items = normalizePlaybackOrder(page);
      const index = items.findIndex((item) => item.elementId === elementId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return page;
      [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
      return { ...page, playbackOrder: items };
    });
  };

  const reorderPlaybackOrder = (elementId: string, targetElementId: string, position: PlaybackDropPosition) => {
    if (!isResearch || elementId === targetElementId) return;
    modifyCurrentPage((page) => {
      const items = normalizePlaybackOrder(page);
      const sourceIndex = items.findIndex((item) => item.elementId === elementId);
      const targetIndex = items.findIndex((item) => item.elementId === targetElementId);
      if (sourceIndex < 0 || targetIndex < 0) return page;
      const [moved] = items.splice(sourceIndex, 1);
      const insertionIndex = items.findIndex((item) => item.elementId === targetElementId) + (position === "after" ? 1 : 0);
      items.splice(Math.max(0, insertionIndex), 0, moved);
      return { ...page, playbackOrder: items };
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
    if (event.key === "Escape") {
      const selectedVisualRequirement = selectedElement && (selectedElement.type === "image" || selectedElement.type === "motion")
        ? getVisualRequirement(currentPage, selectedElement)
        : undefined;
      if (showBasicInfo) {
        setShowBasicInfo(false);
      } else if (pendingPageDelete) {
        setPendingPageDelete(null);
      } else if (pendingAnnotationDelete) {
        setPendingAnnotationDelete(null);
      } else if (pendingDelete) {
        setPendingDelete(null);
      } else if (selectedVisualRequirement && canvasRequirementModes[selectedVisualRequirement.id]) {
        setCanvasRequirementMode(selectedVisualRequirement.id, null);
      } else if (editingTextId) {
        setEditingTextId(null);
      } else {
        setSelectedId(null);
      }
      return;
    }
    if (isResearch && currentPage.kind === "page" && (event.key === "Delete" || event.key === "Backspace") && selectedId) {
      event.preventDefault();
      requestRemoveElement(selectedId);
    }
  };

  const isContextPanel = (panelTab === "question" && Boolean(currentQuestion)) || currentPage.kind === "page" && isResearch && (
    panelTab === "voice" || panelTab === "word" || panelTab === "sentence" || panelTab === "note" || panelTab === "standard" || panelTab === "playback"
  );

  return (
    <div className="animation-book-editor" onKeyDown={handleKeyDown}>
      <div className="ab-window-bar">
        <div className="ab-traffic-lights" aria-hidden="true">
          <span className="ab-traffic-light ab-traffic-light--red" />
          <span className="ab-traffic-light ab-traffic-light--yellow" />
          <span className="ab-traffic-light ab-traffic-light--green" />
        </div>
        <span className="ab-window-title">工作台</span>
      </div>

      <header className="ab-project-header">
        <div className="ab-project-summary">
          <div className="ab-project-primary-row">
            <span className="ab-tag ab-tag--blue">进行中</span>
            <span className="ab-tag ab-tag--blue">生产中</span>
            <span className="ab-tag ab-tag--muted">LS_105189</span>
            <input
              aria-label="动画书名称"
              value={book.title}
              readOnly={!isResearch}
              onChange={(event) => { if (isResearch) setBook((previous) => ({ ...previous, title: event.target.value })); }}
              className="ab-project-title-input"
            />
            <span className="ab-project-note">我是课时备注 - 读一读 - 动画书</span>
            <span className="ab-tag ab-tag--muted">阅读5阶</span>
            <button className="ab-text-button" type="button" onClick={() => notify("更多信息将在后续版本开放")}>更多</button>
          </div>
          <div className="ab-project-meta-row">
            <span className="ab-meta-label">职能</span><span className="ab-meta-value">{isResearch ? "教研" : "制作人员"}</span>
            <span className="ab-meta-label">执行人</span><span className="ab-meta-value">王宝强；吴彦祖</span>
            <span className="ab-meta-label">生产日期</span><span className="ab-meta-value">2025.10.01–2025.10.15</span>
          </div>
        </div>
        <div className="ab-project-actions">
          <div className="ab-role-switch" role="group" aria-label="切换工作角色">
            <button type="button" className={isResearch ? "is-active" : ""} aria-pressed={isResearch} onClick={() => selectRole("research")}><BriefcaseBusiness size={13} />教研人员</button>
            <button type="button" className={!isResearch ? "is-active" : ""} aria-pressed={!isResearch} onClick={() => selectRole("production")}><ShieldCheck size={13} />制作人员</button>
          </div>
        </div>
      </header>

      <div className="ab-workspace-toolbar">
        <div className="ab-workspace-name">
          <Link to="/" className="ab-back-button" aria-label="返回 Demo 首页" title="返回 Demo 首页">
            <ArrowLeft size={16} />
          </Link>
          <span>动画书生产工具</span>
        </div>
        <div className="ab-toolbar-actions">
          <button type="button" className="ab-toolbar-button" onClick={() => notify("编辑画布已适配窗口") }>
            <Maximize2 size={14} /> 全屏
          </button>
          <button type="button" className="ab-secondary-button" onClick={() => notify("已取消本次演示操作")}>取消</button>
          <button type="button" className="ab-primary-button" onClick={() => notify("已保存到当前 Demo 会话")}>
            <Save size={14} /> 保存
          </button>
        </div>
      </div>

      <main className="ab-layout">
        <aside className="ab-sidebar" aria-label="页面缩略图列表">
          <div className="ab-sidebar-basic-info">
            <button
              type="button"
              className={`ab-basic-info-button${showBasicInfo ? " is-active" : ""}`}
              aria-pressed={showBasicInfo}
              onClick={() => setShowBasicInfo((open) => !open)}
            >
              <span>基础信息</span>
            </button>
          </div>

          <div className="ab-page-list">
            <CoverThumbnail
              page={book.cover}
              active={!showBasicInfo && viewId === "cover"}
              coverLayout={book.coverLayout}
              onClick={() => selectView("cover")}
            />
            {book.pages.map((page, index) => (
              <PageThumbnail
                key={page.id}
                page={page}
                active={!showBasicInfo && viewId === page.id}
                index={index + 1}
                onClick={() => selectView(page.id)}
                onDelete={() => requestDeletePage(page.id)}
                canReorder={isResearch}
                draggedPageId={draggedPageId}
                onDragStart={handlePageDragStart}
                onDragEnd={resetPageDrag}
                onDragOver={handlePageDragOver}
                onDrop={handlePageDrop}
                dropPosition={dropTarget?.id === page.id ? dropTarget.position : undefined}
              />
            ))}
            {isResearch && (
              <button type="button" className="ab-outline-button" onClick={addPage}>
                <Plus size={16} aria-hidden="true" /> 添加页面
              </button>
            )}
          </div>
        </aside>

        <section className="ab-center-workspace">
          {showBasicInfo ? (
            <BasicInfoPanel
              musicStyle={backgroundMusicStyle}
              selectedMusicId={backgroundMusicChoice}
              onMusicStyleChange={setBackgroundMusicStyle}
              onSelectMusic={setBackgroundMusicChoice}
            />
          ) : (
            <>
              <div className="ab-stage-scroll">
                <div className="ab-canvas-zone">
                  {isResearch && <div className="ab-editor-sticky-toolbar">
                    <div className="ab-editor-toolbar" aria-label={isResearch ? "编辑画布工具" : "制作工具"}>
                      {isResearch && (
                        <div className="ab-editor-toolbar-group ab-editor-history" aria-label="编辑历史">
                          <ToolButton icon={<Undo2 size={18} />} label="撤销" displayLabel="撤销" disabled />
                          <ToolButton icon={<Redo2 size={18} />} label="重做" displayLabel="重做" disabled />
                        </div>
                      )}
                      {isResearch && <span className="ab-tool-divider" />}
                      <div className="ab-editor-toolbar-group">
                        <ToolButton icon={<MousePointer2 size={18} />} label="选择" displayLabel="选择" active={!isTextToolActive} />
                        {isResearch && currentPage.kind === "page" ? (
                          <>
                            <ToolButton icon={<Type size={18} />} label="添加文本" displayLabel="文字" active={isTextToolActive} onClick={addText} />
                            <ToolButton icon={<ImageIcon size={18} />} label="添加图片占位" displayLabel="图片" onClick={addImagePlaceholder} />
                            <ToolButton icon={<Film size={18} />} label="添加动效占位" displayLabel="动效" onClick={addMotion} />
                            <ToolButton icon={<MessageCircle size={18} />} label="添加对话气泡" displayLabel="对话" onClick={addBubble} />
                            <span className="ab-tool-divider" />
                            <ToolButton
                              icon={<Gamepad2 size={18} />}
                              label={hasQuestion ? "查看或编辑题目" : "添加标准选择题"}
                              displayLabel="题"
                              active={hasQuestion && panelTab === "question"}
                              disabled={currentPage.kind !== "page" || hasInteraction}
                              onClick={addQuestion}
                            />
                            <ToolButton
                              icon={<Hand size={18} />}
                              label={hasQuestion ? "互动入口已被题占用" : hasInteraction ? "查看或编辑互动" : "添加投票互动"}
                              active={hasInteraction && panelTab === "question"}
                              displayLabel="互动"
                              disabled={currentPage.kind !== "page" || hasQuestion}
                              onClick={addInteraction}
                            />
                          </>
                        ) : !isResearch ? (
                          <>
                            <span className="ab-tool-divider" />
                            <ToolButton icon={<ClipboardList size={18} />} label="查看制作需求" displayLabel="制作需求" active={panelTab === "requirements"} onClick={() => setPanelTab("requirements")} />
                          </>
                        ) : null}
                      </div>
                      {isResearch && (
                        <div className="ab-editor-toolbar-settings">
                          <span className="ab-editor-zoom" aria-label="缩放比例">50%<ChevronDown size={14} aria-hidden="true" /></span>
                        </div>
                      )}
                      <div className="ab-canvas-grid-toggle ab-editor-toolbar-grid" aria-label="动画书网格系统">
                        <span>网格系统</span>
                        <button
                          type="button"
                          className={`ab-switch${showSafeArea ? " is-on" : ""}`}
                          role="switch"
                          aria-checked={showSafeArea}
                          aria-label={showSafeArea ? "隐藏动画书网格系统" : "显示动画书网格系统"}
                          onClick={() => setShowSafeArea((visible) => !visible)}
                        >
                          <span className="ab-switch-thumb" />
                        </button>
                      </div>
                    </div>
                  </div>}

                  {currentPage.kind === "cover" && (
                    <CoverLayoutConfig
                      layout={book.coverLayout}
                      research={isResearch}
                      onChange={changeCoverLayout}
                    />
                  )}

                  <div className="ab-canvas-shadow">
                <div
                  ref={canvasRef}
                  className={`ab-canvas ab-canvas--${currentPage?.kind ?? "page"}`}
                  style={{ backgroundColor: currentPage?.backgroundColor ?? "#fefcf8" }}
                  onPointerDown={(event) => {
                    if ((event.target as HTMLElement).closest(".ab-canvas-requirement")) return;
                    finishActiveCanvasRequirementEdit();
                  }}
                  onClick={() => {
                    finishActiveCanvasRequirementEdit();
                    setSelectedId(null);
                    setEditingTextId(null);
                    setTextSelection(null);
                    setSelectedAnnotationId(null);
                  }}
                  onPointerMove={handleCanvasPointerMove}
                  onPointerUp={endPointerDrag}
                  onPointerCancel={endPointerDrag}
                  >
                  {showSafeArea && <SafeAreaOverlay />}
                  {sortedElements.map((element) => {
                    const isVisualElement = element.type === "image" || element.type === "motion";
                    const elementRequirement = element.type === "image" || element.type === "motion"
                      ? getVisualRequirement(currentPage, element)
                      : undefined;
                    const requirementMode = elementRequirement
                      ? canvasRequirementModes[elementRequirement.id]
                      : undefined;
                    return (
                      <Fragment key={element.id}>
                        {currentPage.kind === "cover" && element.type === "text" && element.coverField ? (
                          <CoverTextSlot
                            element={element}
                            selected={selectedId === element.id}
                            editing={editingTextId === element.id}
                            research={isResearch}
                            onSelect={() => selectElement(element.id)}
                            onBeginEdit={() => {
                              selectElement(element.id);
                              if (isResearch) setEditingTextId(element.id);
                            }}
                            onChange={(content) => updateTextContent(element.id, content)}
                            onEndEdit={() => setEditingTextId(null)}
                          />
                        ) : currentPage.kind === "cover" && (element.type === "image" || element.type === "motion") ? (
                          <CoverMediaElement
                            key={`${element.id}-${book.coverLayout}`}
                            element={element}
                            layout={book.coverLayout}
                            selected={selectedId === element.id}
                            research={isResearch}
                            requirement={elementRequirement}
                            onSelect={() => selectElement(element.id)}
                            onRequestUpload={() => requestCoverMediaUpload(element.id)}
                            onDelete={() => element.type === "image" ? clearImageAsset(element.id) : clearMotionAsset(element.id)}
                            onChangeMedia={changeCoverMedia}
                          >
                            <CanvasRequirement
                              elementType={element.type}
                              requirement={elementRequirement}
                              mode={requirementMode}
                              canEdit={isResearch}
                              onToggle={() => toggleElementRequirement(element)}
                              onChange={(brief) => {
                                if (elementRequirement) updateCanvasRequirement(elementRequirement.id, brief);
                              }}
                              onEdit={() => {
                                if (elementRequirement && isResearch) setCanvasRequirementMode(elementRequirement.id, "editing");
                              }}
                              onFinishEditing={() => {
                                if (elementRequirement) finishCanvasRequirementEdit(elementRequirement.id);
                              }}
                            />
                          </CoverMediaElement>
                        ) : isVisualElement ? (
                          <div
                            className="ab-canvas-visual-group"
                            style={{
                              left: `${(element.x / CANVAS_WIDTH) * 100}%`,
                              top: `${(element.y / CANVAS_HEIGHT) * 100}%`,
                              width: `${(element.width / CANVAS_WIDTH) * 100}%`,
                              height: `${(element.height / CANVAS_HEIGHT) * 100}%`,
                              zIndex: element.zIndex,
                            }}
                          >
                            <CanvasElement
                              element={element}
                              selected={selectedId === element.id}
                              editing={editingTextId === element.id}
                              canEditText={isResearch && currentPage.kind === "page"}
                              isBodyText={false}
                              autoHeightResizeActive={false}
                              canEditGeometry={currentPage.kind === "page"}
                              positionedByParent
                              canUploadImage={!isResearch && element.type === "image"}
                              onRequestImageUpload={() => requestImageUpload(element.id)}
                              onDeleteImage={() => clearImageAsset(element.id)}
                              onSelect={() => selectElement(element.id)}
                              annotations={[]}
                              onBeginTextEdit={() => selectElement(element.id)}
                              onTextChange={() => undefined}
                              onEndTextEdit={() => undefined}
                              onAutoSizeChange={(patch) => updateElementGeometry(element.id, patch)}
                              onNaturalWidthChange={(width) => { bubbleNaturalWidthRef.current[element.id] = width; }}
                              onTailAngleChange={(angle) => updateElementGeometry(element.id, { tailAngle: angle })}
                              onPointerDown={(event, mode, corner) => beginPointerDrag(event, element, mode, corner)}
                            />
                            <div className="ab-canvas-requirement-layer">
                              <CanvasRequirement
                                elementType={element.type}
                                requirement={elementRequirement}
                                mode={requirementMode}
                                canEdit={isResearch}
                                onToggle={() => toggleElementRequirement(element)}
                                onChange={(brief) => {
                                  if (elementRequirement) updateCanvasRequirement(elementRequirement.id, brief);
                                }}
                                onEdit={() => {
                                  if (elementRequirement && isResearch) setCanvasRequirementMode(elementRequirement.id, "editing");
                                }}
                                onFinishEditing={() => {
                                  if (elementRequirement) finishCanvasRequirementEdit(elementRequirement.id);
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <CanvasElement
                            element={element}
                            selected={selectedId === element.id}
                            editing={editingTextId === element.id}
                            canEditText={isResearch && currentPage.kind === "page"}
                            isBodyText={currentPage?.kind === "page"}
                            autoHeightResizeActive={autoHeightElementId === element.id}
                            canEditGeometry={currentPage.kind === "page" && element.type !== "question" && element.type !== "interaction" && (isResearch || ["image", "motion", "bubble", "text"].includes(element.type))}
                            canUploadImage={false}
                            onRequestImageUpload={() => requestImageUpload(element.id)}
                            onDeleteImage={() => clearImageAsset(element.id)}
                            onSelect={() => selectElement(element.id)}
                            textSelection={textSelection?.elementId === element.id ? textSelection : undefined}
                            annotations={isResearch && element.type === "text" ? element.annotations : []}
                            onTextSelectionChange={(range) => handleTextSelection(element.id, range)}
                            onRequestDeleteAnnotation={isResearch ? requestRemoveAnnotation : undefined}
                            onSelectAnnotation={isResearch ? selectAnnotation : undefined}
                            onBeginTextEdit={() => {
                              selectElement(element.id);
                              if (element.type === "text" || element.type === "bubble") setEditingTextId(element.id);
                            }}
                            onTextChange={(content) => {
                              if (element.type === "text") updateTextContent(element.id, content);
                              else updateElementById(element.id, { content });
                            }}
                            onEndTextEdit={() => setEditingTextId(null)}
                            onAutoSizeChange={(patch) => updateElementGeometry(element.id, patch)}
                            onNaturalWidthChange={(width) => { bubbleNaturalWidthRef.current[element.id] = width; }}
                            onTailAngleChange={(angle) => updateElementGeometry(element.id, { tailAngle: angle })}
                            onPointerDown={(event, mode, corner) => beginPointerDrag(event, element, mode, corner)}
                          />
                        )}
                      </Fragment>
                    );
                  })}
                  <input
                    ref={imageUploadInputRef}
                    className="ab-hidden-input"
                    type="file"
                    accept="image/*"
                    aria-label="上传图片"
                    onChange={handleImageUploadChange}
                  />
                  <input
                    ref={coverMediaUploadInputRef}
                    className="ab-hidden-input"
                    type="file"
                    accept={coverMediaUploadAccept}
                    aria-label="上传封面媒体"
                    onChange={handleCoverMediaUploadChange}
                  />
                  {isResearch && currentPage.kind === "page" && selectedElement?.type === "text" && editingTextId === selectedElement.id && (
                    <TextFormatToolbar
                      element={selectedElement}
                      onUpdate={(patch) => updateElementById(selectedElement.id, patch)}
                      onMark={addTextAnnotation}
                    />
                  )}
                  {isResearch && currentPage.kind === "page" && (
                    <>
                      {isLayerPanelOpen && (
                        <LayersPanel
                          elements={layerElements}
                          selectedId={selectedId}
                          onSelect={selectElement}
                          onMove={moveLayer}
                          onReorder={reorderLayer}
                          onToggleVisibility={toggleElementVisibility}
                          onOpenRequirement={openElementRequirementPanel}
                        />
                      )}
                      <button
                        type="button"
                        className="ab-canvas-layer-trigger"
                        aria-expanded={isLayerPanelOpen}
                        aria-controls="ab-canvas-layer-panel"
                        aria-label={isLayerPanelOpen ? "收起图层顺序" : "展开图层顺序"}
                        title={isLayerPanelOpen ? "收起图层顺序" : "展开图层顺序"}
                        onClick={(event) => {
                          event.stopPropagation();
                          setIsLayerPanelOpen((open) => !open);
                        }}
                      >
                        <Layers3 size={18} aria-hidden="true" />
                      </button>
                    </>
                  )}
                  {currentPage?.kind === "page" && (
                    <div className="ab-canvas-page-meta" aria-label={`正文页 ${pageIndex + 1}/${book.pages.length}${currentQuestion ? "，包含题目" : ""}`}>
                      <span className="ab-canvas-page-number">{pageIndex + 1}/{book.pages.length}</span>
                      {currentQuestion && <span className="ab-canvas-question-badge" aria-label="本页包含题目">题</span>}
                    </div>
                  )}
                </div>
                  </div>
                </div>

                <div className={`ab-editor-panel${currentPage.kind === "cover" ? " ab-editor-panel--cover" : ""}`}>
              {isContextPanel ? (
                <TextAnnotationPanel
                  activeTab={panelTab}
                  annotations={currentAnnotations}
                  selectedAnnotationId={selectedAnnotationId}
                  question={currentQuestion?.type === "question" ? currentQuestion : null}
                  interaction={currentQuestion?.type === "interaction" ? currentQuestion : null}
                  onUpdateInteraction={updateInteraction}
                  onSaveInteraction={saveInteraction}
                  onCancelInteraction={cancelInteraction}
                  questionOnly={!isResearch}
                  canEditQuestion={isResearch}
                  voiceItems={currentVoiceItems}
                  elements={currentPage.elements}
                  playbackOrder={currentPlaybackOrder}
                  onChangeTab={selectAnnotationTab}
                  onUpdatePlaybackDisplayMode={updatePlaybackDisplayMode}
                  onMovePlaybackOrder={movePlaybackOrderItem}
                  onReorderPlaybackOrder={reorderPlaybackOrder}
                        onSelectAnnotation={selectAnnotation}
                        onUpdateAnnotation={updateAnnotation}
                  onQuickFill={quickFillAnnotationVoice}
                  onUpdateVoiceSupplement={updateVoiceSupplement}
                  onUpdateQuestion={updateQuestion}
                  onUpdateQuestionOption={updateQuestionOption}
                  onAddQuestionOption={addQuestionOption}
                  onRemoveQuestionOption={removeQuestionOption}
                />
              ) : (
                <>
                  {!isResearch && currentPage.kind === "page" && <div className="ab-panel-tabs" role="tablist" aria-label="编辑设置">
                    <PanelTabButton active={panelTab === "requirements"} onClick={() => setPanelTab("requirements")} label="制作需求" count={currentPage?.requirements.length} />
                    {currentQuestion && <PanelTabButton active={panelTab === "question"} onClick={() => selectAnnotationTab("question")} label="题" count={1} />}
                  </div>}
                  {isResearch && currentPage.kind === "page" && panelTab === "requirements" && <div className="ab-panel-tabs" role="tablist" aria-label="编辑设置">
                    <PanelTabButton active={false} onClick={() => setPanelTab("voice")} label="领读语音" />
                    <PanelTabButton active label="需求 / 产物" count={currentPage?.requirements.length} onClick={() => setPanelTab("requirements")} />
                  </div>}

                  {currentPage.kind === "cover" && <CoverAudioPanel
                      research={isResearch}
                      requirement={currentPage.requirements.find((item) => item.type === "audio")}
                      onChange={(brief) => updateRequirement(currentPage.requirements.find((item) => item.type === "audio")?.id ?? "", { brief })}
                      onSupplement={(brief) => updateRequirement(currentPage.requirements.find((item) => item.type === "audio")?.id ?? "", { supplementalBrief: brief })}
                      onUpload={(file) => { const requirement = currentPage.requirements.find((item) => item.type === "audio"); if (requirement) handleRequirementUpload(requirement.id, file); }}
                    />}
                  {currentPage.kind === "page" && panelTab === "requirements" && (
                    <RequirementsPanel
                      page={currentPage}
                      role={role}
                      selectedId={selectedRequirementId}
                      onSelectRequirement={setSelectedRequirementId}
                      onAddRequirement={addRequirement}
                      onUpdateRequirement={updateRequirement}
                      onDeleteRequirement={deleteRequirement}
                      onUploadFile={handleRequirementUpload}
                      getElement={(id) => currentPage?.elements.find((element) => element.id === id)}
                    />
                  )}
                </>
              )}
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      {toast && <div className="ab-toast" role="status"><Check size={15} />{toast}</div>}
      <dialog
        ref={coverConfirmRef}
        className="ab-confirm-dialog ab-cover-confirm-dialog"
        aria-labelledby="ab-cover-confirm-title"
        aria-describedby="ab-cover-confirm-description"
        onCancel={() => setPendingCoverChange(null)}
        onClick={(event) => { if (event.target === event.currentTarget) setPendingCoverChange(null); }}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <div onClick={(event) => event.stopPropagation()}>
          <button type="button" className="ab-icon-button" aria-label="关闭确认弹窗" onClick={() => setPendingCoverChange(null)} style={{ float: "right" }}><X size={16} /></button>
          <div className="ab-confirm-icon"><AlertCircle size={18} /></div>
          <div className="ab-confirm-copy">
            <h2 id="ab-cover-confirm-title">{pendingCoverChange?.kind === "layout" ? "切换为全屏布局？" : `切换为${pendingCoverChange?.value === "motion" ? "动效" : "图片"}？`}</h2>
            <p id="ab-cover-confirm-description">{pendingCoverChange?.kind === "layout" ? "切换后将清空封面文字内容，是否继续？" : "切换后将清空当前封面媒体及对应需求，是否继续？"}</p>
          </div>
          <div className="ab-confirm-actions">
            <button type="button" className="ab-secondary-button" autoFocus onClick={() => setPendingCoverChange(null)}>取消</button>
            <button type="button" className="ab-primary-button ab-primary-button--danger" onClick={() => {
              if (pendingCoverChange?.kind === "layout") changeCoverLayout(pendingCoverChange.value, true);
              else if (pendingCoverChange?.kind === "media") changeCoverMedia(pendingCoverChange.value, true);
              setPendingCoverChange(null);
            }}>确认切换</button>
          </div>
        </div>
      </dialog>
      {pendingPageDelete && (
        <div className="ab-confirm-backdrop" role="presentation" onClick={() => setPendingPageDelete(null)}>
          <div className="ab-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="ab-page-delete-title" onClick={(event) => event.stopPropagation()}>
            <div className="ab-confirm-icon"><AlertCircle size={18} /></div>
            <div className="ab-confirm-copy">
              <h2 id="ab-page-delete-title">确认删除{pendingPageDelete.label}？</h2>
              <p>删除后该页面内容将无法恢复，请确认是否继续。</p>
            </div>
            <div className="ab-confirm-actions">
              <button type="button" className="ab-secondary-button" autoFocus onClick={() => setPendingPageDelete(null)}>取消</button>
              <button type="button" className="ab-primary-button ab-primary-button--danger" onClick={confirmDeletePage}>确认删除</button>
            </div>
          </div>
        </div>
      )}
      {pendingDelete && (
        <div className="ab-confirm-backdrop" role="presentation" onClick={() => setPendingDelete(null)}>
          <div className="ab-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="ab-delete-title" onClick={(event) => event.stopPropagation()}>
            <div className="ab-confirm-icon"><AlertCircle size={18} /></div>
            <div className="ab-confirm-copy">
              <h2 id="ab-delete-title">确认删除{getElementLabel(pendingDelete.type)}？</h2>
              <p>{(pendingDelete.type === "question" || pendingDelete.type === "interaction") ? "删除后题干、选项及题目配置将一并移除，请确认是否继续。" : `当前内容“${pendingDelete.name}”已填充，删除后需要重新添加。`}</p>
            </div>
            <div className="ab-confirm-actions">
              <button type="button" className="ab-secondary-button" autoFocus onClick={() => setPendingDelete(null)}>取消</button>
              <button type="button" className="ab-primary-button ab-primary-button--danger" onClick={confirmRemoveElement}>确认删除</button>
            </div>
          </div>
        </div>
      )}
      {pendingAnnotationDelete && (
        <div className="ab-confirm-backdrop" role="presentation" onClick={() => setPendingAnnotationDelete(null)}>
          <div className="ab-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="ab-annotation-delete-title" onClick={(event) => event.stopPropagation()}>
            <div className="ab-confirm-icon"><AlertCircle size={18} /></div>
            <div className="ab-confirm-copy">
              <h2 id="ab-annotation-delete-title">确认删除{ANNOTATION_LABELS[pendingAnnotationDelete.type]}？</h2>
              <p>“{pendingAnnotationDelete.text}”已有配置内容，删除后只移除标注，不会删除原文。</p>
            </div>
            <div className="ab-confirm-actions">
              <button type="button" className="ab-secondary-button" autoFocus onClick={() => setPendingAnnotationDelete(null)}>取消</button>
              <button type="button" className="ab-primary-button ab-primary-button--danger" onClick={() => removeAnnotation(pendingAnnotationDelete.id)}>确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BasicInfoPanel({
  musicStyle,
  selectedMusicId,
  onMusicStyleChange,
  onSelectMusic,
}: {
  musicStyle: string;
  selectedMusicId: string;
  onMusicStyleChange: (style: string) => void;
  onSelectMusic: (musicId: string) => void;
}) {
  const [playingMusicId, setPlayingMusicId] = useState<string | null>(null);

  return (
    <div className="ab-basic-info-scroll">
      <div className="ab-basic-info-card">
        <h1>基础信息</h1>
        <div className="ab-basic-info-form">
          <div className="ab-basic-info-field">
            <label htmlFor="ab-background-music-style">背景音乐风格</label>
            <div className="ab-basic-info-select-wrap">
              <select
                id="ab-background-music-style"
                className="ab-basic-info-select"
                value={musicStyle}
                onChange={(event) => onMusicStyleChange(event.target.value)}
              >
                <option>安静</option>
                <option>活泼</option>
                <option>温暖</option>
              </select>
              <ChevronDown size={16} aria-hidden="true" />
            </div>
          </div>

          <div className="ab-basic-info-music-grid" role="list" aria-label="背景音乐选择">
            {BASIC_INFO_MUSIC_OPTIONS.map((option) => {
              const isSelected = selectedMusicId === option.id;
              const isPlaying = playingMusicId === option.id;
              return (
                <div
                  key={option.id}
                  className={`ab-basic-info-music-card${isSelected ? " is-selected" : ""}`}
                  role="listitem"
                >
                  <button
                    type="button"
                    className="ab-basic-info-music-play"
                    aria-label={`${isPlaying ? "暂停" : "播放"}${option.title}`}
                    aria-pressed={isPlaying}
                    onClick={() => setPlayingMusicId((current) => current === option.id ? null : option.id)}
                  >
                    {isPlaying ? <Pause size={16} fill="currentColor" aria-hidden="true" /> : <Play size={16} fill="currentColor" aria-hidden="true" />}
                  </button>
                  <button
                    type="button"
                    className="ab-basic-info-music-copy"
                    aria-pressed={isSelected}
                    onClick={() => onSelectMusic(option.id)}
                  >
                    <span className="ab-basic-info-music-title">{option.title}</span>
                    <span className="ab-basic-info-music-duration">00:00 / {option.duration}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolButton({
  icon,
  label,
  displayLabel = label,
  onClick,
  active = false,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  displayLabel?: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button type="button" className={`ab-tool-button${active ? " is-active" : ""}${disabled ? " is-disabled" : ""}`} onClick={onClick} aria-label={label} title={label} disabled={disabled}>
      <span className="ab-tool-icon" aria-hidden="true">{icon}</span>
      <span className="ab-tool-label">{displayLabel}</span>
    </button>
  );
}

function PanelTabButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count?: number }) {
  return (
    <button type="button" role="tab" aria-selected={active} className={`ab-panel-tab${active ? " is-active" : ""}`} onClick={onClick}>
      {label}
      {typeof count === "number" && <span className="ab-panel-tab-count">{count}</span>}
    </button>
  );
}

const getThumbnailImage = (page: AnimationBookPage) =>
  page.elements.find(
    (element): element is ImageElement => element.type === "image" && element.hidden !== true && Boolean(element.src.trim()),
  )?.src ?? null;

const getCoverTitle = (page: AnimationBookPage) =>
  page.elements.find((element): element is TextElement => element.type === "text" && element.coverField === "title")?.content.split("\n")[0]?.trim() || "未命名标题";

function ThumbnailPreview({
  imageSrc,
  emptyLabel,
  coverLayout,
  title,
}: {
  imageSrc: string | null;
  emptyLabel: string;
  coverLayout?: CoverLayout;
  title?: string;
}) {
  if (coverLayout === "split") {
    return (
      <div className="ab-thumbnail-preview ab-thumbnail-preview--cover-split">
        <ThumbnailImagePane imageSrc={imageSrc} emptyLabel={emptyLabel} />
        <div className="ab-thumbnail-cover-title">{title}</div>
      </div>
    );
  }

  return (
    <div className={`ab-thumbnail-preview${coverLayout === "fullscreen" ? " ab-thumbnail-preview--cover-fullscreen" : ""}`}>
      <ThumbnailImagePane imageSrc={imageSrc} emptyLabel={emptyLabel} />
    </div>
  );
}

function ThumbnailImagePane({ imageSrc, emptyLabel }: { imageSrc: string | null; emptyLabel: string }) {
  return (
    <div className="ab-thumbnail-image-pane">
      {imageSrc ? <img src={imageSrc} alt="" /> : <span>{emptyLabel}</span>}
    </div>
  );
}

function CoverThumbnail({
  page,
  active,
  coverLayout,
  onClick,
}: {
  page: AnimationBookPage;
  active: boolean;
  coverLayout: CoverLayout;
  onClick: () => void;
}) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`ab-page-thumbnail ab-cover-thumbnail${active ? " is-active" : ""}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-current={active ? "page" : undefined}
    >
      <div className="ab-page-thumbnail-index">封面</div>
      <ThumbnailPreview
        imageSrc={getThumbnailImage(page)}
        emptyLabel="暂无封面"
        coverLayout={coverLayout}
        title={getCoverTitle(page)}
      />
    </div>
  );
}

function PageThumbnailCard({
  page,
  active,
  index,
  onClick,
  dragHandle,
  deleteButton,
  isDragging = false,
}: {
  page: AnimationBookPage;
  active: boolean;
  index: number;
  onClick?: () => void;
  dragHandle?: React.ReactNode;
  deleteButton?: React.ReactNode;
  isDragging?: boolean;
}) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    onClick();
  };

  return (
    <div
      className={`ab-page-thumbnail${active ? " is-active" : ""}${isDragging ? " is-dragging" : ""}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "group" : undefined}
      tabIndex={onClick ? 0 : -1}
      aria-current={active ? "page" : undefined}
    >
      <div className="ab-page-thumbnail-index">{index}</div>
      <ThumbnailPreview imageSrc={getThumbnailImage(page)} emptyLabel="暂无内容" />
      {dragHandle}
      {deleteButton}
    </div>
  );
}

function PageThumbnail({
  page,
  active,
  index,
  onClick,
  onDelete,
  canReorder,
  draggedPageId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  dropPosition,
}: {
  page: AnimationBookPage;
  active: boolean;
  index: number;
  onClick: () => void;
  onDelete: () => void;
  canReorder: boolean;
  draggedPageId: string | null;
  onDragStart: (event: React.DragEvent<HTMLButtonElement>, pageId: string) => void;
  onDragEnd: () => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>, pageId: string) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>, pageId: string) => void;
  dropPosition?: PageDropPosition;
}) {
  const dragHandle = canReorder ? (
    <button
      type="button"
      className="ab-page-drag-handle"
      draggable
      aria-label={`拖拽排序${page.label}`}
      onClick={(event) => event.stopPropagation()}
      onDragStart={(event) => onDragStart(event, page.id)}
      onDragEnd={onDragEnd}
    >
      <Menu size={16} aria-hidden="true" />
    </button>
  ) : undefined;
  const deleteButton = canReorder ? (
    <button
      type="button"
      className="ab-page-delete-button"
      aria-label={`删除${page.label}`}
      title={`删除${page.label}`}
      onClick={(event) => {
        event.stopPropagation();
        onDelete();
      }}
    >
      <CircleX size={14} aria-hidden="true" />
    </button>
  ) : undefined;

  return (
    <div
      className="ab-page-sortable-item"
      onDragOver={(event) => onDragOver(event, page.id)}
      onDrop={(event) => onDrop(event, page.id)}
    >
      {dropPosition === "before" && <div className="ab-drop-indicator" aria-hidden="true" />}
      <PageThumbnailCard
        page={page}
        active={active}
        index={index}
        onClick={onClick}
        dragHandle={dragHandle}
        deleteButton={deleteButton}
        isDragging={draggedPageId === page.id}
      />
      {dropPosition === "after" && <div className="ab-drop-indicator" aria-hidden="true" />}
    </div>
  );
}

function SafeAreaOverlay() {
  return (
    <img
      className="ab-safe-area-overlay"
      src={ANIMATION_BOOK_GRID_ASSET}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}

const getCanvasTextStyle = (element: TextElement, isBodyText: boolean) => ({
  ...(isBodyText ? {
    fontFamily: BODY_TEXT_FONT_FAMILY,
    lineHeight: "24px",
    textIndent: BODY_TEXT_PARAGRAPH_INDENT,
  } : {}),
  fontSize: (element.fontSize * (EDITOR_WIDTH / CANVAS_WIDTH)) + "px",
  color: element.color,
  fontWeight: element.fontWeight === "bold" ? 700 : element.fontWeight === "medium" ? 500 : 400,
  fontStyle: element.italic ? "italic" : "normal",
  textDecoration: element.underline ? "underline" : "none",
  textAlign: element.textAlign ?? "left",
});

function CanvasElement({
  element,
  selected,
  editing,
  canEditText,
  isBodyText,
  autoHeightResizeActive,
  canEditGeometry,
  positionedByParent = false,
  canUploadImage,
  annotations,
  textSelection,
  onSelect,
  onTextSelectionChange,
  onRequestDeleteAnnotation,
  onSelectAnnotation,
  onBeginTextEdit,
  onTextChange,
  onEndTextEdit,
  onAutoSizeChange,
  onNaturalWidthChange,
  onTailAngleChange,
  onRequestImageUpload,
  onDeleteImage,
  onPointerDown,
}: {
  element: BookElement;
  selected: boolean;
  editing: boolean;
  canEditText: boolean;
  isBodyText: boolean;
  autoHeightResizeActive: boolean;
  canEditGeometry: boolean;
  positionedByParent?: boolean;
  canUploadImage: boolean;
  annotations?: TextAnnotation[];
  textSelection?: TextSelectionRange;
  onSelect: () => void;
  onTextSelectionChange?: (range: TextSelectionRange | null) => void;
  onRequestDeleteAnnotation?: (annotationId: string) => void;
  onSelectAnnotation?: (annotationId: string) => void;
  onBeginTextEdit: () => void;
  onTextChange: (content: string) => void;
  onEndTextEdit: () => void;
  onAutoSizeChange: (patch: ElementGeometryPatch) => void;
  onNaturalWidthChange: (width: number) => void;
  onTailAngleChange: (angle: number) => void;
  onRequestImageUpload: () => void;
  onDeleteImage: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>, mode: "move" | "resize" | "tail", corner?: ResizeCorner) => void;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const textContentRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);
  const lastMeasuredWidthRef = useRef<number | null>(null);
  const previousBubbleContentRef = useRef<string | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const pointerMovedRef = useRef(false);
  const editableElementContent = element.type === "text" || element.type === "bubble" ? element.content : "";
  const bubbleWidthMode = element.type === "bubble" ? element.widthMode : undefined;
  const elementX = element.x;

  useLayoutEffect(() => {
    if (!editing || !canEditText || (element.type !== "text" && element.type !== "bubble") || !textContentRef.current) return;
    writePlainTextToContentEditable(
      textContentRef.current,
      editableElementContent,
      element.type === "text" ? TEXT_ELEMENT_PLACEHOLDER : BUBBLE_ELEMENT_PLACEHOLDER,
    );
    textContentRef.current.focus();
    if (element.type === "text" && textSelection) {
      selectTextRange(textContentRef.current, textSelection);
      return;
    }
    setTextCaret(textContentRef.current, editableElementContent.length);
    // Content and selection are intentionally excluded: this initializes the uncontrolled editor only on edit entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEditText, editing, element.id, element.type]);

  useLayoutEffect(() => {
    const isTextElement = element.type === "text";
    const isBubbleElement = element.type === "bubble";
    const bubbleContentChanged = isBubbleElement
      && previousBubbleContentRef.current !== null
      && previousBubbleContentRef.current !== editableElementContent;
    if (isBubbleElement) previousBubbleContentRef.current = editableElementContent;

    const isEditingBodyText = isTextElement && isBodyText && editing && canEditText;
    const shouldMeasureText = isTextElement && (autoHeightResizeActive || isEditingBodyText);
    const shouldMeasureBubble = isBubbleElement && canEditGeometry && (autoHeightResizeActive || bubbleContentChanged);
    if (!isTextElement && !isBubbleElement) return;

    const canvas = elementRef.current?.closest<HTMLElement>(".ab-canvas");
    const content = elementRef.current?.querySelector<HTMLElement>(
      isBubbleElement ? ".ab-canvas-bubble-content" : ".ab-canvas-text-content",
    );
    if (!content) return;

    let naturalWidth: number | null = null;
    if (isBubbleElement) {
      const measurement = content.cloneNode(false) as HTMLElement;
      measurement.textContent = editableElementContent || BUBBLE_ELEMENT_PLACEHOLDER;
      measurement.style.position = "fixed";
      measurement.style.left = "-100000px";
      measurement.style.top = "0";
      measurement.style.display = "inline-block";
      measurement.style.width = "max-content";
      measurement.style.height = "auto";
      measurement.style.minHeight = "0";
      measurement.style.maxWidth = "none";
      measurement.style.overflow = "visible";
      measurement.style.whiteSpace = "pre";
      measurement.style.visibility = "hidden";
      measurement.style.pointerEvents = "none";
      document.body.appendChild(measurement);
      const measuredWidth = measurement.getBoundingClientRect().width;
      measurement.remove();
      naturalWidth = Math.max(BUBBLE_MIN_WIDTH, Math.ceil((measuredWidth + BUBBLE_OUTER_CHROME_PX + BUBBLE_NATURAL_WIDTH_BUFFER_PX) * BUBBLE_EDITOR_SCALE));
      onNaturalWidthChange(naturalWidth);
    }
    const maxAvailableBubbleWidth = Math.max(1, CANVAS_WIDTH - elementX);
    const firstInputWidth = naturalWidth !== null && bubbleContentChanged && bubbleWidthMode === "auto" && editableElementContent.trim()
      ? clamp(naturalWidth, Math.min(BUBBLE_MIN_WIDTH, maxAvailableBubbleWidth), maxAvailableBubbleWidth)
      : null;

    if (!canEditGeometry || (!shouldMeasureText && !shouldMeasureBubble)) {
      lastMeasuredWidthRef.current = isTextElement ? element.width : null;
      return;
    }
    if (isTextElement && autoHeightResizeActive && !isEditingBodyText && lastMeasuredWidthRef.current === element.width) return;
    const canvasHeight = canvas?.getBoundingClientRect().height ?? 0;
    if (canvasHeight <= 0) return;

    let contentHeight: number;
    if (isBubbleElement) {
      const measurement = content.cloneNode(false) as HTMLElement;
      measurement.innerHTML = content.innerHTML;
      measurement.style.position = "fixed";
      measurement.style.left = "-100000px";
      measurement.style.top = "0";
      const contentRect = content.getBoundingClientRect();
      const elementRect = elementRef.current?.getBoundingClientRect();
      const outerChrome = (elementRect?.width ?? contentRect.width) - contentRect.width;
      const targetContentWidth = firstInputWidth !== null
        ? firstInputWidth / BUBBLE_EDITOR_SCALE - outerChrome
        : contentRect.width;
      measurement.style.width = `${Math.max(1, targetContentWidth)}px`;
      measurement.style.height = "auto";
      measurement.style.minHeight = "0";
      measurement.style.maxHeight = "none";
      measurement.style.overflow = "visible";
      measurement.style.visibility = "hidden";
      measurement.style.pointerEvents = "none";
      document.body.appendChild(measurement);
      contentHeight = measurement.getBoundingClientRect().height;
      measurement.remove();
    } else {
      const previousHeight = content.style.height;
      content.style.height = "auto";
      contentHeight = content.scrollHeight;
      content.style.height = previousHeight;
    }
    if (autoHeightResizeActive) lastMeasuredWidthRef.current = element.width;

    const nextHeight = isBubbleElement
      ? Math.max(BUBBLE_MIN_HEIGHT, Math.ceil((contentHeight + BUBBLE_OUTER_CHROME_PX) * BUBBLE_EDITOR_SCALE))
      : Math.max(54, Math.ceil(contentHeight * (CANVAS_HEIGHT / canvasHeight)));
    const sizePatch: ElementGeometryPatch = {};
    if (isBubbleElement && bubbleContentChanged && bubbleWidthMode === "auto" && editableElementContent.trim() && naturalWidth !== null) {
      sizePatch.width = firstInputWidth ?? BUBBLE_MIN_WIDTH;
      sizePatch.widthMode = "manual";
    }
    if (Number.isFinite(nextHeight) && Math.abs(nextHeight - element.height) > 1) sizePatch.height = nextHeight;
    if (Object.keys(sizePatch).length > 0) onAutoSizeChange(sizePatch);
  }, [
    autoHeightResizeActive,
    canEditText,
    canEditGeometry,
    editing,
    editableElementContent,
    element.height,
    element.type,
    element.width,
    bubbleWidthMode,
    elementX,
    isBodyText,
    onAutoSizeChange,
    onNaturalWidthChange,
  ]);

  const positionStyle = positionedByParent ? {
    inset: 0,
    width: "100%",
    height: "100%",
    zIndex: 1,
  } : {
    left: `${(element.x / CANVAS_WIDTH) * 100}%`,
    top: `${(element.y / CANVAS_HEIGHT) * 100}%`,
    width: `${(element.width / CANVAS_WIDTH) * 100}%`,
    height: `${(element.height / CANVAS_HEIGHT) * 100}%`,
    zIndex: element.zIndex,
  };
  const replaceEditorSelection = (root: HTMLElement, insertedText: string) => {
    const nextContent = replaceContentEditableSelection(root, insertedText);
    if (nextContent === null) return;
    onTextChange(nextContent);
    onTextSelectionChange?.(null);
  };
  const editableContentProps = {
    ref: textContentRef,
    contentEditable: editing && canEditText,
    suppressContentEditableWarning: true,
    onCompositionStart: () => { isComposingRef.current = true; },
    onCompositionEnd: (event: React.CompositionEvent<HTMLDivElement>) => {
      isComposingRef.current = false;
      onTextChange(readPlainTextFromContentEditable(event.currentTarget));
    },
    onInput: (event: React.FormEvent<HTMLDivElement>) => {
      const nativeEvent = event.nativeEvent as InputEvent;
      if (isComposingRef.current || nativeEvent.isComposing) return;
      onTextChange(readPlainTextFromContentEditable(event.currentTarget));
    },
    onBeforeInput: (event: React.FormEvent<HTMLDivElement>) => {
      if (event.defaultPrevented) return;
      const nativeEvent = event.nativeEvent as InputEvent;
      if (nativeEvent.inputType !== "insertParagraph" && nativeEvent.inputType !== "insertLineBreak") return;
      event.preventDefault();
      replaceEditorSelection(event.currentTarget, "\n");
    },
    onPaste: (event: React.ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      replaceEditorSelection(event.currentTarget, event.clipboardData.getData("text/plain"));
    },
    onMouseUp: () => {
      if (textContentRef.current) onTextSelectionChange?.(getTextSelectionRange(textContentRef.current));
    },
    onKeyUp: () => {
      if (textContentRef.current) onTextSelectionChange?.(getTextSelectionRange(textContentRef.current));
    },
    onBlur: onEndTextEdit,
    onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
      event.stopPropagation();
      if (event.key === "Escape") {
        event.preventDefault();
        onEndTextEdit();
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        replaceEditorSelection(event.currentTarget, "\n");
      }
    },
  };
  const textStyle = element.type === "text" ? getCanvasTextStyle(element, isBodyText) : undefined;
  const baseProps = {
    className: `ab-canvas-element ab-canvas-element--${element.type}${selected ? " is-selected" : ""}`,
    style: positionStyle,
    onClick: (event: React.MouseEvent) => {
      event.stopPropagation();
      const target = event.target as HTMLElement;
      const moved = pointerMovedRef.current;
      pointerStartRef.current = null;
      pointerMovedRef.current = false;
      if (moved || target.closest(".ab-resize-handle")) {
        onSelect();
        return;
      }
      if (element.type === "image" && canUploadImage) {
        onRequestImageUpload();
        return;
      }
      onSelect();
    },
    onDoubleClick: (event: React.MouseEvent) => {
      event.stopPropagation();
      if ((element.type === "text" || element.type === "bubble") && canEditText) onBeginTextEdit();
    },
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      pointerStartRef.current = { x: event.clientX, y: event.clientY };
      pointerMovedRef.current = false;
      if (((element.type === "text" || element.type === "bubble") && editing) || !canEditGeometry) {
        event.stopPropagation();
        return;
      }
      onPointerDown(event, "move");
    },
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
      const start = pointerStartRef.current;
      if (!start) return;
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 5) pointerMovedRef.current = true;
    },
    tabIndex: 0,
    role: "button" as const,
    "aria-label": `${getElementLabel(element.type)}：${elementName(element)}`,
  };
  const resizeCorners: ResizeCorner[] = element.type === "bubble"
    ? ["middle-left", "middle-right"]
    : element.type === "text"
    ? ["top-left", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-right"]
    : ["top-left", "top-right", "bottom-left", "bottom-right"];

  return (
    <div ref={elementRef} {...baseProps}>
      {element.type === "text" && (
        editing ? (
          <div
            {...editableContentProps}
            className={`ab-canvas-text-content${isBodyText ? " is-body-text" : ""}`}
            data-placeholder={TEXT_ELEMENT_PLACEHOLDER}
            style={textStyle}
          />
        ) : (
          <AnnotatedTextContent
            element={element}
            isBodyText={isBodyText}
            annotations={annotations ?? element.annotations}
            onRequestDelete={onRequestDeleteAnnotation}
            onSelectAnnotation={onSelectAnnotation}
          />
        )
      )}
      {element.type === "image" && (
        <>
          <span className="ab-canvas-element-tag ab-canvas-element-tag--image">图片</span>
          {element.src ? <img className="ab-canvas-image" src={element.src} alt={element.alt} style={{ objectFit: "contain" }} /> : <div className="ab-canvas-asset-placeholder"><FileImage size={21} /><span>{element.alt || "待制作图片"}</span></div>}
          {canUploadImage && (
            <div
              className="ab-image-hover-actions"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              <button type="button" aria-label="上传图片" title="上传图片" onClick={onRequestImageUpload}>
                <Upload size={18} aria-hidden="true" />
              </button>
              {element.src && (
                <button type="button" aria-label="删除图片" title="删除图片" onClick={onDeleteImage}>
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </>
      )}
      {element.type === "motion" && (
        <>
          <span className="ab-canvas-element-tag ab-canvas-element-tag--motion">动效</span>
          <div className={`ab-canvas-motion${element.src ? " has-asset" : ""}`}>
            {element.src ? <Film size={21} /> : <ImagePlus size={21} />}
            <span>{element.src ? "动效静态占位" : "待上传动效"}</span>
            <small>{element.fileName}</small>
          </div>
        </>
      )}
      {element.type === "question" && <QuestionCanvas element={element} />}
      {element.type === "interaction" && <InteractionCanvas element={element} />}
      {element.type === "bubble" && (
        <>
          <div
            {...editableContentProps}
            className="ab-canvas-bubble-content"
            data-placeholder={BUBBLE_ELEMENT_PLACEHOLDER}
          >
            {!editing && element.content}
          </div>
          {(() => {
            const tailAngle = normalizeAngle(element.tailAngle);
            const tailPosition = getBubbleTailPosition(element.width, element.height, tailAngle);
            return (
              <span
                className="ab-bubble-tail"
                style={{
                  left: `${tailPosition.left}%`,
                  top: `${tailPosition.top}%`,
                  transform: `translate(-50%, -50%) rotate(${tailAngle - 90}deg)`,
                }}
                onPointerDown={(event) => onPointerDown(event, "tail")}
                onKeyDown={(event) => {
                  const step = event.shiftKey ? 15 : 1;
                  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                    event.preventDefault();
                    event.stopPropagation();
                    onTailAngleChange(normalizeAngle(tailAngle + step));
                  } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                    event.preventDefault();
                    event.stopPropagation();
                    onTailAngleChange(normalizeAngle(tailAngle - step));
                  } else if (event.key === "Home") {
                    event.preventDefault();
                    event.stopPropagation();
                    onTailAngleChange(0);
                  } else if (event.key === "End") {
                    event.preventDefault();
                    event.stopPropagation();
                    onTailAngleChange(359);
                  }
                }}
                role="slider"
                aria-label="调整气泡指向"
                aria-valuemin={0}
                aria-valuemax={359}
                aria-valuestep={1}
                aria-valuenow={Math.round(tailAngle) % 360}
                aria-valuetext={`${Math.round(tailAngle)}°，顺时针方向`}
                tabIndex={selected ? 0 : -1}
              />
            );
          })()}
        </>
      )}
      {selected && element.type !== "question" && element.type !== "interaction" && (
        <>
          {canEditGeometry && resizeCorners.map((corner) => (
            <span
              key={corner}
              className={`ab-resize-handle ab-resize-handle--${corner}`}
              onPointerDown={(event) => onPointerDown(event, "resize", corner)}
              aria-hidden="true"
            />
          ))}
        </>
      )}
    </div>
  );
}

function InteractionCanvas({ element }: { element: InteractionElement }) {
  const characters = Array.from(element.title.trim());
  return (
    <div className="ab-interaction-canvas" aria-label="投票互动画布预览">
      <div className="ab-interaction-title">
        <div className="ab-interaction-title-line">
          <img src={new URL("./assets/f3183aca-3189-409f-b5b6-7e67b1ee3c9a.svg", import.meta.url).href} width={13.333} height={13.333} alt="标题语音" />
          <span className={characters.length ? undefined : "is-empty"}>{characters.slice(0, 10).join("") || "暂无内容"}</span>
          <img className="ab-interaction-arrow" src={new URL("./assets/fe80ed05-da26-4780-8c21-dc54e8f35635.svg", import.meta.url).href} width={10.667} height={10.667} alt="" />
        </div>
        {characters.length > 10 && <div>{characters.slice(10).join("")}</div>}
      </div>
      <div className="ab-interaction-options">
        {element.options.map((option) => <div className={`ab-interaction-option${option.content.trim() ? "" : " is-empty"}`} key={option.id}>{option.content.trim() || "暂无内容"}</div>)}
      </div>
    </div>
  );
}

function QuestionCanvas({ element }: { element: QuestionElement }) {
  return (
    <div className="ab-question-canvas-card" aria-label="题目画布预览">
      <div className="ab-question-canvas-stem">
        <FileAudio size={13} aria-hidden="true" />
        <span className={element.stem.trim() ? "is-filled" : ""}>{element.stem.trim() || "暂无内容"}</span>
      </div>
      <div className="ab-question-canvas-divider" />
      <div className="ab-question-canvas-options">
        {element.options.map((option, index) => (
          <div className={`ab-question-canvas-option${option.isCorrect ? " is-correct" : ""}`} key={option.id}>
            <span className="ab-question-canvas-option-label">{String.fromCharCode(65 + index)}</span>
            <span className={`ab-question-canvas-option-content${option.content.trim() ? " is-filled" : ""}`}>{option.content.trim() || "暂无内容"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnnotatedTextContent({
  element,
  isBodyText,
  annotations,
  onRequestDelete,
  onSelectAnnotation,
}: {
  element: TextElement;
  isBodyText: boolean;
  annotations: TextAnnotation[];
  onRequestDelete?: (annotationId: string) => void;
  onSelectAnnotation?: (annotationId: string) => void;
}) {
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<string | null>(null);
  const segments = buildAnnotationSegments(element.content, annotations);
  const style = getCanvasTextStyle(element, isBodyText);
  const paragraphs = segments.reduce<typeof segments[]>((result, segment) => {
    const parts = segment.text.split("\n");
    let partStart = segment.start;
    parts.forEach((text, index) => {
      const partEnd = partStart + text.length;
      if (text.length > 0) {
        result[result.length - 1].push({ ...segment, start: partStart, end: partEnd, text });
      }
      if (index < parts.length - 1) {
        result.push([]);
        partStart = partEnd + 1;
      } else {
        partStart = partEnd;
      }
    });
    return result;
  }, [[]]);

  const renderSegment = (segment: (typeof segments)[number]) => {
    let decorated: React.ReactNode = segment.text;
    if (segment.annotations.some((annotation) => annotation.type === "note")) {
      decorated = <span className="ab-annotation-decoration ab-annotation-decoration--note">{decorated}</span>;
    }
    if (segment.annotations.some((annotation) => annotation.type === "sentence")) {
      decorated = <span className="ab-annotation-decoration ab-annotation-decoration--sentence">{decorated}</span>;
    }
    if (segment.annotations.some((annotation) => annotation.type === "word")) {
      decorated = <span className="ab-annotation-decoration ab-annotation-decoration--word">{decorated}</span>;
    }
    const controls = segment.annotations.filter((annotation) => annotation.start === segment.start);
    const hoveredControl = segment.annotations.find((annotation) => annotation.id === hoveredAnnotationId);
    const visibleControls = controls.length > 0 ? controls : hoveredControl ? [hoveredControl] : [];
    const firstAnnotation = segment.annotations[0];
    const isClickable = Boolean(firstAnnotation && onSelectAnnotation);
    return (
      <span
        key={`${segment.start}-${segment.end}`}
        className={`ab-annotation-segment${isClickable ? " is-clickable" : ""}`}
        onMouseEnter={() => setHoveredAnnotationId(controls[0]?.id ?? segment.annotations[0]?.id ?? null)}
        onMouseLeave={() => setHoveredAnnotationId(null)}
        onPointerDown={(event) => {
          if (isClickable) event.stopPropagation();
        }}
        onClick={(event) => {
          if (!isClickable || !firstAnnotation) return;
          event.stopPropagation();
          onSelectAnnotation?.(firstAnnotation.id);
        }}
      >
        {decorated}
        {hoveredAnnotationId && segment.annotations.some((annotation) => annotation.id === hoveredAnnotationId) && visibleControls.length > 0 && (
          <span className="ab-annotation-delete-list">
            {visibleControls.map((annotation) => (
              <button
                type="button"
                key={annotation.id}
                className="ab-annotation-delete-button"
                aria-label={`删除${annotation.text}${annotation.type === "word" ? "好词" : annotation.type === "sentence" ? "好句" : "注释"}`}
                title="删除标注"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  onRequestDelete?.(annotation.id);
                }}
              >
                <Trash2 size={11} aria-hidden="true" />
              </button>
            ))}
          </span>
        )}
      </span>
    );
  };

  return (
    <div
      className={`ab-canvas-text-content ab-canvas-text-rendered${isBodyText ? " is-body-text" : ""}`}
      data-placeholder={element.content ? undefined : TEXT_ELEMENT_PLACEHOLDER}
      style={style}
    >
      {element.content && paragraphs.map((paragraph, index) => (
        <div className="ab-canvas-text-paragraph" key={`paragraph-${index}`}>
          {paragraph.map(renderSegment)}
        </div>
      ))}
    </div>
  );
}

function CanvasRequirement({
  elementType,
  requirement,
  mode,
  canEdit,
  onToggle,
  onChange,
  onEdit,
  onFinishEditing,
}: {
  elementType: "image" | "motion";
  requirement?: ProductionRequirement;
  mode?: "editing" | "preview";
  canEdit: boolean;
  onToggle: () => void;
  onChange: (brief: ProductionRequirement["brief"]) => void;
  onEdit: () => void;
  onFinishEditing: () => void;
}) {
  const brief = requirement?.brief ?? { html: "", text: "" };
  const isEditing = canEdit && mode === "editing";
  const hasBrief = Boolean(brief.text.trim() || /<img\b/i.test(brief.html));

  return (
    <div
      className={`ab-canvas-requirement ab-canvas-requirement--${elementType}${mode ? ` is-${mode}` : ""}`}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onBlur={(event) => {
        if (!isEditing) return;
        const nextTarget = event.relatedTarget as Node | null;
        if (!nextTarget || !event.currentTarget.contains(nextTarget)) onFinishEditing();
      }}
    >
      <button
        type="button"
        className="ab-canvas-requirement-toggle"
        aria-expanded={Boolean(mode)}
        aria-label={`${elementType === "image" ? "图片" : "动效"}需求`}
        onPointerDown={(event) => event.preventDefault()}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onToggle}
      >
        <span>需求</span>
        {mode ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {isEditing ? (
        <RequirementRichText
          value={brief}
          onChange={onChange}
          className="ab-rich-text-editor--canvas"
          placeholder={elementType === "image" ? "输入图片需求..." : "输入动效需求..."}
          autoFocus
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            event.stopPropagation();
            onFinishEditing();
          }}
        />
      ) : mode === "preview" ? (
        <div
          className={`ab-canvas-requirement-preview${canEdit ? " ab-canvas-requirement-preview--interactive" : ""}`}
          role={canEdit ? "button" : undefined}
          tabIndex={canEdit ? 0 : undefined}
          aria-label={canEdit ? `编辑${elementType === "image" ? "图片" : "动效"}需求` : undefined}
          onKeyDown={(event) => {
            if (!canEdit || (event.key !== "Enter" && event.key !== " ")) return;
            event.preventDefault();
            event.currentTarget.blur();
            onEdit();
          }}
          onClick={(event) => {
            event.stopPropagation();
            if (canEdit) onEdit();
          }}
        >
          {hasBrief ? <RichTextPreview value={brief} /> : <span className="ab-canvas-requirement-empty">未填写需求</span>}
        </div>
      ) : null}
    </div>
  );
}

function TextFormatToolbar({
  element,
  onUpdate,
  onMark,
}: {
  element: TextElement;
  onUpdate: (patch: Partial<TextElement>) => void;
  onMark: (type: TextAnnotationType) => void;
}) {
  const leftPercent = (element.x / CANVAS_WIDTH) * 100;
  const positionStyle = {
    left: `clamp(2%, ${leftPercent}%, calc(100% - min(560px, calc(100vw - 32px))))`,
    top: `${Math.max(8, (element.y / CANVAS_HEIGHT) * 100 - 16)}%`,
  };

  return (
    <div className="ab-text-format-toolbar" style={positionStyle} onPointerDown={(event) => event.stopPropagation()}>
      <select aria-label="文本样式" defaultValue="正文">
        <option>正文</option>
      </select>
      <label className="ab-format-color" title="文字颜色">
        <span style={{ color: element.color }}>A</span>
        <input aria-label="文字颜色" type="color" value={element.color} onChange={(event) => onUpdate({ color: event.target.value })} />
        <ChevronDown size={12} />
      </label>
      <span className="ab-format-divider" />
      <button type="button" className={`ab-format-button${element.fontWeight === "bold" ? " is-active" : ""}`} aria-label="粗体" title="粗体" onClick={() => onUpdate({ fontWeight: element.fontWeight === "bold" ? "regular" : "bold" })}><Bold size={16} /></button>
      <button type="button" className={`ab-format-button${element.italic ? " is-active" : ""}`} aria-label="斜体" title="斜体" onClick={() => onUpdate({ italic: !element.italic })}><Italic size={16} /></button>
      <button type="button" className={`ab-format-button${element.underline ? " is-active" : ""}`} aria-label="下划线" title="下划线" onClick={() => onUpdate({ underline: !element.underline })}><Underline size={16} /></button>
      <span className="ab-format-divider" />
      <button type="button" className={`ab-format-button${(element.textAlign ?? "left") === "left" ? " is-active" : ""}`} aria-label="左对齐" title="左对齐" onClick={() => onUpdate({ textAlign: "left" })}><AlignLeft size={16} /></button>
      <button type="button" className={`ab-format-button${element.textAlign === "center" ? " is-active" : ""}`} aria-label="居中对齐" title="居中对齐" onClick={() => onUpdate({ textAlign: "center" })}><AlignCenter size={16} /></button>
      <button type="button" className={`ab-format-button${element.textAlign === "right" ? " is-active" : ""}`} aria-label="右对齐" title="右对齐" onClick={() => onUpdate({ textAlign: "right" })}><AlignRight size={16} /></button>
      <button type="button" className={`ab-format-button${element.textAlign === "justify" ? " is-active" : ""}`} aria-label="两端对齐" title="两端对齐" onClick={() => onUpdate({ textAlign: "justify" })}><AlignJustify size={16} /></button>
      <span className="ab-format-divider" />
      <button type="button" className="ab-format-text-button" onMouseDown={(event) => event.preventDefault()} onClick={() => onMark("word")}>+好词</button>
      <button type="button" className="ab-format-text-button" onMouseDown={(event) => event.preventDefault()} onClick={() => onMark("sentence")}>+好句</button>
      <button type="button" className="ab-format-text-button" onMouseDown={(event) => event.preventDefault()} onClick={() => onMark("note")}>+注释</button>
    </div>
  );
}

const COVER_TEXT_FIELD_LABELS: Record<CoverTextField, string> = {
  title: "标题",
  topic: "绘本主题",
  wordCount: "阅读字数",
  fiction: "虚构/非虚构",
};

const COVER_TEXT_FIELD_PLACEHOLDERS: Record<CoverTextField, string> = {
  title: "请输入标题",
  topic: "请输入绘本主题",
  wordCount: "请输入阅读字数",
  fiction: "请输入类型",
};

function CoverLayoutConfig({
  layout,
  research,
  onChange,
}: {
  layout: CoverLayout;
  research: boolean;
  onChange: (layout: CoverLayout) => void;
}) {
  return (
    <div className={`ab-cover-layout-config${research ? "" : " is-readonly"}`}>
      <span className="ab-cover-layout-config__label">封面布局</span>
      {research ? (
        <div className="ab-cover-layout-config__control" role="group" aria-label="封面布局">
          <button type="button" className={layout === "split" ? "is-active" : ""} aria-pressed={layout === "split"} onClick={() => onChange("split")}>左右布局</button>
          <button type="button" className={layout === "fullscreen" ? "is-active" : ""} aria-pressed={layout === "fullscreen"} onClick={() => onChange("fullscreen")}>全屏布局</button>
        </div>
      ) : (
        <span className="ab-cover-layout-config__readonly-value">{layout === "split" ? "左右布局" : "全屏布局"} · 只读</span>
      )}
    </div>
  );
}

function CoverTextSlot({
  element,
  selected,
  editing,
  research,
  onSelect,
  onBeginEdit,
  onChange,
  onEndEdit,
}: {
  element: TextElement;
  selected: boolean;
  editing: boolean;
  research: boolean;
  onSelect: () => void;
  onBeginEdit: () => void;
  onChange: (content: string) => void;
  onEndEdit: () => void;
}) {
  const field = element.coverField;
  const contentRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef(false);
  const value = element.content;

  if (!field) return null;
  const geometry = COVER_TEXT_GEOMETRY[field];
  const isTitle = field === "title";

  const content = (
    <input
      ref={contentRef}
      className="ab-cover-text-value"
      type="text"
      value={value}
      readOnly={!research}
      aria-label={`封面${COVER_TEXT_FIELD_LABELS[field]}`}
      placeholder={COVER_TEXT_FIELD_PLACEHOLDERS[field]}
      onFocus={() => { if (research) onBeginEdit(); else onSelect(); }}
      onCompositionStart={() => { isComposingRef.current = true; }}
      onCompositionEnd={() => {
        isComposingRef.current = false;
      }}
      onChange={(event) => { if (research) onChange(event.target.value); }}
      onBlur={onEndEdit}
      onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
        event.stopPropagation();
        if (isComposingRef.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
        if (event.key === "Escape" || event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
    />
  );

  return (
    <div
      className={`ab-cover-text-slot ab-cover-text-slot--${field}${selected ? " is-selected" : ""}${!value.trim() ? " is-empty" : ""}${editing ? " is-editing" : ""}`}
      style={{
        left: `${(geometry.x / CANVAS_WIDTH) * 100}%`,
        top: `${(geometry.y / CANVAS_HEIGHT) * 100}%`,
        width: `${(geometry.width / CANVAS_WIDTH) * 100}%`,
        height: `${(geometry.height / CANVAS_HEIGHT) * 100}%`,
        zIndex: 4,
      }}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
        contentRef.current?.focus();
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        if (research) onBeginEdit();
      }}
      onKeyDown={(event) => {
        if (!editing && research && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onBeginEdit();
        }
      }}
    >
      {isTitle ? content : (
        <div className="ab-cover-text-meta-row">
          <span className="ab-cover-text-bullet" aria-hidden="true" />
          <span className="ab-cover-text-label">{COVER_TEXT_FIELD_LABELS[field]}</span>
          {content}
        </div>
      )}
    </div>
  );
}

function CoverMediaElement({
  children,
  element,
  layout,
  selected,
  research,
  requirement,
  onSelect,
  onRequestUpload,
  onDelete,
  onChangeMedia,
}: {
  element: ImageElement | MotionElement;
  children: React.ReactNode;
  layout: CoverLayout;
  selected: boolean;
  research: boolean;
  requirement?: ProductionRequirement;
  onSelect: () => void;
  onRequestUpload: () => void;
  onDelete: () => void;
  onChangeMedia: (type: "image" | "motion") => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isImage = element.type === "image";
  const mediaType = isImage ? "image" : "motion";
  const geometry = layout === "split" ? COVER_SPLIT_IMAGE : COVER_FULLSCREEN_MEDIA;
  const mediaSource = element.src;
  const isVideoSource = !isImage && typeof mediaSource === "string" && (
    mediaSource.startsWith("data:video/") || /\.(mp4|webm|mov)(?:$|\?)/i.test(mediaSource)
  );

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleDocumentPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", handleDocumentPointerDown);
    document.addEventListener("keydown", handleDocumentKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [menuOpen]);

  const media = element.src ? (
    isVideoSource ? (
      <video className="ab-cover-media-content" src={element.src} autoPlay loop muted playsInline aria-label="封面动效" />
    ) : (
      <img className="ab-cover-media-content" src={element.src} alt={isImage ? element.alt : "封面动效静态预览"} draggable={false} />
    )
  ) : (
    <div className={`ab-cover-media-placeholder${isImage ? " is-image" : " is-motion"}`}>
      {isImage ? <FileImage size={24} aria-hidden="true" /> : <ImagePlus size={24} aria-hidden="true" />}
      <span>{isImage ? "待制作图片" : "待上传动效"}</span>
    </div>
  );

  return (
    <div
      className={`ab-cover-media-element ab-cover-media-element--${layout}${selected ? " is-selected" : ""}`}
      style={{
        left: `${(geometry.x / CANVAS_WIDTH) * 100}%`,
        top: `${(geometry.y / CANVAS_HEIGHT) * 100}%`,
        width: `${(geometry.width / CANVAS_WIDTH) * 100}%`,
        height: `${(geometry.height / CANVAS_HEIGHT) * 100}%`,
        zIndex: element.zIndex,
      }}
      role="button"
      tabIndex={0}
      aria-label={`封面${isImage ? "图片" : "动效"}`}
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest("button")) return;
        event.stopPropagation();
        onSelect();
      }}
      onClick={(event) => {
        event.stopPropagation();
        if ((event.target as HTMLElement).closest("button")) return;
        if (!research) onRequestUpload();
        else onSelect();
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (!research) onRequestUpload();
          else onSelect();
        }
      }}
    >
      <div className="ab-cover-media-surface">{media}</div>
      <div className="ab-canvas-requirement-layer">{children}</div>
      <div className={`ab-cover-media-tag ab-cover-media-tag--${mediaType}`}>
        {layout === "fullscreen" ? (
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
            aria-label="切换封面媒体类型"
            disabled={!research}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen((open) => !open);
            }}
          >
            {isImage ? "图片" : "动效"}<ChevronDown size={14} aria-hidden="true" />
          </button>
        ) : <span>图片</span>}
      </div>
      {layout === "fullscreen" && menuOpen && (
        <div ref={menuRef} className="ab-cover-media-menu" role="listbox" aria-label="封面媒体类型">
          {(["image", "motion"] as const).map((type) => (
            <button
              key={type}
              type="button"
              role="option"
              aria-selected={mediaType === type}
              className={mediaType === type ? "is-selected" : ""}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onChangeMedia(type);
                setMenuOpen(false);
              }}
            >
              {type === "image" ? "图片" : "动效"}
            </button>
          ))}
        </div>
      )}
      {!research && (
        <div
          className="ab-cover-media-actions"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <button type="button" aria-label={`上传${isImage ? "图片" : "动效"}`} title={`上传${isImage ? "图片" : "动效"}`} onClick={onRequestUpload}>
            <Upload size={16} aria-hidden="true" />
          </button>
          {element.src && <button type="button" aria-label={`删除${isImage ? "图片" : "动效"}`} title={`删除${isImage ? "图片" : "动效"}`} onClick={onDelete}><Trash2 size={16} aria-hidden="true" /></button>}
        </div>
      )}
      {!research && requirement?.status === "failed" && (
        <span className="ab-cover-media-error">{requirement.errorMessage || "上传失败，可重试"}</span>
      )}
    </div>
  );
}

function CoverAudioPanel({
  research,
  requirement,
  onChange,
  onSupplement,
  onUpload,
}: {
  research: boolean;
  requirement?: ProductionRequirement;
  onChange: (brief: ProductionRequirement["brief"]) => void;
  onSupplement: (brief: ProductionRequirement["brief"]) => void;
  onUpload: (file: File) => void;
}) {
  const [open, setOpen] = useState(false);
  const [requirementOpen, setRequirementOpen] = useState(true);
  const brief = requirement?.brief ?? { html: "", text: "" };
  const supplement = requirement?.supplementalBrief ?? { html: "", text: "" };
  return (
    <div className="ab-cover-audio-panel">
      {!open ? (
        <button type="button" className="ab-cover-audio-trigger" aria-expanded={false} onClick={() => setOpen(true)}>
          <Plus size={16} aria-hidden="true" />封面语音
        </button>
      ) : (
        <section className="ab-cover-audio-module">
          <div className="ab-cover-audio-module-header">
            <strong>讲解语音</strong>
            <button type="button" className="ab-cover-audio-close" aria-label="收起封面语音" title="收起封面语音" onClick={() => setOpen(false)}><X size={18} aria-hidden="true" /></button>
          </div>
          <div className="ab-cover-audio-media">
            <span className="ab-cover-audio-tag">语音</span>
            {research && !requirement?.asset && (
              <div className="ab-cover-audio-placeholder">
                <img src={new URL("./assets/cover-audio-placeholder.svg", import.meta.url).href} width={65} height={65} alt="暂无讲解语音" />
              </div>
            )}
            {!research && <label
              className={`ab-cover-audio-upload${research ? " is-readonly" : ""}`}
              onDragOver={(event) => { if (!research) { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; } }}
              onDrop={(event) => {
                if (research) return;
                event.preventDefault();
                const file = event.dataTransfer.files[0];
                if (file) onUpload(file);
              }}
            >
              <Upload size={24} aria-hidden="true" />
              <span>{requirement?.asset ? `已有音频：${requirement.asset.fileName}，点击或拖拽替换` : "点击或拖拽音频进行上传"}</span>
              <input className="ab-hidden-input" type="file" accept="audio/*" disabled={research} onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(file); event.currentTarget.value = ""; }} />
            </label>}
            {requirement?.asset && <audio className="ab-cover-audio-player" controls src={requirement.asset.url} aria-label="播放封面语音" />}
            <div className="ab-cover-audio-demand">
              <button type="button" className="ab-cover-audio-demand-toggle" aria-expanded={requirementOpen} onClick={() => setRequirementOpen((value) => !value)}>
                <span>需求</span>{requirementOpen ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronUp size={14} aria-hidden="true" />}
              </button>
              {requirementOpen && (
                <div className="ab-cover-audio-demand-rows">
                  <div className="ab-cover-audio-demand-row">
                    <span className="ab-cover-audio-demand-label">需求</span>
                    <textarea className="ab-cover-audio-text-input" aria-label="封面语音需求" value={brief.text} readOnly={!research} placeholder="输入封面语音需求..." onChange={(event) => { const text = event.target.value; const node = document.createElement("div"); node.textContent = text; onChange({ text, html: node.innerHTML.replace(/\n/g, "<br>") }); }} />
                  </div>
                  <div className="ab-cover-audio-demand-row">
                    <span className="ab-cover-audio-demand-label">补充</span>
                    <textarea className="ab-cover-audio-text-input" aria-label="封面语音补充需求" value={supplement.text} readOnly={!research} placeholder="输入补充需求..." onChange={(event) => { const text = event.target.value; const node = document.createElement("div"); node.textContent = text; onSupplement({ text, html: node.innerHTML.replace(/\n/g, "<br>") }); }} />
                  </div>
                </div>
              )}
            </div>
            {requirement?.status === "failed" && <div className="ab-upload-error"><AlertCircle size={14} />上传失败，可重试</div>}
          </div>
        </section>
      )}
    </div>
  );
}


function LayersPanel({
  elements,
  selectedId,
  onSelect,
  onMove,
  onReorder,
  onToggleVisibility,
  onOpenRequirement,
}: {
  elements: BookElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, direction: "up" | "down" | "top" | "bottom") => void;
  onReorder: (id: string, targetId: string, position: LayerDropPosition) => void;
  onToggleVisibility: (id: string) => void;
  onOpenRequirement: (element: BookElement) => void;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; position: LayerDropPosition } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const resetDrag = () => {
    setDraggedId(null);
    setDropTarget(null);
  };

  const getDropTargetAtPoint = (clientX: number, clientY: number) => {
    const target = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>("[data-layer-id]");
    if (!target || !panelRef.current?.contains(target)) return null;
    const targetId = target.dataset.layerId;
    if (!targetId) return null;
    const rect = target.getBoundingClientRect();
    return {
      id: targetId,
      position: clientY < rect.top + rect.height / 2 ? "before" as const : "after" as const,
    };
  };

  useEffect(() => {
    if (!draggedId) return undefined;
    const handlePointerMove = (event: PointerEvent) => {
      const target = getDropTargetAtPoint(event.clientX, event.clientY);
      setDropTarget(target && target.id !== draggedId ? target : null);
    };
    const handlePointerUp = (event: PointerEvent) => {
      const target = getDropTargetAtPoint(event.clientX, event.clientY);
      if (target && target.id !== draggedId) onReorder(draggedId, target.id, target.position);
      resetDrag();
    };
    const handlePointerCancel = () => resetDrag();
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [draggedId, onReorder]);

  return (
    <div
      id="ab-canvas-layer-panel"
      className="ab-canvas-layer-panel"
      ref={panelRef}
      role="region"
      aria-label="图层顺序"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="ab-canvas-layer-list" role="list" aria-label="当前页面图层">
        {elements.length === 0 && <div className="ab-canvas-layer-empty">当前页面暂无元素</div>}
        {elements.map((element, index) => {
          const hidden = element.hidden === true;
          const typeLabel = getLayerTypeLabel(element.type);
          const isDropBefore = dropTarget?.id === element.id && dropTarget.position === "before";
          const isDropAfter = dropTarget?.id === element.id && dropTarget.position === "after";
          return (
            <div
              key={element.id}
              className={`ab-canvas-layer-row${selectedId === element.id ? " is-selected" : ""}${hidden ? " is-hidden" : ""}${draggedId === element.id ? " is-dragging" : ""}${isDropBefore ? " is-drop-before" : ""}${isDropAfter ? " is-drop-after" : ""}`}
              role="listitem"
              data-layer-id={element.id}
              aria-posinset={index + 1}
              aria-setsize={elements.length}
              onClick={() => onSelect(element.id)}
            >
              <span
                className="ab-canvas-layer-drag"
                role="button"
                tabIndex={0}
                aria-label={`拖动${typeLabel}“${elementName(element)}”，可使用上下方向键调整顺序`}
                title="拖动调整图层顺序"
                onPointerDown={(event) => {
                  if (event.button !== 0) return;
                  event.preventDefault();
                  event.stopPropagation();
                  setDraggedId(element.id);
                  setDropTarget(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    event.stopPropagation();
                    onMove(element.id, "up");
                  } else if (event.key === "ArrowDown") {
                    event.preventDefault();
                    event.stopPropagation();
                    onMove(element.id, "down");
                  } else if (event.key === "Home") {
                    event.preventDefault();
                    event.stopPropagation();
                    onMove(element.id, "top");
                  } else if (event.key === "End") {
                    event.preventDefault();
                    event.stopPropagation();
                    onMove(element.id, "bottom");
                  }
                }}
              >
                <GripVertical size={14} aria-hidden="true" />
              </span>
              <span className={`ab-canvas-layer-icon ab-canvas-layer-icon--${element.type}`} aria-hidden="true">
                {getLayerTypeIcon(element.type)}
              </span>
              <span className="ab-canvas-layer-name" title={elementName(element)}>{elementName(element)}</span>
              {(element.type === "image" || element.type === "motion") && (
                <button
                  type="button"
                  className="ab-canvas-layer-requirement"
                  aria-label={`打开${element.type === "image" ? "图片" : "动效"}需求`}
                  title="打开需求"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenRequirement(element);
                  }}
                >
                  <ClipboardList size={13} aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                className="ab-canvas-layer-visibility"
                aria-label={`${hidden ? "显示" : "隐藏"}${typeLabel}`}
                title={hidden ? `显示${typeLabel}` : `隐藏${typeLabel}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleVisibility(element.id);
                }}
              >
                {hidden ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
