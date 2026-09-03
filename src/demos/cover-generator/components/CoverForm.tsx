import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Dices,
  Image as ImageIcon,
  Loader2,
  Type as TypeIcon,
  X,
} from 'lucide-react';
import { Switch } from '../../../components/Switch';
import { ColorPicker } from './ColorPicker';
import { TextColorPicker } from './TextColorPicker';
import { ThumbnailGrid, type ThumbnailCategory } from './ThumbnailGrid';
import {
  textures,
  projectFigureCategories,
  groupFigureCategories,
} from '../tokens/assets';
import {
  coverColorOptions,
  getTextColorOptions,
  getDefaultTextColorOption,
  type CoverColorId,
} from '../tokens/colors';
import {
  isEnglishTitle,
  resolveLayout,
  type LayoutDirection,
} from '../utils/layoutMatcher';
import { validateCoverTitle } from '../utils/coverValidation';
import type { CoverDraft } from '../types';

export type CoverFormState = CoverDraft;

interface CoverFormProps {
  state: CoverFormState;
  randomizing: boolean;
  randomDisabled: boolean;
  randomError: string;
  onChange: (partial: Partial<CoverFormState>) => void;
  onRandomize: () => void;
}

type ResourcePanel = 'color' | 'texture' | 'figure';

const RESOURCE_PANEL_LABELS: Record<ResourcePanel, string> = {
  color: '颜色',
  texture: '纹理',
  figure: '角色',
};

const RESOURCE_PANEL_WIDTHS: Record<ResourcePanel, number> = {
  color: 360,
  texture: 320,
  figure: 340,
};

const RESOURCE_PANEL_HEIGHTS: Record<ResourcePanel, number> = {
  color: 650,
  texture: 420,
  figure: 600,
};

interface ResourceMenuButtonProps {
  panel: ResourcePanel;
  preview: React.ReactNode;
  title: string;
  summary: string;
  open: boolean;
  buttonRef: (element: HTMLButtonElement | null) => void;
  onClick: () => void;
}

interface CoverTypeControlProps {
  value: CoverDraft['coverType'];
  onChange: (coverType: CoverDraft['coverType']) => void;
}

const COVER_TYPE_OPTIONS: Array<{
  value: CoverDraft['coverType'];
  label: string;
}> = [
  { value: 'project', label: '项目封面' },
  { value: 'group', label: '项目组封面' },
];

