import { useBookStore } from "../../store/useBookStore";
import { ColorPicker } from "../common/ColorPicker";
import { AudioUploader } from "../common/AudioUploader";
import { FONT_OPTIONS } from "../../constants/defaults";
import { X } from "lucide-react";

interface GlobalSettingsProps {
  onClose: () => void;
}

export function GlobalSettings({ onClose }: GlobalSettingsProps) {
  const { book, updateGlobalSettings } = useBookStore();

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-700">
          全局设置
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-base hover:bg-neutral-100 transition-all"
        >
          <X size={16} className="text-neutral-500" />
        </button>
      </div>

      {/* 基础信息 */}
      <div>
        <h4 className="text-xs font-semibold text-neutral-600 mb-4">基础信息</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 选择音乐 */}
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-2 block">
              背景音乐
            </label>
            <AudioUploader
              audioUrl={book.globalSettings.globalAudioUrl}
              onUpload={(dataUrl) => updateGlobalSettings({ globalAudioUrl: dataUrl })}
              onRemove={() => updateGlobalSettings({ globalAudioUrl: null })}
              uploadLabel="选择音乐"
            />
          </div>

          {/* Default Font */}
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-2 block">
              默认字体
            </label>
            <div className="flex gap-2">
              {FONT_OPTIONS.map((font) => (
                <button
                  key={font.value}
                  onClick={() =>
                    updateGlobalSettings({ defaultFontFamily: font.value })
                  }
                  className={`px-3 py-1.5 rounded-base text-sm font-medium transition-all ${
                    book.globalSettings.defaultFontFamily === font.value
                      ? "bg-brand-500 text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                  style={{ fontFamily: font.value }}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </div>

          {/* Default Background Color */}
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-2 block">
              默认背景色
            </label>
            <ColorPicker
              value={book.globalSettings.defaultBackgroundColor}
              onChange={(color) =>
                color !== null &&
                updateGlobalSettings({ defaultBackgroundColor: color })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
