/**
 * 封面素材清单配置
 * 基于 public/cover-generator/assets/ 下的实际文件
 */

const BASE = '/cover-generator/assets';

// ============================================================================
// 背景纹理
// ============================================================================

export interface TextureAsset {
  id: string;
  name: string;
  path: string;
}

export const textures: TextureAsset[] = [
  { id: 'tex-cloth-frame', name: '布面纹+框', path: `${BASE}/textures/背景纹理=布面纹+框.png` },
  { id: 'tex-cloth',       name: '布面纹',     path: `${BASE}/textures/背景纹理=布面纹.png` },
  { id: 'tex-stripe',      name: '条纹',       path: `${BASE}/textures/背景纹理=条纹.png` },
  { id: 'tex-wave',        name: '水波纹',     path: `${BASE}/textures/背景纹理=水波纹.png` },
  { id: 'tex-dot',         name: '点状暗角',   path: `${BASE}/textures/背景纹理=点状暗角.png` },
  { id: 'tex-paper',       name: '纸张纹理',   path: `${BASE}/textures/背景纹理=纸张纹理.png` },
  { id: 'tex-grid-paper',  name: '网格纸纹理', path: `${BASE}/textures/背景纹理=网格纸纹理.png` },
];

// ============================================================================
// 人物素材
// ============================================================================

export interface FigureAsset {
  id: string;
  name: string;
  path: string;
}

export interface FigureCategory {
  id: string;
  name: string;
  figures: FigureAsset[];
}

// ---------- 项目封面人物 ----------

const PROJECT_JIAOJIAO: FigureCategory = {
  id: 'project-jiaojiao-family',
  name: '叫叫家族',
  figures: [
    { id: 'pj-1',  name: '叫叫+铃铛+猪小弟', path: `${BASE}/project/jiaojiao-family/人物=叫叫+铃铛+猪小弟.png` },
    { id: 'pj-2',  name: '叫叫-买书',        path: `${BASE}/project/jiaojiao-family/人物=叫叫-买书.png` },
    { id: 'pj-3',  name: '叫叫-啦啦队',      path: `${BASE}/project/jiaojiao-family/人物=叫叫-啦啦队.png` },
    { id: 'pj-4',  name: '叫叫-恐龙',        path: `${BASE}/project/jiaojiao-family/人物=叫叫-恐龙.png` },
    { id: 'pj-5',  name: '叫叫-旋转',        path: `${BASE}/project/jiaojiao-family/人物=叫叫-旋转.png` },
    { id: 'pj-6',  name: '叫叫-画画',        path: `${BASE}/project/jiaojiao-family/人物=叫叫-画画.png` },
    { id: 'pj-7',  name: '叫叫-画笔',        path: `${BASE}/project/jiaojiao-family/人物=叫叫-画笔.png` },
    { id: 'pj-8',  name: '叫叫-礼物',        path: `${BASE}/project/jiaojiao-family/人物=叫叫-礼物.png` },
    { id: 'pj-9',  name: '叫叫-趴地上',      path: `${BASE}/project/jiaojiao-family/人物=叫叫-趴地上.png` },
    { id: 'pj-10', name: '叫叫画框',         path: `${BASE}/project/jiaojiao-family/人物=叫叫画框.png` },
    { id: 'pj-11', name: '猪小弟-吃包子',    path: `${BASE}/project/jiaojiao-family/人物=猪小弟-吃包子.png` },
    { id: 'pj-12', name: '猪小弟画框',       path: `${BASE}/project/jiaojiao-family/人物=猪小弟画框.png` },
    { id: 'pj-13', name: '铃铛-奖杯',        path: `${BASE}/project/jiaojiao-family/人物=铃铛-奖杯.png` },
    { id: 'pj-14', name: '铃铛画框',         path: `${BASE}/project/jiaojiao-family/人物=铃铛画框.png` },
  ],
};

