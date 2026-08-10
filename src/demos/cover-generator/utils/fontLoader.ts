/**
 * 字体异步加载工具
 * 使用 FontFace API 加载自定义字体，确保 Canvas 绘制前字体就绪
 */

import { FONT_PATHS, FONT_FAMILIES } from '../tokens/assets';

export interface FontLoadStatus {
  projectTitle: boolean;
  groupTitle: boolean;
  englishTitle: boolean;
}

const loaded: FontLoadStatus = {
  projectTitle: false,
  groupTitle: false,
  englishTitle: false,
};

async function loadFont(family: string, url: string): Promise<boolean> {
  if (typeof FontFace === 'undefined') {
    console.warn(`[fontLoader] FontFace API 不可用，跳过字体加载: ${family}`);
    return false;
  }
  try {
    const fontFace = new FontFace(family, `url(${url})`);
    await fontFace.load();
    document.fonts.add(fontFace);
    return true;
  } catch (err) {
    console.warn(`[fontLoader] 字体加载失败: ${family}`, err);
    return false;
  }
}

/** 加载所有封面字体 */
export async function loadCoverFonts(): Promise<FontLoadStatus> {
  const results = await Promise.all([
    loadFont(FONT_FAMILIES.projectTitle, FONT_PATHS.projectTitle),
    loadFont(FONT_FAMILIES.groupTitle, FONT_PATHS.groupTitle),
    loadFont(FONT_FAMILIES.englishTitle, FONT_PATHS.englishTitle),
  ]);

  loaded.projectTitle = results[0];
  loaded.groupTitle = results[1];
  loaded.englishTitle = results[2];

  return { ...loaded };
}

/** 检查字体是否已加载 */
export function isFontLoaded(key: keyof FontLoadStatus): boolean {
  return loaded[key];
}

/** 等待字体就绪（使用 document.fonts.ready） */
export async function waitForFontsReady(): Promise<void> {
  await document.fonts.ready;
}
