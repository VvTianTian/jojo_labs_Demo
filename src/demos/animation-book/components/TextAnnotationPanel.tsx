import { useEffect, useState, type DragEvent as ReactDragEvent } from "react";
import { Check, ChevronDown, ChevronUp, FileAudio, FileImage, Film, GripVertical, Info, ListOrdered, MessageCircle, Plus, Type, X } from "lucide-react";
import type { BookElement, PlaybackDisplayMode, PlaybackOrderItem, QuestionElement, QuestionOption, TextAnnotation, TextAnnotationType } from "../types";
import { ANNOTATION_LABELS } from "../annotation-utils";

export type AnnotationPanelTab = "voice" | TextAnnotationType | "standard" | "playback" | "question";

type PlaybackDropPosition = "before" | "after";

interface VoiceItem {
  id: string;
  type: "text" | "bubble";
  label: string;
  content: string;
  voiceSupplement: string;
}

interface TextAnnotationPanelProps {
  activeTab: AnnotationPanelTab;
  annotations: TextAnnotation[];
  selectedAnnotationId: string | null;
  standardInteractionCount: number;
  question: QuestionElement | null;
  questionOnly?: boolean;
  canEditQuestion: boolean;
  voiceItems: VoiceItem[];
  elements: BookElement[];
  playbackOrder: PlaybackOrderItem[];
  onChangeTab: (tab: AnnotationPanelTab) => void;
  onUpdatePlaybackDisplayMode: (elementId: string, displayMode: PlaybackDisplayMode) => void;
  onMovePlaybackOrder: (elementId: string, direction: -1 | 1) => void;
  onReorderPlaybackOrder: (elementId: string, targetElementId: string, position: PlaybackDropPosition) => void;
  onSelectAnnotation: (annotationId: string) => void;
  onUpdateAnnotation: (annotationId: string, patch: Partial<TextAnnotation>) => void;
  onQuickFill: (annotationId: string) => void;
  onUpdateVoiceSupplement: (elementId: string, voiceSupplement: string) => void;
  onUpdateQuestion: (elementId: string, patch: Partial<Pick<QuestionElement, "stem" | "optionMode">>) => void;
  onUpdateQuestionOption: (elementId: string, optionId: string, patch: Partial<Pick<QuestionOption, "content" | "isCorrect">>) => void;
  onAddQuestionOption: (elementId: string) => void;
  onRemoveQuestionOption: (elementId: string, optionId: string) => void;
}

const annotationTypes: TextAnnotationType[] = ["word", "sentence", "note"];

const splitLines = (value: string) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

const getAnnotationsByType = (annotations: TextAnnotation[], type: TextAnnotationType) =>
  annotations.filter((annotation) => annotation.type === type);

