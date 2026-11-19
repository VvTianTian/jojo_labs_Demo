Labs 星球呼啦圈 Loading 动画 · 第六版

在第五版动作的基础上，只调整星球身体上的光环投影。投影使用正前偏上的固定
光源，并根据光环的前后深度、球面和遮挡变化；原有光环及星球运动保持不变。

交付内容
- frames-60fps/：75 张 PNG，透明背景，309 × 309 像素，60 帧/秒。
- frames-24fps/：30 张 PNG，透明背景，309 × 309 像素，24 帧/秒。
- labs-loading-preview-60fps-transparent.png：60 帧/秒透明背景 APNG。
- labs-loading-preview-60fps-dark.png：60 帧/秒深色背景 APNG，背景仅用于预览。
- labs-loading-preview-24fps-transparent.png：24 帧/秒透明背景 APNG。
- labs-loading-preview-24fps-dark.png：24 帧/秒深色背景 APNG，背景仅用于预览。
- labs-loading-figma-transparent.gif：供 Figma 原型导入的透明 GIF。
- labs-loading-figma-dark-preview.gif：深色背景 GIF，供直接预览。
- labs-loading-shadow-steps.png：投影前后变化的关键帧对照。
- source/：Figma 原始 Logo 矢量和生成脚本。

播放设置
- PNG 序列按照编号从小到大播放，最后一帧后直接返回第一帧。
- 60 帧/秒版：75 张，1.25 秒一轮；24 帧/秒版：30 张，1.25 秒一轮。
- GIF 版：63 张，50 帧/秒，1.26 秒一轮。GIF 的透明边缘采用二值透明，
  优先以 PNG 序列作为高质量交付素材。
- 原始 Figma 画板为 103 × 103；导出尺寸为 3 倍。

源文件说明
- labs-logo-original.svg 为 Figma 原始 Logo 矢量。
- generate.mjs 使用 Node.js 及 sharp 生成 PNG 序列帧及身体投影。
- prepare-preview.py 使用 Python 及 Pillow 生成 APNG 动画预览。
- prepare-figma-gif.py 使用 Node.js、sharp、Python 和 Pillow 生成 GIF。
- frame-diagnostics.json 记录运动、接触间隙及受压程度。

原始设计：
https://www.figma.com/design/OG90DoBqhmXweu1qDvwvWB/?node-id=13989-36335
