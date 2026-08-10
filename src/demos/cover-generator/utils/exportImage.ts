/**
 * 封面导出工具
 * 统一使用 JPG，支持 1x/2x 高清导出
 * 2x 导出以 2x 分辨率重新渲染整个封面（而非拉伸 1x 像素）
 */

import { CANVAS_SIZE } from '../tokens/layouts';
import {
  drawCover,
  collectImagePaths,
  loadImage,
  type CoverPreviewState,
} from '../components/CoverPreview';

interface ExportOptions {
  /** 封面状态 */
  state: CoverPreviewState;
  /** 已加载的图片资源 */
  images: Map<string, HTMLImageElement>;
  /** 倍率：1x 或 2x */
  scale: 1 | 2;
  /** 文件名（不含扩展名） */
  filename: string;
  /** JPG 质量，默认 0.92 */
  quality?: number;
}

/** 导出封面图片到本地 */
export async function exportCoverImage({
  state,
  images,
  scale,
  filename,
  quality = 0.92,
}: ExportOptions): Promise<void> {
  // 确保所有图片已加载（兜底）
  const paths = collectImagePaths(state);
  const loadPromises = paths
    .filter((p) => !images.has(p))
    .map(async (p) => {
      try {
        const img = await loadImage(p);
        images.set(p, img);
      } catch {
        // 图片加载失败，忽略（使用系统字体兜底等）
      }
    });
  await Promise.all(loadPromises);

  // 创建导出画布（物理像素 = 原始尺寸 × scale）
  const canvasSize =
    state.coverType === 'project' ? CANVAS_SIZE.project : CANVAS_SIZE.group;
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvasSize.width * scale;
  exportCanvas.height = canvasSize.height * scale;

  const ctx = exportCanvas.getContext('2d');
  if (!ctx) return;

  // 以对应 scale 重新绘制整个封面（文字、图形均以矢量方式渲染，保证高清）
  drawCover(ctx, state, images, scale);

  const dataUrl = exportCanvas.toDataURL('image/jpeg', quality);

  const scaleLabel = scale === 2 ? '@2x' : '';
  const fullFilename = `${filename}${scaleLabel}.jpg`;

  // 创建下载链接
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fullFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** 生成导出文件名 */
export function buildExportFilename(
  title: string,
  coverType: 'project' | 'group',
): string {
  const typeLabel = coverType === 'project' ? '项目' : '项目组';
  const dateStr = new Date()
    .toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replace(/\//g, '');
  const safeTitle = (title || '未命名').replace(/[\\/:*?"<>|]/g, '_').slice(0, 20);
  return `${safeTitle}_${typeLabel}_${dateStr}`;
}
