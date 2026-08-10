/**
 * 封面预览组件
 * 使用 Canvas 2D API 实时渲染封面
 * 渲染层级：背景色 → 背景纹理 → 存储标签 → 封面文字 → 头图人物
 */

/* 该文件同时导出 Canvas 绘制和图片加载工具，供导出模块复用。 */
/* eslint-disable react-refresh/only-export-components */

import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { CANVAS_SIZE, type CoverLayout } from '../tokens/layouts';
import { coverColors, type CoverColorName } from '../tokens/colors';
import { textures, projectFigureCategories, groupFigureCategories, FONT_FAMILIES } from '../tokens/assets';
import { resolveLayout, isEnglishTitle } from '../utils/layoutMatcher';
import type { LayoutDirection } from '../utils/layoutMatcher';

export interface CoverPreviewState {
  coverType: 'project' | 'group';
  title: string;
  direction: LayoutDirection;
  showStorageTag: boolean;
  color: CoverColorName;
  textureId: string;
  figureId: string;
}

export interface CoverPreviewHandle {
  getCanvas: () => HTMLCanvasElement | null;
  getImages: () => Map<string, HTMLImageElement>;
}

interface CoverPreviewProps {
  state: CoverPreviewState;
}

/** 在 Canvas 上绘制封面（支持 scale 高清渲染） */
export function drawCover(
  ctx: CanvasRenderingContext2D,
  state: CoverPreviewState,
  images: Map<string, HTMLImageElement>,
  scale: number = 1,
) {
  const { coverType, title, direction, showStorageTag, color, textureId, figureId } = state;

  const canvasSize = coverType === 'project' ? CANVAS_SIZE.project : CANVAS_SIZE.group;
  const W = canvasSize.width;
  const H = canvasSize.height;

  // 获取布局
  const layout: CoverLayout = resolveLayout(coverType, title, direction);

  ctx.save();
  ctx.scale(scale, scale);

  // 1. 背景色
  const bgLevel = coverType === 'project' ? 4 : 1;
  const bgColor = coverColors[color][bgLevel];
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);

  // 2. 背景纹理（叠加）
  if (textureId) {
    const texture = textures.find((t) => t.id === textureId);
    if (texture) {
      const texImg = images.get(texture.path);
      if (texImg && texImg.complete && texImg.naturalWidth > 0) {
        ctx.save();
        if (coverType === 'project') {
          ctx.globalCompositeOperation = 'overlay';
          ctx.globalAlpha = 0.8;
          // 项目封面纹理：居中等比缩放（contain）
          const texScale = Math.min(W / texImg.naturalWidth, H / texImg.naturalHeight);
          const texW = texImg.naturalWidth * texScale;
          const texH = texImg.naturalHeight * texScale;
          const texX = (W - texW) / 2;
          const texY = (H - texH) / 2;
          ctx.drawImage(texImg, texX, texY, texW, texH);
        } else {
          ctx.globalAlpha = 0.35;
          ctx.drawImage(texImg, 0, 0, W, H);
        }
        ctx.restore();
      }
    }
  }

  // 英语组件的装饰图形属于布局本身，不依赖人物素材。
  if (coverType === 'group' && isEnglishTitle(title)) {
    drawEnglishDecoration(ctx, color, W);
  }

  // 3. 存储标签（仅项目组，左上角）
  if (coverType === 'group' && showStorageTag) {
    drawStorageTag(ctx);
  }

  // 4. 封面文字
  drawTitle(ctx, state, layout);

  // 5. 头图人物
  if (figureId && layout.figure && !(coverType === 'group' && isEnglishTitle(title))) {
    const figPath = findFigurePath(coverType, figureId);
    if (figPath) {
      const figImg = images.get(figPath);
      if (figImg && figImg.complete && figImg.naturalWidth > 0) {
        const fl = layout.figure;
        // 底部对齐：y 是底部坐标
        ctx.drawImage(figImg, fl.x, fl.y - fl.height, fl.width, fl.height);
      }
    }
  }

  ctx.restore();
}

