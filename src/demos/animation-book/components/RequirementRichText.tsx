import { useEffect, useRef } from "react";
import type { ChangeEvent, FocusEvent, MouseEvent as ReactMouseEvent } from "react";
import {
  Bold,
  ChevronDown,
  Eraser,
  ImagePlus,
  Italic,
  Palette,
} from "lucide-react";
import type { RichTextDocument } from "../types";
import { sanitizeRichTextHtml } from "./richTextUtils";

interface RequirementRichTextProps {
  value: RichTextDocument;
  onChange: (value: RichTextDocument) => void;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: (event: FocusEvent<HTMLDivElement>) => void;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getPlainText = (html: string) => {
  const container = document.createElement("div");
  container.innerHTML = html;
  return (container.textContent ?? "").replace(/\s+/g, " ").trim();
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });

export function RequirementRichText({
  value,
  onChange,
  readOnly = false,
  className = "",
  placeholder = "描述画面、风格、构图或语音要求……",
  autoFocus = false,
  onFocus,
  onBlur,
}: RequirementRichTextProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  useEffect(() => {
    if (!editorRef.current || document.activeElement === editorRef.current) return;
    if (editorRef.current.innerHTML !== value.html) {
      editorRef.current.innerHTML = value.html;
    }
  }, [value.html]);

  useEffect(() => {
    if (!autoFocus || !editorRef.current) return;
    editorRef.current.focus();
    const range = document.createRange();
    range.selectNodeContents(editorRef.current);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [autoFocus]);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return;
    if (editorRef.current.contains(selection.anchorNode)) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    const range = savedSelectionRef.current;
    if (!selection || !range) return;
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const emitChange = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    onChange({ html, text: getPlainText(html) });
  };

  const runCommand = (command: string, argument?: string) => {
    restoreSelection();
    editorRef.current?.focus();
    document.execCommand(command, false, argument);
    emitChange();
    saveSelection();
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const caption = window.prompt("图片说明（可选）", file.name) ?? file.name;
      restoreSelection();
      editorRef.current?.focus();
      const imageHtml = `<figure><img src="${escapeHtml(dataUrl)}" alt="${escapeHtml(caption)}"><figcaption>${escapeHtml(caption)}</figcaption></figure><p><br></p>`;
      document.execCommand("insertHTML", false, imageHtml);
      emitChange();
      saveSelection();
    } catch {
      // The parent keeps the previous document when a local file cannot be read.
    }
  };

  const handleToolbarMouseDown = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    saveSelection();
  };

  if (readOnly) {
    return <RichTextPreview value={value} />;
  }

  return (
    <div className={`ab-rich-text-editor ${className}`.trim()}>
      <div className="ab-rich-text-toolbar" role="toolbar" aria-label="需求富文本工具栏">
        <label className="ab-rich-text-color" title="文字颜色">
          <span>A</span>
          <Palette size={14} aria-hidden="true" />
          <ChevronDown size={12} aria-hidden="true" />
          <input
            aria-label="需求文字颜色"
            type="color"
            defaultValue="#353e42"
            onMouseDown={() => saveSelection()}
            onChange={(event) => runCommand("foreColor", event.target.value)}
          />
        </label>
        <RichTextToolButton label="粗体" icon={<Bold size={14} />} onMouseDown={handleToolbarMouseDown} onClick={() => runCommand("bold")} />
        <RichTextToolButton label="斜体" icon={<Italic size={14} />} onMouseDown={handleToolbarMouseDown} onClick={() => runCommand("italic")} />
        <RichTextToolButton label="下划线" icon={<span className="ab-rich-text-letter-icon">U</span>} onMouseDown={handleToolbarMouseDown} onClick={() => runCommand("underline")} />
        <RichTextToolButton label="插入欧姆符号" icon={<span className="ab-rich-text-symbol-icon">Ω</span>} onMouseDown={handleToolbarMouseDown} onClick={() => runCommand("insertText", "Ω")} />
        <RichTextToolButton label="插入求和符号" icon={<span className="ab-rich-text-symbol-icon">Σ</span>} onMouseDown={handleToolbarMouseDown} onClick={() => runCommand("insertText", "Σ")} />
        <RichTextToolButton label="标注" icon={<span className="ab-rich-text-symbol-icon">✎</span>} onMouseDown={handleToolbarMouseDown} onClick={() => runCommand("insertText", "注")} />
        <RichTextToolButton label="益智单位" icon={<span className="ab-rich-text-text-button">益智单位</span>} onMouseDown={handleToolbarMouseDown} onClick={() => runCommand("insertText", "益智单位")} />
        <RichTextToolButton label="音标" icon={<span className="ab-rich-text-text-button">音标</span>} onMouseDown={handleToolbarMouseDown} onClick={() => runCommand("insertText", "音标")} />
        <RichTextToolButton label="插入图片" icon={<ImagePlus size={14} />} onMouseDown={handleToolbarMouseDown} onClick={() => imageInputRef.current?.click()} />
        <RichTextToolButton label="清除格式" icon={<Eraser size={14} />} onMouseDown={handleToolbarMouseDown} onClick={() => runCommand("removeFormat")} />
      </div>
      <div
        ref={editorRef}
        className="ab-rich-text-surface"
        data-placeholder={placeholder}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="产物需求"
        aria-multiline="true"
        onInput={emitChange}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onFocus={onFocus}
        onBlur={(event) => {
          saveSelection();
          onBlur?.(event);
        }}
      />
      <input ref={imageInputRef} className="ab-hidden-input" type="file" accept="image/*" onChange={handleImageChange} />
    </div>
  );
}

function RichTextToolButton({
  label,
  icon,
  onMouseDown,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onMouseDown: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  onClick: () => void;
}) {
  return (
    <button type="button" className="ab-rich-text-tool" aria-label={label} title={label} onMouseDown={onMouseDown} onClick={onClick}>
      {icon}
    </button>
  );
}

export function RichTextPreview({ value }: { value: RichTextDocument }) {
  return <div className="ab-rich-text-preview" dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(value.html) }} />;
}
