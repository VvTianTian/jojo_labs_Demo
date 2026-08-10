/**
 * 通用 Switch 组件
 * 遵循项目设计 Token，使用 inline style 避免 Tailwind 依赖冲突
 */

import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

const TRACK_WIDTH = 36;
const TRACK_HEIGHT = 20;
const THUMB_SIZE = 16;
const THUMB_OFFSET = 2;

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, disabled = false, label }) => {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        userSelect: 'none',
      }}
    >
      <span
        role="switch"
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        style={{
          position: 'relative',
          display: 'inline-block',
          width: TRACK_WIDTH,
          height: TRACK_HEIGHT,
          borderRadius: TRACK_HEIGHT / 2,
          background: checked ? '#0090D9' : '#b2b2b2',
          transition: 'background 0.2s ease',
          flexShrink: 0,
          outline: 'none',
        }}
      >
        {/* thumb */}
        <span
          style={{
            position: 'absolute',
            top: THUMB_OFFSET,
            left: checked ? TRACK_WIDTH - THUMB_SIZE - THUMB_OFFSET : THUMB_OFFSET,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            transition: 'left 0.2s ease',
          }}
        />
      </span>
      {label && (
        <span style={{ fontSize: 13, color: '#353D42' }}>{label}</span>
      )}
    </label>
  );
};

export default Switch;
