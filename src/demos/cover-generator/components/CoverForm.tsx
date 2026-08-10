/**
 * 封面配置区
 * 基本信息保持常驻，背景和素材以可折叠资源面板承载，避免素材数量增长撑长页面。
 */

import React, { useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { Switch } from '../../../components/Switch';
import { ColorPicker } from './ColorPicker';
import { ThumbnailGrid, type ThumbnailCategory } from './ThumbnailGrid';
import { textures, projectFigureCategories, groupFigureCategories } from '../tokens/assets';
import { coverColorLabels, type CoverColorName } from '../tokens/colors';
import { type LayoutDirection, isEnglishTitle, getEffectiveCharCount } from '../utils/layoutMatcher';

export interface CoverFormState {
  coverType: 'project' | 'group';
  title: string;
  direction: LayoutDirection;
  showStorageTag: boolean;
  color: CoverColorName;
  textureId: string;
  figureId: string;
}

interface CoverFormProps {
  state: CoverFormState;
  onChange: (partial: Partial<CoverFormState>) => void;
}

function CollapsibleSection({
  title,
  summary,
  children,
  defaultOpen = false,
}: {
  title: string;
  summary?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const contentId = `cover-panel-${title}`;

  return (
    <section className="cover-collapsible">
      <button
        type="button"
        className="cover-collapsible__trigger"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="cover-collapsible__title">
          <strong>{title}</strong>
          {summary && <span>{summary}</span>}
        </span>
        <ChevronDown size={16} className={open ? 'is-open' : ''} aria-hidden="true" />
      </button>
      {open && <div id={contentId} className="cover-collapsible__content">{children}</div>}
    </section>
  );
}

export const CoverForm: React.FC<CoverFormProps> = ({ state, onChange }) => {
  const { coverType, title, direction, showStorageTag, color, textureId, figureId } = state;

  const textureCategories: ThumbnailCategory[] = useMemo(
    () => [{ id: 'textures', name: '全部纹理', items: textures.map((t) => ({ id: t.id, name: t.name, path: t.path })) }],
    [],
  );

  const figureCategories: ThumbnailCategory[] = useMemo(() => {
    const categories = coverType === 'project' ? projectFigureCategories : groupFigureCategories;
    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      items: cat.figures.map((f) => ({ id: f.id, name: f.name, path: f.path })),
    }));
  }, [coverType]);

  const selectedTextureName = textures.find((texture) => texture.id === textureId)?.name ?? '无';
  const selectedFigureName = useMemo(
    () => figureCategories.flatMap((category) => category.items).find((figure) => figure.id === figureId)?.name ?? '未选择',
    [figureCategories, figureId],
  );

  const isEnglish = coverType === 'group' && isEnglishTitle(title);
  const charCount = getEffectiveCharCount(title);
  const maxChars = coverType === 'project' ? 2 : 8;
  const isOverLimit = charCount > maxChars;

  return (
    <div className="cover-form">
      <section className="cover-form__group">
        <div className="cover-form__group-heading">
          <h3>基本信息</h3>
          <span>先确定封面内容</span>
        </div>

        <div className="cover-field">
          <label className="cover-field__label">封面类型</label>
          <div className="cover-segmented-control">
            {[
              { value: 'project', label: '项目封面' },
              { value: 'group', label: '项目组封面' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={`cover-segmented-control__option${coverType === option.value ? ' is-selected' : ''}`}
                aria-pressed={coverType === option.value}
                onClick={() => onChange({ coverType: option.value as 'project' | 'group', figureId: '' })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="cover-field">
          <label className="cover-field__label" htmlFor="cover-title">标题</label>
          <input
            id="cover-title"
            type="text"
            value={title}
            placeholder={coverType === 'project' ? '输入 1-2 个中文字' : '输入 1-8 个中文字，或 L1 / L2'}
            onChange={(event) => onChange({ title: event.target.value.replace(/[\r\n]/g, '') })}
            className={`cover-title-input${isOverLimit ? ' is-error' : ''}`}
            aria-invalid={isOverLimit}
          />
          <span className={`cover-field__hint${isOverLimit ? ' is-error' : ''}`}>
            {isEnglish ? '英语布局' : `${title.length === 0 ? 0 : charCount}/${maxChars} 字`}
            {coverType === 'group' && !isEnglish && '｜自动匹配布局'}
            {isOverLimit && '｜超出限制'}
          </span>
        </div>

        {coverType === 'group' && !isEnglish && (
          <div className="cover-field">
            <span className="cover-field__label">布局方向</span>
            <div className="cover-segmented-control">
              {[
                { value: 'left-image', label: '左图右文' },
                { value: 'right-image', label: '左文右图' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`cover-segmented-control__option${direction === option.value ? ' is-selected' : ''}`}
                  aria-pressed={direction === option.value}
                  onClick={() => onChange({ direction: option.value as LayoutDirection })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {coverType === 'group' && (
          <div className="cover-switch-field">
            <div>
              <span className="cover-field__label">存储标签</span>
              <span className="cover-field__hint">在封面左上角显示“存储”</span>
            </div>
            <Switch checked={showStorageTag} onChange={(checked) => onChange({ showStorageTag: checked })} />
          </div>
        )}
      </section>

      <section className="cover-form__group">
        <div className="cover-form__group-heading">
          <h3>背景</h3>
          <span>颜色与纹理</span>
        </div>

        <CollapsibleSection title="背景色" summary={coverColorLabels[color]} defaultOpen>
          <ColorPicker value={color} onChange={(nextColor) => onChange({ color: nextColor })} coverType={coverType} />
        </CollapsibleSection>

        <CollapsibleSection title="背景纹理" summary={selectedTextureName}>
          <ThumbnailGrid
            categories={textureCategories}
            value={textureId}
            onChange={(value) => onChange({ textureId: value })}
            allowNone
            noneLabel="无纹理"
            thumbSize={54}
            maxHeight={176}
          />
        </CollapsibleSection>
      </section>

      {!(coverType === 'group' && isEnglish) && (
      <section className="cover-form__group">
        <div className="cover-form__group-heading">
          <h3>素材</h3>
          <span>人物形象</span>
        </div>

        <CollapsibleSection title="人物形象" summary={selectedFigureName}>
          <ThumbnailGrid
            categories={figureCategories}
            value={figureId}
            onChange={(value) => onChange({ figureId: value })}
            thumbSize={54}
            maxHeight={218}
          />
        </CollapsibleSection>
      </section>
      )}
    </div>
  );
};

export default CoverForm;
