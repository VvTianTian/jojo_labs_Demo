import { ClipboardList } from "lucide-react";

interface RequirementHintProps {
  text: string;
  type: "image" | "audio";
}

export function RequirementHint({ text, type }: RequirementHintProps) {
  if (!text) return null;

  const label = type === "image" ? "教研图片需求" : "教研语音需求";

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-base px-3 py-2 mb-2">
      <div className="flex items-center gap-1.5 mb-1">
        <ClipboardList size={12} className="text-amber-600" />
        <span className="text-xs font-medium text-amber-700">{label}</span>
      </div>
      <p className="text-xs text-amber-800 leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}
