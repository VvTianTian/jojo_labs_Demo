import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ChevronLeft,
  Download,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { CoverForm, CoverTypeControl, type CoverFormState } from './components/CoverForm';
import {
  CoverPreview,
  loadImage,
  type CoverAssetsStatus,
  type CoverPreviewHandle,
} from './components/CoverPreview';
import { exportCoverImage, buildExportFilename } from './utils/exportImage';
import { loadCoverFonts, type FontLoadStatus } from './utils/fontLoader';
import { normalizeCoverTitle, validateCoverTitle } from './utils/coverValidation';
import { isEnglishTitle } from './utils/layoutMatcher';
import {
  coverColorOptions,
  getDefaultTextColorOption,
  type CoverColorId,
} from './tokens/colors';
import { groupFigureCategories, projectFigureCategories, textures } from './tokens/assets';
import type { CoverDraft, CoverType, ExportScale } from './types';
import './cover-generator.css';

const DEFAULT_BACKGROUND: Record<CoverType, CoverColorId> = {
  project: 'orange-5',
  group: 'blue-5',
};

function createDefaultDraft(coverType: CoverType): CoverDraft {
  const backgroundColorId = DEFAULT_BACKGROUND[coverType];
  const figureCategories = coverType === 'project' ? projectFigureCategories : groupFigureCategories;

  return {
    coverType,
    title: coverType === 'project' ? '语文' : '初中语文',
    direction: 'left-image',
    showStorageTag: false,
    backgroundColorId,
    textColorId: getDefaultTextColorOption(backgroundColorId).id,
    textureId: textures[1]?.id ?? textures[0].id,
    figureId: figureCategories[0]?.figures[0]?.id ?? '',
  };
}

const INITIAL_STATE = createDefaultDraft('group');

function trimTitleForProject(title: string): string {
  return [...normalizeCoverTitle(title)].slice(0, 2).join('');
}

function pickRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function isSameVisualCombination(first: CoverDraft, second: CoverDraft) {
  return first.backgroundColorId === second.backgroundColorId
    && first.textureId === second.textureId
    && first.figureId === second.figureId
    && first.direction === second.direction;
}

