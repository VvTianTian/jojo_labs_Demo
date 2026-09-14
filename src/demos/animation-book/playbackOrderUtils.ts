import { participatesInPlayback } from "./types";
import type { BookElement, PlaybackDisplayMode, PlaybackOrderChild, PlaybackOrderItem } from "./types";

export type PlaybackOrderNode = PlaybackOrderItem | PlaybackOrderChild;
export type PlaybackDropPosition = "before" | "after";
export type PlaybackBoundary = "start" | "end";

type RawPlaybackOrderItem = {
  elementId?: unknown;
  displayMode?: unknown;
  children?: unknown;
};

export interface PlaybackOrderLocation {
  parentId: string | null;
  index: number;
}

const toRawItem = (value: unknown): RawPlaybackOrderItem | null => {
  if (typeof value === "string") return { elementId: value };
  if (!value || typeof value !== "object") return null;
  return value as RawPlaybackOrderItem;
};

const toDisplayMode = (value: unknown): PlaybackDisplayMode => value === "onPlayback" ? "onPlayback" : "always";

const withoutChildren = (item: PlaybackOrderItem): PlaybackOrderItem => ({
  elementId: item.elementId,
  displayMode: item.displayMode,
});

const withChildren = (item: PlaybackOrderItem, children: PlaybackOrderChild[]): PlaybackOrderItem =>
  children.length > 0 ? { ...withoutChildren(item), children } : withoutChildren(item);

const getNodeId = (node: PlaybackOrderNode) => node.elementId;

/**
 * Converts legacy flat/string data to the one-level playback tree and fills in
 * newly added playable elements without disturbing the saved relative order.
 */
export const normalizePlaybackOrderItems = (
  rawItems: readonly unknown[] | null | undefined,
  elements: readonly BookElement[],
): PlaybackOrderItem[] => {
  const validIds = new Set(elements.filter(participatesInPlayback).map((element) => element.id));
  const seenIds = new Set<string>();
  const normalized: PlaybackOrderItem[] = [];

  for (const rawValue of rawItems ?? []) {
    const rawItem = toRawItem(rawValue);
    if (!rawItem || typeof rawItem.elementId !== "string" || !validIds.has(rawItem.elementId) || seenIds.has(rawItem.elementId)) continue;
    seenIds.add(rawItem.elementId);

    const children: PlaybackOrderChild[] = [];
    if (Array.isArray(rawItem.children)) {
      for (const rawChildValue of rawItem.children) {
        const rawChild = toRawItem(rawChildValue);
        if (!rawChild || typeof rawChild.elementId !== "string" || !validIds.has(rawChild.elementId) || seenIds.has(rawChild.elementId)) continue;
        seenIds.add(rawChild.elementId);
        children.push({ elementId: rawChild.elementId, displayMode: toDisplayMode(rawChild.displayMode) });
      }
    }

    normalized.push({
      elementId: rawItem.elementId,
      displayMode: toDisplayMode(rawItem.displayMode),
      ...(children.length > 0 ? { children } : {}),
    });
  }

  for (const element of elements) {
    if (!participatesInPlayback(element) || seenIds.has(element.id)) continue;
    seenIds.add(element.id);
    normalized.push({ elementId: element.id, displayMode: "always" });
  }

  return normalized;
};

export const findPlaybackOrderLocation = (
  items: readonly PlaybackOrderItem[],
  elementId: string,
): PlaybackOrderLocation | null => {
  const rootIndex = items.findIndex((item) => item.elementId === elementId);
  if (rootIndex >= 0) return { parentId: null, index: rootIndex };

  for (const item of items) {
    const childIndex = item.children?.findIndex((child) => child.elementId === elementId) ?? -1;
    if (childIndex >= 0) return { parentId: item.elementId, index: childIndex };
  }

  return null;
};

const reorderSequence = <T extends PlaybackOrderNode>(
  sequence: readonly T[],
  sourceElementId: string,
  targetElementId: string,
  position: PlaybackDropPosition,
): T[] | null => {
  const sourceIndex = sequence.findIndex((item) => getNodeId(item) === sourceElementId);
  const targetIndex = sequence.findIndex((item) => getNodeId(item) === targetElementId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceElementId === targetElementId) return null;

  const next = [...sequence];
  const [moved] = next.splice(sourceIndex, 1);
  const insertionIndex = next.findIndex((item) => getNodeId(item) === targetElementId) + (position === "after" ? 1 : 0);
  next.splice(Math.max(0, insertionIndex), 0, moved);
  return next;
};

