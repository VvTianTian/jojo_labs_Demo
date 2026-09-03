import React from 'react';
import { getTextColorOptions, type CoverColorId } from '../tokens/colors';

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

  return (
    <div
      className="cover-color-palette cover-text-color-palette"
      role="listbox"
      aria-label="文字颜色"
    >
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="option"
            aria-selected={selected}
            aria-label={`${option.label}文字颜色${option.source ? `，${option.source}` : ''}`}
            title={`${option.label}${option.source ? ` · ${option.source}` : ''}`}
            className={`cover-color-swatch-button${selected ? ' is-selected' : ''}`}
            onClick={() => onChange(option.id)}
          >
            <span className="cover-color-swatch-button__color" style={{ backgroundColor: option.hex }} />
          </button>
        );
      })}
    </div>
  );
};

export default TextColorPicker;
