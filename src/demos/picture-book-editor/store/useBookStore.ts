import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Book, Cover, GlobalSettings, PageSettings,
  TextBlock, Hotspot, Selection,
} from "../types/book";
import { createDefaultBook } from "../constants/defaults";

interface BookStore {
  book: Book;
  // Book-level
  setBookTitle: (title: string) => void;
  updateGlobalSettings: (settings: Partial<GlobalSettings>) => void;
  // Cover
  updateCover: (cover: Partial<Cover>) => void;
  // Navigation
  setCurrentPage: (index: number) => void;
  setViewingNarration: (index: number) => void;
  // Page CRUD
  addPage: () => void;
  deletePage: (pageId: string) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  updatePageImage: (pageId: string, dataUrl: string | null) => void;
  updatePageAudio: (pageId: string, dataUrl: string | null) => void;
  updatePageSettings: (pageId: string, settings: Partial<PageSettings>) => void;
  // Text blocks
  addTextBlock: (pageId: string) => void;
  removeTextBlock: (pageId: string, blockId: string) => void;
  updateTextBlock: (pageId: string, blockId: string, patch: Partial<TextBlock>) => void;
  moveTextBlock: (pageId: string, fromIndex: number, toIndex: number) => void;
  // Hotspots
  addHotspot: (pageId: string, x: number, y: number) => void;
  removeHotspot: (pageId: string, hotspotId: string) => void;
  updateHotspot: (pageId: string, hotspotId: string, patch: Partial<Hotspot>) => void;
  // Selection
  setSelection: (selection: Selection) => void;
  // Requirements (教研写需求)
  updateCoverRequirement: (key: "imageRequirement", value: string) => void;
  updatePageRequirement: (pageId: string, key: "imageRequirement" | "audioRequirement", value: string) => void;
  updateTextBlockRequirement: (pageId: string, blockId: string, key: "audioRequirement", value: string) => void;
  // Reset
  resetBook: () => void;
}

/** Helper: update a page inside the book */
function updatePage(
  book: Book,
  pageId: string,
  updater: (p: Book["pages"][0]) => Book["pages"][0]
): Book {
  return {
    ...book,
    pages: book.pages.map((p) => (p.id === pageId ? updater(p) : p)),
  };
}

