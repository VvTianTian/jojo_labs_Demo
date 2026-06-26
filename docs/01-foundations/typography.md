# Typography

Status: Draft

## Purpose

定义字体栈、字号、字重、行高与角色化排版样式，用于保证中后台界面的可读性和层级稳定性。

## Token Sources

- `typography.font-family`
- `typography.font-weight`
- `typography.font-size`
- `typography.line-height`
- `typography.styles`

## Design Intent

Jojo Labs 面向课程生产、审核、发布等高频协作场景，排版系统首先服务于阅读效率、扫描效率和信息区分，而不是营造强烈的视觉情绪。

排版设计遵循以下原则：

- 用明确层级区分页面结构与业务信息
- 用稳定、克制的字重体系减少视觉噪音
- 用一致的行高保证长列表、表格与表单的阅读舒适度
- 用角色化样式承载业务场景，而不是临时为每个页面发明文字样式

## Font Strategy

### Sans

- `typography.font-family.sans` 是默认界面字体栈
- 中文界面以 `PingFang SC` 为主，兼容 `Inter` 与系统字体
- 适用于页面标题、模块标题、正文、标签和表单内容

### Mono

- `typography.font-family.mono` 用于代码、编号、时间戳、版本号、素材 ID、结构化数字等信息
- 在资产列表、审核记录、系统日志、数据明细中优先使用等宽字体提高对齐与扫描效率

## Type Scale

### Font Size

- `xs = 12px`：辅助说明、弱提示、表格次级信息
- `sm = 13px`：紧凑场景下的正文补充
- `md = 14px`：默认正文、表单内容、列表信息
- `lg = 16px`：重点正文、卡片标题、小模块标题
- `xl = 18px`：模块标题
- `2xl = 20px`：页面标题
- `3xl = 24px`：大标题
- `4xl = 28px`：KPI、大数字、核心指标

### Font Weight

- `regular = 400`：正文和长文本默认使用
- `medium = 500`：轻强调、标签、重点字段
- `semibold = 600`：模块标题、卡片标题、关键操作区标题
- `bold = 700`：核心数字、KPI、少量高强调场景

### Line Height

- 小字号优先保证可读性，不压缩过度
- 正文默认使用 `22px` 左右行高
- 标题优先使用 `24px / 28px / 32px`
- KPI 等大数字保持更宽松的行高，避免视觉挤压

## Role Styles

### Page Title

- 使用 `typography.styles.page-title`
- 适用于页面级标题，如课程中心、审核工作台、发布管理
- 同一页面中只应出现一个主标题

### Section Title

- 使用 `typography.styles.section-title`
- 适用于模块区块、工作台分栏、详情区标题

### Card Title

- 使用 `typography.styles.card-title`
- 适用于卡片、面板、小容器标题

### Body

- 使用 `typography.styles.body`
- 适用于大部分正文、字段值、表单内容、普通说明

### Body Strong

- 使用 `typography.styles.body-strong`
- 适用于强调字段、当前选中值、重点信息摘要

### Caption

- 使用 `typography.styles.caption`
- 适用于说明、提示、附加信息、更新时间、弱状态说明

### KPI

- 使用 `typography.styles.kpi`
- 适用于课程数量、审核通过率、产出量、发布进度等关键指标

### Code

- 使用 `typography.styles.code`
- 适用于内容 ID、版本号、资源编号、时间戳和结构化字段

## Usage Rules

### Page Hierarchy

- 页面标题使用 `page-title`
- 一级模块使用 `section-title`
- 卡片和局部模块使用 `card-title`
- 不同层级标题不要只通过颜色区分，应优先通过字号和字重区分

### Tables And Lists

- 表格正文优先使用 `body`
- 表格次级字段和补充说明优先使用 `caption`
- 关键列、状态列、主信息列可使用 `body-strong`
- 编号、版本、时间类字段建议使用 `code`

### Forms

- 表单标签优先使用 `body-strong` 或 `body`
- 字段说明、提示文案、校验补充文案优先使用 `caption`
- 单页表单不要混用过多字号，默认以 `14px` 为核心正文档位

### Workflow Information

- 审核结果、流程阶段、关键角色信息需要有清晰等级
- “主信息”与“元信息”必须区分，例如课程名称与更新时间不能使用同级排版
- 在审核列表、资产列表中，推荐使用“标题 + 次级元信息 + 状态”的三层排版结构

## Do / Don't

### Do

- 用少量稳定的角色样式覆盖大部分场景
- 用字重和字号共同建立层级
- 在高密度界面中优先保证扫描效率
- 为数字、编号和时间信息使用等宽字体

### Don't

- 不要在一个页面中混用过多字号
- 不要用颜色代替排版层级
- 不要给正文使用过粗字重
- 不要让标题和正文的行高差异过小，导致阅读粘连

## Suggested Preview Sections

未来统一 Preview 页面建议至少包含以下排版模块：

- Type Scale
- Role Styles
- Table Typography
- Form Typography
- KPI And Code Styles
