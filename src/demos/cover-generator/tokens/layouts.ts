/**
 * 封面布局配置
 *
 * 项目组封面（675×384）：12 套布局
 * - 左图右文：7~8字、5~6字、4字、3字、2字、1行大字
 * - 左文右图：7~8字、5~6字、4字、3字、2字
 * - 英语：2字（新 L1 形式）
 *
 * 项目封面（640×360）：1 套布局
 */

export interface TextLayout {
  /** 文字块 X 坐标（相对画布） */
  x: number;
  /** 文字块 Y 坐标（相对画布） */
  y: number;
  /** 文字块最大宽度 */
  maxWidth: number;
  /** 字号 */
  fontSize: number;
  /** 行高 */
  lineHeight: number;
  /** 对齐方式 */
  align: CanvasTextAlign;
  /** 是否垂直居中（相对于 y 为中线） */
  vAlign?: 'middle' | 'top';
  /** 字间距 */
  letterSpacing?: number;
  /** 文字阴影 */
  shadow?: { offsetX: number; offsetY: number; blur: number; color: string };
}

export interface FigureLayout {
  /** 人物图 X 坐标 */
  x: number;
  /** 人物图 Y 坐标（底部对齐） */
  y: number;
  /** 人物图渲染宽度 */
  width: number;
  /** 人物图渲染高度 */
  height: number;
}

export interface CoverLayout {
  id: string;
  label: string;
  direction: 'left-image' | 'right-image' | 'english' | 'project';
  text: TextLayout;
  /** 英语和 1 行大字组件没有人物素材 */
  figure?: FigureLayout;
}

// ============================================================================
// 项目组封面画布尺寸
// ============================================================================
const GW = 675;
const GH = 384;

// ============================================================================
// 左图右文布局（6 套）
// ============================================================================

const LEFT_IMAGE_RIGHT_TEXT_7_8: CoverLayout = {
  id: 'left-image-7-8',
  label: '左图右文 · 7~8字',
  direction: 'left-image',
  // Figma: text box x=273, width=320, right aligned; figure x=50, y=41, 223×303.
  text: { x: 593, y: 92, maxWidth: 320, fontSize: 80, lineHeight: 100, align: 'right', vAlign: 'top' },
  figure: { x: 50, y: 344, width: 223, height: 303 },
};

const LEFT_IMAGE_RIGHT_TEXT_5_6: CoverLayout = {
  id: 'left-image-5-6',
  label: '左图右文 · 5~6字',
  direction: 'left-image',
  // Figma: text box x=302, width=248, right aligned; figure x=84, y=40, 223×303.
  text: { x: 550, y: 92, maxWidth: 248, fontSize: 80, lineHeight: 100, align: 'right', vAlign: 'top' },
  figure: { x: 84, y: 343, width: 223, height: 303 },
};

const LEFT_IMAGE_RIGHT_TEXT_4: CoverLayout = {
  id: 'left-image-4',
  label: '左图右文 · 4字',
  direction: 'left-image',
  // Figma: text box x=346, y=80, width=210; figure x=106, y=40, 223×303.
  text: { x: 346, y: 80, maxWidth: 210, fontSize: 100, lineHeight: 116, align: 'left', vAlign: 'top' },
  figure: { x: 106, y: 343, width: 223, height: 303 },
};

const LEFT_IMAGE_RIGHT_TEXT_3: CoverLayout = {
  id: 'left-image-3',
  label: '左图右文 · 3字',
  direction: 'left-image',
  // Figma: text box x=259, y=134, width=328; figure x=50, y=52, 223×303.
  text: { x: 259, y: 134, maxWidth: 328, fontSize: 100, lineHeight: 116, align: 'left', vAlign: 'top', letterSpacing: 10 },
  figure: { x: 50, y: 355, width: 223, height: 303 },
};

const LEFT_IMAGE_RIGHT_TEXT_2: CoverLayout = {
  id: 'left-image-2',
  label: '左图右文 · 2字',
  direction: 'left-image',
  // Figma: text box x=294, y=139, width=258; figure x=90, y=48, 223×303.
  text: { x: 294, y: 139, maxWidth: 258, fontSize: 120, lineHeight: 139, align: 'left', vAlign: 'top', letterSpacing: 10 },
  figure: { x: 90, y: 351, width: 223, height: 303 },
};

const LEFT_IMAGE_RIGHT_TEXT_BIG: CoverLayout = {
  id: 'left-image-big',
  label: '左图右文 · 1行大字',
  direction: 'left-image',
  // Figma: full-width one-line text frame, no figure instance.
  text: { x: GW / 2, y: 55, maxWidth: GW, fontSize: 320, lineHeight: 300, align: 'center', vAlign: 'top', letterSpacing: 20 },
};

// ============================================================================
// 左文右图布局（5 套）
// ============================================================================

const RIGHT_IMAGE_LEFT_TEXT_7_8: CoverLayout = {
  id: 'right-image-7-8',
  label: '左文右图 · 7~8字',
  direction: 'right-image',
  // Figma: text box x=89, width=320, right aligned; figure x=398, y=41, 223×303.
  text: { x: 409, y: 92, maxWidth: 320, fontSize: 80, lineHeight: 100, align: 'right', vAlign: 'top' },
  figure: { x: 398, y: 344, width: 223, height: 303 },
};

