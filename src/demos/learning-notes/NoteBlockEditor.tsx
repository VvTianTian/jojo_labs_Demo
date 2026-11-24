import { useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, ComponentPropsWithRef } from "react";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, Ellipsis, ImagePlus, Plus, X } from "lucide-react";
import { RequirementRichText } from "../animation-book/components/RequirementRichText";
import { compressImage } from "../picture-book-editor/utils/imageCompress";
import dragIcon from "./assets/drag-handle.svg";
import photoPlaceholder from "./assets/photo-placeholder.svg";
import { NoteHeading, NotePhoto, Vocabulary } from "./NotePreview";
import { blockLabel, createEntry, EMPTY_RICH_TEXT, layoutFields, LAYOUTS, openNoteEntry, type LayoutId, type NoteBlock, type NoteEntry } from "./notes";

function useNoteSortSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates, scrollBehavior: "auto" }),
  );
}

function DragHandle({ label, ...props }: ComponentPropsWithRef<"button"> & { label: string }) {
  return (
    <button type="button" className="ln-icon-button ln-drag-handle" {...props} aria-label={label} title={label}>
      <img src={dragIcon} alt="" width={14} height={16} />
    </button>
  );
}

function LayoutPicture({ layout }: { layout: LayoutId }) {
  return <span className="ln-layout-picture" data-layout={layout} aria-hidden="true"><i /><b /></span>;
}

