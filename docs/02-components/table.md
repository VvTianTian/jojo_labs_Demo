# Table

Status: Stable

## Purpose

定义表格在 B 端场景下的结构、密度、状态与交互规则，服务于课程列表、资产列表、审核列表等核心数据展示场景。

## Overview

- Table 是纯展示型表格，第一版不含可编辑、拖拽等高阶能力。
- 通过 `columns` 配置定义列结构，`dataSource` 传入数据。
- 支持行选择（复用 Checkbox 组件）、列排序（外部控制）、空状态和加载状态。
- 分页器（Pagination）为独立组件，不在 Table 内部。

## When To Use

- 需要展示结构化数据列表，如资产列表、课程列表、审核记录。
- 需要支持行选择进行批量操作，如批量审核、批量发布。
- 需要按列排序快速定位数据。
- 配合筛选栏和工具栏组成 Filter Table 模式。

## Anatomy

- **Wrapper**：外层容器，处理水平滚动。
- **Header**：表头行，包含列标题、全选 Checkbox、排序图标。
- **Body**：表体行，包含数据单元格、行选择 Checkbox。
- **Empty State**：无数据时显示居中文案。
- **Skeleton**：加载时显示骨架行占位。

## Variants

### 基础表格

纯数据展示，包含表头和表体。

### 带行选择的表格

左侧增加 Checkbox 列，支持单行选择和全选联动（含半选态）。

### 带排序的表格

可排序列的表头可点击，循环切换：默认 → 升序 → 降序 → 默认。排序逻辑由使用者控制。

## States

### 表格整体

| 状态 | 视觉表现 | 说明 |
|------|---------|------|
| 正常 | 完整表头 + 数据行 | 默认状态 |
| 加载中 | 骨架行（5 行占位条） | 数据加载中，表头保持可见 |
| 空数据 | 居中提示「暂无数据」 | 无数据或筛选无结果 |

### 行状态

| 状态 | 视觉表现 | 说明 |
|------|---------|------|
| 默认 | 白底 + 底部边框 | 常规行 |
| 悬停 | 浅灰背景 | 鼠标悬浮反馈 |
| 选中 | 品牌浅蓝背景 | Checkbox 已勾选 |

### 排序表头

| 状态 | 视觉表现 | 说明 |
|------|---------|------|
| 默认 | 灰色双向箭头 | 未激活排序 |
| 升序 | 向上箭头高亮 | 从低到高 |
| 降序 | 向下箭头高亮 | 从高到低 |

## Density

- 表头字号：12px，font-weight: 500
- 表体字号：14px
- 单元格内边距：水平 16px、垂直 12px
- 表头内边距：水平 16px、垂直 10px
- 与 DESIGN.md 推荐的 `size.control-height.sm/md` 密度一致

## Selection

- 使用已有 Checkbox 组件渲染选择列
- 全选 Checkbox 位于表头，与行 Checkbox 联动
- 全选只管当前数据（不涉及跨页全选）
- 半选态：部分行选中时全选 Checkbox 显示 indeterminate
- 选中行背景使用品牌浅蓝色

## Sorting

- 可排序列的表头显示排序图标（上下箭头）
- 点击循环：默认 → 升序 → 降序 → 默认
- 排序逻辑由外部控制，Table 只负责展示状态和触发 `onSorterChange` 事件
- 当前排序列的图标高亮为品牌色

## Empty And Error States

### Empty

- 表体区域显示居中文案「暂无数据」（可自定义）
- 表头保持可见

### Loading

- 显示 5 行骨架占位（灰色条形 + 动画）
- 表头保持可见
- 使用 `aria-busy="true"` 标注

## API

### TableColumn

| 属性 | 类型 | 说明 |
|------|------|------|
| `key` | `string` | 列唯一标识 |
| `title` | `ReactNode` | 列标题 |
| `dataIndex` | `string` | 数据字段名 |
| `width` | `string \| number` | 列宽 |
| `align` | `'left' \| 'center' \| 'right'` | 对齐方式 |
| `sorter` | `boolean` | 是否可排序 |
| `render` | `(value, record, index) => ReactNode` | 自定义渲染 |

### Table Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `columns` | `TableColumn[]` | - | 列配置 |
| `dataSource` | `T[]` | - | 数据源 |
| `rowKey` | `string` | - | 行唯一标识字段 |
| `rowSelection` | `TableRowSelection` | - | 行选择配置 |
| `sorter` | `TableSorter \| null` | - | 排序状态 |
| `onSorterChange` | `(sorter) => void` | - | 排序变化回调 |
| `loading` | `boolean` | `false` | 是否加载中 |
| `emptyText` | `ReactNode` | `'暂无数据'` | 空状态文案 |

### TableRowSelection

| 属性 | 类型 | 说明 |
|------|------|------|
| `selectedRowKeys` | `(string \| number)[]` | 当前选中行 key 列表 |
| `onChange` | `(keys) => void` | 选中变化回调 |
| `hideSelectAll` | `boolean` | 是否隐藏全选 |

## Accessibility

- 使用语义化 `<table>` / `<thead>` / `<tbody>` / `<th>` / `<td>` 结构
- 可排序列使用 `aria-sort` 属性
- 全选 Checkbox 使用 `aria-label="全选"`
- 行 Checkbox 使用 `aria-label="选择第 N 行"`
- 加载状态使用 `aria-busy="true"`

## Token Mapping

- `table.border = color.border.subtle`
- `table.header.bg = color.background.page`
- `table.header.text = color.text.secondary`
- `table.body.bg = color.background.surface`
- `table.row.hover-bg = color.background.page`
- `table.row.selected-bg = color.interaction.brand-soft (40%)`
- `table.sorter.active = color.brand.500`
- `table.cell.padding-x = space.md`（16px）
- `table.cell.padding-y = 12px`
- `table.header.padding-y = 10px`

## Do / Don't

- Do: 把主信息列作为视觉锚点，放在最左侧。
- Do: 状态列使用 Tag 组件，保持语义统一。
- Do: 行内操作使用 Button text 变体，保持紧凑。
- Don't: 在一个表格中混用过多列宽，保持节奏稳定。
- Don't: 把筛选栏和工具栏塞进 Table 组件，它们属于 Filter Table 模式层。
- Don't: 让排序状态只依赖颜色，排序图标提供形状维度的区分。
