import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ArrowLeft, Check, Maximize, Minimize, Play, Plus, X } from "lucide-react";
import { Link } from "react-router-dom";
import emptyArrow from "./assets/empty-arrow.svg";
import emptyMascot from "./assets/empty-mascot.svg";
import { NoteBlockEditor } from "./NoteBlockEditor";
import { NoteBanner, NotePreview } from "./NotePreview";
import { BLOCK_TYPES, STORAGE_KEY, blockLabel, createBlock, loadNotes, openNoteEntry, type BlockId, type NoteBlock } from "./notes";
import "./learning-notes.css";

function AddBlock({ blocks, position, open, placement, inline, onOpen, onClose, onAdd }: {
  blocks: NoteBlock[];
  position: number;
  open: boolean;
  placement: "empty" | "between" | "end";
  inline: boolean;
  onOpen: (position: number) => void;
  onClose: () => void;
  onAdd: (position: number, ids: BlockId[]) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<BlockId[]>([]);
  const [opensUp, setOpensUp] = useState(false);
  const used = new Set(blocks.map(({ id }) => id));
  const menuId = `ln-add-options-${position}`;
  const inlineSeam = inline && placement !== "empty";
  const buttonLabel = inline ? "新增板块" : "添加板块";

  useEffect(() => {
    if (!open) return;
    if (inline) menu.current?.showPopover({ source: trigger.current ?? undefined });
    else menu.current?.scrollIntoView({ block: "nearest" });
    const firstOption = menu.current?.querySelector<HTMLElement>("input:not(:disabled)");
    (firstOption ?? (inline ? menu.current : null))?.focus({ preventScroll: true });
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) onClose();
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [inline, open, onClose]);

  function closeAndRestoreFocus() {
    onClose();
    trigger.current?.focus({ preventScroll: true });
  }

  return (
    <div className={`ln-add ln-add--${placement}`} ref={root} data-open={open} data-opens-up={opensUp} data-inline-seam={inlineSeam} onPointerDown={inlineSeam ? (event) => {
      if (event.pointerType === "touch" && event.target === event.currentTarget) trigger.current?.focus({ preventScroll: true });
    } : undefined}>
      <button ref={trigger} type="button"
        className={inlineSeam ? "ln-button ln-small ln-inline-block-add" : placement === "between" ? "ln-insert" : "ln-button ln-add-button"}
        aria-label={placement === "between" ? `在第${position}个板块后插入` : buttonLabel}
        title={placement === "between" ? "在此处插入板块" : undefined}
        aria-expanded={open} aria-controls={open ? menuId : undefined}
        onClick={() => {
          if (open) closeAndRestoreFocus();
          else {
            const anchor = trigger.current?.getBoundingClientRect();
            const pane = root.current?.closest(".ln-editor-pane")?.getBoundingClientRect();
            setOpensUp(Boolean(anchor && pane && pane.bottom - anchor.bottom < 242 && anchor.top - pane.top > 242));
            setSelected([]);
            onOpen(position);
          }
        }}>
        <Plus size={14} />
        {(inline || placement !== "between") && buttonLabel}
      </button>
      {open && (
        <div className={inline ? "ln-floating-panel ln-inline-add-menu" : "ln-add-menu"} popover={inline ? "manual" : undefined} ref={menu} id={menuId} role="group" aria-label="选择学习笔记板块" tabIndex={inline ? -1 : undefined} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.stopPropagation();
          closeAndRestoreFocus();
        }}>
          {BLOCK_TYPES.map(({ id, label }) => {
            const added = used.has(id);
            return (
              <label key={id} className="ln-add-option" data-added={added}>
                <input type="checkbox" disabled={added} checked={selected.includes(id)} onChange={(event) => {
                  const checked = event.target.checked;
                  setSelected((current) => checked ? [...current, id] : current.filter((value) => value !== id));
                }} />
                <span>{label}</span>
                {added && <small>已添加</small>}
              </label>
            );
          })}
          <div className="ln-menu-footer">
            <button type="button" className="ln-button ln-primary ln-small" disabled={!selected.length} onClick={() => {
              onAdd(position, selected);
            }}>添加{selected.length > 0 ? `（${selected.length}）` : ""}</button>
          </div>
        </div>
      )}
    </div>
  );
}

type Confirmation = { kind: "reset" } | { kind: "delete"; id: BlockId };
const EDITOR_MODES = [
  { value: "split", label: "左编右览" },
  { value: "inline", label: "成品内编辑" },
] as const;