const PROJECT_MIDDLE_HIGH: FigureCategory = {
  id: 'project-middle-high-school',
  name: '初中角色',
  figures: [
    { id: 'pm-1',  name: '勤练习-古装',           path: `${BASE}/project/middle-high-school/人物=勤练习-古装.png` },
    { id: 'pm-2',  name: '勤练习-课桌',           path: `${BASE}/project/middle-high-school/人物=勤练习-课桌.png` },
    { id: 'pm-3',  name: '艾改错-坐',             path: `${BASE}/project/middle-high-school/人物=艾改错-坐.png` },
    { id: 'pm-4',  name: '艾改错-拿花',           path: `${BASE}/project/middle-high-school/人物=艾改错-拿花.png` },
    { id: 'pm-5',  name: '董高分+勤练习',          path: `${BASE}/project/middle-high-school/人物=董高分+勤练习 1.png` },
    { id: 'pm-6',  name: '董高分+勤练习 2',        path: `${BASE}/project/middle-high-school/人物=董高分+勤练习 2.png` },
    { id: 'pm-7',  name: '董高分+勤练习+艾改错',   path: `${BASE}/project/middle-high-school/人物=董高分+勤练习+艾改错1.png` },
    { id: 'pm-8',  name: '董高分+艾改错',          path: `${BASE}/project/middle-high-school/人物=董高分+艾改错.png` },
    { id: 'pm-9',  name: '董高分-拿试卷',          path: `${BASE}/project/middle-high-school/人物=董高分-拿试卷.png` },
    { id: 'pm-10', name: '董高分-教鞭',            path: `${BASE}/project/middle-high-school/人物=董高分-教鞭.png` },
  ],
};

const PROJECT_THINKING: FigureCategory = {
  id: 'project-thinking-family',
  name: '思维家族',
  figures: [
    { id: 'pt-1',  name: '博士-超人',     path: `${BASE}/project/thinking-family/人物=博士-超人.png` },
    { id: 'pt-2',  name: '小豆苗',       path: `${BASE}/project/thinking-family/人物=小豆苗.png` },
    { id: 'pt-3',  name: '粉豆',         path: `${BASE}/project/thinking-family/人物=粉豆.png` },
    { id: 'pt-4',  name: '红豆',         path: `${BASE}/project/thinking-family/人物=红豆.png` },
    { id: 'pt-5',  name: '绿豆-恐龙',    path: `${BASE}/project/thinking-family/人物=绿豆-恐龙.png` },
    { id: 'pt-6',  name: '绿豆-打分',    path: `${BASE}/project/thinking-family/人物=绿豆-打分.png` },
    { id: 'pt-7',  name: '绿豆-拿东西',  path: `${BASE}/project/thinking-family/人物=绿豆-拿东西.png` },
    { id: 'pt-8',  name: '绿豆-拿笔',    path: `${BASE}/project/thinking-family/人物=绿豆-拿笔.png` },
    { id: 'pt-9',  name: '绿豆-拿纸笔',  path: `${BASE}/project/thinking-family/人物=绿豆-拿纸笔.png` },
    { id: 'pt-10', name: '绿豆-火箭',    path: `${BASE}/project/thinking-family/人物=绿豆-火箭.png` },
  ],
};

// ---------- 项目组封面人物 ----------