export const useBookStore = create<BookStore>()(
  persist(
    (set) => ({
      book: createDefaultBook(),

      setBookTitle: (title) =>
        set((s) => ({ book: { ...s.book, title } })),

      updateGlobalSettings: (settings) =>
        set((s) => ({
          book: {
            ...s.book,
            globalSettings: { ...s.book.globalSettings, ...settings },
          },
        })),

      updateCover: (cover) =>
        set((s) => ({
          book: { ...s.book, cover: { ...s.book.cover, ...cover } },
        })),

      setCurrentPage: (index) =>
        set((s) => ({
          book: { ...s.book, currentPageIndex: index, viewMode: "canvas", selection: { type: "none" } },
        })),

      setViewingNarration: (index) =>
        set((s) => ({
          book: { ...s.book, currentPageIndex: index, viewMode: "narration", selection: { type: "none" } },
        })),

      addPage: () =>
        set((s) => ({
          book: {
            ...s.book,
            pages: [
              ...s.book.pages,
              {
                id: crypto.randomUUID(),
                imageUrl: null,
                textBlocks: [
                  { id: crypto.randomUUID(), content: "", translation: "", audioUrl: null, audioRequirement: "" },
                ],
                hotspots: [],
                audioUrl: null,
                settings: { backgroundColor: null, fontSize: null, textAlign: null },
                imageRequirement: "",
                audioRequirement: "",
              },
            ],
            currentPageIndex: s.book.pages.length,
            viewMode: "canvas",
            selection: { type: "none" },
          },
        })),

      deletePage: (pageId) =>
        set((s) => {
          if (s.book.pages.length <= 1) return s;
          const pages = s.book.pages.filter((p) => p.id !== pageId);
          const currentPageIndex = Math.min(s.book.currentPageIndex, pages.length - 1);
          return { book: { ...s.book, pages, currentPageIndex, viewMode: "canvas", selection: { type: "none" } } };
        }),

      reorderPages: (fromIndex, toIndex) =>
        set((s) => {
          const pages = [...s.book.pages];
          const [moved] = pages.splice(fromIndex, 1);
          pages.splice(toIndex, 0, moved);
          return { book: { ...s.book, pages, currentPageIndex: toIndex } };
        }),

      updatePageImage: (pageId, dataUrl) =>
        set((s) => ({ book: updatePage(s.book, pageId, (p) => ({ ...p, imageUrl: dataUrl })) })),

      updatePageAudio: (pageId, dataUrl) =>
        set((s) => ({ book: updatePage(s.book, pageId, (p) => ({ ...p, audioUrl: dataUrl })) })),

      updatePageSettings: (pageId, settings) =>
        set((s) => ({
          book: updatePage(s.book, pageId, (p) => ({
            ...p,
            settings: { ...p.settings, ...settings },
          })),
        })),

      // ---- Text blocks ----
      addTextBlock: (pageId) =>
        set((s) => ({
          book: updatePage(s.book, pageId, (p) => ({
            ...p,
            textBlocks: [
              ...p.textBlocks,
              { id: crypto.randomUUID(), content: "", translation: "", audioUrl: null, audioRequirement: "" },
            ],
          })),
        })),

      removeTextBlock: (pageId, blockId) =>
        set((s) => ({
          book: updatePage(s.book, pageId, (p) => ({
            ...p,
            textBlocks: p.textBlocks.filter((b) => b.id !== blockId),
          })),
          ...(s.book.selection.textBlockId === blockId
            ? { book: { ...s.book, selection: { type: "none" } } }
            : {}),
        })),

      updateTextBlock: (pageId, blockId, patch) =>
        set((s) => ({
          book: updatePage(s.book, pageId, (p) => ({
            ...p,
            textBlocks: p.textBlocks.map((b) =>
              b.id === blockId ? { ...b, ...patch } : b
            ),
          })),
        })),

      moveTextBlock: (pageId, fromIndex, toIndex) =>
        set((s) => ({
          book: updatePage(s.book, pageId, (p) => {
            const blocks = [...p.textBlocks];
            const [moved] = blocks.splice(fromIndex, 1);
            blocks.splice(toIndex, 0, moved);
            return { ...p, textBlocks: blocks };
          }),
        })),

      // ---- Hotspots ----
      addHotspot: (pageId, x, y) =>
        set((s) => ({
          book: updatePage(s.book, pageId, (p) => ({
            ...p,
            hotspots: [
              ...p.hotspots,
              { id: crypto.randomUUID(), x, y, action: "popup_card", content: "" },
            ],
          })),
        })),

      removeHotspot: (pageId, hotspotId) =>
        set((s) => ({
          book: updatePage(s.book, pageId, (p) => ({
            ...p,
            hotspots: p.hotspots.filter((h) => h.id !== hotspotId),
          })),
        })),

      updateHotspot: (pageId, hotspotId, patch) =>
        set((s) => ({
          book: updatePage(s.book, pageId, (p) => ({
            ...p,
            hotspots: p.hotspots.map((h) =>
              h.id === hotspotId ? { ...h, ...patch } : h
            ),
          })),
        })),

      // ---- Selection ----
      setSelection: (selection) =>
        set((s) => ({ book: { ...s.book, selection } })),

      // ---- Requirements ----
      updateCoverRequirement: (key, value) =>
        set((s) => ({
          book: { ...s.book, cover: { ...s.book.cover, [key]: value } },
        })),

      updatePageRequirement: (pageId, key, value) =>
        set((s) => ({
          book: updatePage(s.book, pageId, (p) => ({ ...p, [key]: value })),
        })),

      updateTextBlockRequirement: (pageId, blockId, key, value) =>
        set((s) => ({
          book: updatePage(s.book, pageId, (p) => ({
            ...p,
            textBlocks: p.textBlocks.map((b) =>
              b.id === blockId ? { ...b, [key]: value } : b
            ),
          })),
        })),

      resetBook: () => set({ book: createDefaultBook() }),
    }),
    {
      name: "picture-book-data",
      version: 5,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          const defaultBook = createDefaultBook();
          const book = persistedState?.book;
          if (book) {
            if (!book.cover) {
              book.cover = { ...defaultBook.cover, title: book.title || defaultBook.title };
            }
          }
        }
        if (version < 3) {
          const book = persistedState?.book;
          if (book?.pages) {
            book.pages = book.pages.map((p: any) => ({
              ...p,
              textBlocks: p.textBlocks ?? [
                { id: crypto.randomUUID(), content: p.text ?? "", translation: "", audioUrl: null },
              ],
              hotspots: p.hotspots ?? [],
              audioUrl: p.audioUrl ?? null,
            }));
            book.pages.forEach((p: any) => { delete p.text; });
          }
          if (book) {
            book.selection = book.selection ?? { type: "none" };
          }
        }
        if (version < 4) {
          const book = persistedState?.book;
          if (book) {
            book.viewMode = book.viewMode ?? "canvas";
            if (book.globalSettings) {
              book.globalSettings.globalAudioUrl = book.globalSettings.globalAudioUrl ?? null;
            }
          }
        }
        if (version < 5) {
          const book = persistedState?.book;
          if (book?.cover) {
            book.cover.imageRequirement = book.cover.imageRequirement ?? "";
          }
          if (book?.pages) {
            book.pages = book.pages.map((p: any) => ({
              ...p,
              imageRequirement: p.imageRequirement ?? "",
              audioRequirement: p.audioRequirement ?? "",
              textBlocks: (p.textBlocks || []).map((b: any) => ({
                ...b,
                audioRequirement: b.audioRequirement ?? "",
              })),
            }));
          }
        }
        return persistedState as any;
      },
    }
  )
);
