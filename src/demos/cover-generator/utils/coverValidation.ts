import type { CoverType } from '../types';
import { getEffectiveCharCount, isEnglishTitle } from './layoutMatcher';

export interface CoverTitleValidation {
  isValid: boolean;
  isEmpty: boolean;
  isEnglish: boolean;
  charCount: number;
  message: string;
}

export function normalizeCoverTitle(value: string): string {
  return value.replace(/[\r\n]/g, '').trim();
}

export function validateCoverTitle(
  coverType: CoverType,
  rawTitle: string,
): CoverTitleValidation {
  const title = normalizeCoverTitle(rawTitle);
  const isEmpty = title.length === 0;
  const isEnglish = coverType === 'group' && isEnglishTitle(title);
  const charCount = getEffectiveCharCount(title);

  if (isEmpty) {
    return {
      isValid: false,
      isEmpty: true,
      isEnglish: false,
      charCount: 0,
      message: coverType === 'project' ? '请输入 2 个中文字' : '请输入标题',
    };
  }

  if (coverType === 'project') {
    const validProjectTitle = /^[\u4e00-\u9fff]{2}$/.test(title);
    return {
      isValid: validProjectTitle,
      isEmpty: false,
      isEnglish: false,
      charCount,
      message: validProjectTitle ? '项目封面 · 2 字构图' : '项目封面标题需为 2 个中文字',
    };
  }

  if (isEnglish) {
    return {
      isValid: true,
      isEmpty: false,
      isEnglish: true,
      charCount: 2,
      message: '特殊标题布局 · 自动隐藏角色',
    };
  }

  const validGroupTitle = /^[\u4e00-\u9fff]{1,8}$/.test(title);
  return {
    isValid: validGroupTitle,
    isEmpty: false,
    isEnglish: false,
    charCount,
    message: validGroupTitle
      ? '项目组封面 · 按字数自动匹配布局'
      : '项目组标题需为 1–8 个中文字，或使用 A1 / 新A1 格式',
  };
}
