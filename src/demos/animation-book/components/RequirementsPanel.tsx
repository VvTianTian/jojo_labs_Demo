import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  AudioLines,
  Check,
  CircleHelp,
  FileImage,
  FileUp,
  Film,
  Link2,
  Mic2,
  Trash2,
  Type,
} from "lucide-react";
import { RequirementRichText, RichTextPreview } from "./RequirementRichText";
import type {
  AnimationBookPage,
  BookElement,
  ProductionRequirement,
  RequirementTarget,
  RequirementType,
  UserRole,
} from "../types";

interface RequirementsPanelProps {
  page: AnimationBookPage;
  role: UserRole;
  selectedId: string | null;
  onSelectRequirement: (id: string) => void;
  onAddRequirement: (type: RequirementType) => void;
  onUpdateRequirement: (id: string, patch: Partial<ProductionRequirement>) => void;
  onDeleteRequirement: (id: string) => void;
  onUploadFile: (id: string, file: File) => void;
  getElement: (id: string) => BookElement | undefined;
}

const requirementTypeLabel = (type: RequirementType) => {
  if (type === "image") return "图片需求";
  if (type === "motion") return "动效需求";
  return "音频需求";
};

const elementLabel = (element: BookElement | undefined) => {
  if (!element) return "未绑定元素";
  if (element.type === "text") return "文本";
  if (element.type === "image") return element.alt || "图片";
  if (element.type === "motion") return element.fileName || "动效";
  return element.content.split("\n")[0] || "气泡";
};

const getTargetValue = (target: RequirementTarget | null) => {
  return target?.elementId ?? "";
};

const getAssetPreview = (requirement: ProductionRequirement) => {
  if (!requirement.asset) return null;
  if (requirement.type === "image" && requirement.asset.mimeType.startsWith("image/")) {
    return <img src={requirement.asset.url} alt={requirement.asset.fileName} />;
  }
  return (
    <div className="ab-production-file-preview">
      {requirement.type === "motion" ? <Film size={18} /> : <AudioLines size={18} />}
      <span>{requirement.asset.fileName}</span>
    </div>
  );
};

export function RequirementsPanel({
  page,
  role,
  selectedId,
  onSelectRequirement,
  onAddRequirement,
  onUpdateRequirement,
  onDeleteRequirement,
  onUploadFile,
  getElement,
}: RequirementsPanelProps) {
  const [uploadTarget, setUploadTarget] = useState<{ id: string; type: RequirementType } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isResearch = role === "research";

  const requestUpload = (requirement: ProductionRequirement) => {
    setUploadTarget({ id: requirement.id, type: requirement.type });
    window.setTimeout(() => inputRef.current?.click(), 0);
  };

  const handleUploadChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && uploadTarget) onUploadFile(uploadTarget.id, file);
    event.target.value = "";
    setUploadTarget(null);
  };

  return (
    <div className="ab-panel-content ab-requirements-panel">
      <div className="ab-panel-heading">
        <div>
          <span className="ab-panel-eyebrow">{isResearch ? "教研需求" : "制作交付"}</span>
          <h2>需求 / 产物</h2>
        </div>
        <span className="ab-panel-note">{page.requirements.length} 个槽位</span>
      </div>

      {isResearch && (
        <div className="ab-requirement-add-row" aria-label="新增需求">
          <span>新增需求</span>
          <button type="button" className="ab-requirement-add-button" onClick={() => onAddRequirement("image")}><FileImage size={13} />图片</button>
          <button type="button" className="ab-requirement-add-button" onClick={() => onAddRequirement("motion")}><Film size={13} />动效</button>
          <button type="button" className="ab-requirement-add-button" onClick={() => onAddRequirement("audio")}><Mic2 size={13} />音频</button>
        </div>
      )}

      {page.requirements.length === 0 && (
        <div className="ab-requirement-empty"><CircleHelp size={16} /><span>{isResearch ? "当前页面还没有制作需求" : "当前页面暂无待交付产物"}</span></div>
      )}

      <div className="ab-requirement-list">
        {page.requirements.map((requirement) => (
          <RequirementCard
            key={requirement.id}
            page={page}
            requirement={requirement}
            role={role}
            selected={selectedId === requirement.id}
            getElement={getElement}
            onSelect={() => onSelectRequirement(requirement.id)}
            onUpdate={(patch) => onUpdateRequirement(requirement.id, patch)}
            onDelete={() => onDeleteRequirement(requirement.id)}
            onRequestUpload={() => requestUpload(requirement)}
          />
        ))}
      </div>

      <input
        ref={inputRef}
        className="ab-hidden-input"
        type="file"
        accept={uploadTarget?.type === "audio" ? "audio/*" : uploadTarget?.type === "motion" ? "image/*,video/*" : "image/*"}
        onChange={handleUploadChange}
      />
    </div>
  );
}

