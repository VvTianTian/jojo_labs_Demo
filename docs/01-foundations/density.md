# Density

Status: Draft

## Purpose

定义控件高度、图标尺寸和布局尺寸，支撑紧凑型与常规型中后台密度。

## Token Sources

- `size.control-height`
- `size.icon`
- `size.layout`

## Design Intent

Jojo Labs 的核心是课程生产效率，因此密度系统的目标不是“把内容塞得越多越好”，而是在信息密度和操作舒适之间找到适合高频协作的平衡。

密度设计遵循以下原则：

- 高信息密度页面优先保证扫描效率
- 高频操作区域优先保证点击效率和连续操作效率
- 同一页面中不要混用过多控件高度
- 密度选择应服务于业务任务，而不是服务于视觉风格

## Density Levels

### Compact

适用于：

- 筛选 + 表格页面
- 审核列表
- 资产管理列表
- 批量处理与高频录入区域

推荐使用：

- `size.control-height.sm = 28px`
- `size.control-height.md = 32px`
- `size.icon.sm/md`

### Comfortable

适用于：

- 常规表单页
- 详情页
- 配置页
- 新手或复杂输入场景

推荐使用：

- `size.control-height.md = 32px`
- `size.control-height.lg = 36px`
- `size.icon.md/lg`

### Emphasized

适用于：

- 页面级主要操作
- 重要 CTA
- 需要更强存在感的关键入口

推荐使用：

- `size.control-height.xl = 40px`

## Control Height Guidelines

### XS 24px

- 仅用于极紧凑辅助控件
- 如小型标签操作、微型筛选控件、次级工具区
- 不建议作为主表单高度

### SM 28px

- 适用于高密度筛选栏、表格工具栏、批量操作区
- 是偏 B 端场景很常用的紧凑高度

### MD 32px

- 默认推荐高度
- 适用于大多数输入框、选择器、按钮和普通操作条

### LG 36px

- 适用于常规表单、较长文案按钮、重点输入区域

### XL 40px

- 适用于页面主要操作、主提交按钮、强调入口

## Icon Size Guidelines

- `xs = 12px`：辅助性图标、轻量提示
- `sm = 14px`：表格操作图标、小型工具区
- `md = 16px`：默认图标尺寸
- `lg = 20px`：强调图标、主操作区
- `xl = 24px`：大型入口或视觉型导航元素

图标尺寸应与控件高度协同，不应单独追求“看起来大”。

## Layout Width Guidelines

- `size.layout.sidebar = 240px`：适合作为后台侧边导航基线宽度
- `size.layout.content-max = 1440px`：适合作为内容区最大宽度控制，避免超宽页面降低阅读效率

## Business Recommendations

### Production Workbench

- 左侧导航和顶部筛选建议采用紧凑密度
- 中央内容区保持中等密度，避免素材信息拥挤
- 频繁操作按钮可用 `md`，主操作可用 `lg`

### Review Workbench

- 待审核列表、批量审核工具栏优先使用 `sm/md`
- 审核结果面板和评论区优先保证可读性，不建议使用过小高度

### Publish Flow

- 发布确认区和关键操作按钮优先使用 `lg/xl`
- 说明信息和状态回顾区域保持 `md` 密度即可

### Forms

- 单列表单优先使用 `md/lg`
- 大量并列表单或配置型表单可局部降到 `sm`
- 同一表单内不建议同时出现三种以上控件高度

### Tables

- 表格筛选栏与工具栏优先使用 `sm/md`
- 表格行高和单元格内容应与正文排版协同
- 状态标签、行内操作、复选框尺寸要统一，不要各自使用不同密度

## Do / Don't

### Do

- 为不同业务任务选择稳定的密度等级
- 在高频操作区域优先保证效率
- 在高认知负担区域优先保证可读性
- 用一致的控件高度建立秩序感

### Don't

- 不要为了“装下更多信息”无限压缩控件高度
- 不要在同一模块中混用多种高度造成跳动感
- 不要让图标尺寸与控件尺寸失衡
- 不要用超大控件高度填满整个后台页面

## Suggested Preview Sections

未来统一 Preview 页面建议至少包含以下密度模块：

- Control Height Scale
- Icon Size Scale
- Compact vs Comfortable Comparison
- Table Toolbar Density Demo
- Form Density Demo
