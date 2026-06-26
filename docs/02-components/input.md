# Input

Status: Stable

## Purpose

定义文本输入组件的结构、变体、状态、尺寸、校验反馈与 token 映射，服务于 Jojo Labs 中后台表单、搜索与文本录入场景。

## Overview

- 首批包含 **Input**（单行）和 **TextArea**（多行）两个子组件。
- Input 通过 `type` 属性切换 Standard / Password / Search 三种形态，无需独立组件。
- 控件高度与 Button 对齐：`sm=24 / md=32 / lg=40`，圆角规则同步：SM=8px，MD/LG=10px。
- 校验状态支持 `error` 和 `warning` 两级语义反馈。

## When To Use

- 表单中的文本字段：课程名称、标签、备注、搜索关键词。
- 需要密码输入、显示/隐藏切换的安全字段。
- 需要多行输入的备注、描述、批量标签场景（使用 TextArea）。
- 需要实时字符计数限制的内容编辑场景。

## Anatomy

### Input

- **Wrapper**: 承载边框、背景、圆角、焦点环和状态色。
- **Prefix**（可选）: 前置图标或文本，如用户图标、货币符号。
- **Native Input**: 原生 `<input>` 元素，承载文本输入与光标。
- **Suffix**（可选）: 后置图标或文本，如单位、状态提示。
- **Clear Button**（可选）: 有值且非禁用时出现，点击清空。
- **Password Toggle**（仅 type=password）: 眼睛图标切换显示/隐藏。

### TextArea

- **Wrapper**: 同 Input Wrapper 语义。
- **Native Textarea**: 原生 `<textarea>` 元素。
- **Character Count**（可选）: 显示当前字符数和最大限制。

## Variants

| 变体 | 触发方式 | 说明 |
|------|----------|------|
| Standard | `type="text"`（默认） | 标准单行文本输入 |
| Password | `type="password"` | 自动附带眼睛图标切换显示/隐藏 |
| Search | `type="search"` | 自动前置搜索图标 |
| TextArea | 使用 `<TextArea>` 组件 | 多行文本域，支持 `autoSize` 和 `showCount` |

## States

| 状态 | 边框 | 焦点环 | 背景 | 说明 |
|------|------|--------|------|------|
| `default` | `neutral-300` | — | `neutral-0` | 可编辑，未聚焦 |
| `hover` | `neutral-400` | — | `neutral-0` | 鼠标悬停 |
| `focus` | `brand-500` | `focusBrand`（3px 品牌色光晕） | `neutral-0` | 键盘或鼠标聚焦 |
| `disabled` | `neutral-200` | — | `neutral-50` | 不可交互 |
| `readOnly` | `neutral-300` | — | `neutral-50` | 可查看不可编辑 |
| `error` | `error-500` | `focusError`（3px 红色光晕） | `neutral-0` | 校验失败 |
| `warning` | `warning-500` | 3px 警告色光晕 | `neutral-0` | 需要注意但不阻断 |

## Sizes

| Size | Height | Padding X | Font | Radius | Use Case |
|------|--------|-----------|------|--------|----------|
| `sm` | 24px | 8px | 12px | 8px (`radii.md`) | 表格行内编辑、紧凑工具栏 |
| `md` | 32px | 12px | 14px | 10px (`radii.button`) | 默认表单、弹窗输入 |
| `lg` | 40px | 12px | 14px | 10px (`radii.button`) | 低密度页面、突出输入区域 |

> **圆角规则**: 与 Button 保持一致。SM 使用 `radii.md`（8px），MD/LG 使用 `radii.button`（10px）。

## Validation

- `error`: 表单校验失败，使用错误语义色边框和焦点环。不阻断输入，但需在 Input 下方配合错误提示文本。
- `warning`: 内容需要注意但不阻断提交，使用警告语义色。如字符接近上限、格式建议等。
- 校验时机推荐：失焦后触发首次校验，输入中清除错误态。

## Content Rules

- 占位文本使用 `neutral-400`，描述期望输入格式，如"请输入课程名称"。
- 占位文本不替代 label，每个 Input 必须有可见的表单标签。
- 字符计数（TextArea）超出 `maxLength` 时使用 `error-500` 高亮。
- 清空按钮仅在有值、非 disabled、非 readOnly 时显示。
- 密码输入的眼睛图标，默认显示"显示密码"状态。

## Accessibility

- 必须使用原生 `<input>` / `<textarea>` 元素，不用 `div` 模拟。
- 每个输入框通过 `<label>` 或 `aria-label` 提供可访问名称。
- 焦点环不能只靠浏览器默认 outline，自定义时必须保证清晰可见。
- 校验状态不能只依赖颜色，需配合 `aria-invalid` 和辅助文本。
- 清空按钮和密码切换按钮提供 `aria-label`。
- 支持键盘操作：Tab 聚焦、Shift+Tab 退出、Enter 提交（表单上下文）。

## Token Mapping

### Input

| Token | Value | 说明 |
|-------|-------|------|
| `sizing.controlHeight.sm` | 24px | SM 高度 |
| `sizing.controlHeight.md` | 32px | MD 高度 |
| `sizing.controlHeight.lg` | 40px | LG 高度 |
| `radii.md` | 8px | SM 圆角 |
| `radii.button` | 10px | MD/LG 圆角 |
| `color.border.default` | #D8E4EB | 默认边框 |
| `color.border.strong` | #B0B3B5 | 悬停边框 |
| `color.border.focus` | #0090D9 | 聚焦边框 |
| `shadow.focusBrand` | 3px #D6F1FF | 品牌焦点环 |
| `shadow.focusError` | 3px #FEE2E2 | 错误焦点环 |
| `color.semantic.error.solid` | #EF4C32 | 错误边框色 |
| `color.semantic.warning.solid` | #FFC506 | 警告边框色 |
| `color.text.primary` | #353D42 | 输入文字色 |
| `color.text.disabled` | #B0B3B5 | 禁用文字色 |

## Do / Don't

- Do: 每个 Input 配合可见的 `<label>` 或明确的 `aria-label`。
- Do: 在 SM 尺寸场景中确认输入内容长度不会频繁溢出。
- Do: 校验错误时在 Input 下方显示明确的错误提示文本。
- Do: TextArea 长文本场景启用 `autoSize` 避免滚动条干扰。
- Don't: 用占位文本替代表单标签。
- Don't: 在禁用态 Input 上隐藏已填入的值。
- Don't: 对密码输入默认显示明文。