function RequirementCard({
  page,
  requirement,
  role,
  selected,
  getElement,
  onSelect,
  onUpdate,
  onDelete,
  onRequestUpload,
}: {
  page: AnimationBookPage;
  requirement: ProductionRequirement;
  role: UserRole;
  selected: boolean;
  getElement: (id: string) => BookElement | undefined;
  onSelect: () => void;
  onUpdate: (patch: Partial<ProductionRequirement>) => void;
  onDelete: () => void;
  onRequestUpload: () => void;
}) {
  const isResearch = role === "research";
  const targetValue = getTargetValue(requirement.target);
  const targetElement = requirement.target ? getElement(requirement.target.elementId) : undefined;
  const targetLabel = elementLabel(targetElement);
  const statusLabel = requirement.status === "uploaded" ? "已上传" : requirement.status === "failed" ? "上传失败" : "待制作";
  const isBriefEmpty = requirement.brief.text.trim().length === 0;
  const isVisualTargetMissing = requirement.type !== "audio" && (
    !requirement.target || (requirement.target.kind === "element" && !targetElement)
  );

  const targetOptions = page.elements.filter((element) => {
    if (requirement.type === "image") return element.type === "image";
    if (requirement.type === "motion") return element.type === "motion";
    return element.type === "text" || element.type === "bubble";
  });

  const updateTarget = (value: string) => {
    if (!value) {
      onUpdate({ target: null });
    } else {
      onUpdate({ target: { kind: "element", elementId: value } });
    }
  };

  return (
    <article className={`ab-requirement-card${selected ? " is-selected" : ""}`} onClick={onSelect}>
      <div className="ab-requirement-card-header">
        <div className={`ab-requirement-type ab-requirement-type--${requirement.type}`}>
          {requirement.type === "image" ? <FileImage size={14} /> : requirement.type === "motion" ? <Film size={14} /> : <AudioLines size={14} />}
          <span>{requirementTypeLabel(requirement.type)}</span>
        </div>
        <div className={`ab-requirement-status ab-requirement-status--${requirement.status}`}>
          {requirement.status === "uploaded" && <Check size={12} />}
          {statusLabel}
        </div>
      </div>

      {isResearch ? (
        <>
          <div className="ab-requirement-form-grid">
            <label className="ab-field"><span>需求标题</span><input value={requirement.title} onClick={(event) => event.stopPropagation()} onChange={(event) => onUpdate({ title: event.target.value })} /></label>
            <label className="ab-field"><span>绑定对象</span><select value={targetValue} onClick={(event) => event.stopPropagation()} onChange={(event) => updateTarget(event.target.value)}><option value="">暂不绑定</option>{targetOptions.map((element) => <option key={element.id} value={element.id}>{elementLabel(element)}</option>)}</select></label>
          </div>
          <div className="ab-requirement-editor-label"><Type size={13} />需求说明</div>
          <div onClick={(event) => event.stopPropagation()}>
            <RequirementRichText value={requirement.brief} onChange={(brief) => onUpdate({ brief })} />
          </div>
          {isBriefEmpty && <p className="ab-requirement-warning">需求说明为空，请补充制作要求</p>}
          {requirement.asset && <div className="ab-production-preview">{getAssetPreview(requirement)}</div>}
          {requirement.type === "audio" && requirement.asset && <audio className="ab-requirement-audio" controls src={requirement.asset.url} aria-label={`播放${requirement.title || "音频产物"}`} />}
          <div className="ab-requirement-card-footer">
            <span>{requirement.asset ? `已有产物：${requirement.asset.fileName}` : "制作人员尚未上传产物"}</span>
            <button type="button" className="ab-icon-button ab-icon-button--danger" onClick={(event) => { event.stopPropagation(); onDelete(); }} aria-label={`删除${requirementTypeLabel(requirement.type)}`} title="删除需求"><Trash2 size={14} /></button>
          </div>
        </>
      ) : (
        <>
          <h3 className="ab-requirement-title">{requirement.title || "未命名需求"}</h3>
          <div className="ab-requirement-readonly-brief"><RichTextPreview value={requirement.brief} /></div>
          <div className="ab-requirement-target"><Link2 size={12} />目标：{targetLabel}</div>
          {isBriefEmpty && <p className="ab-requirement-warning">需求说明为空，请联系教研人员补充</p>}
          {requirement.status === "failed" && <p className="ab-requirement-error">{requirement.errorMessage || "上传失败，请重试"}</p>}
          {requirement.asset && <div className="ab-production-preview">{getAssetPreview(requirement)}</div>}
          <div className="ab-requirement-card-footer">
            <span>{requirement.asset ? requirement.asset.fileName : "尚未上传产物"}</span>
            <button type="button" className="ab-upload-button" onClick={(event) => { event.stopPropagation(); onRequestUpload(); }}><FileUp size={14} />{requirement.asset ? "替换产物" : "上传产物"}</button>
          </div>
          {isVisualTargetMissing && <p className="ab-requirement-warning">待教研绑定画布位置</p>}
          {requirement.type === "audio" && requirement.asset && <audio className="ab-requirement-audio" controls src={requirement.asset.url} aria-label={`播放${requirement.title || "音频产物"}`} />}
        </>
      )}
    </article>
  );
}
