import type { TextAnnotation, TextAnnotationType } from "./types";

export interface TextSelectionRange {
  start: number;
  end: number;
}

export interface AnnotationSegment {
  start: number;
  end: number;
  text: string;
  annotations: TextAnnotation[];
}

export const ANNOTATION_LABELS: Record<TextAnnotationType, string> = {
  word: "好词",
  sentence: "好句",
  note: "注释",
};

const textLength = (node: Node) => node.textContent?.length ?? 0;

const getOffsetInsideNode = (root: Node, target: Node, targetOffset: number) => {
  let total = 0;
  let found = false;

  const visit = (node: Node): boolean => {
    if (node === target) {
      if (node.nodeType === Node.TEXT_NODE) {
        total += targetOffset;
      } else {
        total += Array.from(node.childNodes)
          .slice(0, targetOffset)
          .reduce((sum, child) => sum + textLength(child), 0);
      }
      found = true;
      return true;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      total += textLength(node);
      return false;
    }

    for (const child of Array.from(node.childNodes)) {
      if (visit(child)) return true;
    }
    return false;
  };

  visit(root);
  return found ? total : null;
};

export const getTextSelectionRange = (root: HTMLElement): TextSelectionRange | null => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;

  const start = getOffsetInsideNode(root, range.startContainer, range.startOffset);
  const end = getOffsetInsideNode(root, range.endContainer, range.endOffset);
  if (start === null || end === null || start === end) return null;
  return { start: Math.min(start, end), end: Math.max(start, end) };
};

const getNodeAtOffset = (root: Node, offset: number) => {
  let remaining = Math.max(0, offset);
  let lastTextNode: Text | null = null;

  const visit = (node: Node): [Node, number] | null => {
    if (node.nodeType === Node.TEXT_NODE) {
      lastTextNode = node as Text;
      const length = textLength(node);
      if (remaining <= length) return [node, remaining];
      remaining -= length;
      return null;
    }

    for (const child of Array.from(node.childNodes)) {
      const result = visit(child);
      if (result) return result;
    }
    return null;
  };

  return visit(root) ?? [lastTextNode ?? root, lastTextNode ? textLength(lastTextNode) : 0];
};

export const selectTextRange = (root: HTMLElement, selectionRange: TextSelectionRange) => {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  const [startNode, startOffset] = getNodeAtOffset(root, selectionRange.start);
  const [endNode, endOffset] = getNodeAtOffset(root, selectionRange.end);
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  selection.removeAllRanges();
  selection.addRange(range);
};

export const buildAnnotationSegments = (content: string, annotations: TextAnnotation[]): AnnotationSegment[] => {
  const validAnnotations = annotations.filter(
    (annotation) => annotation.start >= 0 && annotation.end <= content.length && annotation.start < annotation.end,
  );
  const boundaries = Array.from(new Set([
    0,
    content.length,
    ...validAnnotations.flatMap((annotation) => [annotation.start, annotation.end]),
  ])).sort((a, b) => a - b);

  return boundaries.slice(0, -1).flatMap((start, index) => {
    const end = boundaries[index + 1];
    if (start === end) return [];
    return [{
      start,
      end,
      text: content.slice(start, end),
      annotations: validAnnotations.filter((annotation) => annotation.start <= start && annotation.end >= end),
    }];
  });
};

export const hasAnnotationContent = (annotation: TextAnnotation) => Boolean(
  annotation.pinyin.trim()
  || annotation.translations.some((translation) => translation.trim())
  || annotation.explanation.trim()
  || annotation.note.trim()
  || annotation.voiceRequest.trim()
  || annotation.voiceSupplement.trim(),
);

export const createAnnotation = (
  id: string,
  type: TextAnnotationType,
  selectionRange: TextSelectionRange,
  content: string,
): TextAnnotation => ({
  id,
  type,
  start: selectionRange.start,
  end: selectionRange.end,
  text: content.slice(selectionRange.start, selectionRange.end),
  pronunciationMode: "pinyin",
  pinyin: "",
  translations: [],
  explanation: "",
  note: "",
  voiceRequest: "",
  voiceSupplement: "",
});

export const normalizeAnnotations = (content: string, annotations: TextAnnotation[]) => annotations
  .filter((annotation) => annotation.start >= 0 && annotation.start < annotation.end && annotation.end <= content.length)
  .map((annotation) => ({
    ...annotation,
    text: content.slice(annotation.start, annotation.end),
  }));
