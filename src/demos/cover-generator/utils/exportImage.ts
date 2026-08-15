/** 封面目标尺寸导出工具。 */

import { CANVAS_SIZE } from '../tokens/layouts';
import {
  drawCover,
  collectImagePaths,
  loadImage,
  type CoverPreviewState,
} from '../components/CoverPreview';
import type { ExportScale } from '../types';

interface ExportOptions {
  state: CoverPreviewState;
  images: Map<string, HTMLImageElement>;
  scale: ExportScale;
  filename: string;
  quality?: number;
}

/** 以封面原始尺寸重新绘制并下载，避免下载预览缩放后的像素。 */
export async function exportCoverImage({
  state,
  images,
  scale,
  filename,
  quality = 0.92,
}: ExportOptions): Promise<void> {
  const paths = collectImagePaths(state);
  await Promise.all(paths.map(async (path) => {
    if (images.has(path)) return;
    images.set(path, await loadImage(path));
  }));

  const canvasSize = state.coverType === 'project' ? CANVAS_SIZE.project : CANVAS_SIZE.group;
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvasSize.width * scale;
  exportCanvas.height = canvasSize.height * scale;

  const context = exportCanvas.getContext('2d');
  if (!context) throw new Error('当前浏览器无法创建导出画布');

  drawCover(context, state, images, scale);

  const dataUrl = exportCanvas.toDataURL('image/jpeg', quality);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${filename}${scale === 2 ? '@2x' : ''}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

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
