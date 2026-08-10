/**
 * 封面生成器主页面
 * 工作区结构：固定顶栏 + 独立滚动的左侧配置区 + 固定预览区。
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Download, Loader2 } from 'lucide-react';
import { CoverForm, type CoverFormState } from './components/CoverForm';
import { CoverPreview, type CoverPreviewState, type CoverPreviewHandle } from './components/CoverPreview';
import { exportCoverImage, buildExportFilename } from './utils/exportImage';
import { loadCoverFonts } from './utils/fontLoader';
import { CANVAS_SIZE } from './tokens/layouts';
import './cover-generator.css';

const INITIAL_STATE: CoverFormState = {
  coverType: 'group',
  title: '',
  direction: 'left-image',
  showStorageTag: false,
  color: 'blue',
  textureId: '',
  figureId: '',
};

export const CoverGenerator: React.FC = () => {
  const [formState, setFormState] = useState<CoverFormState>(INITIAL_STATE);
  const [previewState, setPreviewState] = useState<CoverPreviewState>(INITIAL_STATE);
  const [exportScale, setExportScale] = useState<1 | 2>(1);
  const [fontsReady, setFontsReady] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const previewRef = useRef<CoverPreviewHandle>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formStateRef = useRef(formState);

  useEffect(() => {
    formStateRef.current = formState;
  }, [formState]);

  // 初始化加载字体
  useEffect(() => {
    loadCoverFonts()
      .then(() => setFontsReady(true))
      .catch((err) => {
        console.warn('[CoverGenerator] 字体加载异常，使用系统字体兜底', err);
        setFontsReady(true);
      });
  }, []);

  // 组件卸载时清理 debounce 定时器
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // 表单变化 debounce 150ms 更新预览
  // 注意：副作用（setTimeout）必须放在 updater 外部，
  // 因为 React 18 StrictMode 会双重调用 updater 导致副作用行为异常
  const handleFormChange = useCallback((partial: Partial<CoverFormState>) => {
    const nextState = { ...formStateRef.current, ...partial };
    formStateRef.current = nextState;
    setFormState(nextState);

    // debounce 更新预览：通过 ref 读取最新 state，确保 updater 为纯函数
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPreviewState({ ...formStateRef.current });
    }, 150);
  }, []);

  // 导出下载
  const handleExport = useCallback(async () => {
    const images = previewRef.current?.getImages();
    if (!images || exporting || !fontsReady) return;

    setExporting(true);
    setExportError('');
    try {
      // 让按钮先进入 loading 状态，再开始 Canvas 导出。
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      const filename = buildExportFilename(formState.title, formState.coverType);
      await exportCoverImage({
        state: formState,
        images,
        scale: exportScale,
        filename,
        quality: 0.92,
      });
    } catch (error) {
      console.error('[CoverGenerator] JPG 导出失败', error);
      setExportError('下载失败，请重试');
    } finally {
      setExporting(false);
    }
  }, [exporting, fontsReady, formState, exportScale]);

  const previewSize = formState.coverType === 'project' ? CANVAS_SIZE.project : CANVAS_SIZE.group;

  return (
    <div className="cover-generator">
      {/* 顶部工具栏 */}
      <header className="cover-header">
        {/* 返回首页 */}
        <Link
          to="/"
          className="cover-header__back"
          aria-label="返回工具首页"
        >
          <ChevronLeft size={18} />
        </Link>

        <div className="cover-header__identity">
          <h1>封面图生成工具</h1>
          <span>{formState.coverType === 'project' ? '项目封面' : '项目组封面'}</span>
        </div>

        <div className="cover-header__spacer" />

        <div className="cover-header__actions">
          {/* 格式固定为 JPG，不再提供格式切换 */}
          <span className="cover-format-badge" aria-label="导出格式 JPG">JPG</span>

          <div className="cover-scale-control" aria-label="导出清晰度">
            <span className="cover-scale-control__label">清晰度</span>
            <div className="cover-scale-control__options">
              {([1, 2] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setExportScale(s)}
                  className={`cover-scale-control__option${exportScale === s ? ' is-selected' : ''}`}
                  aria-pressed={exportScale === s}
                >
                  {s === 2 ? '2x 高清' : '1x'}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || !fontsReady}
            className="cover-download-button"
          >
            {exporting ? <Loader2 size={16} className="cover-spin" /> : <Download size={16} />}
            {exporting ? '导出中...' : '下载 JPG'}
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <div className="cover-layout">
        {/* 左侧表单区 */}
        <aside className="cover-sidebar" aria-label="封面配置">
          <div className="cover-sidebar__scroll">
            <div className="cover-sidebar__heading">
              <div>
                <span className="cover-sidebar__eyebrow">封面配置</span>
                <h2>把内容放到画布上</h2>
              </div>
              <span className="cover-sidebar__status">实时预览</span>
            </div>

            {!fontsReady && (
              <div className="cover-inline-status cover-inline-status--loading" role="status">
                <Loader2 size={14} className="cover-spin" />
                字体加载中，请稍候...
              </div>
            )}
            <CoverForm state={formState} onChange={handleFormChange} />
          </div>
        </aside>

        {/* 右侧预览区 */}
        <main className="cover-workspace">
          <div className="cover-workspace__toolbar">
            <div>
              <h2>实时预览</h2>
              <span>调整左侧配置，画布会自动更新</span>
            </div>
            <span className="cover-workspace__size">{previewSize.width} × {previewSize.height} px</span>
          </div>
          <CoverPreview ref={previewRef} state={previewState} />
          {exportError && <div className="cover-inline-status cover-inline-status--error" role="alert">{exportError}</div>}
        </main>
      </div>
    </div>
  );
};

export default CoverGenerator;