const extractPlaybackNode = (
  items: readonly PlaybackOrderItem[],
  elementId: string,
): { node: PlaybackOrderNode; parentId: string | null; items: PlaybackOrderItem[] } | null => {
  const rootIndex = items.findIndex((item) => item.elementId === elementId);
  if (rootIndex >= 0) {
    return {
      node: items[rootIndex],
      parentId: null,
      items: items.filter((_, index) => index !== rootIndex),
    };
  }

  for (const [parentIndex, parent] of items.entries()) {
    const childIndex = parent.children?.findIndex((child) => child.elementId === elementId) ?? -1;
    if (childIndex < 0 || !parent.children) continue;
    const node = parent.children[childIndex];
    const nextChildren = parent.children.filter((_, index) => index !== childIndex);
    const nextItems = [...items];
    nextItems[parentIndex] = withChildren(parent, nextChildren);
    return { node, parentId: parent.elementId, items: nextItems };
  }

  return null;
};

export const updatePlaybackDisplayModeInOrder = (
  items: readonly PlaybackOrderItem[],
  elementId: string,
  displayMode: PlaybackDisplayMode,
): PlaybackOrderItem[] => items.map((item) => {
  if (item.elementId === elementId) return { ...item, displayMode };
  if (!item.children?.some((child) => child.elementId === elementId)) return item;
  return {
    ...item,
    children: item.children.map((child) => child.elementId === elementId ? { ...child, displayMode } : child),
  };
});

export const movePlaybackOrderItemInOrder = (
  items: readonly PlaybackOrderItem[],
  elementId: string,
  direction: -1 | 1,
): PlaybackOrderItem[] => {
  const location = findPlaybackOrderLocation(items, elementId);
  if (!location) return [...items];

  if (location.parentId === null) {
    const nextIndex = location.index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return [...items];
    const next = [...items];
    [next[location.index], next[nextIndex]] = [next[nextIndex], next[location.index]];
    return next;
  }

  const parentIndex = items.findIndex((item) => item.elementId === location.parentId);
  const siblings = parentIndex >= 0 ? items[parentIndex].children ?? [] : [];
  const nextIndex = location.index + direction;
  if (parentIndex < 0 || nextIndex < 0 || nextIndex >= siblings.length) return [...items];
  const nextSiblings = [...siblings];
  [nextSiblings[location.index], nextSiblings[nextIndex]] = [nextSiblings[nextIndex], nextSiblings[location.index]];
  const next = [...items];
  next[parentIndex] = withChildren(items[parentIndex], nextSiblings);
  return next;
};

export const movePlaybackOrderItemToBoundary = (
  items: readonly PlaybackOrderItem[],
  elementId: string,
  boundary: PlaybackBoundary,
): PlaybackOrderItem[] => {
  const location = findPlaybackOrderLocation(items, elementId);
  if (!location) return [...items];

  const targetIndex = boundary === "start" ? 0 : (location.parentId === null ? items.length : (items.find((item) => item.elementId === location.parentId)?.children?.length ?? 0) - 1);
  if (targetIndex < 0 || targetIndex === location.index) return [...items];

  if (location.parentId === null) {
    const next = [...items];
    const [moved] = next.splice(location.index, 1);
    next.splice(targetIndex, 0, moved);
    return next;
  }

  const parentIndex = items.findIndex((item) => item.elementId === location.parentId);
  const siblings = parentIndex >= 0 ? items[parentIndex].children ?? [] : [];
  if (parentIndex < 0) return [...items];
  const nextSiblings = [...siblings];
  const [moved] = nextSiblings.splice(location.index, 1);
  nextSiblings.splice(targetIndex, 0, moved);
  const next = [...items];
  next[parentIndex] = withChildren(items[parentIndex], nextSiblings);
  return next;
};

