import { useEffect, useMemo, useRef, useState } from "react";
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
  ChevronsDown,
  ChevronsUp,
  ClipboardList,
  CircleX,
  CircleHelp,
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
  PanelLeft,
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
  Italic,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getElementLabel, initialAnimationBook } from "./data";
import {
  ANNOTATION_LABELS,
  buildAnnotationSegments,
  createAnnotation,
  getTextSelectionRange,
  hasAnnotationContent,
  normalizeAnnotations,
  selectTextRange,
  type TextSelectionRange,
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
  type ImageElement,
  type MotionElement,
  type ProductionAsset,
  type ProductionRequirement,
  type PlaybackDisplayMode,
  type PlaybackOrderItem,
  type RequirementType,
  type TextAnnotation,
  type TextAnnotationType,
  type TextElement,
  type UserRole,
} from "./types";
import "./animation-book.css";

type ViewId = "cover" | string;
type PanelTab = "properties" | "layers" | "requirements" | AnnotationPanelTab;
type ResizeCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

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
type PlaybackDropPosition = "before" | "after";

const BASIC_INFO_MUSIC_OPTIONS = [
  { id: "cicada", title: "静静引路--Cicada", duration: "03:54" },
  { id: "spring", title: "春风亲吻我像蛋挞--麦兜", duration: "03:54" },
  { id: "fengshen", title: "风神125--交工乐队", duration: "09:47" },
  { id: "spring-garden", title: "春田花花幼稚园园歌--小墨鱼装死班合唱团", duration: "02:08" },
  { id: "pacific", title: "太平洋的风--胡德夫", duration: "04:43" },
];

const ANIMATION_BOOK_GRID_ASSET = "/animation-book/assets/animation-book-grid-system.png";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const elementName = (element: BookElement) => {
  if (element.type === "text") return element.content.split("\n")[0] || "未命名文本";
  if (element.type === "image") return element.alt || "未命名图片";
  if (element.type === "motion") return element.fileName || "未命名动效";
  return element.content.split("\n")[0] || "未命名气泡";
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

const readFileAsDataUrl = (file: File, onReady: (dataUrl: string) => void, onError?: () => void) => {
  const reader = new FileReader();
  reader.onload = () => onReady(reader.result as string);
  reader.onerror = onError ?? null;
  reader.readAsDataURL(file);
};

const getVoiceItems = (page: AnimationBookPage): VoiceItem[] => page.elements
  .filter((element): element is TextElement | BubbleElement => element.type === "text" || element.type === "bubble")
  .map((element) => ({
    id: element.id,
    type: element.type,
    content: element.content,
    hasAudio: Boolean(element.audioUrl),
  }));

const createPlaybackOrder = (elements: BookElement[]): PlaybackOrderItem[] => elements.map((element) => ({
  elementId: element.id,
  displayMode: "always",
}));

const normalizePlaybackOrder = (page: AnimationBookPage): PlaybackOrderItem[] => {
  const elementsById = new Map(page.elements.map((element) => [element.id, element]));
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
      .filter((element) => !existingIds.has(element.id))
      .map((element) => ({ elementId: element.id, displayMode: "always" as const })),
  ];
};

const needsDeleteConfirmation = (element: BookElement) =>
  (element.type === "text" && element.content.trim().length > 0) ||
  (element.type === "bubble" && element.content.trim().length > 0) ||
  (element.type === "image" && element.src.trim().length > 0) ||
  (element.type === "motion" && Boolean(element.src));

