# Jojo Labs Design System

> Jojo Labs 的设计系统总纲与索引文档。当前阶段聚焦偏 B 端、中后台场景的基础视觉规范、语义化 token 与组件文档结构。

## 1. Design System Overview

Jojo Labs Design System 用于统一品牌视觉、交互语言与组件设计规则，服务于未来的课程生产平台、内容协作工作台、审核发布后台与数据密集型页面。

当前系统以 [tokens.json](./foundations/tokens.json) 为基础来源，已经建立了颜色、排版、间距、圆角、尺寸、阴影与动效 token，并将逐步扩展到组件规范、页面模式与可视化设计展示页面。

### Goals

- 建立专业、清晰、克制的 B 端视觉基线
- 让设计与开发共享同一套 token 语言
- 为后续组件文档和可视化页面提供统一索引
- 让页面模式和组件规则可以持续迭代而不失控

### Current Scope

- Foundations: Ready
- Token Structure: Ready
- Component Docs: Draft
- Pattern Docs: Draft
- Visual Showcase: Planned

## 2. Product Positioning

### What Is Jojo Labs

JOJO Labs 是一个面向在线教育、课程研发与互动内容生产团队的成果导向型协作平台。它以课程生产流程为核心，以内容资产和关键产出物为第一公民，围绕生产、审核、发布构建统一的智能协作中枢。

它不是传统意义上的任务管理、流程管理或需求管理系统。平台关注的重点不是“任务是否被分配”，而是“课程内容是否被高效、稳定、高质量地生产出来并完成交付”。

### Core Value

- 让课程生产流程更顺畅，而不是只管理流程节点
- 让内容资产成为协作中心，而不是把协作割裂在多个工具中
- 让不同阶段的用户围绕同一成果物协同，而不是围绕抽象任务协同
- 让生产效率、审核效率和最终发布质量同步提升

### Target Users

- 教研老师
- 制作老师
- 审核老师
- 内容运营、课程运营与发布相关角色

## 3. Core Workflow

### Workflow Summary

JOJO Labs 的核心理念是解决课程生产效率问题。平台通过连接不同阶段、不同角色的协作，让课程内容从框架搭建到最终发布形成完整闭环。

### Typical Production Flow

1. 教研老师搭建课程框架，定义内容结构与关键产出
2. 制作老师依据框架生产图片、视频、音频等内容资产，并上传到平台
3. 审核老师在平台中完成审核、反馈、确认与修正回合
4. 内容确认无误后，通过平台完成课程发布

### Product Characteristics

- 生产流程是核心主线
- 内容资产是核心对象
- 审核反馈是关键协作机制
- 发布是成果交付的终点

## 4. Design Goals

### What The System Should Support

- 支撑高信息密度的内容生产与管理界面
- 支撑多角色、多阶段协作下的状态流转
- 支撑内容资产、结构、版本、审核反馈的清晰表达
- 支撑高频操作场景下的效率与稳定性

### Design Tone

- 专业可信
- 清晰理性
- 结果导向
- 状态明确
- 结构稳定

## 5. Design Principles

### Professional And Calm

默认风格应传递专业、可信和长期可维护的产品印象。品牌蓝用于强调，而不是覆盖整个界面。

### Information First

优先保证信息层级、可读性与扫描效率。色彩、阴影、圆角都服务于内容和流程理解，而不是抢占注意力。

### Clear Hierarchy

通过中性色、标题层级、留白、边框和容器关系建立稳定的信息结构，适配表格、筛选、表单、审核和详情等复杂界面。

### Explicit States

交互状态、反馈状态和语义状态必须明确且一致。用户应始终知道当前是否可点击、已选中、待审核、已提交、成功、警告或失败。

### Efficient Consistency

优先复用 token、组件和模式，避免临时样式。相同问题应尽量使用相同解决方案，让生产流程中的高频操作保持低学习成本。

## 6. Brand Expression

### Brand Color

- Primary Brand: `#0090D9`
- Tone: 专业、清晰、理性、可信
- Role: CTA、链接、选中、焦点、关键状态强调

### Brand Usage Rules

- 品牌色优先用于主要操作、链接、选中态和聚焦态
- 大面积背景优先使用中性色或浅语义背景，不使用高饱和品牌色铺满页面
- 页面层级依赖 `neutral`，品牌色承担强调而不是结构职责

## 7. Foundations

### Foundation Index

