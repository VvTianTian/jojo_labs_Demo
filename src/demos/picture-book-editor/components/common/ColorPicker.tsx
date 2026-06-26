import { Check } from "lucide-react";
import { PRESET_COLORS } from "../../constants/defaults";

interface ColorPickerProps {
  value: string | null;
  onChange: (color: string | null) => void;
  showInherit?: boolean;
  inheritLabel?: string;
}

export function ColorPicker({
  value,
  onChange,
  showInherit = false,
  inheritLabel = "继承全局",
}: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {showInherit && (
        <button
          onClick={() => onChange(null)}
          className={`
            flex items-center gap-1.5 px-2.5 py-1.5 rounded-base text-xs font-medium transition-all
            ${value === null
              ? "bg-brand-500 text-white shadow-xs"
              : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
            }
          `}
        >
          {value === null && <Check size={12} />}
          {inheritLabel}
        </button>
      )}
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          onClick={() => onChange(color)}
          className={`
            w-8 h-8 rounded-base border-2 transition-all hover:scale-110
            ${value === color
              ? "border-brand-500 shadow-md scale-110"
              : "border-neutral-200 hover:border-brand-300"
            }
          `}
          style={{ backgroundColor: color }}
          title={color}
        >
          {value === color && (
            <Check
              size={14}
              className={`mx-auto ${
                color === "#F4F8FA" || color === "#EBF9FF" || color === "#DBF3FF" || color === "#EFFAEB" || color === "#FCF9DE" || color === "#E6EEF2"
                  ? "text-neutral-700"
                  : "text-white"
              }`}
            />
          )}
        </button>
      ))}
    </div>
  );
}
