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
  type CoverAssetsStatus,
  type CoverPreviewHandle,
} from './components/CoverPreview';
import { exportCoverImage, buildExportFilename } from './utils/exportImage';
import { loadCoverFonts, type FontLoadStatus } from './utils/fontLoader';
import { validateCoverTitle } from './utils/coverValidation';
import {
  contrastRatio,
  getCoverColorHex,
  getRecommendedTextColorOption,
  getTextColorHex,
  getTextColorOptions,
  TEXT_CONTRAST_THRESHOLD,
  type CoverColorId,
} from './tokens/colors';
import { groupFigureCategories, projectFigureCategories, textures } from './tokens/assets';
import { CANVAS_SIZE } from './tokens/layouts';
import type { CoverDraft, CoverType, ExportScale } from './types';
import './cover-generator.css';

const DEFAULT_BACKGROUND: Record<CoverType, CoverColorId> = {
  project: 'orange-5',
  group: 'blue-5',
};

function getDefaultTextColor(backgroundColorId: CoverColorId): string {
  return getTextColorOptions(backgroundColorId).find((option) => option.id === 'white')?.id
    ?? getTextColorOptions(backgroundColorId)[0].id;
}

function createDefaultDraft(coverType: CoverType): CoverDraft {
  const backgroundColorId = DEFAULT_BACKGROUND[coverType];
  const figureCategories = coverType === 'project' ? projectFigureCategories : groupFigureCategories;

  return {
    coverType,
    title: coverType === 'project' ? '语文' : '初中语文',
    direction: 'left-image',
    showStorageTag: false,
    backgroundColorId,
    textColorId: getDefaultTextColor(backgroundColorId),
    textureId: textures[1]?.id ?? textures[0].id,
    figureId: figureCategories[0]?.figures[0]?.id ?? '',
  };
}

const INITIAL_STATE = createDefaultDraft('group');

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

  const previewRef = useRef<CoverPreviewHandle>(null);
  const validation = useMemo(
    () => validateCoverTitle(formState.coverType, formState.title),
    [formState.coverType, formState.title],
  );
  const textContrastAlert = useMemo(() => {
    const ratio = contrastRatio(
      getCoverColorHex(formState.backgroundColorId),
      getTextColorHex(formState.backgroundColorId, formState.textColorId),
    );

    if (ratio >= TEXT_CONTRAST_THRESHOLD) return null;

    return {
      ratio,
      recommendation: getRecommendedTextColorOption(formState.backgroundColorId),
    };
  }, [formState.backgroundColorId, formState.textColorId]);
  const [contrastToastDismissed, setContrastToastDismissed] = useState(false);
  const contrastToast = textContrastAlert && !contrastToastDismissed ? textContrastAlert : null;
  const previewSize = formState.coverType === 'project' ? CANVAS_SIZE.project : CANVAS_SIZE.group;
  const isReadyToExport = validation.isValid
    && fontStatus === 'ready'
    && assetStatus === 'ready'
    && !exporting;

  const handleFormChange = useCallback((partial: Partial<CoverFormState>) => {
    setContrastToastDismissed(false);
    setFormState((current) => {
      if (partial.coverType && partial.coverType !== current.coverType) {
        return createDefaultDraft(partial.coverType);
      }

      const nextState = { ...current, ...partial };
      if (partial.backgroundColorId && !partial.textColorId) {
        const safeTextColors = getTextColorOptions(partial.backgroundColorId);
        if (!safeTextColors.some((option) => option.id === nextState.textColorId)) {
          nextState.textColorId = safeTextColors[0].id;
        }
      }
      return nextState;
    });
    setExportError('');
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

  useEffect(() => {
    if (!textContrastAlert) return undefined;

    const timeoutId = window.setTimeout(() => setContrastToastDismissed(true), 5200);
    return () => window.clearTimeout(timeoutId);
  }, [textContrastAlert]);

  const handleAssetsStatus = useCallback((status: CoverAssetsStatus, failedPaths: string[] = []) => {
    setAssetStatus(status);
    setFailedAssetCount(failedPaths.length);
  }, []);

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
                  {scale === 2 ? '2x 高清' : '1x'}
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

            <CoverForm state={formState} onChange={handleFormChange} />
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
            <div className="cover-preview-card__topline">
              <div className="cover-preview-card__label">
                <strong>{formState.coverType === 'project' ? '项目封面' : '项目组封面'}</strong>
              </div>
              <span className="cover-preview-card__size">{previewSize.width} × {previewSize.height} px</span>
            </div>
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

      {contrastToast && (
        <div className="cover-contrast-toast" role="status" aria-live="polite">
          <AlertCircle size={17} aria-hidden="true" />
          <div className="cover-contrast-toast__copy">
            <strong>文字颜色对比度不足</strong>
            <span>
              当前对比度 {contrastToast.ratio.toFixed(1)}:1，推荐使用{contrastToast.recommendation.label}。
            </span>
          </div>
          <button
            type="button"
            className="cover-contrast-toast__action"
            onClick={() => handleFormChange({ textColorId: contrastToast.recommendation.id })}
          >
            更换推荐字色
          </button>
        </div>
      )}
    </div>
  );
};

export default CoverGenerator;
