import type { RichTextDocument } from "../animation-book/types";

export const BLOCK_TYPES = [
  { id: "method", label: "协作方法" },
  { id: "story", label: "故事回顾" },
  { id: "knowledge", label: "文常积累" },
  { id: "words", label: "好词好句" },
  { id: "reflection", label: "课后输出" },
  { id: "school", label: "校内对标" },
] as const;

export const LAYOUTS = [
  { id: "image-top", label: "上图下文", fields: ["photo", "text"] },
  { id: "text-top", label: "上文下图", fields: ["text", "photo"] },
  { id: "image-left", label: "左图右文", fields: ["photo", "text"] },
  { id: "text-left", label: "右图左文", fields: ["text", "photo"] },
  { id: "text", label: "只有文", fields: ["text"] },
  { id: "image", label: "只有图", fields: ["photo"] },
] as const;

export type BlockId = (typeof BLOCK_TYPES)[number]["id"];
export type LayoutId = (typeof LAYOUTS)[number]["id"];

export interface NoteEntry {
  id: string;
  richText?: RichTextDocument;
  word?: string;
  pinyin?: string;
  meaning?: string;
  example?: string;
  photo?: { requirement: string; source?: string; name?: string };
}

export interface NoteBlock {
  id: BlockId;
  layout: LayoutId;
  wordLayout?: LayoutId;
  weekly: boolean;
  report: boolean;
  entries: NoteEntry[];
}

export const EMPTY_RICH_TEXT: RichTextDocument = { html: "", text: "" };
export const STORAGE_KEY = "web-test:learning-notes:1";

export const blockLabel = (id: BlockId) => BLOCK_TYPES.find((block) => block.id === id)!.label;

export const layoutFields = (id: LayoutId) => LAYOUTS.find((layout) => layout.id === id)!.fields;

export const createEntry = (): NoteEntry => ({ id: crypto.randomUUID() });

export function openNoteEntry(id: string) {
  requestAnimationFrame(() => {
    const entry = document.getElementById(`ln-entry-${id}`);
    const vocabulary = entry?.querySelector<HTMLButtonElement>(".ln-vocabulary-trigger");
    if (vocabulary) {
      vocabulary.focus();
      vocabulary.click();
      return;
    }
    const editTarget = entry?.querySelector<HTMLElement>("[contenteditable]") ?? entry?.querySelector<HTMLElement>(".ln-photo-trigger");
    editTarget?.focus();
  });
}

export const createBlock = (id: BlockId): NoteBlock => ({
  id,
  layout: "text",
  weekly: true,
  report: false,
  entries: [createEntry()],
});

const textTags = new Set(["b", "strong", "i", "em", "u", "br", "div", "p", "span", "font"]);
const colorPattern = /^(#[\da-f]{3,8}|rgba?\([\d., %]+\))$/i;

function restoreRichText(value: RichTextDocument): RichTextDocument {
  const parsed = new DOMParser().parseFromString(value.html, "text/html");
  parsed.body.querySelectorAll("*").forEach((node) => {
    if (!textTags.has(node.localName)) {
      node.replaceWith(document.createTextNode(node.textContent ?? ""));
      return;
    }
    const color = (node as HTMLElement).style.color || node.getAttribute("color") || "";
    for (const { name } of Array.from(node.attributes)) node.removeAttribute(name);
    if (colorPattern.test(color)) (node as HTMLElement).style.color = color;
  });
  return { html: parsed.body.innerHTML, text: parsed.body.textContent?.trim() ?? "" };
}

export function loadNotes(): NoteBlock[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(stored)) return [];
    const knownIds = new Set<BlockId>(BLOCK_TYPES.map(({ id }) => id));
    return stored.filter((block: NoteBlock) => {
      if (!block || !knownIds.delete(block.id) || !Array.isArray(block.entries)) return false;
      return LAYOUTS.some(({ id }) => id === block.layout);
    }).map((block: NoteBlock) => ({
      ...block,
      wordLayout: LAYOUTS.find(({ id }) => id === block.wordLayout)?.id,
      entries: block.entries.map((entry) => ({
        ...entry,
        richText: entry.richText && restoreRichText(entry.richText),
        photo: entry.photo && {
          ...entry.photo,
          source: /^data:image\/jpeg;base64,[\da-z+/=]+$/i.test(entry.photo.source ?? "")
            ? entry.photo.source
            : undefined,
        },
      })),
    }));
  } catch {
    return [];
  }
}
