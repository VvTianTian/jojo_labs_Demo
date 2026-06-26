# Color

Status: Draft

## Purpose

定义 Jojo Labs 的品牌色、中性色、语义色、表面色、边框色、遮罩色与图表色使用规则。

## Token Sources

- `color.brand`
- `color.neutral`
- `color.semantic`
- `color.text`
- `color.surface`
- `color.border`
- `color.overlay`
- `color.data-viz`

## Design Intent

Jojo Labs 是一个围绕课程生产、审核、发布展开协作的 B 端平台，因此颜色系统的首要职责不是“装饰页面”，而是帮助用户快速理解信息层级、流程状态与操作优先级。

这套颜色体系遵循以下原则：

- 用中性色建立结构，而不是用大量彩色建立结构
- 用品牌色表达关键操作、选中和焦点，而不是把品牌色铺满页面
- 用语义色表达状态与反馈，而不是让用户自行猜测颜色含义
- 用浅背景和弱边框承载状态信息，避免高饱和色对高频操作造成干扰

## Color Roles

### Brand

- `color.brand` 是品牌色梯度，核心色为 `brand.500 = #0090D9`
- 主要用于主按钮、链接、激活态、选中态、焦点态、关键入口
- `brand.50-200` 适合轻状态背景、弱强调容器、选中背景
- `brand.500-700` 适合按钮、交互高亮、链接与强调文字
- `brand.800-900` 仅在深色强调或特殊场景下使用，不作为常规正文色

### Neutral

- `color.neutral` 是页面层级的骨架
- 优先用于背景、容器、边框、正文、弱信息、禁用态
- `neutral.0-100` 适合页面和容器背景
- `neutral.200-300` 适合分割线、描边、表格边界
- `neutral.500-700` 适合辅助文字、说明信息、次级标题
- `neutral.800-950` 适合正文、关键文字与高强调信息

### Semantic

- `color.semantic.primary` 用于品牌相关状态
- `color.semantic.success` 用于成功、通过、完成
- `color.semantic.warning` 用于提醒、待处理、临界风险
- `color.semantic.danger` 用于驳回、失败、删除、高风险操作
- `color.semantic.info` 用于说明、系统提示、非阻断反馈

每组语义色都包含：

- `bg`: 弱背景
- `subtle`: 辅助背景
- `border`: 状态边框
- `text`: 状态文字
- `solid`: 实心状态色
- `hover`: 悬停色
- `active`: 按下色

### Text / Surface / Border / Overlay

- `color.text` 用于页面文字层级，不建议绕过它直接用基础灰阶
- `color.surface` 用于页面、卡片、浮层、禁用容器等背景语义
- `color.border` 用于边框强弱层级与 focus 边框
- `color.overlay` 用于弹窗遮罩、浅叠加层与深遮罩

### Data Visualization

- `color.data-viz` 用于图表、趋势、对比和多分类展示
- 图表色不直接承担状态语义，避免与 `success/warning/danger` 混淆

## Usage Rules

### Page Structure

- 页面底色优先使用 `color.surface.page`
- 普通卡片与表单容器优先使用 `color.surface.base`
- 弱分区和筛选容器优先使用 `color.surface.subtle`
- 浮层和弹窗优先使用 `color.surface.raised`
- 分割线和常规边框优先使用 `color.border.subtle/default`

### Text Hierarchy

- 页面正文优先使用 `color.text.primary`
- 说明文字、字段描述、辅助信息优先使用 `color.text.secondary` 和 `color.text.tertiary`
- 禁用信息统一使用 `color.text.disabled`
- 深色底上的文字统一使用 `color.text.inverse`

### Action Priority

- 主操作按钮、主链接、选中项、焦点态优先使用品牌色
- 次级操作优先通过边框、中性色和版式层级表达，不滥用彩色按钮
- 同一操作区内应有且只有一个主要品牌操作

### Workflow States

针对课程生产流程，建议采用统一的状态颜色语义：

- 草稿、未开始、未配置：中性色
- 制作中、处理中、排队中：品牌主语义或信息语义
- 待审核、待确认：警告语义
- 审核通过、已完成、已发布：成功语义
- 审核驳回、发布失败、高风险操作：危险语义

### Review And Feedback

- 审核面板和反馈提示优先使用浅背景 + 状态文字，不直接使用高饱和实心块
- 危险反馈仅在需要强提示时使用 `danger.solid`
- 页面上同时出现多种状态时，应优先控制彩色面积，避免界面噪音

## Do / Don't

### Do

- 用中性色建立页面层级
- 用品牌色表达关键操作和焦点
- 用语义色表达流程状态与反馈结果
- 用浅状态背景承载大面积状态信息
- 保持同一状态在不同模块中的颜色语义一致

### Don't

- 不要把品牌蓝当作大面积页面背景
- 不要用多种无语义的彩色同时争抢注意力
- 不要直接混用图表色和业务状态色
- 不要同一页面同时出现多个“主按钮颜色”
- 不要只靠颜色区分审核通过和驳回，必须配合文案或图标

## Suggested Preview Sections

未来统一 Preview 页面建议至少包含以下颜色模块：

- Brand Palette
- Neutral Palette
- Semantic State Cards
- Text / Surface / Border Mapping
- Workflow Status Showcase
- Chart Palette Preview
