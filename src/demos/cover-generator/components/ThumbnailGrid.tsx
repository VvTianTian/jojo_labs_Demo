/**
 * 资源缩略图选择器
 * 分类切换和网格内部滚动都在组件内完成，素材数量增加时不改变外层布局高度。
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ImageOff } from 'lucide-react';

export interface ThumbnailItem {
  id: string;
  name: string;
  path: string;
}

export interface ThumbnailCategory {
  id: string;
  name: string;
  items: ThumbnailItem[];
}

interface ThumbnailGridProps {
  categories: ThumbnailCategory[];
  value: string;
  onChange: (id: string) => void;
  allowNone?: boolean;
  noneLabel?: string;
  thumbSize?: number;
  columns?: number;
  maxHeight?: number;
}

export const ThumbnailGrid: React.FC<ThumbnailGridProps> = ({
  categories,
  value,
  onChange,
  allowNone = false,
  noneLabel = '无',
  thumbSize = 64,
  maxHeight = 220,
}) => {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? '');
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const isWrappingTabsRef = useRef(false);

  const resolvedActiveCategory = categories.some((category) => category.id === activeCategory)
    ? activeCategory
    : categories[0]?.id ?? '';
  const currentCategory = categories.find((category) => category.id === resolvedActiveCategory) ?? categories[0];

  useEffect(() => {
    if (tabsRef.current) {
      isWrappingTabsRef.current = true;
      tabsRef.current.scrollLeft = 0;
      window.requestAnimationFrame(() => {
        isWrappingTabsRef.current = false;
      });
    }
  }, [categories]);

  const wrapTabsScroll = useCallback((tabs: HTMLDivElement) => {
    if (isWrappingTabsRef.current) return;

    const maxScrollLeft = tabs.scrollWidth - tabs.clientWidth;
    if (maxScrollLeft <= 1) return;

    if (tabs.scrollLeft <= 0) {
      isWrappingTabsRef.current = true;
      tabs.scrollLeft = maxScrollLeft - 1;
    } else if (tabs.scrollLeft >= maxScrollLeft - 1) {
      isWrappingTabsRef.current = true;
      tabs.scrollLeft = 1;
    }

    if (isWrappingTabsRef.current) {
      window.requestAnimationFrame(() => {
        isWrappingTabsRef.current = false;
      });
    }
  }, []);

  const handleTabsWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const tabs = event.currentTarget;
    const maxScrollLeft = tabs.scrollWidth - tabs.clientWidth;
    if (maxScrollLeft <= 1) return;

    const delta = Math.abs(event.deltaX) >= Math.abs(event.deltaY)
      ? event.deltaX
      : event.deltaY;
    if (delta === 0) return;

    const isMovingRight = delta > 0;
    const isAtStart = tabs.scrollLeft <= 0;
    const isAtEnd = tabs.scrollLeft >= maxScrollLeft - 1;

    if ((isMovingRight && isAtEnd) || (!isMovingRight && isAtStart)) {
      event.preventDefault();
      tabs.scrollLeft = isMovingRight ? 1 : maxScrollLeft - 1;
      return;
    }

    // 普通鼠标滚轮只有 deltaY，把它转换成分类条的横向滚动。
    if (event.deltaX === 0 && event.deltaY !== 0) {
      event.preventDefault();
      tabs.scrollLeft += event.deltaY;
    }
  };

  const markImageFailed = (path: string) => {
    setFailedImages((current) => {
      if (current.has(path)) return current;
      const next = new Set(current);
      next.add(path);
      return next;
    });
  };

  return (
    <div className="cover-thumbnail-picker">
      {categories.length > 1 && (
        <div
          ref={tabsRef}
          className="cover-thumbnail-tabs"
          role="tablist"
          aria-label="素材分类"
          onScroll={(event) => wrapTabsScroll(event.currentTarget)}
          onWheel={handleTabsWheel}
        >
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              role="tab"
              aria-selected={currentCategory?.id === category.id}
              className={`cover-thumbnail-tab${currentCategory?.id === category.id ? ' is-selected' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      <div
        className="cover-thumbnail-grid"
        role="listbox"
        aria-label="可选素材"
        style={{
          maxHeight,
          gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(48, thumbSize)}px, 1fr))`,
        }}
      >
        {allowNone && (
          <button
            type="button"
            className={`cover-thumbnail-button cover-thumbnail-button--none${value === '' ? ' is-selected' : ''}`}
            role="option"
            aria-selected={value === ''}
            aria-label={noneLabel}
            title={noneLabel}
            onClick={() => onChange('')}
          >
            <span>{noneLabel}</span>
          </button>
        )}

        {currentCategory?.items.map((item) => {
          const selected = value === item.id;
          const failed = failedImages.has(item.path);
          return (
            <button
              key={item.id}
              type="button"
              className={`cover-thumbnail-button${selected ? ' is-selected' : ''}`}
              role="option"
              aria-selected={selected}
              aria-label={item.name}
              title={item.name}
              onClick={() => onChange(item.id)}
            >
              {failed ? (
                <span className="cover-thumbnail-button__fallback">
                  <ImageOff size={15} aria-hidden="true" />
                  <span>加载失败</span>
                </span>
              ) : (
                <img
                  src={item.path}
                  alt=""
                  draggable={false}
                  loading="lazy"
                  onError={() => markImageFailed(item.path)}
                />
              )}
              {selected && (
                <span className="cover-thumbnail-button__check" aria-hidden="true">
                  <Check size={11} strokeWidth={2.5} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ThumbnailGrid;