const GROUP_JIAOJIAO: FigureCategory = {
  id: 'group-jiaojiao-family',
  name: '叫叫家族',
  figures: [
    { id: 'gj-1',  name: '叫叫-交卷',     path: `${BASE}/group/jiaojiao-family/人物=叫叫-交卷.png` },
    { id: 'gj-2',  name: '叫叫-唱K',      path: `${BASE}/group/jiaojiao-family/人物=叫叫-唱K.png` },
    { id: 'gj-3',  name: '叫叫-思考',     path: `${BASE}/group/jiaojiao-family/人物=叫叫-思考.png` },
    { id: 'gj-4',  name: '叫叫-手指',     path: `${BASE}/group/jiaojiao-family/人物=叫叫-手指.png` },
    { id: 'gj-5',  name: '叫叫-招手',     path: `${BASE}/group/jiaojiao-family/人物=叫叫-招手.png` },
    { id: 'gj-6',  name: '叫叫-挥笔',     path: `${BASE}/group/jiaojiao-family/人物=叫叫-挥笔.png` },
    { id: 'gj-7',  name: '叫叫-期待',     path: `${BASE}/group/jiaojiao-family/人物=叫叫-期待.png` },
    { id: 'gj-8',  name: '叫叫-滑板车',   path: `${BASE}/group/jiaojiao-family/人物=叫叫-滑板车.png` },
    { id: 'gj-9',  name: '叫叫-激动',     path: `${BASE}/group/jiaojiao-family/人物=叫叫-激动.png` },
    { id: 'gj-10', name: '叫叫-灵感',     path: `${BASE}/group/jiaojiao-family/人物=叫叫-灵感.png` },
    { id: 'gj-11', name: '叫叫-画笔',     path: `${BASE}/group/jiaojiao-family/人物=叫叫-画笔.png` },
    { id: 'gj-12', name: '叫叫-笔作宝剑', path: `${BASE}/group/jiaojiao-family/人物=叫叫-笔作宝剑.png` },
    { id: 'gj-13', name: '叫叫-花球',     path: `${BASE}/group/jiaojiao-family/人物=叫叫-花球.png` },
    { id: 'gj-14', name: '叫叫-走',       path: `${BASE}/group/jiaojiao-family/人物=叫叫-走.png` },
    { id: 'gj-15', name: '叫叫-足球',     path: `${BASE}/group/jiaojiao-family/人物=叫叫-足球.png` },
    { id: 'gj-16', name: '叫叫-金牌',     path: `${BASE}/group/jiaojiao-family/人物=叫叫-金牌.png` },
    { id: 'gj-17', name: '猪小弟-右看',   path: `${BASE}/group/jiaojiao-family/人物=猪小弟-右看.png` },
    { id: 'gj-18', name: '猪小弟-吃包子', path: `${BASE}/group/jiaojiao-family/人物=猪小弟-吃包子.png` },
    { id: 'gj-19', name: '猪小弟-嗨',     path: `${BASE}/group/jiaojiao-family/人物=猪小弟-嗨.png` },
    { id: 'gj-20', name: '猪小弟-坐',     path: `${BASE}/group/jiaojiao-family/人物=猪小弟-坐.png` },
    { id: 'gj-21', name: '猪小弟-坐地吃包子', path: `${BASE}/group/jiaojiao-family/人物=猪小弟-坐地吃包子.png` },
    { id: 'gj-22', name: '猪小弟-害羞',   path: `${BASE}/group/jiaojiao-family/人物=猪小弟-害羞.png` },
    { id: 'gj-23', name: '猪小弟-左看',   path: `${BASE}/group/jiaojiao-family/人物=猪小弟-左看.png` },
    { id: 'gj-24', name: '猪小弟-惊',     path: `${BASE}/group/jiaojiao-family/人物=猪小弟-惊.png` },
    { id: 'gj-25', name: '猪小弟-懵',     path: `${BASE}/group/jiaojiao-family/人物=猪小弟-懵.png` },
    { id: 'gj-26', name: '猪小弟-挠头',   path: `${BASE}/group/jiaojiao-family/人物=猪小弟-挠头.png` },
    { id: 'gj-27', name: '猪小弟-欢喜',   path: `${BASE}/group/jiaojiao-family/人物=猪小弟-欢喜.png` },
    { id: 'gj-28', name: '猪小弟-睡觉',   path: `${BASE}/group/jiaojiao-family/人物=猪小弟-睡觉.png` },
    { id: 'gj-29', name: '猪小弟-站立',   path: `${BASE}/group/jiaojiao-family/人物=猪小弟-站立.png` },
    { id: 'gj-30', name: '猪小弟-端坐',   path: `${BASE}/group/jiaojiao-family/人物=猪小弟-端坐.png` },
    { id: 'gj-31', name: '猪小弟-纸和橡皮', path: `${BASE}/group/jiaojiao-family/人物=猪小弟-纸和橡皮.png` },
    { id: 'gj-32', name: '猪小弟-走路吃包子', path: `${BASE}/group/jiaojiao-family/人物=猪小弟-走路吃包子.png` },
    { id: 'gj-33', name: '铃铛-坐沙发',   path: `${BASE}/group/jiaojiao-family/人物=铃铛-坐沙发.png` },
    { id: 'gj-34', name: '铃铛-奖杯',     path: `${BASE}/group/jiaojiao-family/人物=铃铛-奖杯.png` },
    { id: 'gj-35', name: '铃铛-得意',     path: `${BASE}/group/jiaojiao-family/人物=铃铛-得意.png` },
    { id: 'gj-36', name: '铃铛-思考',     path: `${BASE}/group/jiaojiao-family/人物=铃铛-思考.png` },
    { id: 'gj-37', name: '铃铛-拿框',     path: `${BASE}/group/jiaojiao-family/人物=铃铛-拿框.png` },
    { id: 'gj-38', name: '铃铛-读书',     path: `${BASE}/group/jiaojiao-family/人物=铃铛-读书.png` },
    { id: 'gj-39', name: '铃铛-赞',       path: `${BASE}/group/jiaojiao-family/人物=铃铛-赞.png` },
  ],
};