const RIGHT_IMAGE_LEFT_TEXT_5_6: CoverLayout = {
  id: 'right-image-5-6',
  label: '左文右图 · 5~6字',
  direction: 'right-image',
  // Figma: text box x=128, width=248, right aligned; figure x=375, y=40, 223×303.
  text: { x: 376, y: 92, maxWidth: 248, fontSize: 80, lineHeight: 100, align: 'right', vAlign: 'top' },
  figure: { x: 375, y: 343, width: 223, height: 303 },
};

const RIGHT_IMAGE_LEFT_TEXT_4: CoverLayout = {
  id: 'right-image-4',
  label: '左文右图 · 4字',
  direction: 'right-image',
  // Figma: text box x=154, y=80, width=210; figure x=355, y=40, 223×303.
  text: { x: 154, y: 80, maxWidth: 210, fontSize: 100, lineHeight: 116, align: 'left', vAlign: 'top' },
  figure: { x: 355, y: 343, width: 223, height: 303 },
};

const RIGHT_IMAGE_LEFT_TEXT_3: CoverLayout = {
  id: 'right-image-3',
  label: '左文右图 · 3字',
  direction: 'right-image',
  // Figma: text box x=84, y=134, width=328; figure x=381, y=40, 223×303.
  text: { x: 84, y: 134, maxWidth: 328, fontSize: 100, lineHeight: 116, align: 'left', vAlign: 'top', letterSpacing: 10 },
  figure: { x: 381, y: 343, width: 223, height: 303 },
};

const RIGHT_IMAGE_LEFT_TEXT_2: CoverLayout = {
  id: 'right-image-2',
  label: '左文右图 · 2字',
  direction: 'right-image',
  // Figma: text box x=119, y=139, width=258; figure x=347, y=48, 223×303.
  text: { x: 119, y: 139, maxWidth: 258, fontSize: 120, lineHeight: 139, align: 'left', vAlign: 'top', letterSpacing: 10 },
  figure: { x: 347, y: 351, width: 223, height: 303 },
};

// ============================================================================
// 英语布局（1 套）
// ============================================================================

const ENGLISH_2: CoverLayout = {
  id: 'english-2',
  label: '英语 · 2字（新L1）',
  direction: 'english',
  // Figma: foreground text frame x=0, y=65, width=675, height=300; no figure.
  text: { x: GW / 2, y: 65, maxWidth: GW, fontSize: 320, lineHeight: 300, align: 'center', vAlign: 'top', letterSpacing: 20 },
};

// ============================================================================
// 项目封面布局（1 套）
// ============================================================================

// ============================================================================
// 项目封面画布尺寸
// ============================================================================
const PW = 640;
const PH = 360;

const PROJECT_LAYOUT: CoverLayout = {
  id: 'project',
  label: '项目封面',
  direction: 'project',
  text: {
    x: PW / 2,        // 320 居中
    y: PH / 2,        // 180 居中
    maxWidth: 600,     // 280px字号+20px间距，2字需约600px
    fontSize: 280,     // 设计稿 280px（原来是 80）
    lineHeight: 320,   // 约1.14倍（原来是 96）
    align: 'center',
    vAlign: 'middle',
    letterSpacing: 20, // 新增：设计稿 20px
    shadow: { offsetX: 0, offsetY: 4, blur: 50, color: 'rgba(190,171,148,0.25)' }, // 新增
  },
  figure: {
    x: 54,      // 设计稿 left:54（原来是 380）
    y: 342,     // top:42 + height:300 = 342（原来是 360）
    width: 531,  // 设计稿 531（原来是 260）
    height: 300, // 设计稿 300（原来是 280）
  },
};

// ============================================================================
// 导出
// ============================================================================

/** 项目组封面布局（12 套） */
export const groupLayouts: CoverLayout[] = [
  LEFT_IMAGE_RIGHT_TEXT_7_8,
  LEFT_IMAGE_RIGHT_TEXT_5_6,
  LEFT_IMAGE_RIGHT_TEXT_4,
  LEFT_IMAGE_RIGHT_TEXT_3,
  LEFT_IMAGE_RIGHT_TEXT_2,
  LEFT_IMAGE_RIGHT_TEXT_BIG,
  RIGHT_IMAGE_LEFT_TEXT_7_8,
  RIGHT_IMAGE_LEFT_TEXT_5_6,
  RIGHT_IMAGE_LEFT_TEXT_4,
  RIGHT_IMAGE_LEFT_TEXT_3,
  RIGHT_IMAGE_LEFT_TEXT_2,
  ENGLISH_2,
];

/** 项目封面布局 */
export const projectLayout: CoverLayout = PROJECT_LAYOUT;

/** 按方向筛选布局 */
export function getGroupLayoutsByDirection(direction: 'left-image' | 'right-image') {
  return groupLayouts.filter((l) => l.direction === direction);
}

/** 画布尺寸常量 */
export const CANVAS_SIZE = {
  project: { width: 640, height: 360 },
  group: { width: GW, height: GH },
} as const;
