import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronRight,
  Image as ImageIcon,
  Palette,
  Type as TypeIcon,
  Users,
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
  onChange: (partial: Partial<CoverFormState>) => void;
}

type ResourcePanel = 'color' | 'texture' | 'figure';

const RESOURCE_PANEL_LABELS: Record<ResourcePanel, string> = {
  color: '颜色',
  texture: '纹理',
  figure: '人物',
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
  icon: React.ReactNode;
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
  size: string;
}> = [
  { value: 'project', label: '项目封面', size: '640 × 360' },
  { value: 'group', label: '项目组封面', size: '675 × 384' },
];

export function CoverTypeControl({ value, onChange }: CoverTypeControlProps) {
  return (
    <div className="cover-segmented-control cover-type-control" role="group" aria-label="封面类型">
      {COVER_TYPE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`cover-segmented-control__option${value === option.value ? ' is-selected' : ''}`}
          aria-pressed={value === option.value}
          aria-label={`${option.label}，尺寸 ${option.size}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ResourceMenuButton({
  panel,
  icon,
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
      onClick={onClick}
    >
      <span className="cover-resource-menu__trigger-icon" aria-hidden="true">{icon}</span>
      <span className="cover-resource-menu__trigger-copy">
        <strong>{title}</strong>
        <span>{summary}</span>
      </span>
      <ChevronRight size={16} aria-hidden="true" />
    </button>
  );
}

function getSelectedFigureName(
  categories: ThumbnailCategory[],
  figureId: string,
): string {
  return categories
    .flatMap((category) => category.items)
    .find((figure) => figure.id === figureId)?.name ?? '未选择';
}

export const CoverForm: React.FC<CoverFormProps> = ({ state, onChange }) => {
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
  const selectedTextureName = textures.find((texture) => texture.id === textureId)?.name ?? '无';
  const selectedFigureName = getSelectedFigureName(figureCategories, figureId);
  const selectedFigureCategory = figureCategories
    .find((category) => category.items.some((item) => item.id === figureId))?.name;
  const selectedFigureSummary = selectedFigureCategory
    ? `${selectedFigureCategory} · ${selectedFigureName}`
    : selectedFigureName;
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
    const safeTextColors = getTextColorOptions(nextBackgroundColorId);
    const textColorStillSafe = safeTextColors.some((option) => option.id === textColorId);
    onChange({
      backgroundColorId: nextBackgroundColorId,
      textColorId: textColorStillSafe ? textColorId : safeTextColors[0].id,
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
            <p className="cover-picker-hint cover-picker-hint--compact">只显示与当前背景有足够对比度的颜色。</p>
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

        {coverType === 'group' && !isEnglish && (
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

        {coverType === 'group' && (
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
        )}
      </section>

      <section className="cover-form__group cover-form__group--resources" aria-label="视觉资源">
        <div className="cover-resource-menu">
          <ResourceMenuButton
            panel="color"
            icon={<Palette size={17} />}
            title="颜色"
            summary={`${selectedBackground?.familyLabel ?? '未选择'} · ${selectedBackground?.step ?? ''}阶${selectedTextColor ? ` · 文字${selectedTextColor.label}` : ''}`}
            open={activePanel === 'color'}
            buttonRef={(element) => { resourceTriggerRefs.current.color = element; }}
            onClick={() => toggleResourcePanel('color')}
          />
          {renderResourcePopover('color')}
          <ResourceMenuButton
            panel="texture"
            icon={<ImageIcon size={17} />}
            title="纹理"
            summary={selectedTextureName}
            open={activePanel === 'texture'}
            buttonRef={(element) => { resourceTriggerRefs.current.texture = element; }}
            onClick={() => toggleResourcePanel('texture')}
          />
          {renderResourcePopover('texture')}
          {hasFigure && (
            <>
              <ResourceMenuButton
                panel="figure"
                icon={<Users size={17} />}
                title="人物"
              summary={selectedFigureSummary}
                open={activePanel === 'figure'}
                buttonRef={(element) => { resourceTriggerRefs.current.figure = element; }}
                onClick={() => toggleResourcePanel('figure')}
              />
              {renderResourcePopover('figure')}
            </>
          )}

          {!hasFigure && coverType === 'group' && (
            <div className="cover-form__note">
              当前标题使用特殊样式，人物选择已隐藏。
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CoverForm;