const GROUP_MIDDLE_HIGH: FigureCategory = {
  id: 'group-middle-high-school',
  name: '初中角色',
  figures: [
    { id: 'gm-1',  name: '勤练习-古灵精怪',   path: `${BASE}/group/middle-high-school/人物=勤练习-古灵精怪.png` },
    { id: 'gm-2',  name: '勤练习-唱K',        path: `${BASE}/group/middle-high-school/人物=勤练习-唱K.png` },
    { id: 'gm-3',  name: '勤练习-孔明',       path: `${BASE}/group/middle-high-school/人物=勤练习-孔明.png` },
    { id: 'gm-4',  name: '勤练习-拿成绩',     path: `${BASE}/group/middle-high-school/人物=勤练习-拿成绩.png` },
    { id: 'gm-5',  name: '勤练习-答卷',       path: `${BASE}/group/middle-high-school/人物=勤练习-答卷.png` },
    { id: 'gm-6',  name: '勤练习-骄傲',       path: `${BASE}/group/middle-high-school/人物=勤练习-骄傲.png` },
    { id: 'gm-7',  name: '勤练习-鬼脸',       path: `${BASE}/group/middle-high-school/人物=勤练习-鬼脸.png` },
    { id: 'gm-8',  name: '艾改错-平静',       path: `${BASE}/group/middle-high-school/人物=艾改错-平静.png` },
    { id: 'gm-9',  name: '艾改错-浇花',       path: `${BASE}/group/middle-high-school/人物=艾改错-浇花.png` },
    { id: 'gm-10', name: '艾改错-羽毛球',     path: `${BASE}/group/middle-high-school/人物=艾改错-羽毛球.png` },
    { id: 'gm-11', name: '董高分-右展示',     path: `${BASE}/group/middle-high-school/人物=董高分-右展示.png` },
    { id: 'gm-12', name: '董高分-坐看书',     path: `${BASE}/group/middle-high-school/人物=董高分-坐看书.png` },
    { id: 'gm-13', name: '董高分-左展示',     path: `${BASE}/group/middle-high-school/人物=董高分-左展示.png` },
    { id: 'gm-14', name: '董高分-指示',       path: `${BASE}/group/middle-high-school/人物=董高分-指示.png` },
    { id: 'gm-15', name: '董高分-站',         path: `${BASE}/group/middle-high-school/人物=董高分-站.png` },
    { id: 'gm-16', name: '董高分-诗朗诵',     path: `${BASE}/group/middle-high-school/人物=董高分-诗朗诵.png` },
  ],
};

const GROUP_LVDOU_ENGLISH: FigureCategory = {
  id: 'group-lvdoou-english',
  name: '绿豆英语',
  figures: [
    { id: 'ge-1',  name: '绿豆-享受',     path: `${BASE}/group/lvdoou-english/人物=绿豆-享受.png` },
    { id: 'ge-2',  name: '绿豆-冒爱心',   path: `${BASE}/group/lvdoou-english/人物=绿豆-冒爱心.png` },
    { id: 'ge-3',  name: '绿豆-喝饮料',   path: `${BASE}/group/lvdoou-english/人物=绿豆-喝饮料.png` },
    { id: 'ge-4',  name: '绿豆-大笑',     path: `${BASE}/group/lvdoou-english/人物=绿豆-大笑.png` },
    { id: 'ge-5',  name: '绿豆-左展示',   path: `${BASE}/group/lvdoou-english/人物=绿豆-左展示.png` },
    { id: 'ge-6',  name: '绿豆-帽子',     path: `${BASE}/group/lvdoou-english/人物=绿豆-帽子.png` },
    { id: 'ge-7',  name: '绿豆-打瞌睡',   path: `${BASE}/group/lvdoou-english/人物=绿豆-打瞌睡.png` },
    { id: 'ge-8',  name: '绿豆-拿洋葱',   path: `${BASE}/group/lvdoou-english/人物=绿豆-拿洋葱.png` },
    { id: 'ge-9',  name: '绿豆-指右',     path: `${BASE}/group/lvdoou-english/人物=绿豆-指右.png` },
    { id: 'ge-10', name: '绿豆-挠头',     path: `${BASE}/group/lvdoou-english/人物=绿豆-挠头.png` },
    { id: 'ge-11', name: '绿豆-揉脸',     path: `${BASE}/group/lvdoou-english/人物=绿豆-揉脸.png` },
    { id: 'ge-12', name: '绿豆-甩手',     path: `${BASE}/group/lvdoou-english/人物=绿豆-甩手.png` },
    { id: 'ge-13', name: '绿豆-笑',       path: `${BASE}/group/lvdoou-english/人物=绿豆-笑.png` },
    { id: 'ge-14', name: '绿豆-躺平',     path: `${BASE}/group/lvdoou-english/人物=绿豆-躺平.png` },
    { id: 'ge-15', name: '绿豆-雀跃',     path: `${BASE}/group/lvdoou-english/人物=绿豆-雀跃.png` },
  ],
};

