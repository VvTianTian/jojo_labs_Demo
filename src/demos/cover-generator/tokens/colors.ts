/**
 * 封面生成器颜色 Token
 * 来源：Figma 色板（已过滤废弃 Token）
 * 15 个色系 × 6 阶
 */

export interface CoverColorScale {
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
}

export type CoverColorLevel = keyof CoverColorScale;

export type CoverColorName =
  | 'yellow'
  | 'orange'
  | 'red'
  | 'pink'
  | 'purple'
  | 'englishPurple'
  | 'brown'
  | 'integrate'
  | 'blue'
  | 'cyan'
  | 'green'
  | 'grass'
  | 'gray'
  | 'proBlue'
  | 'proGray';

export const coverColorLabels: Record<CoverColorName, string> = {
  yellow: '黄',
  orange: '橙',
  red: '红',
  pink: '粉',
  purple: '紫',
  englishPurple: '英语紫',
  brown: '棕',
  integrate: '综合',
  blue: '蓝',
  cyan: '青',
  green: '绿',
  grass: '草',
  gray: '灰',
  proBlue: '专业蓝',
  proGray: '专业灰',
};

export const coverColors: Record<CoverColorName, CoverColorScale> = {
  yellow:        { 1: '#fcf9de', 2: '#fcf3ba', 3: '#ffeb6b', 4: '#fcda00', 5: '#dbaf00', 6: '#544300' },
  orange:        { 1: '#fff3eb', 2: '#ffebde', 3: '#ffa66b', 4: '#ff9045', 5: '#e35b00', 6: '#6b2d03' },
  red:           { 1: '#fff2f0', 2: '#ffe2de', 3: '#ff9c8c', 4: '#ff715c', 5: '#cc2f16', 6: '#781a0c' },
  pink:          { 1: '#fff0f3', 2: '#ffdbe4', 3: '#ff9eb5', 4: '#ff7a99', 5: '#cc2d52', 6: '#780a23' },
  purple:        { 1: '#f9f5ff', 2: '#f3ebfc', 3: '#c8a0fa', 4: '#ae84e3', 5: '#8d4bde', 6: '#4e2680' },
  englishPurple: { 1: '#f7f5ff', 2: '#f0edff', 3: '#afa0fa', 4: '#9484e3', 5: '#644bde', 6: '#2f2270' },
  brown:         { 1: '#fef7e5', 2: '#f0dcc2', 3: '#e0bf94', 4: '#C09660', 5: '#986c31', 6: '#664314' },
  integrate:     { 1: '#fcf9de', 2: '#fcf3ba', 3: '#ffd21f', 4: '#f5c400', 5: '#c29800', 6: '#544300' },
  blue:          { 1: '#ebf9ff', 2: '#dbf3ff', 3: '#87d7ff', 4: '#33bbff', 5: '#0090d9', 6: '#0c567a' },
  cyan:          { 1: '#edfbfc', 2: '#c2f8fc', 3: '#7fe2eb', 4: '#00c2d4', 5: '#009aa8', 6: '#00484f' },
  green:         { 1: '#effaeb', 2: '#d2f7c6', 3: '#a0d98d', 4: '#5dc43b', 5: '#4aa12d', 6: '#155200' },
  grass:         { 1: '#fbfce8', 2: '#f2f7b2', 3: '#e9f283', 4: '#c7d440', 5: '#a9b52d', 6: '#3d4200' },
  gray:          { 1: '#fafafa', 2: '#f5f4f4', 3: '#e0dfdf', 4: '#b2b2b2', 5: '#666666', 6: '#404040' },
  proBlue:       { 1: '#eef4fe', 2: '#c7dafe', 3: '#7faaff', 4: '#528bff', 5: '#316ce3', 6: '#002265' },
  proGray:       { 1: '#f5f8fd', 2: '#e1e8f7', 3: '#b2bed6', 4: '#919fb9', 5: '#57637c', 6: '#1f284d' },
};

/** 获取所有色系名称列表 */
export const coverColorNames = Object.keys(coverColors) as CoverColorName[];

export type CoverColorId = string;

export interface CoverColorOption {
  id: CoverColorId;
  family: CoverColorName;
  familyLabel: string;
  step: CoverColorLevel;
  hex: string;
  /** 完全相同的色值在其他色系中的别名，不重复渲染为选择入口。 */
  aliases: string[];
}

const COLOR_LEVELS: CoverColorLevel[] = [1, 2, 3, 4, 5, 6];

/**
 * 将 15×6 色板展开为具体颜色，并按十六进制值合并完全重复项。
 * 近似但不同的颜色保留，避免误删主题语义。
 */