export function CoverTypeControl({ value, onChange }: CoverTypeControlProps) {
  const controlRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(0, COVER_TYPE_OPTIONS.findIndex((option) => option.value === value));
  const selectedOption = COVER_TYPE_OPTIONS[selectedIndex] ?? COVER_TYPE_OPTIONS[0];

  const focusOption = (index: number) => {
    window.requestAnimationFrame(() => optionRefs.current[index]?.focus());
  };

  const selectOption = (nextValue: CoverDraft['coverType']) => {
    onChange(nextValue);
    setOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && controlRef.current?.contains(event.target)) return;
      setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Tab') {
      setOpen(false);
      return;
    }

    if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true);
      focusOption(event.key === 'ArrowUp' ? COVER_TYPE_OPTIONS.length - 1 : selectedIndex);
    }
  };

  const handleOptionKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'Tab') {
      setOpen(false);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = (index + direction + COVER_TYPE_OPTIONS.length) % COVER_TYPE_OPTIONS.length;
      optionRefs.current[nextIndex]?.focus();
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const nextIndex = event.key === 'Home' ? 0 : COVER_TYPE_OPTIONS.length - 1;
      optionRefs.current[nextIndex]?.focus();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectOption(COVER_TYPE_OPTIONS[index].value);
    }
  };

  return (
    <div
      ref={controlRef}
      className="cover-type-control"
      role="group"
      aria-label="封面类型"
    >
      <div className="cover-type-control__select-wrap">
        <button
          id="cover-type-select"
          ref={triggerRef}
          type="button"
          className={`cover-type-control__select${open ? ' is-open' : ''}`}
          aria-label="封面类型"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls="cover-type-menu"
          role="combobox"
          onClick={() => setOpen((current) => !current)}
          onKeyDown={handleTriggerKeyDown}
        >
          <span>{selectedOption.label}</span>
          <ChevronDown className="cover-type-control__select-icon" size={16} aria-hidden="true" />
        </button>
        {open && (
          <div id="cover-type-menu" className="cover-type-control__menu" role="listbox" aria-label="封面类型选项">
            {COVER_TYPE_OPTIONS.map((option, index) => {
              const selected = option.value === value;
              return (
                <button
                  key={option.value}
                  id={`cover-type-option-${option.value}`}
                  ref={(element) => { optionRefs.current[index] = element; }}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`cover-type-control__option${selected ? ' is-selected' : ''}`}
                  onClick={() => selectOption(option.value)}
                  onKeyDown={(event) => handleOptionKeyDown(event, index)}
                >
                  <span>{option.label}</span>
                  {selected && <Check size={14} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ResourceMenuButton({
  panel,
  preview,
  title,
  summary,
  open,
  buttonRef,
  onClick,
}: ResourceMenuButtonProps) {
  const panelId = `cover-resource-panel-${panel}`;

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`cover-resource-menu__trigger${open ? ' is-open' : ''}`}
      aria-expanded={open}
      aria-controls={panelId}
      aria-haspopup="dialog"
      aria-label={`${title}，当前${summary}`}
      title={`${title}：${summary}`}
      onClick={onClick}
    >
      <span className={`cover-resource-menu__preview cover-resource-menu__preview--${panel}`} aria-hidden="true">
        {preview}
      </span>
      <span className="cover-resource-menu__trigger-copy">
        <strong>{title}</strong>
      </span>
      <ChevronRight size={16} aria-hidden="true" />
    </button>
  );
}

export const CoverForm: React.FC<CoverFormProps> = ({
  state,
  randomizing,
  randomDisabled,
  randomError,
  onChange,
  onRandomize,
}) => {
  const {
    coverType,
    title,
    direction,
    showStorageTag,
    backgroundColorId,
    textColorId,
    textureId,
    figureId,
  } = state;

  const validation = validateCoverTitle(coverType, title);
  const isEnglish = coverType === 'group' && isEnglishTitle(title);
  const layout = resolveLayout(coverType, title, direction);

  const [activePanel, setActivePanel] = useState<ResourcePanel | null>(null);
  const [panelPosition, setPanelPosition] = useState({ left: 0, top: 0 });
  const resourceTriggerRefs = useRef<Record<ResourcePanel, HTMLButtonElement | null>>({
    color: null,
    texture: null,
    figure: null,
  });
  const resourcePanelRef = useRef<HTMLDivElement | null>(null);

  const textureCategories: ThumbnailCategory[] = useMemo(
    () => [{
      id: 'textures',
      name: '全部纹理',
      items: textures.map((texture) => ({
        id: texture.id,
        name: texture.name,
        path: texture.path,
      })),
    }],
    [],
  );

  const figureCategories: ThumbnailCategory[] = useMemo(() => {
    const categories = coverType === 'project' ? projectFigureCategories : groupFigureCategories;
    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      items: category.figures.map((figure) => ({
        id: figure.id,
        name: figure.name,
        path: figure.path,
      })),
    }));
  }, [coverType]);

  const selectedBackground = coverColorOptions.find((option) => option.id === backgroundColorId);
  const selectedTextColor = getTextColorOptions(backgroundColorId)
    .find((option) => option.id === textColorId);
  const selectedTexture = textures.find((texture) => texture.id === textureId);
  const selectedFigure = figureCategories
    .flatMap((category) => category.items)
    .find((figure) => figure.id === figureId);
  const selectedFigureCategory = figureCategories
    .find((category) => category.items.some((item) => item.id === figureId))?.name;
  const hasFigure = Boolean(layout.figure) && !isEnglish;

  const updatePanelPosition = useCallback((panel: ResourcePanel) => {
    const trigger = resourceTriggerRefs.current[panel];
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const width = RESOURCE_PANEL_WIDTHS[panel];
    const height = RESOURCE_PANEL_HEIGHTS[panel];
    const gap = 10;
    const viewportPadding = 16;
    let left = rect.right + gap;

    if (left + width > window.innerWidth - viewportPadding) {
      left = rect.left - width - gap;
    }

    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - width - viewportPadding));
    const top = Math.max(
      viewportPadding,
      Math.min(rect.top, window.innerHeight - height - viewportPadding),
    );
    setPanelPosition({ left, top });
  }, []);

  const closeResourcePanel = useCallback((restoreFocus = false) => {
    const panel = activePanel;
    setActivePanel(null);
    if (restoreFocus && panel) {
      window.requestAnimationFrame(() => resourceTriggerRefs.current[panel]?.focus());
    }
  }, [activePanel]);

  const toggleResourcePanel = (panel: ResourcePanel) => {
    if (activePanel === panel) {
      setActivePanel(null);
      return;
    }

    updatePanelPosition(panel);
    setActivePanel(panel);
  };

  useEffect(() => {
    if (!activePanel) return undefined;

    const handleOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      const trigger = resourceTriggerRefs.current[activePanel];
      if (resourcePanelRef.current?.contains(target) || trigger?.contains(target)) return;
      setActivePanel(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeResourcePanel(true);
      }
    };

    const handleViewportChange = () => updatePanelPosition(activePanel);

    document.addEventListener('pointerdown', handleOutsidePointer, true);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer, true);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [activePanel, closeResourcePanel, updatePanelPosition]);

  const handleBackgroundChange = (nextBackgroundColorId: CoverColorId) => {
    onChange({
      backgroundColorId: nextBackgroundColorId,
      textColorId: getDefaultTextColorOption(nextBackgroundColorId).id,
    });
  };

  const handleTitleChange = (nextTitle: string) => {
    if (activePanel === 'figure' && coverType === 'group' && isEnglishTitle(nextTitle)) {
      setActivePanel(null);
    }
    onChange({ title: nextTitle });
  };

  const renderResourcePopover = (panel: ResourcePanel) => {
    if (activePanel !== panel) return null;

    const panelTitle = RESOURCE_PANEL_LABELS[panel];

    return (
      <div
        ref={resourcePanelRef}
        id={`cover-resource-panel-${panel}`}
        className={`cover-resource-popover cover-resource-popover--${panel}`}
        role="dialog"
        aria-label={panelTitle}
        style={{ left: panelPosition.left, top: panelPosition.top }}
      >
        <div className="cover-resource-popover__header">
          <strong>{panelTitle}</strong>
          <button
            type="button"
            className="cover-resource-popover__close"
            aria-label={`关闭${panelTitle}面板`}
            onClick={() => closeResourcePanel(true)}
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        {panel === 'color' && (
          <div className="cover-resource-popover__scroll">
            <ColorPicker value={backgroundColorId} onChange={handleBackgroundChange} />
            <div className="cover-resource-popover__subheading">文字颜色</div>
            <TextColorPicker
              backgroundColorId={backgroundColorId}
              value={textColorId}
              onChange={(nextTextColorId) => onChange({ textColorId: nextTextColorId })}
            />
            <p className="cover-picker-hint cover-picker-hint--compact">
              已自动匹配清晰易读的字体颜色，可手动调整。
            </p>
          </div>
        )}

        {panel === 'texture' && (
          <div className="cover-resource-popover__scroll">
            <ThumbnailGrid
              categories={textureCategories}
              value={textureId}
              onChange={(value) => onChange({ textureId: value })}
              allowNone
              noneLabel="无纹理"
              thumbSize={58}
              maxHeight={290}
            />
          </div>
        )}

        {panel === 'figure' && hasFigure && (
          <div className="cover-resource-popover__scroll">
            <ThumbnailGrid
              categories={figureCategories}
              value={figureId}
              onChange={(value) => onChange({ figureId: value })}
              thumbSize={58}
              maxHeight={390}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="cover-form">
      <section className="cover-form__group cover-form__group--identity">
        <div className="cover-field">
          <div className="cover-field__label-row">
            <label className="cover-field__label" htmlFor="cover-title">标题</label>
            <span className={`cover-character-count${!validation.isValid && title ? ' is-error' : ''}`}>
              {validation.isEnglish ? '特殊' : `${validation.charCount}/${coverType === 'project' ? 2 : 8}`}
            </span>
          </div>
          <input
            id="cover-title"
            type="text"
            value={title}
            placeholder={coverType === 'project' ? '例如：语文' : '例如：初中语文 / A1'}
            onChange={(event) => handleTitleChange(event.target.value.replace(/[\r\n]/g, ''))}
            className={`cover-title-input${!validation.isValid && title ? ' is-error' : ''}`}
            aria-invalid={!validation.isValid && Boolean(title)}
            aria-describedby="cover-title-hint"
            autoComplete="off"
          />
          <span
            id="cover-title-hint"
            className={`cover-field__hint${!validation.isValid ? ' is-error' : ''}`}
            role={!validation.isValid ? 'alert' : undefined}
          >
            {validation.message}
          </span>
        </div>

        <div className="cover-random-card">
          <button
            type="button"
            className="cover-random-button"
            disabled={randomDisabled || randomizing}
            onClick={onRandomize}
          >
            {randomizing ? <Loader2 size={17} className="cover-spin" aria-hidden="true" /> : <Dices size={17} aria-hidden="true" />}
            {randomizing ? '生成中…' : '随机生成'}
          </button>
          {randomError && <span className="cover-random-card__error" role="alert">{randomError}</span>}
        </div>
      </section>

      <section className="cover-form__group cover-form__group--resources" aria-label="视觉资源">
        <div className="cover-resource-menu">
          <ResourceMenuButton
            panel="color"
            preview={
              <span
                className="cover-resource-menu__color-swatch"
                style={{ backgroundColor: selectedBackground?.hex ?? 'transparent' }}
              />
            }
            title="颜色"
            summary={`${selectedBackground?.familyLabel ?? '未选择'} · ${selectedBackground?.step ?? ''}阶${selectedTextColor ? ` · 文字${selectedTextColor.label}` : ''}`}
            open={activePanel === 'color'}
            buttonRef={(element) => { resourceTriggerRefs.current.color = element; }}
            onClick={() => toggleResourcePanel('color')}
          />
          {renderResourcePopover('color')}
          <ResourceMenuButton
            panel="texture"
            preview={selectedTexture ? <img src={selectedTexture.path} alt="" /> : <span>无</span>}
            title="纹理"
            summary={selectedTexture?.name ?? '无'}
            open={activePanel === 'texture'}
            buttonRef={(element) => { resourceTriggerRefs.current.texture = element; }}
            onClick={() => toggleResourcePanel('texture')}
          />
          {renderResourcePopover('texture')}
          {hasFigure && (
            <>
              <ResourceMenuButton
                panel="figure"
                preview={selectedFigure ? <img src={selectedFigure.path} alt="" /> : <span>无</span>}
                title="角色"
                summary={selectedFigureCategory && selectedFigure
                  ? `${selectedFigureCategory} · ${selectedFigure.name}`
                  : selectedFigure?.name ?? '未选择'}
                open={activePanel === 'figure'}
                buttonRef={(element) => { resourceTriggerRefs.current.figure = element; }}
                onClick={() => toggleResourcePanel('figure')}
              />
              {renderResourcePopover('figure')}
            </>
          )}

          {!hasFigure && coverType === 'group' && (
            <div className="cover-form__note">
              当前标题使用特殊样式，角色选择已隐藏。
            </div>
          )}
        </div>
      </section>

      {coverType === 'group' && (
        <section className="cover-form__group cover-form__group--settings" aria-label="封面设置">
          {!isEnglish && (
            <div className="cover-field">
              <span className="cover-field__label">图文方向</span>
              <div className="cover-segmented-control cover-direction-control" role="group" aria-label="图文方向">
                {[
                  { value: 'left-image', label: '左图右文', imageFirst: true },
                  { value: 'right-image', label: '左文右图', imageFirst: false },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`cover-segmented-control__option cover-direction-option${direction === option.value ? ' is-selected' : ''}`}
                    aria-label={option.label}
                    aria-pressed={direction === option.value}
                    onClick={() => onChange({ direction: option.value as LayoutDirection })}
                  >
                    <span className="cover-direction-option__icon" aria-hidden="true">
                      {option.imageFirst ? <ImageIcon size={14} strokeWidth={2} /> : <TypeIcon size={14} strokeWidth={2} />}
                      {option.imageFirst ? <TypeIcon size={14} strokeWidth={2} /> : <ImageIcon size={14} strokeWidth={2} />}
                    </span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="cover-switch-field">
            <div>
              <span className="cover-field__label">存储标签</span>
            </div>
            <Switch
              checked={showStorageTag}
              label={showStorageTag ? '已开启' : '未开启'}
              onChange={(checked) => onChange({ showStorageTag: checked })}
            />
          </div>
        </section>
      )}
    </div>
  );
};

export default CoverForm;