export function AnimationBookEditor() {
  const [book, setBook] = useState<AnimationBook>(() => structuredClone(initialAnimationBook));
  const [role, setRole] = useState<UserRole>("research");
  const [viewId, setViewId] = useState<ViewId>("page-1");
  const [selectedId, setSelectedId] = useState<string | null>("page-1-text");
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>("page-1-image-brief");
  const [editingTextId, setEditingTextId] = useState<string | null>("page-1-text");
  const [activeRequirement, setActiveRequirement] = useState<{ id: string; mode: "editing" | "preview" } | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>("voice");
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; position: PageDropPosition } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [pendingPageDelete, setPendingPageDelete] = useState<PendingPageDelete | null>(null);
  const [pendingAnnotationDelete, setPendingAnnotationDelete] = useState<PendingAnnotationDelete | null>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [textSelection, setTextSelection] = useState<(TextSelectionRange & { elementId: string }) | null>({
    elementId: "page-1-text",
    start: 0,
    end: 4,
  });
  const [showBasicInfo, setShowBasicInfo] = useState(false);
  const [backgroundMusicChoice, setBackgroundMusicChoice] = useState("spring");
  const [backgroundMusicStyle, setBackgroundMusicStyle] = useState("安静");
  const [showSafeArea, setShowSafeArea] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);
  const pointerDragRef = useRef<PointerDrag | null>(null);

  const currentPage = getPage(book, viewId);
  const isResearch = role === "research";
  const selectedElement = currentPage?.elements.find((element) => element.id === selectedId) ?? null;
  const isTextToolActive = isResearch && selectedElement?.type === "text" && editingTextId === selectedElement.id;
  const sortedElements = useMemo(
    () => [...(currentPage?.elements ?? [])].sort((a, b) => a.zIndex - b.zIndex),
    [currentPage],
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

  const selectView = (nextViewId: ViewId) => {
    const nextPage = getPage(book, nextViewId);
    setViewId(nextViewId);
    setSelectedId(nextPage?.elements[0]?.id ?? null);
    setSelectedRequirementId(nextPage?.requirements[0]?.id ?? null);
    setEditingTextId(null);
    setActiveRequirement(null);
    setPendingDelete(null);
    setPendingPageDelete(null);
    setPendingAnnotationDelete(null);
    setSelectedAnnotationId(null);
    setTextSelection(null);
    setShowBasicInfo(false);
    const defaultText = nextPage?.elements.find((element): element is TextElement => element.type === "text");
    if (role === "research" && nextPage?.kind === "page" && defaultText && defaultText.content.length > 0) {
      setSelectedId(defaultText.id);
      setEditingTextId(defaultText.id);
      setTextSelection({ elementId: defaultText.id, start: 0, end: Math.min(4, defaultText.content.length) });
      setPanelTab("voice");
    } else {
      setPanelTab(role === "research" ? "properties" : "requirements");
    }
  };

  const selectRole = (nextRole: UserRole) => {
    setRole(nextRole);
    setEditingTextId(null);
    setActiveRequirement(null);
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
      setPanelTab("voice");
    } else {
      setPanelTab("requirements");
    }
    if (nextRole === "production") setSelectedRequirementId(currentPage?.requirements[0]?.id ?? null);
  };

  const modifyCurrentPage = (updater: (page: AnimationBookPage) => AnimationBookPage) => {
    setBook((previous) => updatePage(previous, viewId, updater));
  };

  const selectElement = (elementId: string) => {
    setSelectedId(elementId);
    setActiveRequirement(null);
    const nextElement = currentPage?.elements.find((element) => element.id === elementId);
    if (nextElement?.type !== "text") {
      setTextSelection(null);
      setSelectedAnnotationId(null);
      if (isResearch) setPanelTab("properties");
    } else if (isResearch) {
      setPanelTab("voice");
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
    setActiveRequirement((active) => {
      if (active?.id === requirement.id && active.mode === "editing") {
        return { id: requirement.id, mode: "preview" };
      }
      return { id: requirement.id, mode: isResearch ? "editing" : "preview" };
    });
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
    setActiveRequirement((active) => active?.id === requirementId
      ? { id: requirementId, mode: "preview" }
      : active);
  };

  const updateElementById = (elementId: string, patch: Partial<BookElement>) => {
    if (!isResearch) return;
    modifyCurrentPage((page) =>
      replaceElement(page, elementId, (element) => ({ ...element, ...patch } as BookElement)),
    );
  };

  const updateTextContent = (elementId: string, content: string) => {
    if (!isResearch) return;
    modifyCurrentPage((page) => replaceElement(page, elementId, (element) => {
      if (element.type !== "text") return element;
      return {
        ...element,
        content,
        annotations: normalizeAnnotations(content, element.annotations),
      };
    }));
  };

  const updateAnnotation = (annotationId: string, patch: Partial<TextAnnotation>) => {
    if (!isResearch) return;
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
    if (!isResearch) return;
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
    if (!isResearch || !textSelection) return;
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
    if (tab === "voice" || tab === "standard" || tab === "playback") return;
    const firstAnnotation = currentAnnotations.find((annotation) => annotation.type === tab);
    setSelectedAnnotationId(firstAnnotation?.id ?? null);
  };

  const removeAnnotation = (annotationId: string) => {
    if (!isResearch) return;
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
    if (!isResearch) return;
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

  const updateElementGeometry = (elementId: string, patch: Pick<BookElement, "x" | "y" | "width" | "height"> | Partial<Pick<BubbleElement, "direction" | "tailX" | "tailY">>) => {
    const element = currentPage?.elements.find((candidate) => candidate.id === elementId);
    if (!element || (!isResearch && !["image", "motion", "bubble"].includes(element.type))) return;
    modifyCurrentPage((page) =>
      replaceElement(page, elementId, (candidate) => ({ ...candidate, ...patch } as BookElement)),
    );
  };

  const updateSelectedElement = (patch: Partial<BookElement>) => {
    if (selectedId) updateElementGeometry(selectedId, patch as Pick<BookElement, "x" | "y" | "width" | "height">);
  };

  const addElement = (element: BookElement) => {
    if (!isResearch) return;
    const visualRequirement = element.type === "image" || element.type === "motion"
      ? createVisualRequirement(element)
      : null;
    modifyCurrentPage((page) => ({
      ...page,
      elements: [...page.elements, element],
      appearanceOrder: [...page.appearanceOrder, element.id],
      requirements: visualRequirement
        ? [...page.requirements, visualRequirement]
        : page.requirements,
      playbackOrder: page.kind === "page"
        ? [...normalizePlaybackOrder(page), {
            elementId: element.id,
            displayMode: "always" as const,
          }]
        : page.playbackOrder,
    }));
    setSelectedId(element.id);
    setEditingTextId(element.type === "bubble" ? element.id : null);
    setActiveRequirement(visualRequirement ? { id: visualRequirement.id, mode: "editing" } : null);
    if (visualRequirement) setSelectedRequirementId(visualRequirement.id);
    setSelectedAnnotationId(null);
    setTextSelection(null);
    setPanelTab(element.type === "text" || element.type === "bubble" ? "voice" : "properties");
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
      annotations: [],
    });
  };

  const addBubble = () => {
    addElement({
      id: createId("bubble"),
      type: "bubble",
      x: 820,
      y: 620,
      width: 420,
      height: 150,
      zIndex: Math.max(0, ...currentPage.elements.map((element) => element.zIndex)) + 1,
      content: "",
      direction: "left",
      tailX: 8,
      tailY: 68,
      audioUrl: null,
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

  const requestAudioUpload = () => {
    notify(isResearch ? "音频产物由制作人员上传" : "请在需求 / 产物面板上传音频");
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
      notify("产物已上传");
    }, () => {
      modifyCurrentPage((page) => ({
        ...page,
        requirements: page.requirements.map((candidate) => candidate.id === requirementId ? { ...candidate, status: "failed", errorMessage: "文件读取失败，请重试" } : candidate),
      }));
      notify("文件读取失败，请重试");
    });
  };

  const removeElement = (elementId: string) => {
    if (!isResearch) return;
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
    setActiveRequirement(null);
    setSelectedAnnotationId(null);
    setTextSelection(null);
    setPendingDelete(null);
  };

  const requestRemoveElement = (elementId: string) => {
    if (!isResearch) return;
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
      elements: [
        {
          id: createId("text"),
          type: "text",
          x: 180,
          y: 220,
          width: 1560,
          height: 220,
          zIndex: 1,
          content: "在这里输入页面文本",
          fontSize: 42,
          color: "#404040",
          fontWeight: "regular",
          audioUrl: null,
          annotations: [],
        },
      ],
      appearanceOrder: [],
      playbackOrder: [],
      requirements: [],
    };
    newPage.appearanceOrder = newPage.elements.map((element) => element.id);
    newPage.playbackOrder = createPlaybackOrder(newPage.elements);
    setBook((previous) => ({ ...previous, pages: [...previous.pages, newPage] }));
    setViewId(id);
    setSelectedId(newPage.elements[0].id);
    setActiveRequirement(null);
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
      setViewId(nextPage?.id ?? "cover");
      setSelectedId(nextPage?.elements[0]?.id ?? null);
      setSelectedRequirementId(nextPage?.requirements[0]?.id ?? null);
      setActiveRequirement(null);
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
    if ((mode === "tail" && element.type !== "bubble") || (!isResearch && !["image", "motion", "bubble"].includes(element.type))) {
      setSelectedId(element.id);
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
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
      const tailX = clamp((((event.clientX - rect.left) * scaleX) - draggedElement.x) / draggedElement.width * 100, 0, 100);
      const tailY = clamp((((event.clientY - rect.top) * scaleY) - draggedElement.y) / draggedElement.height * 100, 0, 100);
      updateElementGeometry(drag.id, { tailX, tailY });
      return;
    }
    const minWidth = 80;
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
      const fromLeft = drag.corner.includes("left");
      const fromTop = drag.corner.includes("top");
      const right = drag.origin.x + drag.origin.width;
      const bottom = drag.origin.y + drag.origin.height;
      if (fromLeft) {
        next.x = clamp(drag.origin.x + deltaX, 0, right - minWidth);
        next.width = right - next.x;
      } else {
        next.width = clamp(drag.origin.width + deltaX, minWidth, CANVAS_WIDTH - drag.origin.x);
      }
      if (fromTop) {
        next.y = clamp(drag.origin.y + deltaY, 0, bottom - minHeight);
        next.height = bottom - next.y;
      } else {
        next.height = clamp(drag.origin.height + deltaY, minHeight, CANVAS_HEIGHT - drag.origin.y);
      }
    }
    updateSelectedElement(next);
  };

  const endPointerDrag = () => {
    pointerDragRef.current = null;
  };

  const moveLayer = (elementId: string, direction: "up" | "down" | "top" | "bottom") => {
    if (!isResearch) return;
    modifyCurrentPage((page) => {
      const ordered = [...page.elements].sort((a, b) => a.zIndex - b.zIndex);
      const index = ordered.findIndex((element) => element.id === elementId);
      if (index < 0) return page;
      let targetIndex = index;
      if (direction === "up") targetIndex = Math.min(index + 1, ordered.length - 1);
      if (direction === "down") targetIndex = Math.max(index - 1, 0);
      if (direction === "top") targetIndex = ordered.length - 1;
      if (direction === "bottom") targetIndex = 0;
      if (targetIndex === index) return page;
      const [moved] = ordered.splice(index, 1);
      ordered.splice(targetIndex, 0, moved);
      return {
        ...page,
        elements: page.elements.map((element) => ({
          ...element,
          zIndex: ordered.findIndex((candidate) => candidate.id === element.id) + 1,
        })),
      };
    });
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
      if (showBasicInfo) {
        setShowBasicInfo(false);
      } else if (pendingPageDelete) {
        setPendingPageDelete(null);
      } else if (pendingAnnotationDelete) {
        setPendingAnnotationDelete(null);
      } else if (pendingDelete) {
        setPendingDelete(null);
      } else if (activeRequirement) {
        setActiveRequirement(null);
      } else if (editingTextId) {
        setEditingTextId(null);
      } else {
        setSelectedId(null);
      }
      return;
    }
    if (isResearch && (event.key === "Delete" || event.key === "Backspace") && selectedId) {
      event.preventDefault();
      requestRemoveElement(selectedId);
    }
  };

  const isContextPanel = isResearch && (
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
                  <div className="ab-editor-sticky-toolbar">
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
                        {isResearch ? (
                          <>
                            <ToolButton icon={<Type size={18} />} label="添加文本" displayLabel="文字" active={isTextToolActive} onClick={addText} />
                            <ToolButton icon={<ImageIcon size={18} />} label="添加图片占位" displayLabel="图片" onClick={addImagePlaceholder} />
                            <ToolButton icon={<Film size={18} />} label="添加动效占位" displayLabel="动效" onClick={addMotion} />
                            <ToolButton icon={<MessageCircle size={18} />} label="添加对话气泡" displayLabel="对话" onClick={addBubble} />
                            <span className="ab-tool-divider" />
                            <ToolButton icon={<Gamepad2 size={18} />} label="标准互动（暂未开放）" displayLabel="题" disabled />
                            <ToolButton icon={<Hand size={18} />} label="互动（暂未开放）" displayLabel="互动" disabled />
                          </>
                        ) : (
                          <>
                            <span className="ab-tool-divider" />
                            <ToolButton icon={<ClipboardList size={18} />} label="查看制作需求" displayLabel="制作需求" active={panelTab === "requirements"} onClick={() => setPanelTab("requirements")} />
                          </>
                        )}
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
                  </div>

                  <div className="ab-canvas-shadow">
                <div
                  ref={canvasRef}
                  className={`ab-canvas ab-canvas--${currentPage?.kind ?? "page"}`}
                  style={{ backgroundColor: currentPage?.backgroundColor ?? "#fefcf8" }}
                  onClick={() => {
                    setSelectedId(null);
                    setActiveRequirement(null);
                    setEditingTextId(null);
                    setTextSelection(null);
                    setSelectedAnnotationId(null);
                  }}
                  onPointerMove={handleCanvasPointerMove}
                  onPointerUp={endPointerDrag}
                  onPointerCancel={endPointerDrag}
                >
                  {showSafeArea && <SafeAreaOverlay />}
                  {currentPage?.kind === "cover" && (
                    <div className={`ab-cover-layout-hint ab-cover-layout-hint--${book.coverLayout}`} aria-hidden="true" />
                  )}
                  {sortedElements.map((element) => {
                    const elementRequirement = element.type === "image" || element.type === "motion"
                      ? getVisualRequirement(currentPage, element)
                      : undefined;
                    return (
                      <CanvasElement
                        key={element.id}
                        element={element}
                        selected={selectedId === element.id}
                        editing={editingTextId === element.id}
                        canEditText={isResearch}
                        canEditGeometry={isResearch || ["image", "motion", "bubble"].includes(element.type)}
                        requirement={elementRequirement}
                        requirementMode={activeRequirement?.mode}
                        requirementOpen={Boolean(elementRequirement && activeRequirement?.id === elementRequirement.id)}
                        onToggleRequirement={() => toggleElementRequirement(element)}
                        onUpdateRequirement={(brief) => {
                          if (elementRequirement) updateCanvasRequirement(elementRequirement.id, brief);
                        }}
                        onFinishRequirementEdit={() => {
                          if (elementRequirement) finishCanvasRequirementEdit(elementRequirement.id);
                        }}
                        onSelect={() => selectElement(element.id)}
                        textSelection={textSelection?.elementId === element.id ? textSelection : undefined}
                        annotations={isResearch && element.type === "text" ? element.annotations : []}
                        onTextSelectionChange={(range) => handleTextSelection(element.id, range)}
                        onRequestDeleteAnnotation={isResearch ? requestRemoveAnnotation : undefined}
                        onBeginTextEdit={() => {
                          selectElement(element.id);
                          if (element.type === "text" || element.type === "bubble") setEditingTextId(element.id);
                        }}
                        onTextChange={(content) => {
                          if (element.type === "text") updateTextContent(element.id, content);
                          else updateElementById(element.id, { content });
                        }}
                        onEndTextEdit={() => setEditingTextId(null)}
                        onPointerDown={(event, mode, corner) => beginPointerDrag(event, element, mode, corner)}
                      />
                    );
                  })}
                  {isResearch && selectedElement?.type === "text" && editingTextId === selectedElement.id && (
                    <TextFormatToolbar
                      element={selectedElement}
                      onUpdate={(patch) => updateElementById(selectedElement.id, patch)}
                      onMark={addTextAnnotation}
                    />
                  )}
                  {isResearch && (
                    <button
                      type="button"
                      className="ab-canvas-layer-trigger"
                      aria-label="打开图层顺序"
                      title="图层顺序"
                      onClick={(event) => {
                        event.stopPropagation();
                        setPanelTab("layers");
                      }}
                    >
                      <Layers3 size={14} aria-hidden="true" />
                    </button>
                  )}
                  {currentPage?.kind === "page" && (
                    <div className="ab-canvas-page-number">{pageIndex + 1}/{book.pages.length}</div>
                  )}
                  <div className="ab-canvas-grid-label" aria-hidden="true">640 × 360</div>
                </div>
                  </div>
                  <div className="ab-canvas-footnote">
                    <span><PanelLeft size={13} /> 生产态编辑区</span>
                  </div>
                </div>

                <div className="ab-editor-panel">
              {isContextPanel ? (
                <TextAnnotationPanel
                  activeTab={panelTab}
                  annotations={currentAnnotations}
                  selectedAnnotationId={selectedAnnotationId}
                  standardInteractionCount={1}
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
                />
              ) : (
                <>
                  {!isResearch && <div className="ab-panel-tabs" role="tablist" aria-label="编辑设置">
                    <PanelTabButton active={panelTab === "requirements"} onClick={() => setPanelTab("requirements")} label="制作需求" count={currentPage?.requirements.length} />
                  </div>}

                  {panelTab === "properties" && (
                    <PropertiesPanel
                      page={currentPage}
                      selectedId={selectedId}
                      onSelectElement={selectElement}
                      coverLayout={book.coverLayout}
                      onCoverLayoutChange={(coverLayout) => { if (isResearch) setBook((previous) => ({ ...previous, coverLayout })); }}
                      onUpdateElement={updateElementById}
                      onRemoveElement={requestRemoveElement}
                      onRequestAudioUpload={requestAudioUpload}
                    />
                  )}
                  {panelTab === "layers" && (
                    <LayersPanel
                      elements={layerElements}
                      selectedId={selectedId}
                      onSelect={selectElement}
                      onMove={moveLayer}
                    />
                  )}
                  {!isResearch && panelTab === "requirements" && (
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
              <p>当前内容“{pendingDelete.name}”已填充，删除后需要重新添加。</p>
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
    (element): element is ImageElement => element.type === "image" && Boolean(element.src.trim()),
  )?.src ?? null;

const getCoverTitle = (page: AnimationBookPage) =>
  page.elements.find((element): element is TextElement => element.type === "text")?.content.split("\n")[0]?.trim() || "未命名标题";

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

function CanvasElement({
  element,
  selected,
  editing,
  canEditText,
  canEditGeometry,
  requirement,
  requirementMode,
  requirementOpen,
  annotations,
  textSelection,
  onSelect,
  onTextSelectionChange,
  onRequestDeleteAnnotation,
  onBeginTextEdit,
  onTextChange,
  onEndTextEdit,
  onToggleRequirement,
  onUpdateRequirement,
  onFinishRequirementEdit,
  onPointerDown,
}: {
  element: BookElement;
  selected: boolean;
  editing: boolean;
  canEditText: boolean;
  canEditGeometry: boolean;
  requirement?: ProductionRequirement;
  requirementMode?: "editing" | "preview";
  requirementOpen: boolean;
  annotations?: TextAnnotation[];
  textSelection?: TextSelectionRange;
  onSelect: () => void;
  onTextSelectionChange?: (range: TextSelectionRange | null) => void;
  onRequestDeleteAnnotation?: (annotationId: string) => void;
  onBeginTextEdit: () => void;
  onTextChange: (content: string) => void;
  onEndTextEdit: () => void;
  onToggleRequirement: () => void;
  onUpdateRequirement: (brief: ProductionRequirement["brief"]) => void;
  onFinishRequirementEdit: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>, mode: "move" | "resize" | "tail", corner?: ResizeCorner) => void;
}) {
  const textContentRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);

  useEffect(() => {
    if (!editing || (element.type !== "text" && element.type !== "bubble") || !textContentRef.current) return;
    textContentRef.current.focus();
    if (element.type === "text" && textSelection) {
      selectTextRange(textContentRef.current, textSelection);
      return;
    }
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(textContentRef.current);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }, [editing, element.type, textSelection]);

  const positionStyle = {
    left: `${(element.x / CANVAS_WIDTH) * 100}%`,
    top: `${(element.y / CANVAS_HEIGHT) * 100}%`,
    width: `${(element.width / CANVAS_WIDTH) * 100}%`,
    height: `${(element.height / CANVAS_HEIGHT) * 100}%`,
    zIndex: requirementOpen ? element.zIndex + 1000 : element.zIndex,
  };
  const editableContentProps = {
    ref: textContentRef,
    contentEditable: editing && canEditText,
    suppressContentEditableWarning: true,
    onCompositionStart: () => { isComposingRef.current = true; },
    onCompositionEnd: (event: React.CompositionEvent<HTMLDivElement>) => {
      isComposingRef.current = false;
      onTextChange(event.currentTarget.textContent ?? "");
    },
    onInput: (event: React.FormEvent<HTMLDivElement>) => {
      const nativeEvent = event.nativeEvent as InputEvent;
      if (isComposingRef.current || nativeEvent.isComposing) return;
      onTextChange(event.currentTarget.textContent ?? "");
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
      }
    },
  };
  const textStyle = element.type === "text" ? {
    fontSize: `${element.fontSize * (EDITOR_WIDTH / CANVAS_WIDTH)}px`,
    color: element.color,
    fontWeight: element.fontWeight === "bold" ? 700 : element.fontWeight === "medium" ? 500 : 400,
    fontStyle: element.italic ? "italic" : "normal",
    textDecoration: element.underline ? "underline" : "none",
    textAlign: element.textAlign ?? "left",
  } as const : undefined;
  const baseProps = {
    className: `ab-canvas-element ab-canvas-element--${element.type}${selected ? " is-selected" : ""}`,
    style: positionStyle,
    onClick: (event: React.MouseEvent) => {
      event.stopPropagation();
      onSelect();
    },
    onDoubleClick: (event: React.MouseEvent) => {
      event.stopPropagation();
      if ((element.type === "text" || element.type === "bubble") && canEditText) onBeginTextEdit();
    },
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      if (((element.type === "text" || element.type === "bubble") && editing) || !canEditGeometry) {
        event.stopPropagation();
        return;
      }
      onPointerDown(event, "move");
    },
    tabIndex: 0,
    role: "button" as const,
    "aria-label": `${getElementLabel(element.type)}：${elementName(element)}`,
  };

  return (
    <div {...baseProps}>
      {element.type === "text" && (
        editing ? (
          <div {...editableContentProps} className="ab-canvas-text-content" style={textStyle}>
            {element.content}
          </div>
        ) : (
          <AnnotatedTextContent
            element={element}
            annotations={annotations ?? element.annotations}
            onRequestDelete={onRequestDeleteAnnotation}
          />
        )
      )}
      {element.type === "image" && (
        <>
          <span className="ab-canvas-element-tag ab-canvas-element-tag--image">图片</span>
          {element.src ? <img className="ab-canvas-image" src={element.src} alt={element.alt} style={{ objectFit: element.objectFit }} /> : <div className="ab-canvas-asset-placeholder"><FileImage size={21} /><span>{element.alt || "待制作图片"}</span></div>}
          <CanvasRequirement
            elementType="image"
            requirement={requirement}
            mode={requirementOpen ? requirementMode : undefined}
            canEdit={canEditText}
            onToggle={onToggleRequirement}
            onChange={onUpdateRequirement}
            onFinishEditing={onFinishRequirementEdit}
          />
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
          <CanvasRequirement
            elementType="motion"
            requirement={requirement}
            mode={requirementOpen ? requirementMode : undefined}
            canEdit={canEditText}
            onToggle={onToggleRequirement}
            onChange={onUpdateRequirement}
            onFinishEditing={onFinishRequirementEdit}
          />
        </>
      )}
      {element.type === "bubble" && (
        <>
          <div
            {...editableContentProps}
            className="ab-canvas-bubble-content"
            data-placeholder="请输入对话"
          >
            {element.content}
          </div>
          <span
            className={`ab-bubble-tail ab-bubble-tail--${element.direction}`}
            style={{ left: `${element.tailX}%`, top: `${element.tailY}%` }}
            onPointerDown={(event) => onPointerDown(event, "tail")}
            role="slider"
            aria-label="调整气泡指向"
            tabIndex={selected ? 0 : -1}
          />
        </>
      )}
      {selected && (
        <>
          <div className="ab-selection-label">{getElementLabel(element.type)}{!canEditGeometry ? " · 只读" : ""}</div>
          {canEditGeometry && (["top-left", "top-right", "bottom-left", "bottom-right"] as ResizeCorner[]).map((corner) => (
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

function AnnotatedTextContent({
  element,
  annotations,
  onRequestDelete,
}: {
  element: TextElement;
  annotations: TextAnnotation[];
  onRequestDelete?: (annotationId: string) => void;
}) {
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<string | null>(null);
  const segments = buildAnnotationSegments(element.content, annotations);
  const style = {
    fontSize: `${element.fontSize * (EDITOR_WIDTH / CANVAS_WIDTH)}px`,
    color: element.color,
    fontWeight: element.fontWeight === "bold" ? 700 : element.fontWeight === "medium" ? 500 : 400,
    fontStyle: element.italic ? "italic" : "normal",
    textDecoration: element.underline ? "underline" : "none",
    textAlign: element.textAlign ?? "left",
  } as const;

  return (
    <div className="ab-canvas-text-content ab-canvas-text-rendered" style={style}>
      {segments.map((segment) => {
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
        return (
          <span
            key={`${segment.start}-${segment.end}`}
            className="ab-annotation-segment"
            onMouseEnter={() => setHoveredAnnotationId(controls[0]?.id ?? segment.annotations[0]?.id ?? null)}
            onMouseLeave={() => setHoveredAnnotationId(null)}
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
      })}
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
  onFinishEditing,
}: {
  elementType: "image" | "motion";
  requirement?: ProductionRequirement;
  mode?: "editing" | "preview";
  canEdit: boolean;
  onToggle: () => void;
  onChange: (brief: ProductionRequirement["brief"]) => void;
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
      {isEditing ? (
        <RequirementRichText
          value={brief}
          onChange={onChange}
          className="ab-rich-text-editor--canvas"
          placeholder={elementType === "image" ? "输入图片需求..." : "输入动效需求..."}
          autoFocus
        />
      ) : mode === "preview" && hasBrief ? (
        <div className="ab-canvas-requirement-preview">
          <RichTextPreview value={brief} />
        </div>
      ) : null}
      <button
        type="button"
        className="ab-canvas-requirement-toggle"
        aria-expanded={Boolean(mode)}
        aria-label={`${elementType === "image" ? "图片" : "动效"}需求`}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onToggle}
      >
        <span>需求</span>
        {mode ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
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

function PropertiesPanel({
  page,
  selectedId,
  onSelectElement,
  coverLayout,
  onCoverLayoutChange,
  onUpdateElement,
  onRemoveElement,
  onRequestAudioUpload,
}: {
  page: AnimationBookPage;
  selectedId: string | null;
  onSelectElement: (id: string) => void;
  coverLayout: CoverLayout;
  onCoverLayoutChange: (layout: CoverLayout) => void;
  onUpdateElement: (id: string, patch: Partial<BookElement>) => void;
  onRemoveElement: (id: string) => void;
  onRequestAudioUpload: () => void;
}) {
  const contentElements = [...page.elements].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="ab-panel-content">
      <div className="ab-panel-heading">
        <div>
          <span className="ab-panel-eyebrow">当前页面全部内容</span>
          <h2>{page.kind === "cover" ? "封面内容" : "页面内容"}</h2>
        </div>
        <span className="ab-panel-note">{contentElements.length} 个元素</span>
      </div>

      {page.kind === "cover" && (
        <section className="ab-setting-section">
          <div className="ab-setting-label-row"><label>封面布局</label><span>封面不参与排序</span></div>
          <div className="ab-segmented-control">
            <button type="button" className={coverLayout === "split" ? "is-active" : ""} onClick={() => onCoverLayoutChange("split")}>左右布局</button>
            <button type="button" className={coverLayout === "fullscreen" ? "is-active" : ""} onClick={() => onCoverLayoutChange("fullscreen")}>全屏布局</button>
          </div>
        </section>
      )}

      <section className="ab-content-section">
        <div className="ab-content-section-heading">
          <div><strong>画布元素</strong><span>内容在画布中直接编辑，点击卡片可定位元素</span></div>
          <span className="ab-order-count">{contentElements.length}</span>
        </div>
        <div className="ab-content-list">
          {contentElements.length === 0 && <div className="ab-order-empty">当前页面暂无元素</div>}
          {contentElements.map((element) => (
            <ContentItem
              key={element.id}
              element={element}
              selected={selectedId === element.id}
              onSelect={() => onSelectElement(element.id)}
              onUpdate={(patch) => onUpdateElement(element.id, patch)}
              onRemove={() => onRemoveElement(element.id)}
              onRequestAudioUpload={onRequestAudioUpload}
            />
          ))}
        </div>
      </section>

      <div className="ab-panel-extension-note"><CircleHelp size={14} /><span>动效产物在需求 / 产物面板中由制作人员上传；互动答题和审校区将在后续版本接入。</span></div>
    </div>
  );
}

function ContentItem({
  element,
  selected,
  onSelect,
  onUpdate,
  onRemove,
  onRequestAudioUpload,
}: {
  element: BookElement;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<BookElement>) => void;
  onRemove: () => void;
  onRequestAudioUpload: () => void;
}) {
  const icon = element.type === "text" ? <Type size={14} /> : element.type === "image" ? <FileImage size={14} /> : element.type === "motion" ? <Film size={14} /> : <MessageCircle size={14} />;
  const label = element.type === "text" ? "文本" : element.type === "image" ? "图片" : element.type === "motion" ? "动效" : "气泡";

  return (
    <article
      className={`ab-content-card${selected ? " is-selected" : ""}`}
      onClick={onSelect}
      onKeyDown={(event) => {
        const target = event.target as HTMLElement;
        if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName)) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className={`ab-content-card-icon ab-layer-icon--${element.type}`}>{icon}</div>
      <div className="ab-content-card-main">
        <div className="ab-content-card-header">
          <div><strong>{label}</strong><span>{elementName(element)}</span></div>
          <button type="button" className="ab-icon-button ab-icon-button--danger" onClick={(event) => { event.stopPropagation(); onRemove(); }} aria-label={`删除${label}`} title={`删除${label}`}><Trash2 size={14} /></button>
        </div>

        {element.type === "text" && (
          <>
            <p className="ab-content-card-copy">{element.content || "未填写文本"}</p>
            <div className="ab-content-card-meta">画布内编辑 · {element.fontSize}px · {element.fontWeight === "bold" ? "加粗" : element.fontWeight === "medium" ? "中等" : "常规"}</div>
            <AudioField hasAudio={Boolean(element.audioUrl)} onRequest={onRequestAudioUpload} label="文本语音" />
          </>
        )}

        {element.type === "image" && (
          <>
            <div className="ab-content-card-image">
              {element.src ? <img src={element.src} alt="" /> : <div className="ab-content-card-image-empty"><FileImage size={16} /><span>等待制作人员上传</span></div>}
              <div><strong>{element.alt}</strong><span>图片元素 · 画布内拖拽调整大小</span></div>
            </div>
            <label className="ab-field ab-content-card-field"><span>填充方式</span><select value={element.objectFit} onClick={(event) => event.stopPropagation()} onChange={(event) => onUpdate({ objectFit: event.target.value as ImageElement["objectFit"] })}><option value="contain">完整显示</option><option value="cover">裁切填充</option></select></label>
          </>
        )}

        {element.type === "motion" && (
          <div className="ab-content-card-image">
            <div className="ab-content-card-motion"><Film size={17} /><span>{element.src ? "已上传静态占位" : "等待制作人员上传"}</span></div>
            <div><strong>{element.fileName}</strong><span>动效元素 · 不播放，仅调整位置和尺寸</span></div>
          </div>
        )}

        {element.type === "bubble" && (
          <>
            <textarea value={element.content} onClick={(event) => event.stopPropagation()} onChange={(event) => onUpdate({ content: event.target.value })} rows={2} aria-label="气泡文字" />
            <div className="ab-form-grid ab-form-grid--three ab-content-card-controls">
              <label className="ab-field"><span>气泡方向</span><select value={element.direction} onClick={(event) => event.stopPropagation()} onChange={(event) => onUpdate({ direction: event.target.value as BubbleElement["direction"] })}><option value="left">左侧指向</option><option value="right">右侧指向</option></select></label>
              <NumberField label="三角横向 %" value={element.tailX} onChange={(value) => onUpdate({ tailX: clamp(value, 0, 100) })} />
              <NumberField label="三角纵向 %" value={element.tailY} onChange={(value) => onUpdate({ tailY: clamp(value, 0, 100) })} />
            </div>
            <AudioField hasAudio={Boolean(element.audioUrl)} onRequest={onRequestAudioUpload} label="气泡语音" />
          </>
        )}
      </div>
    </article>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="ab-field"><span>{label}</span><input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

function AudioField({ hasAudio, onRequest, label }: { hasAudio: boolean; onRequest: () => void; label: string }) {
  return (
    <div className="ab-audio-field">
      <div className="ab-setting-label-row"><label><FileAudio size={13} />{label}</label><span>{hasAudio ? "已绑定 1 条" : "未上传"}</span></div>
      <button type="button" className={`ab-upload-button ab-upload-button--readonly${hasAudio ? " is-ready" : ""}`} onClick={onRequest}><Upload size={14} />制作人员上传</button>
    </div>
  );
}

function LayersPanel({ elements, selectedId, onSelect, onMove }: { elements: BookElement[]; selectedId: string | null; onSelect: (id: string) => void; onMove: (id: string, direction: "up" | "down" | "top" | "bottom") => void }) {
  return (
    <div className="ab-panel-content ab-list-panel">
      <div className="ab-panel-heading"><div><span className="ab-panel-eyebrow">页面图层</span><h2>图层顺序</h2></div><span className="ab-panel-note">上方优先显示</span></div>
      <div className="ab-layer-list">
        {elements.map((element, index) => (
          <div key={element.id} className={`ab-layer-item${selectedId === element.id ? " is-selected" : ""}`} onClick={() => onSelect(element.id)}>
            <GripVertical size={14} className="ab-layer-drag" />
            <span className={`ab-layer-icon ab-layer-icon--${element.type}`}>{element.type === "text" ? <Type size={13} /> : element.type === "image" ? <FileImage size={13} /> : element.type === "motion" ? <Film size={13} /> : <MessageCircle size={13} />}</span>
            <span className="ab-layer-name">{elementName(element)}</span>
            <span className="ab-layer-index">{elements.length - index}</span>
            {selectedId === element.id && <div className="ab-layer-actions"><button type="button" onClick={(event) => { event.stopPropagation(); onMove(element.id, "top"); }} title="置顶"><ChevronsUp size={13} /></button><button type="button" onClick={(event) => { event.stopPropagation(); onMove(element.id, "up"); }} title="上移"><ChevronUp size={13} /></button><button type="button" onClick={(event) => { event.stopPropagation(); onMove(element.id, "down"); }} title="下移"><ChevronDown size={13} /></button><button type="button" onClick={(event) => { event.stopPropagation(); onMove(element.id, "bottom"); }} title="置底"><ChevronsDown size={13} /></button></div>}
          </div>
        ))}
      </div>
      <p className="ab-helper-text">当前支持置顶、置底、上移、下移；本期不提供锁定和隐藏。</p>
    </div>
  );
}