/** 绘制存储标签 */
function drawStorageTag(ctx: CanvasRenderingContext2D) {
  // Figma 组件：x=26、y=26、116×57，圆角 20；文字内边距 24/6。
  const tagX = 26;
  const tagY = 26;
  const tagW = 116;
  const tagH = 57;

  ctx.save();
  // 标签背景
  ctx.fillStyle = '#353E42';
  ctx.beginPath();
  ctx.roundRect(tagX, tagY, tagW, tagH, 20);
  ctx.fill();

  // 标签文字
  ctx.fillStyle = '#fff';
  ctx.font = '500 34px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('存储', tagX + 24, tagY + 6);
  ctx.restore();
}

/** 英语组件中的浅色装饰背景（Figma 中为布局自带图形，不是人物素材）。 */
function drawEnglishDecoration(
  ctx: CanvasRenderingContext2D,
  color: CoverColorName,
  width: number,
) {
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = coverColors[color][3];
  ctx.font = `700 200px "${FONT_FAMILIES.groupTitle}", "PingFang SC", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('ABCDEFGHIJKLMNOPQRSTUVWXYZ', width / 2, 52);
  ctx.fillText('ABCDEFGHIJKLMNOPQRSTUVWXYZ', width / 2, 252);

  // 用圆角块补足 Figma 英语组件中的抽象图形层，保持低对比度，避免压住标题。
  ctx.globalAlpha = 0.08;
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

/** 绘制标题 */
function drawTitle(
  ctx: CanvasRenderingContext2D,
  state: CoverPreviewState,
  layout: CoverLayout,
) {
  const { coverType, title } = state;
  if (!title) return;

  const tl = layout.text;
  const isEnglish = coverType === 'group' && isEnglishTitle(title);

  if (coverType === 'group' && isEnglish) {
    drawEnglishTitle(ctx, title);
    return;
  }

  // 选择字体
  let fontFamily: string;
  if (isEnglish) {
    fontFamily = FONT_FAMILIES.englishTitle;
  } else if (coverType === 'project') {
    fontFamily = FONT_FAMILIES.projectTitle;
  } else {
    fontFamily = FONT_FAMILIES.groupTitle;
  }

  ctx.save();

  // 2c: 项目封面文字固定白色
  ctx.fillStyle = coverType === 'project' ? '#FFFFFF' : getTextColor(state.color);

  // 2g: 项目封面 font-weight 为 normal
  const weight = coverType === 'project' ? 'normal' : '700';
  ctx.font = `${weight} ${tl.fontSize}px "${fontFamily}", "PingFang SC", sans-serif`;
  ctx.textAlign = tl.align;
  ctx.textBaseline = tl.vAlign === 'middle' ? 'middle' : 'top';

  // 2d: 项目封面文字阴影
  if (coverType === 'project' && tl.shadow) {
    ctx.shadowOffsetX = tl.shadow.offsetX;
    ctx.shadowOffsetY = tl.shadow.offsetY;
    ctx.shadowBlur = tl.shadow.blur;
    ctx.shadowColor = tl.shadow.color;
  }

  // 不接受手动换行；布局只根据标题宽度自动换行。
  const normalizedTitle = title.replace(/[\r\n]/g, '');
  const lines = wrapText(ctx, normalizedTitle, tl.maxWidth, tl.letterSpacing ?? 0);
  const startY = tl.vAlign === 'middle'
    ? tl.y - ((lines.length - 1) * tl.lineHeight) / 2
    : tl.y;

  // Figma letter-spacing 通过逐字符绘制还原。
  if (tl.letterSpacing && tl.letterSpacing > 0) {
    const ls = tl.letterSpacing;
    ctx.textAlign = 'left';
    lines.forEach((line, i) => {
      const lineY = startY + i * tl.lineHeight;
      // 计算每个字符宽度
      const charWidths = [...line].map((ch) => ctx.measureText(ch).width);
      const totalWidth = charWidths.reduce((s, w) => s + w, 0) + (line.length - 1) * ls;

      let startX: number;
      if (tl.align === 'center') {
        startX = tl.x - totalWidth / 2;
      } else if (tl.align === 'right') {
        startX = tl.x - totalWidth;
      } else {
        startX = tl.x;
      }

      let curX = startX;
      for (let ci = 0; ci < line.length; ci++) {
        ctx.fillText(line[ci], curX, lineY);
        curX += charWidths[ci] + ls;
      }
    });
    ctx.textAlign = tl.align;
  } else {
    lines.forEach((line, i) => {
      ctx.fillText(line, tl.x, startY + i * tl.lineHeight, tl.maxWidth);
    });
  }

  // 清除 shadow，避免影响后续图层
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 0;
  ctx.shadowColor = '';

  ctx.restore();
}

/** 绘制英语专属标题：可选 1 个中文前缀 + L1/L2。 */
function drawEnglishTitle(ctx: CanvasRenderingContext2D, title: string) {
  const match = title.trim().match(/^([\u4e00-\u9fff])?\s*(L\d+)$/i);
  if (!match) return;

  const prefix = match[1] ?? '';
  const level = match[2].toUpperCase();
  const centerX = 675 / 2;
  const centerY = 215;
  const gap = prefix ? 12 : 0;

  ctx.save();
  ctx.fillStyle = '#FFFFFF';
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

/** 获取文字颜色 */
function getTextColor(color: CoverColorName): string {
  return coverColors[color][6];
}

/** 文本自动换行 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  letterSpacing = 0,
): string[] {
  const lines: string[] = [];
  let currentLine = '';

  for (const char of text) {
    const testLine = currentLine + char;
    const metrics = measureLineWidth(ctx, testLine, letterSpacing);
    if (metrics > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

function measureLineWidth(
  ctx: CanvasRenderingContext2D,
  line: string,
  letterSpacing: number,
): number {
  if (!letterSpacing || line.length < 2) return ctx.measureText(line).width;
  return [...line].reduce((total, char) => total + ctx.measureText(char).width, 0)
    + (line.length - 1) * letterSpacing;
}

/** 查找人物素材路径 */
function findFigurePath(coverType: 'project' | 'group', figureId: string): string | null {
  const categories = coverType === 'project' ? projectFigureCategories : groupFigureCategories;
  for (const cat of categories) {
    const fig = cat.figures.find((f) => f.id === figureId);
    if (fig) return fig.path;
  }
  return null;
}

/** 收集所有需要加载的图片路径 */
export function collectImagePaths(state: CoverPreviewState): string[] {
  const paths: string[] = [];
  const { textureId, figureId, coverType, title } = state;

  if (textureId) {
    const tex = textures.find((t) => t.id === textureId);
    if (tex) paths.push(tex.path);
  }

  if (figureId && !(coverType === 'group' && isEnglishTitle(title))) {
    const figPath = findFigurePath(coverType, figureId);
    if (figPath) paths.push(figPath);
  }

  return paths;
}

/** 加载单张图片 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export const CoverPreview = forwardRef<CoverPreviewHandle, CoverPreviewProps>(
  ({ state }, ref) => {
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

        const canvasSize =
          state.coverType === 'project' ? CANVAS_SIZE.project : CANVAS_SIZE.group;
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 加载所需图片
        const paths = collectImagePaths(state);
        const loadPromises = paths
          .filter((p) => !imagesRef.current.has(p))
          .map(async (p) => {
            try {
              const img = await loadImage(p);
              imagesRef.current.set(p, img);
            } catch {
              // 图片加载失败，忽略
            }
          });

        await Promise.all(loadPromises);
        if (cancelled) return;

        // 清空并重绘
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCover(ctx, state, imagesRef.current);
      };

      render();
      return () => { cancelled = true; };
    }, [state]);

    const canvasSize =
      state.coverType === 'project' ? CANVAS_SIZE.project : CANVAS_SIZE.group;

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