const GROUP_THINKING: FigureCategory = {
  id: 'group-thinking-family',
  name: '思维家族',
  figures: [
    { id: 'gt-1',  name: '博士-思考',     path: `${BASE}/group/thinking-family/人物=博士-思考.png` },
    { id: 'gt-2',  name: '博士-拿笔',     path: `${BASE}/group/thinking-family/人物=博士-拿笔.png` },
    { id: 'gt-3',  name: '博士-握拳庆祝', path: `${BASE}/group/thinking-family/人物=博士-握拳庆祝.png` },
    { id: 'gt-4',  name: '博士-点赞',     path: `${BASE}/group/thinking-family/人物=博士-点赞.png` },
    { id: 'gt-5',  name: '博士-篮球',     path: `${BASE}/group/thinking-family/人物=博士-篮球.png` },
    { id: 'gt-6',  name: '博士-超人',     path: `${BASE}/group/thinking-family/人物=博士-超人.png` },
    { id: 'gt-7',  name: '小豆苗-hi',     path: `${BASE}/group/thinking-family/人物=小豆苗-hi.png` },
    { id: 'gt-8',  name: '小豆苗-上指',   path: `${BASE}/group/thinking-family/人物=小豆苗-上指.png` },
    { id: 'gt-9',  name: '小豆苗-左指',   path: `${BASE}/group/thinking-family/人物=小豆苗-左指.png` },
    { id: 'gt-10', name: '小豆苗-抬手',   path: `${BASE}/group/thinking-family/人物=小豆苗-抬手.png` },
    { id: 'gt-11', name: '小豆苗-挠头',   path: `${BASE}/group/thinking-family/人物=小豆苗-挠头.png` },
    { id: 'gt-12', name: '小豆苗-期待',   path: `${BASE}/group/thinking-family/人物=小豆苗-期待.png` },
    { id: 'gt-13', name: '粉豆-下指',     path: `${BASE}/group/thinking-family/人物=粉豆-下指.png` },
    { id: 'gt-14', name: '粉豆-吃饱',     path: `${BASE}/group/thinking-family/人物=粉豆-吃饱.png` },
    { id: 'gt-15', name: '粉豆-吓',       path: `${BASE}/group/thinking-family/人物=粉豆-吓.png` },
    { id: 'gt-16', name: '粉豆-惊了',     path: `${BASE}/group/thinking-family/人物=粉豆-惊了.png` },
    { id: 'gt-17', name: '粉豆-抬手',     path: `${BASE}/group/thinking-family/人物=粉豆-抬手.png` },
    { id: 'gt-18', name: '粉豆-拿竿',     path: `${BASE}/group/thinking-family/人物=粉豆-拿竿.png` },
    { id: 'gt-19', name: '红豆-介绍',     path: `${BASE}/group/thinking-family/人物=红豆-介绍.png` },
    { id: 'gt-20', name: '红豆-发狂',     path: `${BASE}/group/thinking-family/人物=红豆-发狂.png` },
    { id: 'gt-21', name: '红豆-握拳',     path: `${BASE}/group/thinking-family/人物=红豆-握拳.png` },
    { id: 'gt-22', name: '红豆-邀请',     path: `${BASE}/group/thinking-family/人物=红豆-邀请.png` },
    { id: 'gt-23', name: '绿豆-叉腰',     path: `${BASE}/group/thinking-family/人物=绿豆-叉腰.png` },
    { id: 'gt-24', name: '绿豆-呆住',     path: `${BASE}/group/thinking-family/人物=绿豆-呆住.png` },
    { id: 'gt-25', name: '绿豆-呆笑',     path: `${BASE}/group/thinking-family/人物=绿豆-呆笑.png` },
    { id: 'gt-26', name: '绿豆-开心',     path: `${BASE}/group/thinking-family/人物=绿豆-开心.png` },
    { id: 'gt-27', name: '绿豆-拿尺子',   path: `${BASE}/group/thinking-family/人物=绿豆-拿尺子.png` },
    { id: 'gt-28', name: '绿豆-挠头',     path: `${BASE}/group/thinking-family/人物=绿豆-挠头.png` },
    { id: 'gt-29', name: '绿豆-摸脸',     path: `${BASE}/group/thinking-family/人物=绿豆-摸脸.png` },
    { id: 'gt-30', name: '绿豆-晕',       path: `${BASE}/group/thinking-family/人物=绿豆-晕.png` },
    { id: 'gt-31', name: '绿豆-期待',     path: `${BASE}/group/thinking-family/人物=绿豆-期待.png` },
    { id: 'gt-32', name: '绿豆-超期待',   path: `${BASE}/group/thinking-family/人物=绿豆-超期待.png` },
    { id: 'gt-33', name: '绿豆-跳',       path: `${BASE}/group/thinking-family/人物=绿豆-跳.png` },
    { id: 'gt-34', name: '绿豆-震惊',     path: `${BASE}/group/thinking-family/人物=绿豆-震惊.png` },
    { id: 'gt-35', name: '蓝豆-叉腰',     path: `${BASE}/group/thinking-family/人物=蓝豆-叉腰.png` },
    { id: 'gt-36', name: '蓝豆-喇叭',     path: `${BASE}/group/thinking-family/人物=蓝豆-喇叭.png` },
    { id: 'gt-37', name: '蓝豆-开心',     path: `${BASE}/group/thinking-family/人物=蓝豆-开心.png` },
    { id: 'gt-38', name: '蓝豆-搓手',     path: `${BASE}/group/thinking-family/人物=蓝豆-搓手.png` },
    { id: 'gt-39', name: '蓝豆-期待',     path: `${BASE}/group/thinking-family/人物=蓝豆-期待.png` },
    { id: 'gt-40', name: '蓝豆-震惊',     path: `${BASE}/group/thinking-family/人物=蓝豆-震惊.png` },
  ],
};

