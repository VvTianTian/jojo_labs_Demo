# Button

Status: Ready

## Purpose

定义按钮的语义层级、视觉变体、尺寸与交互状态，服务于 Jojo Labs 中后台的关键提交、普通流程操作和高风险动作。

## Overview

- 当前 Button 参考 Ant Design 的三档尺寸，统一使用 `sm / md / lg = 24 / 32 / 40`。
- `Primary` 作为默认基线，固定为 `32px` 高、`14px` 字号、`10px` 圆角。
- 组件优先保证状态可识别性和操作层级，不追求营销化视觉效果。

## When To Use

- 触发当前上下文中的单次明确操作，如保存、提交、确认发布。
- 在工具栏、列表或弹窗中承载普通流程动作，如取消、批量指派、查看规则。
- 用 `danger` 表达删除、移除、停用等高风险操作。
- 用 `text` 表达低干扰辅助操作，而不是与主按钮竞争注意力。

## Anatomy

- Container: 承载点击热区、边框、背景和焦点态。
- Label: 使用简洁动词短语，优先 2 到 6 个中文字符。
- Icon: 作为补充语义出现，不替代文案本身。
- Loading Indicator: 与文案共同出现，用于阻止重复提交并说明当前状态。

## Variants

- `primary`: 区域内最重要的动作，每个局部区域最多一个。
- `secondary`: 普通操作按钮，用于取消、返回、次级确认。（默认值）
- `primary-outline`: 蓝色描边 + 蓝色文字 + 透明背景，用于工作台表单区域，层级介于主按钮与次按钮之间。
- `text`: 最弱层级的按钮，适合工具栏、文档入口和辅助动作。
- `link`: 无边距、无背景的纯文字按钮，用于跳转链接或表格操作列，仅靠颜色变化区分状态。
- `danger`: 高风险动作按钮，适合删除、驳回、停用等不可逆行为。

## States

- `default`: 可点击且未被聚焦。
- `hover`: 提供轻量颜色反馈，不依赖位移动画制造存在感。
- `active`: 使用更深一档颜色，明确按压反馈。
- `focus-visible`: 使用品牌色或错误语义焦点环，满足键盘可达性。
- `disabled`: 不可点击，并降低文字和背景对比。
- `loading`: 进入处理中，显示加载图标并阻止重复触发。

## Sizes

| Size | Height | Padding X | Font | Icon | Radius | Typical Use |
|------|--------|-----------|------|------|--------|-------------|
| `sm` | 24px | 8px | 12px / Body SM | 12px | 8px (`radii.md`) | 工具栏、表格行内、紧凑操作 |
| `md` | 32px | 12px | 14px / Body Base | 16px | 10px (`radii.button`) | 默认表单、弹窗确认、常规 CTA |
| `lg` | 40px | 16px | 14px / Body Base | 16px | 10px (`radii.button`) | 低密度页面中的强调按钮 |

> **圆角规则**: 圆角随控件高度变化。SM 使用 `radii.md`（8px），MD/LG 使用 `radii.button`（10px，按钮圆角上限）。

### Primary Baseline

- Height: `32px`
- Font Size: `14px`
- Font Weight: `600`
- Radius: `10px`（MD 默认值）
- Background: 品牌主色
- Use: 默认提交、确认发布、进入下一步

## Content Rules

- 文案优先使用动词开头，如“保存设置”“确认发布”“删除素材”。
- 不把整句解释塞进按钮，复杂说明应放在按钮附近的正文中。
- 同一操作组内避免多个长度差异过大的按钮并排，防止视觉重心失衡。
- 纯图标按钮必须提供 `aria-label`，且只用于用户可快速识别的高频操作。

## Accessibility

- 必须使用原生 `<button>` 元素，不用 `div` 模拟点击。
- 焦点态不能只靠浏览器默认 outline，被自定义时必须保留清晰可见的 focus ring。
- 危险、禁用、加载等状态不能只依赖颜色，也要通过文案或图标辅助表达。
- Loading 状态应阻止重复点击，并在必要时补充处理中语义。

## Token Mapping

- `button.height.sm = 24px`
- `button.height.md = 32px`
- `button.height.lg = 40px`
- `button.radius.sm = 8px` (`radii.md`)
- `button.radius.default = 10px` (`radii.button`，MD/LG 共用)
- `button.primary.text = 14px / 600`
- `button.primary.bg = color.brand.500`
- `button.primary.hover = color.brand.600`
- `button.primary.active = color.brand.700`
- `button.secondary.border = color.border.default`
- `button.danger.bg = color.semantic.error.solid`
- `button.primary-outline.border = color.brand.500`
- `button.primary-outline.text = color.brand.500`
- `button.primary-outline.hover-border = color.brand.600`
- `button.primary-outline.hover-bg = color.brand.50`
- `button.link.text = color.brand.500`
- `button.link.hover = color.brand.600`
- `button.link.active = color.brand.700`

## Do / Don't

- Do: 在局部区域只保留一个 `primary`，确保主操作清晰。
- Do: 在列表、工具栏等高密度场景优先使用 `sm`。
- Do: 危险操作使用 `danger`，必要时再结合二次确认弹窗。
- Don't: 用多个主按钮争抢注意力。
- Don't: 把说明性句子当作按钮文案。
- Don't: 让纯图标按钮没有名称或提示。