function PhotoField({ photo, label, inline, onChange, onRemove }: {
  photo: NonNullable<NoteEntry["photo"]>;
  label: string;
  inline: boolean;
  onChange: (change: Partial<NonNullable<NoteEntry["photo"]>>) => void;
  onRemove?: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const uploadVersion = useRef(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [requirementOpen, setRequirementOpen] = useState(true);
  const requirementId = useId();

  useEffect(() => () => { uploadVersion.current += 1; }, []);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    uploadVersion.current += 1;
    const version = uploadVersion.current;
    setUploading(true);
    setError("");
    try {
      const source = await compressImage(file);
      if (uploadVersion.current === version) onChange({ source, name: file.name });
    } catch {
      if (uploadVersion.current === version) setError("图片读取失败，请重新选择。");
    } finally {
      if (uploadVersion.current === version) setUploading(false);
    }
  }

  function removePhoto() {
    uploadVersion.current += 1;
    setUploading(false);
    setError("");
    if (onRemove) onRemove();
    else onChange({ source: undefined, name: undefined });
  }

  const requirement = <input aria-label={`${label}图片需求`} value={photo.requirement} placeholder="请输入内容" onChange={(event) => onChange({ requirement: event.target.value })} />;
  const fileInput = <input ref={input} type="file" hidden aria-label={`${label}上传配图`} accept="image/png,image/jpeg,image/webp,image/gif" onChange={upload} />;
  const uploadLabel = photo.source ? "更换配图" : "上传配图";
  const openFilePicker = () => input.current?.click();

  if (inline) return (
    <div className="ln-inline-photo-card" role="group" aria-label={`${label}配图`}>
      <div className="ln-inline-photo-stage">
        <span className="ln-inline-photo-tag">图片</span>
        {photo.source ? (
          <>
            <NotePhoto photo={photo} />
            <div className="ln-inline-photo-actions ln-hover-action">
              <button type="button" className="ln-button ln-small ln-photo-trigger" disabled={uploading} onClick={openFilePicker}>
                <ImagePlus size={13} />{uploading ? "读取中" : uploadLabel}
              </button>
              <button type="button" className="ln-icon-button ln-remove" aria-label={`移除${label}配图`} title="移除配图" onClick={removePhoto}><X size={15} /></button>
            </div>
          </>
        ) : (
          <button className="ln-inline-photo-placeholder ln-photo-trigger" type="button" aria-label={uploadLabel} title={uploadLabel} disabled={uploading} onClick={openFilePicker}>
            <img src={photoPlaceholder} alt="" />
            {uploading && <span role="status">读取中</span>}
          </button>
        )}
      </div>
      <div className="ln-inline-photo-requirement">
        <button type="button" className="ln-inline-photo-disclosure" aria-expanded={requirementOpen} aria-controls={requirementId} onClick={() => setRequirementOpen((open) => !open)}>
          需求<ChevronDown size={11} aria-hidden="true" />
        </button>
        <div id={requirementId} hidden={!requirementOpen}>{requirement}</div>
      </div>
      {fileInput}
      {error && <p role="alert" className="ln-error">{error}</p>}
    </div>
  );

  return (
    <div className="ln-field ln-photo-field">
      <span className="ln-field-label">图片</span>
      <div className="ln-photo-controls">
        <div className="ln-photo-row">
          {photo.source && <img src={photo.source} alt={photo.name || "配图"} />}
          <label className="ln-requirement">
            <span>需求</span>
            {requirement}
          </label>
          <button type="button" className="ln-button ln-small" disabled={uploading} onClick={openFilePicker}>
            <ImagePlus size={13} />{uploading ? "读取中" : uploadLabel}
          </button>
          {fileInput}
          {(onRemove || photo.source) && (
            <button type="button" className="ln-icon-button ln-remove" aria-label={`移除${label}配图`} title="移除配图" onClick={removePhoto}><X size={15} /></button>
          )}
        </div>
        {error && <p role="alert" className="ln-error">{error}</p>}
      </div>
    </div>
  );
}

const VOCABULARY_LABELS = { word: "文本", pinyin: "拼音", meaning: "义", example: "例" } as const;

function EntryEditor({ entry, index, block, inline, onChange, onRemove, onInsertAfter }: {
  entry: NoteEntry;
  index: number;
  block: NoteBlock;
  inline: boolean;
  onChange: (update: (entry: NoteEntry) => NoteEntry) => void;
  onRemove: () => void;
  onInsertAfter: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id });
  const isWord = block.id === "words";
  const title = `${isWord ? "好词好句" : "内容块"} ${index + 1}`;
  const fields = layoutFields(block.layout);
  const wordLayout = block.wordLayout ?? "text-top";
  const showWordPhotoCard = inline && isWord && block.wordLayout !== undefined && layoutFields(wordLayout).some((field) => field === "photo");
  const showPhotoCard = inline && (!isWord || showWordPhotoCard);
  const wordFields = layoutFields(inline ? wordLayout : "text-top").filter((field) => (
    field === "text" || Boolean(entry.photo)
  ));
  const wordPanelId = useId();
  const photoField = (
    <PhotoField key="photo" photo={entry.photo ?? { requirement: "" }} label={title} inline={showPhotoCard} onChange={(change) => onChange((current) => ({
      ...current, photo: { requirement: "", ...current.photo, ...change },
    }))} onRemove={isWord && entry.photo && !showPhotoCard ? () => onChange((current) => ({ ...current, photo: undefined })) : undefined} />
  );
  const canAddWordPhoto = !showWordPhotoCard && !entry.photo && (!inline || layoutFields(wordLayout).some((field) => field === "photo"));

  function vocabularyField(key: keyof typeof VOCABULARY_LABELS) {
    const label = VOCABULARY_LABELS[key];
    return (
      <label className="ln-field" data-field={key} key={key}>
        <span className="ln-field-label">{label}</span>
        <input aria-label={`${title} ${label}`} value={entry[key] ?? ""} placeholder={inline && key === "pinyin" ? "输入拼音" : inline && key === "word" ? "输入好词好句" : "请输入内容"} onChange={(event) => {
          const value = event.target.value;
          onChange((current) => ({ ...current, [key]: value }));
        }} />
      </label>
    );
  }

  const wordForm = isWord && (
    <>
      {vocabularyField("word")}
      {vocabularyField("pinyin")}
      {wordFields.includes("text") && <>{vocabularyField("meaning")}{vocabularyField("example")}</>}
      {!showWordPhotoCard && wordFields.includes("photo") && photoField}
      {canAddWordPhoto && (
        <button type="button" className="ln-button ln-small" onClick={() => onChange((current) => ({ ...current, photo: { requirement: "" } }))}>
          <Plus size={13} />添加配图
        </button>
      )}
    </>
  );

  return (
    <div className="ln-entry" id={`ln-entry-${entry.id}`} ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} data-dragging={isDragging} tabIndex={inline ? -1 : undefined} onPointerDown={inline ? (event) => {
      if (event.pointerType === "touch" && event.target instanceof Element && !event.target.closest("button, input, [contenteditable], [popover]")) {
        event.currentTarget.focus({ preventScroll: true });
      }
    } : undefined}>
      <div className={inline ? "ln-entry-header ln-hover-action" : "ln-entry-header"}>
        <span>{title}</span>
        <div className="ln-entry-actions">
          {block.entries.length > 1 && <DragHandle ref={setActivatorNodeRef} label={`排序${title}`} {...attributes} {...listeners} />}
          <button type="button" className="ln-icon-button ln-remove" aria-label={`删除${title}`} title={`删除${title}`} onClick={onRemove}><X size={16} /></button>
        </div>
      </div>
      {isWord ? (
        inline ? (
          <>
            <div className="ln-vocabulary-reading">
              <Vocabulary entry={entry} layout={wordLayout} photoSlot={showWordPhotoCard ? photoField : undefined} />
              <button type="button" className="ln-vocabulary-trigger" aria-label={`编辑${title}`} popoverTarget={wordPanelId}>编辑词条</button>
            </div>
            <div className="ln-floating-panel ln-field-panel ln-word-panel" popover="auto" id={wordPanelId} role="group" aria-label={`编辑${title}`} onToggle={(event) => {
              if (event.newState === "open") event.currentTarget.querySelector("input")?.focus({ preventScroll: true });
            }}>
              {wordForm}
            </div>
          </>
        ) : wordForm
      ) : (
        <div className="ln-entry-layout ln-content-layout" data-layout={block.layout} data-paired={fields.length === 2}>
          {fields.map((field) => field === "photo" ? photoField : (
            <div className="ln-field ln-entry-text" key={field}>
              <span className="ln-field-label">富文本</span>
              <RequirementRichText basicToolbar value={entry.richText ?? EMPTY_RICH_TEXT} placeholder="请输入内容" fieldLabel={`${blockLabel(block.id)} ${title} 富文本`} onChange={(richText) => onChange((current) => ({ ...current, richText }))} />
            </div>
          ))}
        </div>
      )}
      {inline && (
        <button type="button" className="ln-button ln-small ln-inline-entry-add ln-hover-action" aria-label={`在${title}后${isWord ? "新增好词" : "添加内容块"}`} onClick={onInsertAfter}>
          <Plus size={13} />{isWord ? "新增好词" : "添加内容块"}
        </button>
      )}
    </div>
  );
}

