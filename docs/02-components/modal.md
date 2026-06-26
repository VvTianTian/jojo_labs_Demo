# Modal

Status: Stable

## Purpose

定义弹窗的层级、尺寸、结构、遮罩与操作反馈规范，服务于 Jojo Labs 中后台的确认操作、表单编辑与详情预览场景。

## Overview

- 首批提供 `<Modal>` 组件式用法（受控 `open` / `onClose` / `onOk`）。
- 三档宽度：SM=400px / MD=520px / LG=720px，默认居中展示。
- 支持 `confirmLoading` 异步确认、`okType="danger"` 危险操作、`footer={null}` 隐藏底部。
- 静态方法（`Modal.confirm` / `info` 等）后续迭代。

## When To Use

- 需要用户做出关键决策前的确认，如删除、提交、发布。
- 需要在当前上下文中展示表单、详情或操作指引。
- 需要打断用户当前流程并获取明确回应。

## Anatomy

- **Mask**: 遮罩层，`#00000066`，点击可关闭（`maskClosable`）。
- **Container**: 弹窗主体，白色背景，`shadow.lg`，`radii.lg`（12px）。
- **Header**: 标题 + 关闭按钮，底部分割线。
- **Body**: 内容区域，可滚动。
- **Footer**: 操作区（取消 + 确认按钮），顶部分割线。

## Sizes

| Size | Width | Typical Use |
|------|-------|-------------|
| `sm` | 400px | 简单确认、提示信息 |
| `md` | 520px | 默认，表单弹窗、操作确认 |
| `lg` | 720px | 详情预览、复杂表单 |

## States

- `open` / `closed`：含 `scale` + `opacity` 过渡动画（200ms）。
- `confirmLoading`：确认按钮显示 loading，阻止重复提交。

## Actions

- **确认按钮**：默认 `primary`，可设为 `danger`。
- **取消按钮**：`secondary` 变体。
- **关闭按钮**：右上角 X 图标。
- **ESC 键**：关闭弹窗。
- **遮罩点击**：默认关闭（`maskClosable`）。
- **自定义 Footer**：传 `footer` prop 完全替换，传 `null` 隐藏。

## Accessibility

- 使用 `role="dialog"` + `aria-modal="true"` + `aria-labelledby`。
- 关闭按钮提供 `aria-label="关闭"`。
- ESC 键关闭支持。
- 打开时锁定 body 滚动。

## Token Mapping

- `modal.mask.bg = overlay.mask (#00000066)`
- `modal.bg = background.surface (#FFFFFF)`
- `modal.radius = radii.lg (12px)`
- `modal.header.border = border.subtle (#E6EEF2)`
- `modal.footer.border = border.subtle (#E6EEF2)`
- `modal.title = heading.h5 (16px/600)`

## Do / Don't

- Do: 确认弹窗使用 SM 尺寸，保持轻量。
- Do: 危险操作使用 `okType="danger"` + 二次确认文案。
- Don't: 在弹窗内嵌套过多层级或另一个弹窗。
- Don't: 用弹窗承载大量内容，超过视口 85% 高度时应使用其他模式。
