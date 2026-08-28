/**
 * 封面 Canvas 预览与导出绘制源。
 * 渲染层级：背景色 → 背景纹理 → 存储标签 → 标题 → 人物。
 */

/* eslint-disable react-refresh/only-export-components */

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { CANVAS_SIZE, type CoverLayout } from '../tokens/layouts';
import {
  getCoverColorHex,
  getTextColorHex,
} from '../tokens/colors';
import {
  textures,
  projectFigureCategories,
  groupFigureCategories,
  FONT_FAMILIES,
} from '../tokens/assets';
import { parseSpecialGroupTitle, resolveLayout, isEnglishTitle } from '../utils/layoutMatcher';
import type { CoverDraft } from '../types';

export type CoverPreviewState = CoverDraft;
export type CoverAssetsStatus = 'loading' | 'ready' | 'error';

/** 预览使用 2 倍 backing store，CSS 仍按逻辑尺寸显示。 */
const PREVIEW_RENDER_SCALE = 2;

export interface CoverPreviewHandle {
  getCanvas: () => HTMLCanvasElement | null;
  getImages: () => Map<string, HTMLImageElement>;
}

interface CoverPreviewProps {
  state: CoverPreviewState;
  /** 字体未就绪时不绘制，避免 Canvas 先缓存系统回退字体。 */
  fontStatus: 'loading' | 'ready' | 'error';
  retryToken?: number;
  onAssetsStatus?: (status: CoverAssetsStatus, failedPaths?: string[]) => void;
}

/** 在 Canvas 上绘制封面，scale 仅供内部导出使用。 */
export function drawCover(
  ctx: CanvasRenderingContext2D,
  state: CoverPreviewState,
  images: Map<string, HTMLImageElement>,
  scale = 1,
) {
  const {
    coverType,
    title,
    direction,
    showStorageTag,
    textColorId,
    figureId,
  } = state;

  const canvasSize = coverType === 'project' ? CANVAS_SIZE.project : CANVAS_SIZE.group;
  const W = canvasSize.width;
  const H = canvasSize.height;
  const layout: CoverLayout = resolveLayout(coverType, title, direction);

  ctx.save();
  ctx.scale(scale, scale);

  // 背景由两个独立层组成，后续可按层调整而不影响标题和人物。
  drawCoverBackground(ctx, state, images, W, H);

  // 3. 存储标签。
  if (coverType === 'group' && showStorageTag) {
    drawStorageTag(ctx);
  }

  // 4. 标题。
  drawTitle(ctx, state, layout, textColorId);

  // 5. 人物。
  if (figureId && layout.figure && !(coverType === 'group' && isEnglishTitle(title))) {
    const figurePath = findFigurePath(coverType, figureId);
    const figureImage = figurePath ? images.get(figurePath) : undefined;
    if (figureImage && figureImage.complete && figureImage.naturalWidth > 0) {
      const figureLayout = layout.figure;
      ctx.drawImage(
        figureImage,
        figureLayout.x,
        figureLayout.y - figureLayout.height,
        figureLayout.width,
        figureLayout.height,
      );
    }
  }

  ctx.restore();
}

/** 背景层 1：用户选择的纯色底。 */
function drawSolidColorBackground(
  ctx: CanvasRenderingContext2D,
  backgroundColorId: string,
  width: number,
  height: number,
) {
  ctx.fillStyle = getCoverColorHex(backgroundColorId);
  ctx.fillRect(0, 0, width, height);
}

/** 背景层 2：纹理图片，以 Multiply + 50% 透明度叠加。 */
function drawTextureBackground(
  ctx: CanvasRenderingContext2D,
  textureId: string,
  coverType: CoverPreviewState['coverType'],
  images: Map<string, HTMLImageElement>,
  width: number,
  height: number,
) {
  const texture = textures.find((item) => item.id === textureId);
  const textureImage = texture ? images.get(texture.path) : undefined;
  if (!textureImage || !textureImage.complete || textureImage.naturalWidth <= 0) return;

  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.5;
  if (coverType === 'project') {
    // Project textures use a centered, aspect-ratio-preserving cover crop so
    // the texture reaches every edge of the 640×360 export canvas.
    const textureScale = Math.max(width / textureImage.naturalWidth, height / textureImage.naturalHeight);
    const textureWidth = textureImage.naturalWidth * textureScale;
    const textureHeight = textureImage.naturalHeight * textureScale;
    ctx.drawImage(
      textureImage,
      (width - textureWidth) / 2,
      (height - textureHeight) / 2,
      textureWidth,
      textureHeight,
    );
  } else {
    ctx.drawImage(textureImage, 0, 0, width, height);
  }
  ctx.restore();
}

