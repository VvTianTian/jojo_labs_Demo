import React from 'react';
import {
  contrastRatio,
  getCoverColorHex,
  getTextColorOptions,
  TEXT_CONTRAST_THRESHOLD,
  type CoverColorId,
} from '../tokens/colors';

interface TextColorPickerProps {
  backgroundColorId: CoverColorId;
  value: string;
  onChange: (textColorId: string) => void;
}

export const TextColorPicker: React.FC<TextColorPickerProps> = ({
  backgroundColorId,
  value,
  onChange,
}) => {
  const options = getTextColorOptions(backgroundColorId);
  const backgroundHex = getCoverColorHex(backgroundColorId);

  return (
    <div className="cover-text-color-picker" role="listbox" aria-label="文字颜色">
      {options.map((option) => {
        const selected = option.id === value;
        const isLowContrast = contrastRatio(backgroundHex, option.hex) < TEXT_CONTRAST_THRESHOLD;
        return (
          <button
            key={option.id}
            type="button"
            role="option"
            aria-selected={selected}
            aria-label={`${option.label}文字颜色${option.source ? `，${option.source}` : ''}${isLowContrast ? '，当前对比度不足' : ''}`}
            title={`${option.label}${option.source ? ` · ${option.source}` : ''}${isLowContrast ? ' · 当前对比度不足' : ''}`}
            className={`cover-text-color-option${selected ? ' is-selected' : ''}${isLowContrast ? ' is-low-contrast' : ''}`}
            onClick={() => onChange(option.id)}
          >
            <span className="cover-text-color-option__swatch" style={{ backgroundColor: option.hex }} />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default TextColorPicker;
