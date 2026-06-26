# Tag

Status: Stable

## Purpose

定义标签组件的语义用途、颜色映射、变体与组合规则，服务于 Jojo Labs 中后台的分类标记、状态展示与批量标签场景。

## Overview

- 三种变体：`outlined`（描边）、`filled`（浅底填充）、`solid`（实心填充）。
- 六种语义颜色：`default` / `brand` / `success` / `warning` / `error` / `info`。
- 支持 `closable` 可关闭、`icon` 前置图标、`disabled` 禁用。
- CheckableTag（可选择标签）后续迭代。

## When To Use

- 展示分类信息：课程分类、内容标签、优先级。
- 展示流程状态：审核中、已发布、已归档。
- 表单中多选值的可视化展示（与 Select 多选配合）。
- 筛选条件中的已选条件标签。

## Anatomy

- **Root**: 承载背景、边框、圆角、文字颜色。
- **Icon**（可选）: 前置图标，12×12px。
- **Content**: 标签文字。
- **Close Button**（可选）: X 图标，点击触发 `onClose`。

## Variants

| Variant | 视觉特征 | 使用场景 |
|---------|----------|----------|
| `outlined` | 描边 + 透明背景 | 最轻量标记，筛选条件、元信息 |
| `filled` | 浅色背景 + 深色文字 | 分类标签、内容标记（默认） |
| `solid` | 实心背景 + 白色文字 | 强状态标记、高优先级 |

## Status Mapping（语义色）

| Color | 语义用途 | Token 来源 |
|-------|---------|-----------|
| `default` | 通用、无特定语义 | `neutral` |
| `brand` | 品牌相关、进行中 | `semantic.brand` |
| `success` | 完成、通过、已发布 | `semantic.success` |
| `warning` | 待处理、需注意 | `semantic.warning` |
| `error` | 失败、驳回、过期 | `semantic.error` |
| `info` | 提示信息、参考 | `semantic.info` |

## Content Rules

- 文案控制在 2-8 个字符，避免长句。
- 同一组标签尽量使用相同变体，不混用 `outlined` 和 `solid`。
- 语义颜色必须与含义对应：成功用 `success`，错误用 `error`，不随意用色。
- 可关闭标签提供 `onClose` 回调，关闭动画由父组件控制。

## Token Mapping

- `tag.radius = radii.sm (4px)`
- `tag.font-size = fontSize.xs (12px)`
- `tag.height = 22px`
- `tag.padding-x = space.2xs (4px)` → `8px`
- `tag.outlined.border = border.default (#D8E4EB)`
- `tag.filled.brand.bg = semantic.brand.bg (#EBF9FF)`
- `tag.solid.brand.bg = semantic.brand.solid (#0090D9)`
- `tag.solid.brand.text = color.text.inverse (#FFFFFF)`

## Do / Don't

- Do: 批量标签统一使用 `filled` 变体，视觉和谐。
- Do: 状态标签使用对应语义色，如审核通过用 `success`。
- Don't: 在同一个标签组内混用 3 种变体。
- Don't: 把 Tag 当作 Button 使用（Tag 不可交互，除关闭按钮外）。
