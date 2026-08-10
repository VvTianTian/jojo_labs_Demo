/**
 * 背景色系选择器
 * 每个颜色系只有一个可交互入口，内部色阶只用于展示封面实际采用的色阶关系。
 */

import React from 'react';
import {
  coverColors,
  coverColorNames,
  coverColorLabels,
  type CoverColorName,
} from '../tokens/colors';

interface ColorPickerProps {
  value: CoverColorName;
  onChange: (color: CoverColorName) => void;
  coverType?: 'project' | 'group';
}

const LEVELS = [1, 2, 3, 4, 5, 6] as const;

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, coverType = 'group' }) => {
  const activeLevel = coverType === 'project' ? 4 : 1;

  return (
    <div className="cover-color-picker">
      <div className="cover-color-grid" role="listbox" aria-label="背景色系">
        {coverColorNames.map((name) => {
          const selected = value === name;
          return (
            <button
              key={name}
              type="button"
              className={`cover-color-option${selected ? ' is-selected' : ''}`}
              role="option"
              aria-selected={selected}
              aria-label={`${coverColorLabels[name]}系背景色`}
              title={`选择${coverColorLabels[name]}系背景色`}
              onClick={() => onChange(name)}
            >
              <span className="cover-color-option__label">{coverColorLabels[name]}</span>
              <span className="cover-color-option__swatches" aria-hidden="true">
                {LEVELS.map((level) => (
                  <span
                    key={level}
                    className={`cover-color-swatch${level === activeLevel ? ' is-active-level' : ''}`}
                    style={{ backgroundColor: coverColors[name][level] }}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <p className="cover-color-picker__hint">
        点击颜色系应用，色阶只作预览。当前封面使用第 {activeLevel} 档。
      </p>
    </div>
  );
};

export default ColorPicker;