export function TextAnnotationPanel({
  activeTab,
  annotations,
  selectedAnnotationId,
  standardInteractionCount,
  question,
  questionOnly = false,
  canEditQuestion,
  voiceItems,
  elements,
  playbackOrder,
  onChangeTab,
  onUpdatePlaybackDisplayMode,
  onMovePlaybackOrder,
  onReorderPlaybackOrder,
  onSelectAnnotation,
  onUpdateAnnotation,
  onQuickFill,
  onUpdateVoiceSupplement,
  onUpdateQuestion,
  onUpdateQuestionOption,
  onAddQuestionOption,
  onRemoveQuestionOption,
}: TextAnnotationPanelProps) {
  const activeAnnotations = activeTab === "voice" || activeTab === "standard" || activeTab === "playback" || activeTab === "question"
    ? []
    : getAnnotationsByType(annotations, activeTab);
  const activeAnnotation = activeAnnotations.find((annotation) => annotation.id === selectedAnnotationId)
    ?? activeAnnotations[0]
    ?? null;

  return (
    <div className="ab-context-panel">
      <div className="ab-context-panel-header" role="tablist" aria-label="正文内容配置">
        <div className="ab-context-tabs">
          {questionOnly ? (
            question && (
              <ContextTab
                active={activeTab === "question"}
                label="题"
                count={1}
                onClick={() => onChangeTab("question")}
              />
            )
          ) : (
            <>
              <ContextTab
                active={activeTab === "voice"}
                label="领读语音"
                count={voiceItems.length}
                onClick={() => onChangeTab("voice")}
              />
              {annotationTypes.map((type) => {
                const count = getAnnotationsByType(annotations, type).length;
                if (count === 0) return null;
                return (
                  <ContextTab
                    key={type}
                    active={activeTab === type}
                    label={ANNOTATION_LABELS[type]}
                    count={count}
                    onClick={() => onChangeTab(type)}
                  />
                );
              })}
              {question && (
                <ContextTab
                  active={activeTab === "question"}
                  label="题"
                  count={1}
                  onClick={() => onChangeTab("question")}
                />
              )}
              {standardInteractionCount > 0 && (
                <ContextTab
                  active={activeTab === "standard"}
                  label="标准互动"
                  count={standardInteractionCount}
                  disabled
                  onClick={() => undefined}
                />
              )}
            </>
          )}
        </div>
        {!questionOnly && (
          <div className="ab-context-playback-slot">
            <ContextTab
              active={activeTab === "playback"}
              label="播放顺序"
              icon={<ListOrdered size={13} aria-hidden="true" />}
              className="ab-context-playback-tab"
              onClick={() => onChangeTab("playback")}
            />
          </div>
        )}
      </div>

      <div className="ab-context-panel-content">
        {activeTab === "voice" && (
          <VoicePanel
            items={voiceItems}
            onUpdateVoiceSupplement={onUpdateVoiceSupplement}
          />
        )}
        {activeTab === "standard" && <StandardInteractionPlaceholder />}
        {activeTab === "question" && question && (
          <QuestionPanel
            question={question}
            canEdit={canEditQuestion}
            onUpdate={onUpdateQuestion}
            onUpdateOption={onUpdateQuestionOption}
            onAddOption={onAddQuestionOption}
            onRemoveOption={onRemoveQuestionOption}
          />
        )}
        {activeTab === "playback" && (
          <PlaybackOrderPanel
            elements={elements}
            playbackOrder={playbackOrder}
            onUpdateDisplayMode={onUpdatePlaybackDisplayMode}
            onMove={onMovePlaybackOrder}
            onReorder={onReorderPlaybackOrder}
          />
        )}
        {activeAnnotation && (
          <AnnotationEditor
            annotation={activeAnnotation}
            onUpdate={(patch) => onUpdateAnnotation(activeAnnotation.id, patch)}
            onQuickFill={() => onQuickFill(activeAnnotation.id)}
            annotations={activeAnnotations}
            onSelectAnnotation={onSelectAnnotation}
          />
        )}
        {activeTab !== "voice" && activeTab !== "standard" && activeTab !== "playback" && activeTab !== "question" && !activeAnnotation && (
          <div className="ab-context-empty">当前类型暂无标注</div>
        )}
      </div>
    </div>
  );
}