function drawCoverBackground(
  ctx: CanvasRenderingContext2D,
  state: CoverPreviewState,
  images: Map<string, HTMLImageElement>,
  width: number,
  height: number,
) {
  drawSolidColorBackground(ctx, state.backgroundColorId, width, height);

  if (state.textureId) {
    drawTextureBackground(ctx, state.textureId, state.coverType, images, width, height);
  }

}

function drawStorageTag(ctx: CanvasRenderingContext2D) {
  const tagX = 26;
  const tagY = 26;
  const tagW = 116;
  const tagH = 57;

  ctx.save();
  ctx.fillStyle = '#353E42';
  ctx.beginPath();
  ctx.roundRect(tagX, tagY, tagW, tagH, 20);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '500 34px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  const label = '存储';
  const metrics = ctx.measureText(label);
  const ascent = metrics.actualBoundingBoxAscent ?? 0;
  const descent = metrics.actualBoundingBoxDescent ?? 0;

  if (ascent + descent > 0) {
    // Figma uses a 45px line box centered inside the 57px tag. Canvas has no
    // line-height, so center the measured glyph bounds to match that result.
    ctx.textBaseline = 'alphabetic';
    const baselineY = tagY + tagH / 2 + (ascent - descent) / 2;
    ctx.fillText(label, tagX + 24, baselineY);
  } else {
    ctx.textBaseline = 'middle';
    ctx.fillText(label, tagX + 24, tagY + tagH / 2);
  }
  ctx.restore();
}

function drawTitle(
  ctx: CanvasRenderingContext2D,
  state: CoverPreviewState,
  layout: CoverLayout,
  textColorId: string,
) {
  const { coverType, title, backgroundColorId } = state;
  if (!title) return;

  const isEnglish = coverType === 'group' && isEnglishTitle(title);
  if (isEnglish) {
    drawEnglishTitle(ctx, title, getTextColorHex(backgroundColorId, textColorId));
    return;
  }

  const textLayout = layout.text;
  const fontFamily = coverType === 'project'
    ? FONT_FAMILIES.projectTitle
    : FONT_FAMILIES.groupTitle;

  ctx.save();
  ctx.fillStyle = getTextColorHex(backgroundColorId, textColorId);
  ctx.font = `normal ${textLayout.fontSize}px "${fontFamily}", "PingFang SC", sans-serif`;
  ctx.textAlign = textLayout.align;
  ctx.textBaseline = textLayout.vAlign === 'middle' ? 'middle' : 'top';

  if (coverType === 'project' && textLayout.shadow) {
    ctx.shadowOffsetX = textLayout.shadow.offsetX;
    ctx.shadowOffsetY = textLayout.shadow.offsetY;
    ctx.shadowBlur = textLayout.shadow.blur;
    ctx.shadowColor = textLayout.shadow.color;
  }

  const normalizedTitle = title.replace(/[\r\n]/g, '');
  const lines = wrapText(ctx, normalizedTitle, textLayout.maxWidth, textLayout.letterSpacing ?? 0);
  const startY = textLayout.vAlign === 'middle'
    ? textLayout.y - ((lines.length - 1) * textLayout.lineHeight) / 2
    : textLayout.y;

  if (textLayout.letterSpacing && textLayout.letterSpacing > 0) {
    const letterSpacing = textLayout.letterSpacing;
    ctx.textAlign = 'left';
    lines.forEach((line, index) => {
      const lineY = startY + index * textLayout.lineHeight;
      const charWidths = [...line].map((character) => ctx.measureText(character).width);
      const totalWidth = charWidths.reduce((sum, width) => sum + width, 0)
        + (line.length - 1) * letterSpacing;
      const startX = textLayout.align === 'center'
        ? textLayout.x - totalWidth / 2
        : textLayout.align === 'right'
          ? textLayout.x - totalWidth
          : textLayout.x;

      let currentX = startX;
      for (let characterIndex = 0; characterIndex < line.length; characterIndex += 1) {
        ctx.fillText(line[characterIndex], currentX, lineY);
        currentX += charWidths[characterIndex] + letterSpacing;
      }
    });
  } else {
    lines.forEach((line, index) => {
      ctx.fillText(line, textLayout.x, startY + index * textLayout.lineHeight, textLayout.maxWidth);
    });
  }

  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 0;
  ctx.shadowColor = '';
  ctx.restore();
}

