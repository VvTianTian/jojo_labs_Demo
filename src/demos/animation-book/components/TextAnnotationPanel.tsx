import { useState, type DragEvent as ReactDragEvent } from "react";
import { ChevronDown, ChevronUp, FileAudio, FileImage, Film, GripVertical, ListOrdered, MessageCircle, Type } from "lucide-react";
import type { BookElement, PlaybackDisplayMode, PlaybackOrderItem, TextAnnotation, TextAnnotationType } from "../types";
import { ANNOTATION_LABELS } from "../annotation-utils";

export type AnnotationPanelTab = "voice" | TextAnnotationType | "standard" | "playback";

type PlaybackDropPosition = "before" | "after";

interface VoiceItem {
  id: string;
  type: "text" | "bubble";
  content: string;
  hasAudio: boolean;
}

interface TextAnnotationPanelProps {
  activeTab: AnnotationPanelTab;
  annotations: TextAnnotation[];
  selectedAnnotationId: string | null;
  standardInteractionCount: number;
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
}

const annotationTypes: TextAnnotationType[] = ["word", "sentence", "note"];

const splitLines = (value: string) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

const getAnnotationsByType = (annotations: TextAnnotation[], type: TextAnnotationType) =>
  annotations.filter((annotation) => annotation.type === type);

const getElementTypeLabel = (type: VoiceItem["type"]) => type === "text" ? "文本" : "对话";

export function TextAnnotationPanel({
  activeTab,
  annotations,
  selectedAnnotationId,
  standardInteractionCount,
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
}: TextAnnotationPanelProps) {
  const activeAnnotations = activeTab === "voice" || activeTab === "standard" || activeTab === "playback"
    ? []
    : getAnnotationsByType(annotations, activeTab);
  const activeAnnotation = activeAnnotations.find((annotation) => annotation.id === selectedAnnotationId)
    ?? activeAnnotations[0]
    ?? null;

  return (
    <div className="ab-context-panel">
      <div className="ab-context-panel-header" role="tablist" aria-label="正文内容配置">
        <div className="ab-context-tabs">
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
          {standardInteractionCount > 0 && (
            <ContextTab
              active={activeTab === "standard"}
              label="标准互动"
              count={standardInteractionCount}
              disabled
              onClick={() => undefined}
            />
          )}
        </div>
        <div className="ab-context-playback-slot">
          <ContextTab
            active={activeTab === "playback"}
            label="播放顺序"
            icon={<ListOrdered size={13} aria-hidden="true" />}
            className="ab-context-playback-tab"
            onClick={() => onChangeTab("playback")}
          />
        </div>
      </div>

      <div className="ab-context-panel-content">
        {activeTab === "voice" && <VoicePanel items={voiceItems} />}
        {activeTab === "standard" && <StandardInteractionPlaceholder />}
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
        {activeTab !== "voice" && activeTab !== "standard" && activeTab !== "playback" && !activeAnnotation && (
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

function VoicePanel({ items }: { items: VoiceItem[] }) {
  return (
    <div className="ab-voice-panel">
      {items.length === 0 && <div className="ab-context-empty">当前页面暂无文本或对话语音</div>}
      {items.map((item, index) => (
        <div className="ab-voice-item" key={item.id}>
          <span className="ab-voice-index">{index + 1}</span>
          <span className={`ab-voice-kind ab-voice-kind--${item.type}`}>
            {item.type === "text" ? <Type size={12} aria-hidden="true" /> : <MessageCircle size={12} aria-hidden="true" />}
            {getElementTypeLabel(item.type)}
          </span>
          <div className="ab-voice-copy">{item.content || "未填写内容"}</div>
          <span className={`ab-voice-status${item.hasAudio ? " is-ready" : ""}`}>
            <FileAudio size={14} aria-hidden="true" />
            {item.hasAudio ? "已上传" : "需求"}
          </span>
        </div>
      ))}
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

function getPlaybackElementTitle(element: BookElement) {
  if (element.type === "text") return element.content || "未填写文本";
  if (element.type === "image") return element.alt || "未命名图片";
  if (element.type === "motion") return element.fileName || "未命名动效";
  return element.content || "未填写对话";
}

function getPlaybackElementLabel(element: BookElement) {
  if (element.type === "text") return "文本";
  if (element.type === "image") return "图片";
  if (element.type === "motion") return "动效";
  return "对话";
}

function PlaybackElementPreview({ element }: { element: BookElement }) {
  if ((element.type === "image" || element.type === "motion") && element.src) {
    return <img className="ab-playback-element-image" src={element.src} alt="" />;
  }

  return (
    <span className={`ab-playback-element-icon ab-playback-element-icon--${element.type}`} aria-hidden="true">
      {element.type === "text" ? <Type size={14} /> : element.type === "image" ? <FileImage size={14} /> : element.type === "motion" ? <Film size={14} /> : <MessageCircle size={14} />}
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
