import type { LayoutDirection } from './utils/layoutMatcher';
import type { CoverColorId } from './tokens/colors';

export type CoverType = 'project' | 'group';
export type ExportScale = 1 | 2;

/** 当前页面内存中的封面配置，不与后端或 JOJOLabs 数据绑定。 */
export interface CoverDraft {
  coverType: CoverType;
  title: string;
  direction: LayoutDirection;
  showStorageTag: boolean;
  backgroundColorId: CoverColorId;
  textColorId: string;
  textureId: string;
  figureId: string;
}
