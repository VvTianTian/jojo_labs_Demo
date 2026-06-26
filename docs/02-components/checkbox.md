# Checkbox

Status: Stable

## Purpose

定义复选框的视觉规范、交互状态与成组使用规则，服务于 Jojo Labs 中后台的表单多选、表格行选择和批量操作场景。

## Overview

- Checkbox 提供单个使用和 Checkbox.Group 成组使用两种方式。
- 支持未选中、已选中、半选三种状态。
- 方框尺寸固定为 16×16px，标签固定在右侧。
- 使用 lucide-react 的 Check 图标作为对勾标识。
- 通过隐藏原生 input 保证可访问性和表单兼容性。

## When To Use

- 表单中需要用户从多个选项中选择一个或多个时，如适用年级、内容分类、权限配置。
- 表格中需要批量选择行并触发批量操作时（后续 Table 集成）。
- 需要全选/半选联动的场景，如批量审核、批量发布。
- 单个开关式选项，如"仅显示已发布""包含已归档"。

## Anatomy

- **Native Input**：隐藏的 `<input type="checkbox">`，保证键盘操作、屏幕阅读器和表单提交。
- **Visual Box**：16×16px 的可视化方框，展示当前状态（空白 / 对勾 / 横线）。
- **Label**：方框右侧的文字标签，使用 `body.md`（14px）字号。

## Variants

### 单个 Checkbox

独立使用，自带选中状态管理或通过 `checked` 属性受控。

### Checkbox.Group

多个 Checkbox 的组合，统一管理选中值。支持水平或垂直排列、整组禁用。

## States

| 状态 | 视觉表现 | 说明 |
|------|---------|------|
| 未选中 | 白底 + 中性边框 | 默认状态 |
| 已选中 | 品牌蓝填充 + 白色对勾 | 已选择 |
| 半选 | 品牌蓝填充 + 白色横线 | 部分子项选中 |
| 悬停 | 边框变品牌色 / 填充加深 | 鼠标悬浮反馈 |
| 聚焦 | 品牌色 focus ring | 键盘 Tab 聚焦 |
| 禁用 | 灰底 + 灰框 + 浅灰文字 | 不可交互 |
| 禁用 + 选中 | 浅品牌蓝填充 + 灰文字 | 已选中但不可修改 |

## Sizes

Checkbox 仅提供单一默认尺寸：

| 属性 | 值 | 说明 |
|------|---|------|
| 方框 | 16×16px | 与 `sizing.icon.md` 对齐 |
| 方框圆角 | 4px (`radii.sm`) | B 端专业感 |
| 标签字号 | 14px (`body.md`) | 与表单组件统一 |
| 方框与标签间距 | 8px (`space.xs`) | 紧凑但清晰 |
| Group 项间距 | 16px 水平 / 16px 垂直 | 保持扫描效率 |

## Interaction

- 点击方框或标签文字均可切换选中状态。
- 键盘 Space 键可切换聚焦的 Checkbox。
- 半选态点击后变为全选（触发 `onChange(true)`）。
- 状态切换使用 `motion.duration.fast`（120ms）过渡。
- Group 中单个 Checkbox 变化时，Group 的 `onChange` 返回新的完整选中列表。

## Checkbox.Group

### API

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `(string \| number)[]` | - | 当前选中值列表（受控） |
| `defaultValue` | `(string \| number)[]` | `[]` | 默认选中值列表 |
| `onChange` | `(value) => void` | - | 选中值变化回调 |
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | 排列方向 |
| `disabled` | `boolean` | `false` | 整组禁用 |

### 全选联动

全选 Checkbox 与 Group 子项的联动由使用者计算，组件不内置全选逻辑：

- `allChecked = selected.length === options.length`
- `someChecked = selected.length > 0 && selected.length < options.length`
- 全选 Checkbox 设置 `indeterminate={someChecked}` 和 `checked={allChecked}`

## Accessibility

- 隐藏的原生 input 使用 visually-hidden 模式（`clip: rect(0,0,0,0)`），保留键盘和屏幕阅读器支持。
- `aria-checked` 属性在半选态值为 `"mixed"`。
- 整个组件由 `<label>` 包裹，确保点击标签可触发 input。
- focus 状态使用品牌色 focus ring，与 Button / Input 保持一致。
- disabled 态同时设置 `disabled` 属性和 `cursor-not-allowed` 视觉反馈。

## Token Mapping

- `checkbox.size = 16px` (`sizing.icon.md`)
- `checkbox.radius = 4px` (`radii.sm`)
- `checkbox.border = color.border.default`
- `checkbox.border.hover = color.brand.500`
- `checkbox.bg.checked = color.brand.500`
- `checkbox.bg.checked.hover = color.brand.600`
- `checkbox.icon = color.neutral.0`（白色）
- `checkbox.focus-ring = color.interaction.focus-ring`
- `checkbox.text = color.text.primary`
- `checkbox.text.disabled = color.text.disabled`
- `checkbox.label-gap = space.xs`（8px）
- `checkbox.group-gap = space.md`（16px）

## Do / Don't

- Do: 在表单中用 Group 管理一组相关选项，保持选中值统一。
- Do: 用 `value` 属性标识每个选项，不要用中文文案作为值。
- Do: 全选联动时，用 `indeterminate` 表达部分选中。
- Don't: 把 Checkbox 当 Switch 使用，开关型交互应使用 Switch 组件。
- Don't: 让全选 Checkbox 的半选态自动变为取消全选，应先变为全选。
- Don't: 在同一 Group 内混用不同尺寸或不同控件类型。
