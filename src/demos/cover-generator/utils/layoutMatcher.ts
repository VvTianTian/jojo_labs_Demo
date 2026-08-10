/**
 * 布局自动匹配工具
 * 根据字数、布局方向和英语标识选择 12 套布局之一
 */

import { groupLayouts, projectLayout, type CoverLayout } from '../tokens/layouts';

export type LayoutDirection = 'left-image' | 'right-image';

/** 判断项目组标题是否为英语类型（如 L1、L2、新L1） */
export function isEnglishTitle(title: string): boolean {
  const trimmed = title.trim();
  if (trimmed.length === 0) return false;
  // 纯 L + 数字
  if (/^L\d+$/i.test(trimmed)) return true;
  // 中文前缀（最多1字） + 可选空格 + L + 数字，如「新L1」「新 L2」
  if (/^[\u4e00-\u9fff][ ]?L\d+$/i.test(trimmed)) return true;
  return false;
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
