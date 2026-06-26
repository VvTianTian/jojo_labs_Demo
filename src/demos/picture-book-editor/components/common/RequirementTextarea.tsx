import { FileText, Mic } from "lucide-react";

interface RequirementTextareaProps {
  value: string;
  onChange: (value: string) => void;
  type: "image" | "audio";
  placeholder?: string;
  minHeight?: string;
}

export function RequirementTextarea({
  value,
  onChange,
  type,
  placeholder,
  minHeight = "min-h-[120px]",
}: RequirementTextareaProps) {
  const label = type === "image" ? "图片需求" : "语音需求";
  const Icon = type === "image" ? FileText : Mic;
  const defaultPlaceholder =
    type === "image"
      ? "描述对此处图片的需求，如场景、风格、色调等..."
      : "描述对此处语音的需求，如语速、情感、内容要点等...";

  return (
    <div className={`flex flex-col items-center justify-center w-full h-full ${minHeight} p-4`}>
      <div className="w-full max-w-[400px]">
        <div className="flex items-center gap-1.5 mb-2">
          <Icon size={14} className="text-brand-500" />
          <span className="text-xs font-medium text-neutral-700">{label}</span>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || defaultPlaceholder}
          rows={4}
          className="w-full bg-neutral-0 border-2 border-dashed border-neutral-300 hover:border-brand-300 focus:border-brand-500 rounded-md px-3 py-2.5 text-sm text-neutral-700 outline-none resize-none transition-colors placeholder:text-neutral-400 leading-relaxed"
        />
      </div>
    </div>
  );
}