export const CoverGenerator: React.FC = () => {
  const [formState, setFormState] = useState<CoverFormState>(INITIAL_STATE);
  const [fontStatus, setFontStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [assetStatus, setAssetStatus] = useState<CoverAssetsStatus>('loading');
  const [failedAssetCount, setFailedAssetCount] = useState(0);
  const [fontRetryToken, setFontRetryToken] = useState(0);
  const [assetRetryToken, setAssetRetryToken] = useState(0);
  const [exportScale, setExportScale] = useState<ExportScale>(1);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [randomizing, setRandomizing] = useState(false);
  const [randomError, setRandomError] = useState('');
  const [failedAssetPaths, setFailedAssetPaths] = useState<string[]>([]);

  const previewRef = useRef<CoverPreviewHandle>(null);
  const randomRequestRef = useRef(0);
  const validation = useMemo(
    () => validateCoverTitle(formState.coverType, formState.title),
    [formState.coverType, formState.title],
  );
  const isReadyToExport = validation.isValid
    && fontStatus === 'ready'
    && assetStatus === 'ready'
    && !exporting;

  const handleFormChange = useCallback((partial: Partial<CoverFormState>) => {
    randomRequestRef.current += 1;
    setRandomizing(false);
    setFormState((current) => {
      if (partial.coverType && partial.coverType !== current.coverType) {
        const nextDefaults = createDefaultDraft(partial.coverType);
        return {
          ...current,
          coverType: partial.coverType,
          title: current.coverType === 'group' && partial.coverType === 'project'
            ? trimTitleForProject(current.title)
            : current.title,
          figureId: nextDefaults.figureId,
        };
      }

      const nextState = { ...current, ...partial };
      if (
        partial.backgroundColorId !== undefined
        && partial.backgroundColorId !== current.backgroundColorId
      ) {
        nextState.textColorId = getDefaultTextColorOption(nextState.backgroundColorId).id;
      }
      return nextState;
    });
    setExportError('');
    setRandomError('');
  }, []);

  useEffect(() => () => {
    randomRequestRef.current += 1;
  }, []);

  useEffect(() => {
    let active = true;
    void loadCoverFonts()
      .then((status: FontLoadStatus) => {
        if (!active) return;
        const allFontsReady = Object.values(status).every(Boolean);
        setFontStatus(allFontsReady ? 'ready' : 'error');
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.warn('[CoverGenerator] 字体加载失败', error);
        setFontStatus('error');
      });

    return () => {
      active = false;
    };
  }, [fontRetryToken]);

  const handleAssetsStatus = useCallback((status: CoverAssetsStatus, failedPaths: string[] = []) => {
    setAssetStatus(status);
    setFailedAssetCount(failedPaths.length);
    setFailedAssetPaths(failedPaths);
  }, []);

  const handleRandomize = useCallback(async () => {
    if (!validation.isValid || fontStatus !== 'ready' || randomizing) return;

    const requestId = randomRequestRef.current + 1;
    randomRequestRef.current = requestId;
    const failedPaths = new Set(failedAssetPaths);
    let availableTextures = textures.filter((texture) => !failedPaths.has(texture.path));
    const figureCategories = formState.coverType === 'project'
      ? projectFigureCategories
      : groupFigureCategories;
    let availableFigures = figureCategories
      .flatMap((category) => category.figures)
      .filter((figure) => !failedPaths.has(figure.path));

    if (availableTextures.length === 0 || availableFigures.length === 0) {
      setRandomError('可用素材不足，请重试加载后再生成');
      return;
    }

    setRandomizing(true);
    setRandomError('');
    const startedAt = window.performance.now();
    let nextDraft: CoverDraft | null = null;

    for (let attempt = 0; attempt < 12 && availableTextures.length > 0 && availableFigures.length > 0; attempt += 1) {
      const texture = pickRandomItem(availableTextures);
      const figure = pickRandomItem(availableFigures);
      const loadResults = await Promise.allSettled([
        loadImage(texture.path),
        loadImage(figure.path),
      ]);

      if (loadResults[0].status === 'rejected') failedPaths.add(texture.path);
      if (loadResults[1].status === 'rejected') failedPaths.add(figure.path);
      if (loadResults.some((result) => result.status === 'rejected')) {
        availableTextures = availableTextures.filter((item) => !failedPaths.has(item.path));
        availableFigures = availableFigures.filter((item) => !failedPaths.has(item.path));
        continue;
      }

      const background = pickRandomItem(coverColorOptions);
      nextDraft = {
        ...formState,
        backgroundColorId: background.id,
        textColorId: getDefaultTextColorOption(background.id).id,
        textureId: texture.id,
        figureId: figure.id,
        direction: formState.coverType === 'group' && !isEnglishTitle(formState.title)
          ? pickRandomItem(['left-image', 'right-image'] as const)
          : formState.direction,
      };

      if (isSameVisualCombination(nextDraft, formState)) {
        const currentBackgroundIndex = Math.max(
          0,
          coverColorOptions.findIndex((option) => option.id === formState.backgroundColorId),
        );
        const fallbackBackground = coverColorOptions[(currentBackgroundIndex + 1) % coverColorOptions.length];
        nextDraft.backgroundColorId = fallbackBackground.id;
        nextDraft.textColorId = getDefaultTextColorOption(fallbackBackground.id).id;
      }
      break;
    }

    const remainingDelay = Math.max(0, 260 - (window.performance.now() - startedAt));
    if (remainingDelay > 0) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, remainingDelay));
    }

    if (requestId !== randomRequestRef.current) return;
    setFailedAssetPaths(Array.from(failedPaths));
    if (!nextDraft) {
      setRandomError('可用素材不足，请重试加载后再生成');
      setRandomizing(false);
      return;
    }

    setFormState((current) => current.coverType === formState.coverType
      ? {
          ...current,
          backgroundColorId: nextDraft.backgroundColorId,
          textColorId: nextDraft.textColorId,
          textureId: nextDraft.textureId,
          figureId: nextDraft.figureId,
          direction: nextDraft.direction,
        }
      : current);
    setExportError('');
    setRandomizing(false);
  }, [failedAssetPaths, fontStatus, formState, randomizing, validation.isValid]);

  const handleExport = useCallback(async () => {
    const images = previewRef.current?.getImages();
    if (!images || !isReadyToExport) return;

    setExporting(true);
    setExportError('');
    try {
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      await exportCoverImage({
        state: formState,
        images,
        scale: exportScale,
        filename: buildExportFilename(formState.title, formState.coverType),
      });
    } catch (error) {
      console.error('[CoverGenerator] 封面导出失败', error);
      setExportError('下载失败，请检查素材状态后重试');
    } finally {
      setExporting(false);
    }
  }, [exportScale, formState, isReadyToExport]);

  const pageStatus = fontStatus === 'loading'
    ? '字体加载中'
    : fontStatus === 'error'
      ? '字体加载失败'
      : assetStatus === 'loading'
        ? '素材准备中'
        : assetStatus === 'error'
          ? `${failedAssetCount} 个素材加载失败`
          : validation.isValid
            ? '可直接导出'
            : '请先修正标题';

  return (
    <div className="cover-generator">
      <header className="cover-header">
        <Link to="/" className="cover-header__back" aria-label="返回工具首页">
          <ChevronLeft size={18} aria-hidden="true" />
          <span>工具首页</span>
        </Link>

        <div className="cover-header__brand-mark" aria-hidden="true">J</div>
        <span className="cover-header__brand-name">Jojo Labs</span>
        <span className="cover-header__divider" aria-hidden="true" />
        <div className="cover-header__identity">
          <h1>项目封面配置器</h1>
        </div>

        <div className="cover-header__spacer" />

        <div className="cover-header__actions">
          <div className="cover-scale-control" role="group" aria-label="导出清晰度">
            <span className="cover-scale-control__label">清晰度</span>
            <div className="cover-scale-control__options">
              {([1, 2] as const).map((scale) => (
                <button
                  key={scale}
                  type="button"
                  className={`cover-scale-control__option${exportScale === scale ? ' is-selected' : ''}`}
                  aria-pressed={exportScale === scale}
                  onClick={() => setExportScale(scale)}
                >
                  {scale === 2 ? '2x' : '1x'}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="cover-download-button"
            onClick={handleExport}
            disabled={!isReadyToExport}
            title={!isReadyToExport ? pageStatus : '导出 JPG'}
          >
            {exporting ? <Loader2 size={16} className="cover-spin" /> : <Download size={16} aria-hidden="true" />}
            {exporting ? '导出中…' : '导出 JPG'}
          </button>
        </div>
      </header>

      <div className="cover-layout">
        <div className="cover-background-ornaments" aria-hidden="true">
          <img
            className="cover-background-ornaments__clouds"
            src="/cover-generator/assets/page-background/clouds.png"
            alt=""
          />
          <img
            className="cover-background-ornaments__shrubs-left"
            src="/cover-generator/assets/page-background/shrubs-left.png"
            alt=""
          />
          <img
            className="cover-background-ornaments__shrub-right"
            src="/cover-generator/assets/page-background/shrub-right.png"
            alt=""
          />
        </div>

        <aside className="cover-sidebar" aria-label="封面配置">
          <div className="cover-sidebar__scroll">
            {fontStatus === 'loading' && (
              <div className="cover-inline-status cover-inline-status--loading" role="status">
                <Loader2 size={14} className="cover-spin" aria-hidden="true" />
                正在准备封面字体…
              </div>
            )}
            {fontStatus === 'error' && (
              <div className="cover-inline-status cover-inline-status--error" role="alert">
                <AlertCircle size={14} aria-hidden="true" />
                <span>字体加载失败</span>
                <button type="button" onClick={() => setFontRetryToken((value) => value + 1)}>
                  重试
                </button>
              </div>
            )}

            <CoverForm
              state={formState}
              randomizing={randomizing}
              randomDisabled={!validation.isValid || fontStatus !== 'ready'}
              randomError={randomError}
              onChange={handleFormChange}
              onRandomize={handleRandomize}
            />
          </div>
        </aside>

        <main className="cover-workspace">
          <div className="cover-workspace__toolbar">
            <CoverTypeControl
              value={formState.coverType}
              onChange={(coverType) => handleFormChange({ coverType })}
            />
          </div>

          <section className="cover-preview-card" aria-label="封面预览">
            <CoverPreview
              ref={previewRef}
              state={formState}
              fontStatus={fontStatus}
              retryToken={assetRetryToken}
              onAssetsStatus={handleAssetsStatus}
            />
          </section>

          {(assetStatus === 'error' || exportError || (!validation.isValid && validation.isEmpty)) && (
            <div className="cover-workspace__footer">
              {assetStatus === 'error' && (
                <div className="cover-footer-message cover-footer-message--error" role="alert">
                  <AlertCircle size={15} aria-hidden="true" />
                  <span>素材加载失败，暂时不能导出。</span>
                  <button type="button" onClick={() => setAssetRetryToken((value) => value + 1)}>
                    <RefreshCw size={13} aria-hidden="true" />重试
                  </button>
                </div>
              )}
              {exportError && (
                <div className="cover-footer-message cover-footer-message--error" role="alert">
                  <AlertCircle size={15} aria-hidden="true" />
                  <span>{exportError}</span>
                </div>
              )}
              {!validation.isValid && validation.isEmpty && (
                <div className="cover-footer-message cover-footer-message--hint">
                  <Sparkles size={15} aria-hidden="true" />
                  <span>先输入标题，完成后才能下载封面。</span>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

    </div>
  );
};

export default CoverGenerator;
