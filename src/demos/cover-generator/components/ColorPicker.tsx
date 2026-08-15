import React, { useMemo } from 'react';
import {
  coverColorOptions,
  type CoverColorId,
} from '../tokens/colors';

interface ColorPickerProps {
  value: CoverColorId;
  onChange: (colorId: CoverColorId) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange }) => {
  const selectedOption = useMemo(
    () => coverColorOptions.find((option) => option.id === value),
    [value],
  );

  return (
    <div className="cover-color-picker">
      <div className="cover-color-picker__summary">
        <div>
          <strong>{selectedOption ? `${selectedOption.familyLabel} · ${selectedOption.step} 阶` : '选择背景色'}</strong>
          <span>{selectedOption?.hex ?? '所有色阶均可直接使用'}</span>
        </div>
        <span className="cover-count-badge">{coverColorOptions.length} 色</span>
      </div>

      <div className="cover-color-palette" role="listbox" aria-label="背景色">
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

      <p className="cover-picker-hint">点击小色块直接选择背景色。</p>
    </div>
  );
};

export default ColorPicker;