function buildCoverColorOptions(): CoverColorOption[] {
  const byHex = new Map<string, CoverColorOption>();

  coverColorNames.forEach((family) => {
    COLOR_LEVELS.forEach((step) => {
      const hex = coverColors[family][step].toUpperCase();
      const sourceLabel = `${coverColorLabels[family]} ${step}`;
      const existing = byHex.get(hex);

      if (existing) {
        existing.aliases.push(sourceLabel);
        return;
      }

      byHex.set(hex, {
        id: `${family}-${step}`,
        family,
        familyLabel: coverColorLabels[family],
        step,
        hex,
        aliases: [],
      });
    });
  });

  return [...byHex.values()];
}

export const coverColorOptions = buildCoverColorOptions();

export const coverColorOptionsByFamily: Record<CoverColorName, CoverColorOption[]> =
  coverColorNames.reduce((result, family) => {
    result[family] = coverColorOptions.filter((option) => option.family === family);
    return result;
  }, {} as Record<CoverColorName, CoverColorOption[]>);

const coverColorOptionsById = new Map(
  coverColorOptions.map((option) => [option.id, option]),
);

export function getCoverColorOption(id: CoverColorId): CoverColorOption {
  return coverColorOptionsById.get(id) ?? coverColorOptions[0];
}

export function getCoverColorHex(id: CoverColorId): string {
  return getCoverColorOption(id).hex;
}

export interface TextColorOption {
  id: string;
  label: string;
  hex: string;
  source?: string;
}

/** 大字号标题使用 WCAG 大文本的最低对比度门槛。 */
export const TEXT_CONTRAST_THRESHOLD = 3;

const WHITE_TEXT: TextColorOption = { id: 'white', label: '白色', hex: '#FFFFFF' };
const INK_TEXT: TextColorOption = { id: 'ink', label: '深灰', hex: '#353E42', source: '基础色' };

function channelToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const normalized = hex.replace('#', '');
  const red = channelToLinear(Number.parseInt(normalized.slice(0, 2), 16));
  const green = channelToLinear(Number.parseInt(normalized.slice(2, 4), 16));
  const blue = channelToLinear(Number.parseInt(normalized.slice(4, 6), 16));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(first: string, second: string): number {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

const DARK_PALETTE_TEXT_OPTIONS: TextColorOption[] = coverColorNames.map((family) => ({
  id: `text-${family}`,
  label: `${coverColorLabels[family]}深色`,
  hex: coverColors[family][6].toUpperCase(),
  source: `色板 ${coverColorLabels[family]} 6`,
}));

const ALL_TEXT_COLOR_OPTIONS: TextColorOption[] = [
  WHITE_TEXT,
  INK_TEXT,
  ...DARK_PALETTE_TEXT_OPTIONS,
];

/** 返回文字颜色选择器中的颜色：白色始终保留，其余只展示推荐颜色。 */
export function getTextColorOptions(backgroundColorId: CoverColorId): TextColorOption[] {
  const background = getCoverColorHex(backgroundColorId);

  const seen = new Set<string>();
  return ALL_TEXT_COLOR_OPTIONS.filter((option) => {
    const isWhite = option.id === WHITE_TEXT.id;
    if (!isWhite && contrastRatio(background, option.hex) < TEXT_CONTRAST_THRESHOLD) {
      return false;
    }
    if (seen.has(option.hex)) return false;
    seen.add(option.hex);
    return true;
  });
}

/** 获取当前背景下对比度最高的推荐字色。 */
export function getRecommendedTextColorOption(backgroundColorId: CoverColorId): TextColorOption {
  const background = getCoverColorHex(backgroundColorId);
  const safeOptions = ALL_TEXT_COLOR_OPTIONS.filter(
    (option) => contrastRatio(background, option.hex) >= TEXT_CONTRAST_THRESHOLD,
  );

  return safeOptions.reduce<TextColorOption | undefined>((best, option) => {
    if (!best) return option;
    return contrastRatio(background, option.hex) > contrastRatio(background, best.hex)
      ? option
      : best;
  }, undefined) ?? WHITE_TEXT;
}

export function getTextColorHex(
  backgroundColorId: CoverColorId,
  textColorId: string,
): string {
  const match = ALL_TEXT_COLOR_OPTIONS.find((option) => option.id === textColorId);
  return match?.hex ?? getRecommendedTextColorOption(backgroundColorId).hex;
}

export function isTextColorContrastSufficient(
  backgroundColorId: CoverColorId,
  textColorId: string,
): boolean {
  return contrastRatio(
    getCoverColorHex(backgroundColorId),
    getTextColorHex(backgroundColorId, textColorId),
  ) >= TEXT_CONTRAST_THRESHOLD;
}

/** 获取所有色系名称列表 */
/** 获取指定色系的背景色（默认使用第1阶） */
export function getCoverBgColor(name: CoverColorName): string {
  return coverColors[name][1];
}

/** 获取文字颜色（使用第6阶深色） */
export function getCoverTextColor(name: CoverColorName): string {
  return coverColors[name][6];
}