export function NoteBlockEditor({ block, index, collapsed, inline, onChange, onToggle, onRemove }: {
  block: NoteBlock;
  index: number;
  collapsed: boolean;
  inline: boolean;
  onChange: (update: (block: NoteBlock) => NoteBlock) => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const sensors = useNoteSortSensors();
  const label = blockLabel(block.id);
  const isWord = block.id === "words";
  const layoutTrigger = useRef<HTMLButtonElement>(null);
  const layoutPopover = useRef<HTMLDivElement>(null);
  const layoutId = `ln-layout-picker-${block.id}`;
  const activeLayout = isWord ? block.wordLayout ?? "text-top" : block.layout;
  const destinations = (
    <div className="ln-destinations">
      <label><input type="checkbox" checked={block.weekly} onChange={(event) => {
        const weekly = event.target.checked;
        onChange((current) => ({ ...current, weekly }));
      }} />进入周笔记</label>
      <label><input type="checkbox" checked={block.report} onChange={(event) => {
        const report = event.target.checked;
        onChange((current) => ({ ...current, report }));
      }} />进入报告</label>
    </div>
  );

  function reorderEntries({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    onChange((current) => {
      const from = current.entries.findIndex(({ id }) => id === active.id);
      const to = current.entries.findIndex(({ id }) => id === over.id);
      return from < 0 || to < 0 ? current : { ...current, entries: arrayMove(current.entries, from, to) };
    });
  }

  function chooseLayout(layout: LayoutId) {
    onChange((current) => isWord ? { ...current, wordLayout: layout } : { ...current, layout });
  }

  function insertEntry(afterId?: string) {
    const entry = createEntry();
    onChange((current) => {
      const index = current.entries.findIndex(({ id }) => id === afterId);
      const position = index < 0 ? current.entries.length : index + 1;
      return { ...current, entries: [...current.entries.slice(0, position), entry, ...current.entries.slice(position)] };
    });
    if (inline) openNoteEntry(entry.id);
  }

  return (
    <section className="ln-block" ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} data-dragging={isDragging} aria-label={label}>
      <div className="ln-block-header">
        <DragHandle ref={setActivatorNodeRef} label={`排序${label}`} {...attributes} {...listeners} />
        <h2>{inline ? (
          <span className="ln-note-title" tabIndex={0} onPointerDown={(event) => {
            if (event.pointerType === "touch") event.currentTarget.focus({ preventScroll: true });
          }}><NoteHeading index={index} label={label} /></span>
        ) : (
          <button type="button" id={`ln-block-toggle-${block.id}`} aria-expanded={!collapsed} aria-controls={`ln-block-${block.id}`} onClick={onToggle}>
            <span className="ln-block-number">{String(index + 1).padStart(2, "0")}</span>{label}
          </button>
        )}</h2>
        {inline ? (
          <div className="ln-inline-header-actions ln-hover-action">
            <button ref={layoutTrigger} type="button" className="ln-button ln-small" popoverTarget={layoutId}>切换布局</button>
            <div ref={layoutPopover} className="ln-layout-popover" id={layoutId} popover="auto" role="group" aria-label={`${label}图文布局`} onToggle={(event) => {
              if (event.newState === "open") event.currentTarget.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')?.focus({ preventScroll: true });
            }}>
              <div className="ln-layouts">
                {LAYOUTS.map((layout) => (
                  <button type="button" className="ln-layout-tile" key={layout.id} aria-pressed={activeLayout === layout.id} onClick={() => {
                    chooseLayout(layout.id);
                    layoutPopover.current?.hidePopover();
                    layoutTrigger.current?.focus({ preventScroll: true });
                  }}><LayoutPicture layout={layout.id} />{layout.label}</button>
                ))}
              </div>
            </div>
            <button type="button" className="ln-icon-button" aria-label={`${label}更多操作`} title="更多操作" popoverTarget={`ln-options-${block.id}`}><Ellipsis size={16} /></button>
            <div className="ln-floating-panel ln-inline-options-panel" id={`ln-options-${block.id}`} popover="auto">
              {destinations}
              <button type="button" className="ln-button ln-small ln-remove" aria-label={`删除${label}板块`} onClick={(event) => {
                event.currentTarget.closest<HTMLElement>("[popover]")?.hidePopover();
                onRemove();
              }}>删除板块</button>
            </div>
          </div>
        ) : (
          <>
            {!isWord && (
              <fieldset className="ln-header-layouts" aria-label={`${label}图文布局`}>
                {LAYOUTS.map((layout) => (
                  <label className="ln-header-layout" key={layout.id}>
                    <input type="radio" name={`ln-layout-${block.id}`} aria-label={layout.label}
                      checked={activeLayout === layout.id} onChange={() => chooseLayout(layout.id)} />
                    <LayoutPicture layout={layout.id} />
                    <span className="ln-layout-tip" aria-hidden="true">{layout.label}</span>
                  </label>
                ))}
              </fieldset>
            )}
            {destinations}
            <div className="ln-block-actions">
              <button type="button" className="ln-icon-button" aria-label={`${collapsed ? "展开" : "收起"}${label}`} aria-controls={`ln-block-${block.id}`} aria-expanded={!collapsed} onClick={onToggle}>
                {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
              </button>
              <button type="button" className="ln-icon-button ln-remove" aria-label={`删除${label}板块`} title={`删除${label}板块`} onClick={onRemove}><X size={16} /></button>
            </div>
          </>
        )}
      </div>
      {(inline || !collapsed) && (
        <div className="ln-block-body" id={`ln-block-${block.id}`}>
          <DndContext id={`ln-entries-${block.id}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorderEntries}>
            <SortableContext items={block.entries.map((entry) => entry.id)} strategy={verticalListSortingStrategy}>
              {block.entries.map((entry, entryIndex) => (
                <EntryEditor key={entry.id} entry={entry} index={entryIndex} block={block} inline={inline} onInsertAfter={() => insertEntry(entry.id)}
                  onChange={(update) => onChange((current) => ({
                    ...current,
                    entries: current.entries.map((item) => item.id === entry.id ? update(item) : item),
                  }))}
                  onRemove={() => onChange((current) => ({
                    ...current,
                    entries: current.entries.filter(({ id }) => id !== entry.id),
                  }))}
                />
              ))}
            </SortableContext>
          </DndContext>
          {(!inline || block.entries.length === 0) && (
            <button type="button" className="ln-button ln-add-entry" onClick={() => insertEntry()}><Plus size={14} />{isWord ? "新增好词" : "新增内容块"}</button>
          )}
        </div>
      )}
    </section>
  );
}
