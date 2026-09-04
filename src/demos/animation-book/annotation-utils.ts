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

const normalizeLineBreaks = (value: string) => value.replace(/\r\n?/g, "\n");
const BLOCK_TEXT_TAGS = new Set(["DIV", "LI", "P"]);

const isBlockTextElement = (node: Node, root: Node) =>
  node !== root
  && node.nodeType === Node.ELEMENT_NODE
  && BLOCK_TEXT_TAGS.has((node as HTMLElement).tagName);

const getRawPlainTextLength = (node: Node, root: Node): number => {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue?.length ?? 0;
  if (node.nodeType !== Node.ELEMENT_NODE) return 0;
  const element = node as HTMLElement;
  if (element.tagName === "BR") return 1;
  const childrenLength = Array.from(node.childNodes)
    .reduce((sum, child) => sum + getRawPlainTextLength(child, root), 0);
  return childrenLength + (isBlockTextElement(node, root) ? 1 : 0);
};

const readPlainTextNode = (node: Node, root: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue ?? "";
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const element = node as HTMLElement;
  if (element.tagName === "BR") return "\n";
  const content = Array.from(node.childNodes)
    .map((child) => readPlainTextNode(child, root))
    .join("");
  return isBlockTextElement(node, root) && !content.endsWith("\n") ? `${content}\n` : content;
};

/** Reads editable DOM while preserving explicit paragraph and line-break boundaries. */
export const readPlainTextFromContentEditable = (root: HTMLElement) => {
  const value = normalizeLineBreaks(readPlainTextNode(root, root));
  return value.endsWith("\n") ? value.slice(0, -1) : value;
};

/** Writes plain text as paragraph blocks so every explicit paragraph can share the same indent rule. */
export const writePlainTextToContentEditable = (
  root: HTMLElement,
  content: string,
  placeholder?: string,
) => {
  root.replaceChildren();
  normalizeLineBreaks(content).split("\n").forEach((paragraphText) => {
    const paragraph = document.createElement("div");
    paragraph.className = "ab-canvas-text-paragraph";
    if (placeholder) paragraph.dataset.placeholder = placeholder;
    paragraph.textContent = paragraphText;
    root.appendChild(paragraph);
  });
};

const getOffsetInsideNode = (root: Node, target: Node, targetOffset: number) => {
  let total = 0;
  let found = false;

  const visit = (node: Node): boolean => {
    if (node === target) {
      if (node.nodeType === Node.TEXT_NODE) {
        total += Math.min(Math.max(targetOffset, 0), node.nodeValue?.length ?? 0);
      } else if ((node as HTMLElement).tagName !== "BR") {
        total += Array.from(node.childNodes)
          .slice(0, Math.max(0, targetOffset))
          .reduce((sum, child) => sum + getRawPlainTextLength(child, root), 0);
      }
      found = true;
      return true;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      total += node.nodeValue?.length ?? 0;
      return false;
    }
    if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === "BR") {
      total += 1;
      return false;
    }

    for (const child of Array.from(node.childNodes)) {
      if (visit(child)) return true;
    }
    if (isBlockTextElement(node, root)) total += 1;
    return false;
  };

  visit(root);
  return found ? Math.min(total, readPlainTextFromContentEditable(root).length) : null;
};

const getTextBoundaryAtOffset = (root: HTMLElement, offset: number): [Node, number] => {
  const contentLength = readPlainTextFromContentEditable(root).length;
  const locate = (node: Node, targetOffset: number): [Node, number] => {
    if (node.nodeType === Node.TEXT_NODE) {
      return [node, Math.min(Math.max(targetOffset, 0), node.nodeValue?.length ?? 0)];
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return [node, 0];
    const element = node as HTMLElement;
    if (element.tagName === "BR") {
      const parent = node.parentNode ?? root;
      const index = Array.from(parent.childNodes).indexOf(node);
      return [parent, Math.max(0, index + 1)];
    }

    const children = Array.from(node.childNodes);
    if (children.length === 0) return [node, 0];
    let remaining = targetOffset;
    for (let index = 0; index < children.length; index += 1) {
      const child = children[index];
      const childLength = getRawPlainTextLength(child, root);
      if (remaining < childLength) return locate(child, remaining);
      if (remaining === childLength) {
        if (isBlockTextElement(child, root) && index < children.length - 1) {
          return locate(children[index + 1], 0);
        }
        return locate(child, childLength);
      }
      remaining -= childLength;
    }
    return [node, node.childNodes.length];
  };

  return locate(root, Math.min(Math.max(offset, 0), contentLength));
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

export const setTextCaret = (root: HTMLElement, offset: number) => {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  const [node, nodeOffset] = getTextBoundaryAtOffset(root, offset);
  range.setStart(node, nodeOffset);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
};

export const replaceContentEditableSelection = (root: HTMLElement, insertedText: string) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
  const start = getOffsetInsideNode(root, range.startContainer, range.startOffset);
  const end = getOffsetInsideNode(root, range.endContainer, range.endOffset);
  if (start === null || end === null) return null;

  const content = readPlainTextFromContentEditable(root);
  const normalizedInsertion = normalizeLineBreaks(insertedText);
  const selectionStart = Math.min(start, end);
  const selectionEnd = Math.max(start, end);
  const nextContent = content.slice(0, selectionStart)
    + normalizedInsertion
    + content.slice(selectionEnd);
  writePlainTextToContentEditable(root, nextContent);
  setTextCaret(root, selectionStart + normalizedInsertion.length);
  return nextContent;
};

export const selectTextRange = (root: HTMLElement, selectionRange: TextSelectionRange) => {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  const [startNode, startOffset] = getTextBoundaryAtOffset(root, selectionRange.start);
  const [endNode, endOffset] = getTextBoundaryAtOffset(root, selectionRange.end);
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