export function LearningNotesEditor() {
  const [saved, setSaved] = useState(loadNotes);
  const [blocks, setBlocks] = useState(saved);
  const [mode, setMode] = useState<(typeof EDITOR_MODES)[number]["value"]>("split");
  const [collapsed, setCollapsed] = useState<BlockId[]>([]);
  const [menu, setMenu] = useState<number | null>(null);
  const [full, setFull] = useState(false);
  const [notice, setNotice] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [revision, setRevision] = useState(0);
  const previewDialog = useRef<HTMLDialogElement>(null);
  const confirmDialog = useRef<HTMLDialogElement>(null);
  const closeMenu = useCallback(() => setMenu(null), []);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates, scrollBehavior: "auto" }),
  );
  const dirty = blocks !== saved && JSON.stringify(blocks) !== JSON.stringify(saved);
  const inline = mode === "inline";

  useEffect(() => {
    if (confirmation) confirmDialog.current?.showModal();
  }, [confirmation]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function addBlocks(position: number, ids: BlockId[]) {
    const candidates = ids.map(createBlock);
    setBlocks((current) => {
      const newBlocks = candidates.filter(({ id }) => !current.some((block) => block.id === id));
      return [...current.slice(0, position), ...newBlocks, ...current.slice(position)];
    });
    setMenu(null);
    if (inline && candidates[0]?.entries[0]) openNoteEntry(candidates[0].entries[0].id);
    else requestAnimationFrame(() => document.getElementById(`ln-block-toggle-${ids[0]}`)?.focus());
  }

  function updateBlock(id: BlockId, update: (block: NoteBlock) => NoteBlock) {
    setBlocks((current) => current.map((block) => block.id === id ? update(block) : block));
  }

  function reorderBlocks({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    setBlocks((current) => {
      const from = current.findIndex(({ id }) => id === active.id);
      const to = current.findIndex(({ id }) => id === over.id);
      return from < 0 || to < 0 ? current : arrayMove(current, from, to);
    });
    setMenu(null);
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
      setSaved(blocks);
      setNotice("已保存到当前浏览器");
    } catch {
      setNotice("保存失败，浏览器无法写入草稿。");
    }
  }

  function confirm() {
    if (confirmation?.kind === "delete") {
      setBlocks((current) => current.filter(({ id }) => id !== confirmation.id));
      setCollapsed((current) => current.filter((id) => id !== confirmation.id));
    } else {
      setBlocks(saved);
      setCollapsed([]);
      setRevision((current) => current + 1);
      setNotice("已恢复到上次保存的内容");
    }
    setMenu(null);
    confirmDialog.current?.close();
  }

  function renderAdd(position: number, placement: "empty" | "between" | "end") {
    return <AddBlock blocks={blocks} position={position} placement={placement} inline={inline} open={menu === position} onOpen={setMenu} onClose={closeMenu} onAdd={addBlocks} />;
  }

  return (
    <main className="ln-workbench" data-full={full} onKeyDown={(event) => {
      if (event.key === "Escape" && full && !previewDialog.current?.open && !confirmDialog.current?.open
        && !event.currentTarget.querySelector("[popover]:popover-open")) setFull(false);
    }}>
      <header className="ln-window-bar">
        <span className="ln-window-dots" aria-hidden="true"><i /><i /><i /></span>
        <Link to="/" className="ln-back" title="返回 Demo 首页"><ArrowLeft size={16} />工作台</Link>
      </header>

      <div className="ln-workbench-main">
        <section className="ln-task" aria-label="课程信息">
          <div className="ln-task-heading">
            <span className="ln-task-tag ln-task-tag--type">产</span>
            <span className="ln-task-tag ln-task-tag--status">进行中</span>
            <span className="ln-task-tag ln-task-tag--number">LS_105189</span>
            <h2>庄子成语：庖丁解牛</h2>
            <span className="ln-task-description">读一读 · 学习笔记需求</span>
          </div>
          <div className="ln-task-details">
            <span className="ln-task-tag"><span>课程</span>二十四单元 · 第二周</span>
            <span className="ln-task-tag"><span>主题</span>精读《成语里的科学》</span>
          </div>
        </section>

        <section className="ln-tool" aria-labelledby="ln-tool-title">
          <header className="ln-tool-bar">
            <div className="ln-tool-heading">
              <h1 id="ln-tool-title">学习笔记工具</h1>
              <div className="ln-mode-switch" role="group" aria-label="编辑模式">
                {EDITOR_MODES.map(({ value, label }) => (
                  <button type="button" key={value} aria-pressed={mode === value} onClick={() => {
                    closeMenu();
                    setMode(value);
                  }}>{label}</button>
                ))}
              </div>
            </div>
            <div className="ln-tool-actions">
              <button type="button" className="ln-button ln-plain" onClick={() => {
                setMenu(null);
                previewDialog.current?.showModal();
              }}><Play size={14} />预览</button>
              <span className="ln-tool-separator" />
              <button type="button" className="ln-button ln-plain" onClick={() => {
                setMenu(null);
                setFull((current) => !current);
              }}>{full ? <Minimize size={16} /> : <Maximize size={16} />}{full ? "退出全屏" : "全屏"}</button>
              <div className="ln-save-actions">
                <button type="button" className="ln-button" disabled={!dirty} onClick={() => setConfirmation({ kind: "reset" })}>取消</button>
                <button type="button" className="ln-button ln-primary" onClick={save}>保存</button>
              </div>
            </div>
          </header>

          <div className="ln-workspace" data-mode={mode}>
            <div className="ln-editor-pane" aria-label="笔记编辑区" key={revision}>
              <article className={inline ? "ln-note-canvas ln-note" : "ln-editor-structure"} aria-label={inline ? "今日笔记编辑区" : undefined}>
                {inline && <NoteBanner />}
                <div className="ln-note-editor-body">
                  {blocks.length === 0 ? (
                    <div className="ln-empty">
                      {renderAdd(0, "empty")}
                      {!inline && (
                        <div className="ln-empty-message">
                          <div className="ln-empty-illustration">
                            <img className="ln-empty-arrow" src={emptyArrow} alt="" />
                            <img src={emptyMascot} alt="" width={100} height={100} />
                          </div>
                          <p>添加第一个笔记板块</p>
                          <small>点击左上角「添加板块」，开始编写学习笔记</small>
                        </div>
                      )}
                    </div>
                  ) : (
                    <DndContext id="ln-block-order" sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorderBlocks}>
                      <SortableContext items={blocks.map(({ id }) => id)} strategy={verticalListSortingStrategy}>
                        {blocks.map((block, index) => (
                          <Fragment key={block.id}>
                            <NoteBlockEditor block={block} index={index} collapsed={collapsed.includes(block.id)} inline={inline}
                              onChange={(update) => updateBlock(block.id, update)}
                              onToggle={() => setCollapsed((current) => current.includes(block.id) ? current.filter((id) => id !== block.id) : [...current, block.id])}
                              onRemove={() => setConfirmation({ kind: "delete", id: block.id })}
                            />
                            {index < blocks.length - 1 && renderAdd(index + 1, "between")}
                          </Fragment>
                        ))}
                      </SortableContext>
                      {renderAdd(blocks.length, "end")}
                    </DndContext>
                  )}
                </div>
              </article>
            </div>
            {!inline && (
              <aside className="ln-preview-pane" aria-label="手机预览区">
                <div className="ln-phone" tabIndex={0}><NotePreview blocks={blocks} /></div>
              </aside>
            )}
          </div>
        </section>
      </div>

      <dialog ref={previewDialog} className="ln-dialog ln-preview-dialog" aria-labelledby="ln-preview-title" onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}>
        <div className="ln-dialog-header">
          <h2 id="ln-preview-title">今日笔记预览</h2>
          <button type="button" className="ln-icon-button" aria-label="关闭预览" onClick={() => previewDialog.current?.close()}><X size={19} /></button>
        </div>
        <div className="ln-dialog-preview"><div className="ln-phone" tabIndex={0}><NotePreview blocks={blocks} /></div></div>
      </dialog>

      <dialog ref={confirmDialog} className="ln-dialog ln-confirm-dialog" aria-labelledby="ln-confirm-title" onClose={() => setConfirmation(null)}>
        <h2 id="ln-confirm-title">{confirmation?.kind === "delete" ? `删除「${blockLabel(confirmation.id)}」？` : "放弃未保存的修改？"}</h2>
        <p>{confirmation?.kind === "delete" ? "该板块及其内容会从当前笔记中移除。" : "编辑器将恢复到上次保存的内容。"}</p>
        <div className="ln-confirm-actions">
          <button type="button" className="ln-button" autoFocus onClick={() => confirmDialog.current?.close()}>返回</button>
          <button type="button" className="ln-button ln-primary" onClick={confirm}>{confirmation?.kind === "delete" ? "删除板块" : "放弃修改"}</button>
        </div>
      </dialog>
      <div className="ln-notice-region" role="status">{notice && <span>{notice.startsWith("已") && <Check size={15} />}{notice}</span>}</div>
    </main>
  );
}
