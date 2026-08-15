/**
 * 布局自动匹配工具
 * 根据字数、布局方向和特殊标题标识选择项目组布局。
 */

import { groupLayouts, projectLayout, type CoverLayout } from '../tokens/layouts';

export type LayoutDirection = 'left-image' | 'right-image';

export interface SpecialGroupTitle {
  prefix: string;
  level: string;
  normalized: string;
}

const SPECIAL_GROUP_TITLE_PATTERN = /^(新)?([A-Za-z])([0-9])$/;

/**
 * 解析项目组特殊标题：一个 ASCII 字母 + 一个数字，可选“新”前缀。
 * 首尾空格由 trim 忽略，内部空格和多位数字不会匹配。
 */
export function parseSpecialGroupTitle(title: string): SpecialGroupTitle | null {
  const match = title.trim().match(SPECIAL_GROUP_TITLE_PATTERN);
  if (!match) return null;

  const prefix = match[1] ?? '';
  const level = `${match[2].toUpperCase()}${match[3]}`;
  return {
    prefix,
    level,
    normalized: `${prefix}${level}`,
  };
}

/** 判断项目组标题是否为特殊布局标题（如 L1、A2、新L1） */
export function isEnglishTitle(title: string): boolean {
  return parseSpecialGroupTitle(title) !== null;
}

/** 获取有效字数（英语标题返回 2，其他返回非空字符数） */
export function getEffectiveCharCount(title: string): number {
  if (isEnglishTitle(title)) return 2;
  // 统计所有非空字符（中文、英文、数字均计入）
  return title.replace(/\s/g, '').length;
}

/** 根据字数匹配布局档位 */
function matchSizeBucket(charCount: number): '7-8' | '5-6' | '4' | '3' | '2' | 'big' {
  if (charCount <= 0) return 'big';
  if (charCount === 1) return '2'; // 1字兜底用2字布局
  if (charCount === 2) return '2';
  if (charCount === 3) return '3';
  if (charCount === 4) return '4';
  if (charCount <= 6) return '5-6';
  if (charCount <= 8) return '7-8';
  return 'big'; // 超长文字用大字布局
}

/** 匹配项目组布局 */
export function matchGroupLayout(
  title: string,
  direction: LayoutDirection,
): CoverLayout {
  // 英语标题优先
  if (isEnglishTitle(title)) {
    return groupLayouts.find((l) => l.id === 'english-2') ?? groupLayouts[0];
  }

  const charCount = getEffectiveCharCount(title);
  const bucket = matchSizeBucket(charCount);

  // 在指定方向中寻找匹配布局
  const candidates = groupLayouts.filter((l) => l.direction === direction);

  const bucketToIdSuffix: Record<string, string> = {
    '7-8': '7-8',
    '5-6': '5-6',
    '4': '4',
    '3': '3',
    '2': '2',
    'big': 'big',
  };

  const suffix = bucketToIdSuffix[bucket];
  const matched = candidates.find((l) => l.id.endsWith(`-${suffix}`));

  return matched ?? candidates[0] ?? groupLayouts[0];
}

/** 获取项目封面布局 */
export function getProjectLayout(): CoverLayout {
  return projectLayout;
}

/** 根据封面类型和参数获取最终布局 */
export function resolveLayout(
  coverType: 'project' | 'group',
  title: string,
  direction: LayoutDirection,
): CoverLayout {
  if (coverType === 'project') {
    return getProjectLayout();
  }
  return matchGroupLayout(title, direction);
}
