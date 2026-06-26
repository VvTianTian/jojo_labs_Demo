# Select

Status: Stable

## Purpose

定义选择器的触发器、下拉面板、选项交互与状态反馈规则，服务于 Jojo Labs 中后台表单、筛选与多选场景。

## Overview

- 首批支持 **单选** + **多选** + **可搜索**（`showSearch`）。
- 触发器高度/圆角/边框与 Input 完全对齐：SM=24 / MD=32 / LG=40。
- 仅 `outlined` 变体（有边框），与 Input 视觉一致。
- 下拉面板内联渲染（与触发器同层级定位），支持搜索过滤与键盘导航。

## When To Use

- 从预定义选项中选择一个或多个值：课程分类、标签、讲师、状态。
- 需要搜索快速定位选项的场景（选项数量较多时）。
- 表单项中与 Input 并列展示，保持视觉统一。

## Anatomy

### Trigger（触发器）

- **Wrapper**: 承载边框、背景、圆角、焦点环和状态色。
- **Value / Placeholder**: 当前选中项文案或占位文字。
- **Multi Tags**: 多选模式下的已选项标签（可设置 `maxTagCount`）。
- **Search Input**: 内嵌搜索输入框（`showSearch` 开启时）。
- **Suffix**: 下拉箭头 / 清空按钮 / 加载图标。

### Dropdown（下拉面板）

- **Panel**: 内联渲染，`shadow: boxShadowMenu`，圆角与触发器一致（SM=8px, MD/LG=10px）。
- **Option**: 选项行，支持 hover / selected / disabled 状态，右侧显示勾选标记。
- **Empty**: 无匹配选项时的占位内容。

## Variants

- 首批仅 `outlined`（有边框），后续可扩展 `borderless` / `filled`。

## States

- `default`: 可点击，边框中性色。
- `hover`: 边框加深。
- `open / focus`: 品牌色边框 + 焦点环。
- `error`: 红色边框 + 红色焦点环。
- `warning`: 黄色边框 + 黄色焦点环。
- `disabled`: 禁用背景 + 禁用边框。
- `loading`: 显示旋转加载图标。

## Sizes

| Size | Trigger Height | Radius | Option Height | Typical Use |
|------|---------------|--------|---------------|-------------|
| `sm` | 24px | 8px | 24px | 表格筛选、紧凑工具栏 |
| `md` | 32px | 10px | 32px | 默认表单、弹窗选择 |
| `lg` | 40px | 10px | 32px | 低密度页面 |

## Accessibility

- 使用 `role="combobox"` + `aria-expanded` + `aria-haspopup="listbox"`。
- 选项使用 `role="option"` + `aria-selected` + `aria-disabled`。
- 键盘导航：↑↓ 选择、Enter 确认、ESC 关闭。
- 清空按钮提供 `aria-label`。

## Token Mapping

- `select.trigger.height = sizing.controlHeight (sm/md/lg)`
- `select.trigger.radius.sm = radii.md (8px)`
- `select.trigger.radius = radii.button (10px)`
- `select.trigger.border = border.default (#D8E4EB)`
- `select.trigger.border.focus = color.border.focus (#0090D9)`
- `select.option.selected.bg = color.palette.brand.50 (#EBF9FF)`
- `select.option.hover.bg = color.background.subtle (#F7F7F8)`
- `select.dropdown.shadow = boxShadowMenu (0px 4px 8px 0px rgba(0,0,0,0.1))`
- `select.dropdown.z = 1050`
- `select.dropdown.maxHeight = 256px`
- `select.tag.radius = radius.xxs (4px)`
- `select.trigger.minWidth.sm = 140px`
- `select.trigger.minWidth.md = 180px`
- `select.trigger.minWidth.lg = 220px`
- `select.multi.tag.bg = color.palette.neutral.100 (#F7F7F8)`

## Do / Don't

- Do: 选项较多时开启 `showSearch` 提升效率。
- Do: 多选场景使用 `maxTagCount` 防止触发器过高。
- Don't: 把 Select 当 Input 用（不支持自由输入，那是 AutoComplete）。
- Don't: 选项超过 100 个时不做虚拟滚动优化（当前首批不含）。