export const reorderPlaybackOrderItems = (
  items: readonly PlaybackOrderItem[],
  sourceElementId: string,
  targetElementId: string,
  position: PlaybackDropPosition,
): PlaybackOrderItem[] => {
  if (sourceElementId === targetElementId) return [...items];
  const sourceLocation = findPlaybackOrderLocation(items, sourceElementId);
  const targetLocation = findPlaybackOrderLocation(items, targetElementId);
  if (!sourceLocation || !targetLocation) return [...items];

  if (sourceLocation.parentId === targetLocation.parentId) {
    if (sourceLocation.parentId === null) {
      return reorderSequence(items, sourceElementId, targetElementId, position) ?? [...items];
    }
    const parentIndex = items.findIndex((item) => item.elementId === sourceLocation.parentId);
    if (parentIndex < 0) return [...items];
    const siblings = items[parentIndex].children ?? [];
    const nextSiblings = reorderSequence(siblings, sourceElementId, targetElementId, position);
    if (!nextSiblings) return [...items];
    const next = [...items];
    next[parentIndex] = withChildren(items[parentIndex], nextSiblings);
    return next;
  }

  const extracted = extractPlaybackNode(items, sourceElementId);
  if (!extracted) return [...items];
  if (extracted.parentId === null && "children" in extracted.node && extracted.node.children?.length) return [...items];

  if (targetLocation.parentId === null) {
    const targetIndex = extracted.items.findIndex((item) => item.elementId === targetElementId);
    if (targetIndex < 0 || extracted.node.elementId === targetElementId) return [...items];
    const next = [...extracted.items];
    const rootNode = "children" in extracted.node ? withoutChildren(extracted.node) : extracted.node;
    next.splice(targetIndex + (position === "after" ? 1 : 0), 0, rootNode);
    return next;
  }

  const parentIndex = extracted.items.findIndex((item) => item.elementId === targetLocation.parentId);
  if (parentIndex < 0) return [...items];
  const parent = extracted.items[parentIndex];
  const targetChildIndex = parent.children?.findIndex((child) => child.elementId === targetElementId) ?? -1;
  if (targetChildIndex < 0 || "children" in extracted.node && extracted.node.children?.length) return [...items];
  const childNode: PlaybackOrderChild = "children" in extracted.node
    ? { elementId: extracted.node.elementId, displayMode: extracted.node.displayMode }
    : extracted.node;
  const nextChildren = [...(parent.children ?? [])];
  nextChildren.splice(targetChildIndex + (position === "after" ? 1 : 0), 0, childNode);
  const next = [...extracted.items];
  next[parentIndex] = withChildren(parent, nextChildren);
  return next;
};

export const groupPlaybackOrderItems = (
  items: readonly PlaybackOrderItem[],
  sourceElementId: string,
  targetElementId: string,
): PlaybackOrderItem[] => {
  if (sourceElementId === targetElementId) return [...items];
  const sourceLocation = findPlaybackOrderLocation(items, sourceElementId);
  const targetLocation = findPlaybackOrderLocation(items, targetElementId);
  if (!sourceLocation || !targetLocation || targetLocation.parentId !== null || sourceLocation.parentId === targetElementId) return [...items];

  const extracted = extractPlaybackNode(items, sourceElementId);
  if (!extracted || (extracted.parentId === null && "children" in extracted.node && extracted.node.children?.length)) return [...items];
  const targetIndex = extracted.items.findIndex((item) => item.elementId === targetElementId);
  if (targetIndex < 0) return [...items];

  const childNode: PlaybackOrderChild = "children" in extracted.node
    ? { elementId: extracted.node.elementId, displayMode: extracted.node.displayMode }
    : extracted.node;
  const target = extracted.items[targetIndex];
  const next = [...extracted.items];
  next[targetIndex] = withChildren(target, [...(target.children ?? []), childNode]);
  return next;
};

export const ungroupPlaybackOrderItem = (
  items: readonly PlaybackOrderItem[],
  elementId: string,
): PlaybackOrderItem[] => {
  const location = findPlaybackOrderLocation(items, elementId);
  if (!location || location.parentId === null) return [...items];
  const extracted = extractPlaybackNode(items, elementId);
  if (!extracted || extracted.parentId === null) return [...items];
  const parentIndex = extracted.items.findIndex((item) => item.elementId === extracted.parentId);
  if (parentIndex < 0) return [...items];
  const next = [...extracted.items];
  next.splice(parentIndex + 1, 0, "children" in extracted.node ? withoutChildren(extracted.node) : extracted.node);
  return next;
};

export const removePlaybackElementFromOrder = (
  items: readonly PlaybackOrderItem[],
  elementId: string,
): PlaybackOrderItem[] => {
  const next: PlaybackOrderItem[] = [];
  for (const item of items) {
    if (item.elementId === elementId) {
      next.push(...(item.children ?? []).map((child) => ({ elementId: child.elementId, displayMode: child.displayMode })));
      continue;
    }
    const nextChildren = item.children?.filter((child) => child.elementId !== elementId) ?? [];
    next.push(nextChildren.length > 0 ? withChildren(item, nextChildren) : withoutChildren(item));
  }
  return next;
};