const GROUP_LITTLE_WRITER: FigureCategory = {
  id: 'group-little-writer',
  name: '小作家',
  figures: [
    { id: 'gl-1',  name: '右展示',   path: `${BASE}/group/little-writer/人物=右展示.png` },
    { id: 'gl-2',  name: '抬手',     path: `${BASE}/group/little-writer/人物=抬手.png` },
    { id: 'gl-3',  name: '莲花',     path: `${BASE}/group/little-writer/人物=莲花.png` },
    { id: 'gl-4',  name: '唐僧',     path: `${BASE}/group/little-writer/人物=唐僧.png` },
    { id: 'gl-5',  name: '筋斗云',   path: `${BASE}/group/little-writer/人物=筋斗云.png` },
    { id: 'gl-6',  name: '金箍棒',   path: `${BASE}/group/little-writer/人物=金箍棒.png` },
    { id: 'gl-7',  name: '坐',       path: `${BASE}/group/little-writer/人物=坐.png` },
    { id: 'gl-8',  name: '芭蕉扇',   path: `${BASE}/group/little-writer/人物=芭蕉扇.png` },
  ],
};

// ============================================================================
// 按封面类型聚合
// ============================================================================

export const projectFigureCategories: FigureCategory[] = [
  PROJECT_JIAOJIAO,
  PROJECT_MIDDLE_HIGH,
  PROJECT_THINKING,
];

export const groupFigureCategories: FigureCategory[] = [
  GROUP_JIAOJIAO,
  GROUP_MIDDLE_HIGH,
  GROUP_LVDOU_ENGLISH,
  GROUP_THINKING,
  GROUP_LITTLE_WRITER,
];

// ============================================================================
// 字体配置
// ============================================================================

export const FONT_PATHS = {
  /** 项目封面标题字体 */
  projectTitle: `${BASE.replace('/assets', '')}/fonts/FZLanTYJW_Da.TTF`,
  /** 项目组封面中文标题字体 */
  groupTitle: `${BASE.replace('/assets', '')}/fonts/FZLanTYJW_Da.TTF`,
  /** 英语布局字体（L1/L2 等） */
  englishTitle: `${BASE.replace('/assets', '')}/fonts/MohrRounded-Heavy.ttf`,
} as const;

export const FONT_FAMILIES = {
  projectTitle: 'FZLanTYJW-Da',
  groupTitle: 'FZLanTYJW-Da',
  englishTitle: 'MohrRounded-Heavy',
} as const;
