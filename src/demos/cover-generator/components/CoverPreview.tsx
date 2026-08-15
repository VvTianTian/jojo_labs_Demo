/**
 * 封面 Canvas 预览与导出绘制源。
 * 渲染层级：背景色 → 背景纹理 → 特殊装饰 → 存储标签 → 标题 → 人物。
 */

/* eslint-disable react-refresh/only-export-components */

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { CANVAS_SIZE, type CoverLayout } from '../tokens/layouts';
import {
  coverColors,
  getCoverColorHex,
  getCoverColorOption,
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

export interface CoverPreviewHandle {
  getCanvas: () => HTMLCanvasElement | null;
  getImages: () => Map<string, HTMLImageElement>;
}

interface CoverPreviewProps {
  state: CoverPreviewState;
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
    backgroundColorId,
    textColorId,
    textureId,
    figureId,
  } = state;

  const canvasSize = coverType === 'project' ? CANVAS_SIZE.project : CANVAS_SIZE.group;
  const W = canvasSize.width;
  const H = canvasSize.height;
  const layout: CoverLayout = resolveLayout(coverType, title, direction);

  ctx.save();
  ctx.scale(scale, scale);

  // 1. 背景色：直接使用用户选择的具体色阶。
  ctx.fillStyle = getCoverColorHex(backgroundColorId);
  ctx.fillRect(0, 0, W, H);

  // 2. 背景纹理。
  if (textureId) {
    const texture = textures.find((item) => item.id === textureId);
    const textureImage = texture ? images.get(texture.path) : undefined;
    if (textureImage && textureImage.complete && textureImage.naturalWidth > 0) {
      ctx.save();
      if (coverType === 'project') {
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.72;
        // Project textures use a centered, aspect-ratio-preserving cover crop so
        // the texture reaches every edge of the 640×360 export canvas.
        const textureScale = Math.max(W / textureImage.naturalWidth, H / textureImage.naturalHeight);
        const textureWidth = textureImage.naturalWidth * textureScale;
        const textureHeight = textureImage.naturalHeight * textureScale;
        ctx.drawImage(
          textureImage,
          (W - textureWidth) / 2,
          (H - textureHeight) / 2,
          textureWidth,
          textureHeight,
        );
      } else {
        ctx.globalAlpha = 0.35;
        ctx.drawImage(textureImage, 0, 0, W, H);
      }
      ctx.restore();
    }
  }

  // 英语模板的浅色装饰由模板自带，不依赖人物素材。
  if (coverType === 'group' && isEnglishTitle(title)) {
    drawEnglishDecoration(ctx, backgroundColorId);
  }

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

function drawEnglishDecoration(
  ctx: CanvasRenderingContext2D,
  backgroundColorId: string,
) {
  const family = getCoverColorOption(backgroundColorId).family;

  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = coverColors[family][3];
  const blobs = [
    { x: 50, y: 38, w: 160, h: 78, r: 36 },
    { x: 460, y: 76, w: 170, h: 86, r: 40 },
    { x: 168, y: 278, w: 196, h: 70, r: 34 },
    { x: 520, y: 290, w: 110, h: 60, r: 28 },
  ];
  blobs.forEach(({ x, y, w, h, r }) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  });
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
  ctx.font = `${coverType === 'project' ? 'normal' : '700'} ${textLayout.fontSize}px "${fontFamily}", "PingFang SC", sans-serif`;
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
  ctx.font = `700 120px "${FONT_FAMILIES.groupTitle}", "PingFang SC", sans-serif`;
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
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`素材加载失败: ${src}`));
    image.src = src;
  });
}

export const CoverPreview = forwardRef<CoverPreviewHandle, CoverPreviewProps>(
  ({ state, retryToken = 0, onAssetsStatus }, ref) => {
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
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;
        const context = canvas.getContext('2d');
        if (!context) return;

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
        drawCover(context, state, imagesRef.current);
        onAssetsStatus?.(failedPaths.length > 0 ? 'error' : 'ready', failedPaths);
      };

      void render();
      return () => {
        cancelled = true;
      };
    }, [onAssetsStatus, retryToken, state]);

    const canvasSize = state.coverType === 'project' ? CANVAS_SIZE.project : CANVAS_SIZE.group;

    return (
      <div className="cover-preview-stage">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
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
