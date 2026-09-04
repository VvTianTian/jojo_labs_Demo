# 图片框直接上传视觉 QA

## Reference

- Source: `/var/folders/lz/hld1xzrs23d87zwy2d2j7s3r0000gn/T/codex-clipboard-db85f8e7-b602-4dc8-b161-521017ac866d.png`
- Tested route: `/animation-book`
- Tested states: 制作人员角色、图片框已上传、图片框未上传、教研人员角色

## Checks

- 图片框保留蓝色选中边界和“图片”标签。
- 制作人员图片框显示 Hover/选中操作层，包含上传和删除按钮。
- 上传后图片使用 `contain` 完整显示，保持原始比例。
- 图片需求区域与图片框内容区域独立，需求按钮仍可展开/收起。
- 上传成功后需求自动收起；未上传图片的图片框需求保持展开。
- 切回教研人员后图片上传/删除操作不再显示。

## Verification

- 浏览器主流程：passed
- 组件视觉与附件状态对照：passed
- Final result: passed
