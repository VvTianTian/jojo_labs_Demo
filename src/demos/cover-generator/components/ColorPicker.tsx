import React from 'react';
import {
  coverColorOptions,
  type CoverColorId,
} from '../tokens/colors';

interface ColorPickerProps {
  value: CoverColorId;
  onChange: (colorId: CoverColorId) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange }) => {
  const selectedOption = coverColorOptions.find((option) => option.id === value);

  return (
    <div className="cover-color-picker">
      <div className="cover-color-palette" role="listbox" aria-label="颜色">
        {coverColorOptions.map((option) => {
          const selected = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={selected}
              aria-label={`${option.familyLabel}第${option.step}阶，${option.hex}`}
              title={`${option.familyLabel} ${option.step} 阶 · ${option.hex}${option.aliases.length > 0 ? `（与${option.aliases.join('、')}相同）` : ''}`}
              className={`cover-color-swatch-button${selected ? ' is-selected' : ''}`}
              onClick={() => onChange(option.id)}
            >
              <span className="cover-color-swatch-button__color" style={{ backgroundColor: option.hex }} />
            </button>
          );
        })}
      </div>

      <p className="cover-picker-hint cover-picker-hint--value" aria-live="polite">
        {selectedOption?.hex ?? '未选择'}
      </p>
    </div>
  );
};

export default ColorPicker;