function drawEnglishTitle(ctx: CanvasRenderingContext2D, title: string, textColor: string) {
  const parsedTitle = parseSpecialGroupTitle(title);
  if (!parsedTitle) return;

  const { prefix, level } = parsedTitle;
  const centerX = 675 / 2;
  const centerY = 215;
  const gap = prefix ? 12 : 0;

  ctx.save();
  ctx.fillStyle = textColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  ctx.font = `700 320px "${FONT_FAMILIES.englishTitle}", sans-serif`;
  const levelWidth = ctx.measureText(level).width;
  ctx.font = `normal 120px "${FONT_FAMILIES.groupTitle}", "PingFang SC", sans-serif`;
  const prefixWidth = prefix ? ctx.measureText(prefix).width : 0;
  const totalWidth = prefixWidth + gap + levelWidth;
  let x = centerX - totalWidth / 2;

  if (prefix) {
    ctx.fillText(prefix, x, centerY - 60);
    x += prefixWidth + gap;
  }

  ctx.font = `700 320px "${FONT_FAMILIES.englishTitle}", sans-serif`;
  ctx.fillText(level, x, 65);
  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  letterSpacing = 0,
): string[] {
  const lines: string[] = [];
  let currentLine = '';

  for (const character of text) {
    const testLine = currentLine + character;
    if (measureLineWidth(ctx, testLine, letterSpacing) > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = character;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

function measureLineWidth(
  ctx: CanvasRenderingContext2D,
  line: string,
  letterSpacing: number,
): number {
  if (!letterSpacing || line.length < 2) return ctx.measureText(line).width;
  return [...line].reduce((total, character) => total + ctx.measureText(character).width, 0)
    + (line.length - 1) * letterSpacing;
}

function findFigurePath(coverType: 'project' | 'group', figureId: string): string | null {
  const categories = coverType === 'project' ? projectFigureCategories : groupFigureCategories;
  for (const category of categories) {
    const figure = category.figures.find((item) => item.id === figureId);
    if (figure) return figure.path;
  }
  return null;
}

export function collectImagePaths(state: CoverPreviewState): string[] {
  const paths: string[] = [];
  const { textureId, figureId, coverType, title } = state;

  if (textureId) {
    const texture = textures.find((item) => item.id === textureId);
    if (texture) paths.push(texture.path);
  }

  if (figureId && !(coverType === 'group' && isEnglishTitle(title))) {
    const figurePath = findFigurePath(coverType, figureId);
    if (figurePath) paths.push(figurePath);
  }

  return [...new Set(paths)];
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const resolvedSrc = typeof window === 'undefined'
      ? src
      : new URL(src, window.location.href).toString();
    const isCrossOrigin = typeof window !== 'undefined'
      && new URL(resolvedSrc).origin !== window.location.origin;

    // 本地静态素材不需要 CORS；只有跨域资源才设置 anonymous，避免开发服务器
    // 未返回 CORS 响应头时让 Canvas 预览误判为素材加载失败。
    if (isCrossOrigin) image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`素材加载失败: ${resolvedSrc}`));
    image.src = resolvedSrc;
  });
}

export const CoverPreview = forwardRef<CoverPreviewHandle, CoverPreviewProps>(
  ({ state, fontStatus, retryToken = 0, onAssetsStatus }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
      getImages: () => imagesRef.current,
    }));

    useEffect(() => {
      let cancelled = false;

      const render = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const canvasSize = state.coverType === 'project' ? CANVAS_SIZE.project : CANVAS_SIZE.group;
        canvas.width = canvasSize.width * PREVIEW_RENDER_SCALE;
        canvas.height = canvasSize.height * PREVIEW_RENDER_SCALE;
        const context = canvas.getContext('2d');
        if (!context) return;
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        if (fontStatus === 'loading') {
          context.clearRect(0, 0, canvas.width, canvas.height);
          onAssetsStatus?.('loading');
          return;
        }

        onAssetsStatus?.('loading');
        const failedPaths: string[] = [];
        await Promise.all(collectImagePaths(state).map(async (path) => {
          if (imagesRef.current.has(path)) return;
          try {
            imagesRef.current.set(path, await loadImage(path));
          } catch {
            failedPaths.push(path);
          }
        }));

        if (cancelled) return;

        context.clearRect(0, 0, canvas.width, canvas.height);
        drawCover(context, state, imagesRef.current, PREVIEW_RENDER_SCALE);
        onAssetsStatus?.(failedPaths.length > 0 ? 'error' : 'ready', failedPaths);
      };

      void render();
      return () => {
        cancelled = true;
      };
    }, [fontStatus, onAssetsStatus, retryToken, state]);

    const canvasSize = state.coverType === 'project' ? CANVAS_SIZE.project : CANVAS_SIZE.group;

    return (
      <div className="cover-preview-stage">
        <canvas
          ref={canvasRef}
          width={canvasSize.width * PREVIEW_RENDER_SCALE}
          height={canvasSize.height * PREVIEW_RENDER_SCALE}
          style={{ width: `${canvasSize.width}px`, height: 'auto' }}
          className="cover-preview-canvas"
          role="img"
          aria-label="封面实时预览"
        />
      </div>
    );
  },
);

CoverPreview.displayName = 'CoverPreview';

export default CoverPreview;
