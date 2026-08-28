import React from 'react';
import { getTextColorOptions, type CoverColorId } from '../tokens/colors';

interface TextColorPickerProps {
  backgroundColorId: CoverColorId;
  value: string;
  onChange: (textColorId: string) => void;
  disabled?: boolean;
}

export const TextColorPicker: React.FC<TextColorPickerProps> = ({
  backgroundColorId,
  value,
  onChange,
  disabled = false,
}) => {
  const options = getTextColorOptions(backgroundColorId);

  return (
    <div
      className="cover-text-color-picker"
      role="listbox"
      aria-label="文字颜色"
      aria-readonly={disabled}
    >
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="option"
            aria-selected={selected}
            aria-disabled={disabled}
            disabled={disabled}
            aria-label={`${option.label}文字颜色${option.source ? `，${option.source}` : ''}`}
            title={`${option.label}${option.source ? ` · ${option.source}` : ''}`}
            className={`cover-text-color-option${selected ? ' is-selected' : ''}`}
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