- [Color](./foundations/color.md)
- [Typography](./foundations/typography.md)
- [Spacing](./foundations/spacing.md)
- [Radius](./foundations/radius.md)
- [Shadow](./foundations/shadow.md)
- [Motion](./foundations/motion.md)
- [Density](./foundations/density.md)

### Foundation Summary

- `color.brand`: 品牌色梯度，服务于 CTA、链接、交互强调
- `color.neutral`: 中性色阶，服务于文字、背景、边框与层级关系
- `color.semantic`: 语义状态色，服务于 success/warning/danger/info 等反馈场景
- `typography`: 字体族、字重、字号、行高与角色化文字样式
- `spacing/radius/size`: 统一控件密度、容器结构与布局节奏
- `shadow/motion`: 统一浮层层级与动效反馈速度

## 8. Token Structure

当前 token 采用“基础色板 + 语义层 + 基础尺寸”的结构，后续会继续演进到组件级 token。

### Current Layers

1. Base Palette
   - `color.brand`
   - `color.neutral`
   - `color.green / amber / red / blue`
2. Semantic Tokens
   - `color.text`
   - `color.surface`
   - `color.border`
   - `color.overlay`
   - `color.semantic`
3. Foundation Tokens
   - `typography`
   - `spacing`
   - `radius`
   - `border-width`
   - `size`
   - `shadow`
   - `motion`

### Next Layer

后续组件文档会逐步沉淀出 component token，例如：

- `button.primary.bg`
- `button.primary.text`
- `input.default.border`
- `table.header.bg`

### Naming Rules

- 文档文件名统一使用 kebab-case
- token 命名优先语义化，不使用纯视觉描述替代语义描述
- 能用统一层级表达的问题，不在组件内部重复发明命名

## 9. Usage Guidelines

### Color Usage

- 页面背景、容器背景、边框与分割线优先使用 `neutral` 与 `surface`
- 品牌色只用于关键强调，不作为全页面铺底色
- 状态色必须带语义目的，不用于随意装饰
- 图表场景优先使用 `color.data-viz`，避免直接混用品牌色和语义色造成歧义
- 生产、审核、发布等流程节点应优先通过语义层和状态组件表达，而不是依赖零散颜色堆叠

### Typography Usage

- 页面标题使用 `page-title`
- 模块标题使用 `section-title` 或 `card-title`
- 默认正文使用 `body`
- 补充信息使用 `caption`
- 大数字与 KPI 使用 `kpi`

### Density Usage

- 数据密集页面优先使用 `size.control-height.sm/md`
- 常规表单优先使用 `size.control-height.md/lg`
- 大量并列表单和表格不要混用过多控件高度
- 审核、批量处理、内容录入等高频场景优先保证操作效率和扫描效率

### Visual Restraint

- 不使用过强阴影制造层级
- 不使用过大圆角削弱 B 端专业感
- 不通过增加颜色种类解决信息层级问题

## 10. Component Index

### Actions

- [Button](./components/button.md) - Draft

### Forms

- [Input](./components/input.md) - Draft
- [Select](./components/select.md) - Stable
- [Checkbox](./components/checkbox.md) - Stable

### Data Display

- [Tag](./components/tag.md) - Stable
- [Table](./components/table.md) - Stable

### Feedback

- [Modal](./components/modal.md) - Stable

### Expansion Rules

新增组件前，优先判断它是否属于现有组件的变体。如果结构、交互和 token 映射明显不同，再拆成独立文档。

## 11. Patterns

- [Filter Table](./patterns/filter-table.md)
- [Form Page](./patterns/form-page.md)
- [List Detail](./patterns/list-detail.md)

这些模式面向 B 端高频界面组合，用来约束页面级信息结构与组件组合关系，而不是替代单个组件文档。

## 12. Accessibility

- 文本与背景应满足可读对比度要求
- 所有可交互元素必须有明确 focus 状态
- 状态反馈不能只依赖颜色表达
- 动效应短促、克制，并考虑 reduced motion 场景
- 图标按钮、状态标签、图表颜色都应提供额外语义提示

## 13. Contribution And Changelog

### Document Workflow

1. 先补 Foundation 或 Pattern，再补组件文档
2. 新组件必须遵循统一模板
3. 新 token 应先确认是否能复用现有语义层
4. 文档更新时同步标记状态：Planned / Draft / Ready / Deprecated

### Next Milestones

- 完成 `docs/02-components` 第一批组件文档内容
- 生成可视化的设计系统展示页面
- 建立 component token 与实现映射规则
- 将页面模式与真实业务页面示例对齐
- 补充与课程生产、审核、发布相关的关键页面模式说明