function ContextTab({
  active,
  label,
  count,
  icon,
  className,
  disabled = false,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-disabled={disabled || undefined}
      className={`ab-context-tab${active ? " is-active" : ""}${disabled ? " is-disabled" : ""}${className ? ` ${className}` : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      {label}
      {typeof count === "number" && <span className="ab-context-tab-count">{count}</span>}
    </button>
  );
}

const EMPTY_VOICE_SUPPLEMENT_TOOLTIP = "暂无音频补充要求（如语气、音色等台词内容以外的要求）";

function VoicePanel({
  items,
  onUpdateVoiceSupplement,
}: {
  items: VoiceItem[];
  onUpdateVoiceSupplement: (elementId: string, voiceSupplement: string) => void;
}) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const editingItem = items.find((item) => item.id === editingItemId) ?? null;

  const openEditor = (item: VoiceItem) => {
    setEditingItemId(item.id);
    setDraft(item.voiceSupplement);
  };

  const closeEditor = () => {
    setEditingItemId(null);
    setDraft("");
  };

  const saveEditor = () => {
    if (!editingItem) return;
    onUpdateVoiceSupplement(editingItem.id, draft.trim() ? draft : "");
    closeEditor();
  };

  return (
    <>
      <div className="ab-voice-panel">
        {items.length === 0 && <div className="ab-context-empty">当前页面暂无文本或对话语音</div>}
        {items.map((item, index) => (
          <div className="ab-voice-item" key={item.id}>
            <span className="ab-voice-index">{index + 1}</span>
            <span className={"ab-voice-kind ab-voice-kind--" + item.type}>{item.label}</span>
            <div className="ab-voice-copy" aria-label={item.label + "台词需求"}>{item.content || "未填写内容"}</div>
            <VoiceSupplementButton item={item} onClick={() => openEditor(item)} />
          </div>
        ))}
      </div>
      {editingItem && (
        <VoiceSupplementModal
          item={editingItem}
          draft={draft}
          onChange={setDraft}
          onCancel={closeEditor}
          onConfirm={saveEditor}
        />
      )}
    </>
  );
}

function VoiceSupplementButton({
  item,
  onClick,
}: {
  item: VoiceItem;
  onClick: () => void;
}) {
  const hasSupplement = item.voiceSupplement.trim().length > 0;
  const tooltipText = hasSupplement ? item.voiceSupplement : EMPTY_VOICE_SUPPLEMENT_TOOLTIP;

  return (
    <span className="ab-voice-supplement-wrap">
      <button
        type="button"
        className={"ab-voice-supplement-button" + (hasSupplement ? " is-filled" : "")}
        aria-label={item.label + "补充需求"}
        title={tooltipText}
        onClick={onClick}
      >
        <span aria-hidden="true">补</span>
      </button>
      <span className="ab-voice-supplement-tooltip" role="tooltip">{tooltipText}</span>
    </span>
  );
}

function VoiceSupplementModal({
  item,
  draft,
  onChange,
  onCancel,
  onConfirm,
}: {
  item: VoiceItem;
  draft: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      className="ab-voice-dialog-backdrop"
      onClick={onCancel}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
        }
      }}
    >
      <div
        className="ab-voice-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ab-voice-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ab-voice-dialog-header">
          <h2 id="ab-voice-dialog-title">领读语音需求</h2>
          <button type="button" className="ab-voice-dialog-close" aria-label="关闭领读语音需求" title="关闭" onClick={onCancel}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="ab-voice-dialog-body">
          <div className="ab-voice-dialog-alert" role="note">
            <Info size={16} aria-hidden="true" />
            <span>台词需求自动保持与正文文本一致，无法修改。若有角色、语气、语速等其它需求请填写至“补充要求”中</span>
          </div>
          <div className="ab-voice-dialog-field">
            <span className="ab-voice-dialog-field-label">台词需求</span>
            <div className="ab-voice-dialog-readonly">{item.content || "未填写内容"}</div>
          </div>
          <label className="ab-voice-dialog-field">
            <span className="ab-voice-dialog-field-label">补充</span>
            <textarea
              autoFocus
              className="ab-voice-dialog-textarea"
              value={draft}
              onChange={(event) => onChange(event.target.value)}
              placeholder="请输入语气、音色、语速等补充要求"
              rows={4}
              aria-label="补充需求"
            />
          </label>
        </div>
        <div className="ab-voice-dialog-footer">
          <button type="button" className="ab-secondary-button" onClick={onCancel}>取消</button>
          <button type="button" className="ab-primary-button" onClick={onConfirm}>确认</button>
        </div>
      </div>
    </div>
  );
}

function StandardInteractionPlaceholder() {
  return (
    <div className="ab-context-placeholder" aria-disabled="true">
      <span className="ab-context-placeholder-icon">题</span>
      <div>
        <strong>标准互动</strong>
        <span>互动题目编辑将在后续版本接入</span>
      </div>
    </div>
  );
}

function QuestionPanel({
  question,
  canEdit,
  onUpdate,
  onUpdateOption,
  onAddOption,
  onRemoveOption,
}: {
  question: QuestionElement;
  canEdit: boolean;
  onUpdate: (elementId: string, patch: Partial<Pick<QuestionElement, "stem" | "optionMode">>) => void;
  onUpdateOption: (elementId: string, optionId: string, patch: Partial<Pick<QuestionOption, "content" | "isCorrect">>) => void;
  onAddOption: (elementId: string) => void;
  onRemoveOption: (elementId: string, optionId: string) => void;
}) {
  const minOptions = 2;
  const maxOptions = 4;

  return (
    <div className="ab-question-panel">
      <div className="ab-question-panel-header">
        <div className="ab-question-panel-meta" aria-label="题目基本信息">
          <span className="ab-question-meta-number">1</span>
          <span className="ab-question-meta-tag">标准选择题</span>
          <span className="ab-question-meta-tag ab-question-meta-tag--blue">QT_000666</span>
          <span className="ab-question-meta-tag ab-question-meta-tag--muted">待同步</span>
          <span className="ab-question-meta-copy">通用布局 · 备注 -</span>
          <button type="button" className="ab-question-meta-link" disabled>引用记录 (3)</button>
        </div>
        <div className="ab-question-panel-actions">
          <button type="button" className="ab-secondary-button" disabled>取消</button>
          <button type="button" className="ab-primary-button" disabled={!canEdit}>保存</button>
        </div>
      </div>

      <div className="ab-question-panel-body">
        <section className="ab-question-section ab-question-section--main">
          <div className="ab-question-section-heading">
            <h3>题目区</h3>
          </div>

          <label className="ab-question-field">
            <span className="ab-question-field-label">题干文字</span>
            <textarea
              value={question.stem}
              readOnly={!canEdit}
              onChange={(event) => onUpdate(question.id, { stem: event.target.value })}
              placeholder="请输入内容"
              rows={2}
              aria-label="题干文字"
            />
          </label>
          <button type="button" className="ab-question-inline-button" disabled>
            <FileAudio size={13} aria-hidden="true" />题干语音
          </button>

          <div className="ab-question-materials">
            <span className="ab-question-field-label">材料</span>
            <div className="ab-question-material-actions">
              <button type="button" className="ab-question-material-button" disabled>＋文字材料</button>
              <button type="button" className="ab-question-material-button" disabled>＋图片材料</button>
              <button type="button" className="ab-question-material-button" disabled>＋听力材料</button>
            </div>
          </div>

          <div className="ab-question-options-heading">
            <span className="ab-question-field-label">选项</span>
            <div className="ab-question-option-mode" role="group" aria-label="选项类型">
              <button type="button" className={question.optionMode === "text" ? "is-active" : ""} disabled={!canEdit} onClick={() => onUpdate(question.id, { optionMode: "text" })}>文本选项</button>
              <button type="button" className={question.optionMode === "image" ? "is-active" : ""} disabled>图片选项</button>
            </div>
          </div>

          <div className="ab-question-options-grid">
            {question.options.map((option, index) => (
              <div className="ab-question-option-editor" key={option.id}>
                <span className="ab-question-option-prefix" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
                <input
                  type="text"
                  value={option.content}
                  readOnly={!canEdit || question.optionMode === "image"}
                  onChange={(event) => onUpdateOption(question.id, option.id, { content: event.target.value })}
                  placeholder="请输入选项内容"
                  aria-label={`选项${String.fromCharCode(65 + index)}`}
                />
                <button
                  type="button"
                  className={`ab-question-correct-button${option.isCorrect ? " is-active" : ""}`}
                  aria-pressed={option.isCorrect}
                  disabled={!canEdit}
                  onClick={() => onUpdateOption(question.id, option.id, { isCorrect: !option.isCorrect })}
                >
                  {option.isCorrect && <Check size={12} aria-hidden="true" />}
                  {option.isCorrect ? "正确选项" : "设为正确选项"}
                </button>
                <button
                  type="button"
                  className="ab-question-option-remove"
                  aria-label={`删除选项${String.fromCharCode(65 + index)}`}
                  title={question.options.length <= minOptions ? "至少保留两个选项" : "删除选项"}
                  disabled={!canEdit || question.options.length <= minOptions}
                  onClick={() => onRemoveOption(question.id, option.id)}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          <div className="ab-question-options-footer">
            <button
              type="button"
              className="ab-question-add-option"
              disabled={!canEdit || question.options.length >= maxOptions}
              onClick={() => onAddOption(question.id)}
            >
              <Plus size={14} aria-hidden="true" />添加选项
            </button>
            <span>选项显示数量 <strong>{question.options.length}</strong></span>
          </div>
        </section>

        <QuestionPlaceholderSection title="答案区">暂未设置</QuestionPlaceholderSection>
        <QuestionPlaceholderSection title="解析区">
          <span>解析内容</span>
          <div className="ab-question-placeholder-actions"><button type="button" disabled>添加文本</button><button type="button" disabled>添加图片</button><button type="button" disabled>添加图文</button></div>
        </QuestionPlaceholderSection>
        <QuestionPlaceholderSection title="标签区">
          <div className="ab-question-placeholder-tags"><span>真题来源</span><span>标签课程线</span><span>知识点</span><span>难度</span><span>能力</span></div>
        </QuestionPlaceholderSection>
      </div>
    </div>
  );
}

function QuestionPlaceholderSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="ab-question-section ab-question-section--placeholder">
      <div className="ab-question-section-heading"><h3>{title}</h3></div>
      <div className="ab-question-placeholder-content">{children}</div>
    </section>
  );
}

function getPlaybackElementTitle(element: BookElement) {
  if (element.type === "text") return element.content || "未填写文本";
  if (element.type === "image") return element.alt || "未命名图片";
  if (element.type === "motion") return element.fileName || "未命名动效";
  if (element.type === "question") return element.stem || "题目";
  return element.content || "未填写对话";
}

function getPlaybackElementLabel(element: BookElement) {
  if (element.type === "text") return "文本";
  if (element.type === "image") return "图片";
  if (element.type === "motion") return "动效";
  if (element.type === "question") return "题";
  return "对话";
}

function PlaybackElementPreview({ element }: { element: BookElement }) {
  if ((element.type === "image" || element.type === "motion") && element.src) {
    return <img className="ab-playback-element-image" src={element.src} alt="" />;
  }

  return (
    <span className={`ab-playback-element-icon ab-playback-element-icon--${element.type}`} aria-hidden="true">
      {element.type === "text" ? <Type size={14} /> : element.type === "image" ? <FileImage size={14} /> : element.type === "motion" ? <Film size={14} /> : element.type === "question" ? <span>题</span> : <MessageCircle size={14} />}
    </span>
  );
}

function PlaybackOrderPanel({
  elements,
  playbackOrder,
  onUpdateDisplayMode,
  onMove,
  onReorder,
}: {
  elements: BookElement[];
  playbackOrder: PlaybackOrderItem[];
  onUpdateDisplayMode: (elementId: string, displayMode: PlaybackDisplayMode) => void;
  onMove: (elementId: string, direction: -1 | 1) => void;
  onReorder: (elementId: string, targetElementId: string, position: PlaybackDropPosition) => void;
}) {
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ elementId: string; position: PlaybackDropPosition } | null>(null);
  const elementsById = new Map(elements.map((element) => [element.id, element]));
  const visibleItems = playbackOrder
    .map((item) => ({ item, element: elementsById.get(item.elementId) }))
    .filter((entry): entry is { item: PlaybackOrderItem; element: BookElement } => Boolean(entry.element));

  const clearDragState = () => {
    setDraggedElementId(null);
    setDropTarget(null);
  };

  const handleDragStart = (event: ReactDragEvent<HTMLButtonElement>, elementId: string) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", elementId);
    setDraggedElementId(elementId);
  };

  const handleDragOver = (event: ReactDragEvent<HTMLDivElement>, elementId: string) => {
    if (!draggedElementId || draggedElementId === elementId) return;
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    setDropTarget({
      elementId,
      position: event.clientY < bounds.top + bounds.height / 2 ? "before" : "after",
    });
  };

  const handleDrop = (event: ReactDragEvent<HTMLDivElement>, targetElementId: string) => {
    event.preventDefault();
    const sourceElementId = draggedElementId ?? event.dataTransfer.getData("text/plain");
    const position = dropTarget?.elementId === targetElementId ? dropTarget.position : "before";
    if (sourceElementId && sourceElementId !== targetElementId) onReorder(sourceElementId, targetElementId, position);
    clearDragState();
  };

  return (
    <section className="ab-playback-panel" aria-label="播放顺序编辑">
      <div className="ab-playback-panel-heading">
        <div className="ab-playback-panel-title"><ListOrdered size={16} aria-hidden="true" /><strong>播放顺序</strong></div>
      </div>
      {visibleItems.length === 0 && <div className="ab-context-empty">当前页面暂无可排序元素</div>}
      <div className="ab-playback-order-list" role="list">
        {visibleItems.map(({ item, element }, index) => (
          <div
            key={item.elementId}
            className={`ab-playback-order-item${draggedElementId === item.elementId ? " is-dragging" : ""}${dropTarget?.elementId === item.elementId ? ` is-drop-${dropTarget.position}` : ""}`}
            role="listitem"
            onDragOver={(event) => handleDragOver(event, item.elementId)}
            onDrop={(event) => handleDrop(event, item.elementId)}
          >
            <span className="ab-playback-order-number">{index + 1}</span>
            <button
              type="button"
              className="ab-playback-drag-handle"
              draggable
              aria-label={`拖动${getPlaybackElementLabel(element)}${index + 1}调整顺序`}
              onDragStart={(event) => handleDragStart(event, item.elementId)}
              onDragEnd={clearDragState}
            >
              <GripVertical size={14} aria-hidden="true" />
            </button>
            <div className="ab-playback-order-main">
              <span className="ab-playback-order-kind">{getPlaybackElementLabel(element)}</span>
              <div className={`ab-playback-order-copy ab-playback-order-copy--${element.type}`}>
                {element.type !== "text" && <PlaybackElementPreview element={element} />}
                <span>{getPlaybackElementTitle(element)}</span>
              </div>
            </div>
            <select
              className="ab-playback-display-mode"
              aria-label={`${getPlaybackElementLabel(element)}${index + 1}展示方式`}
              value={item.displayMode}
              onPointerDown={(event) => event.stopPropagation()}
              onChange={(event) => onUpdateDisplayMode(item.elementId, event.target.value as PlaybackDisplayMode)}
            >
              <option value="always">一直出现</option>
              <option value="onPlayback">播放时出现</option>
            </select>
            <div className="ab-playback-order-actions" aria-label="调整顺序">
              <button type="button" aria-label="上移" onClick={() => onMove(item.elementId, -1)} disabled={index === 0}><ChevronUp size={13} /></button>
              <button type="button" aria-label="下移" onClick={() => onMove(item.elementId, 1)} disabled={index === visibleItems.length - 1}><ChevronDown size={13} /></button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AnnotationEditor({
  annotation,
  annotations,
  onUpdate,
  onQuickFill,
  onSelectAnnotation,
}: {
  annotation: TextAnnotation;
  annotations: TextAnnotation[];
  onUpdate: (patch: Partial<TextAnnotation>) => void;
  onQuickFill: () => void;
  onSelectAnnotation: (annotationId: string) => void;
}) {
  return (
    <div className="ab-annotation-editor">
      <div className="ab-annotation-chip-row" aria-label={`${ANNOTATION_LABELS[annotation.type]}列表`}>
        {annotations.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`ab-annotation-chip${item.id === annotation.id ? " is-active" : ""}`}
            onClick={() => onSelectAnnotation(item.id)}
          >
            <span className={`ab-annotation-chip-mark ab-annotation-chip-mark--${item.type}`} aria-hidden="true">
              {item.type === "word" ? "词" : item.type === "sentence" ? "句" : "注"}
            </span>
            {item.text || "未命名标注"}
          </button>
        ))}
      </div>

      {annotation.type === "word" && (
        <>
          <div className="ab-annotation-field-row">
            <span className="ab-annotation-field-label">注音模式</span>
            <div className="ab-annotation-radio-group">
              <label><input type="radio" name={`pronunciation-${annotation.id}`} checked={annotation.pronunciationMode === "pinyin"} onChange={() => onUpdate({ pronunciationMode: "pinyin" })} />拼音</label>
              <label><input type="radio" name={`pronunciation-${annotation.id}`} checked={annotation.pronunciationMode === "phonetic"} onChange={() => onUpdate({ pronunciationMode: "phonetic" })} />音标</label>
            </div>
          </div>
          <AnnotationField label="拼音" value={annotation.pinyin} onChange={(value) => onUpdate({ pinyin: value })} />
          <AnnotationField label="翻译" value={annotation.translations.join("\n")} rows={2} onChange={(value) => onUpdate({ translations: splitLines(value) })} />
          <AnnotationField label="扩展讲解" value={annotation.explanation} rows={2} onChange={(value) => onUpdate({ explanation: value })} />
        </>
      )}

      {annotation.type === "sentence" && (
        <>
          <AnnotationField label="翻译" value={annotation.translations.join("\n")} rows={2} onChange={(value) => onUpdate({ translations: splitLines(value) })} />
          <AnnotationField label="扩展讲解" value={annotation.explanation} rows={2} onChange={(value) => onUpdate({ explanation: value })} />
        </>
      )}

      {annotation.type === "note" && (
        <AnnotationField label="注释" value={annotation.note} rows={2} onChange={(value) => onUpdate({ note: value })} />
      )}

      <VoiceRequirementFields
        annotation={annotation}
        onUpdate={onUpdate}
        onQuickFill={onQuickFill}
      />
    </div>
  );
}

function AnnotationField({
  label,
  value,
  rows = 1,
  onChange,
}: {
  label: string;
  value: string;
  rows?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="ab-annotation-field-row">
      <span className="ab-annotation-field-label">{label}</span>
      {rows > 1 ? (
        <textarea value={value} rows={rows} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input type="text" value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function VoiceRequirementFields({
  annotation,
  onUpdate,
  onQuickFill,
}: {
  annotation: TextAnnotation;
  onUpdate: (patch: Partial<TextAnnotation>) => void;
  onQuickFill: () => void;
}) {
  return (
    <div className="ab-annotation-voice-row">
      <span className="ab-annotation-field-label">语音</span>
      <div className="ab-annotation-voice-fields">
        <div className="ab-annotation-voice-line">
          <span className="ab-annotation-voice-tag">需求</span>
          <input aria-label={`${ANNOTATION_LABELS[annotation.type]}语音需求`} type="text" value={annotation.voiceRequest} onChange={(event) => onUpdate({ voiceRequest: event.target.value })} />
          <button type="button" className="ab-quick-fill-button" onClick={onQuickFill}>快捷填入</button>
        </div>
        <div className="ab-annotation-voice-line">
          <span className="ab-annotation-voice-tag">补充</span>
          <input aria-label={`${ANNOTATION_LABELS[annotation.type]}语音补充`} type="text" value={annotation.voiceSupplement} onChange={(event) => onUpdate({ voiceSupplement: event.target.value })} />
        </div>
      </div>
    </div>
  );
}

export type { VoiceItem };
