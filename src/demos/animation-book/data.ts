import type {
  AnimationBook,
  AnimationBookPage,
  BubbleElement,
  ImageElement,
  MotionElement,
  ProductionAsset,
  ProductionRequirement,
  PlaybackOrderItem,
  RequirementTarget,
  RequirementType,
  TextElement,
} from "./types";

const asset = (name: string) => `/animation-book/assets/${name}`;

const coverImage: ImageElement = {
  id: "cover-image",
  type: "image",
  x: 82,
  y: 86,
  width: 730,
  height: 822,
  zIndex: 1,
  src: asset("scene-1.jpeg"),
  alt: "绘本封面插图",
  objectFit: "cover",
};

const coverTitle: TextElement = {
  id: "cover-title",
  type: "text",
  x: 980,
  y: 212,
  width: 760,
  height: 150,
  zIndex: 2,
  content: "北风和太阳",
  fontSize: 76,
  color: "#353e42",
  fontWeight: "bold",
  audioUrl: null,
  annotations: [],
};

const coverMeta: TextElement = {
  id: "cover-meta",
  type: "text",
  x: 986,
  y: 432,
  width: 700,
  height: 270,
  zIndex: 3,
  content: "绘本主题：寓言故事\n蓝思指数：33L\n虚构/非虚构：虚构",
  fontSize: 30,
  color: "#5d6468",
  fontWeight: "regular",
  audioUrl: null,
  annotations: [],
};

const firstText: TextElement = {
  id: "page-1-text",
  type: "text",
  x: 104,
  y: 108,
  width: 810,
  height: 430,
  zIndex: 2,
  content:
    "一阵暴雨从天而降，将采石场里的一堆石头冲刷得一尘不染。暴雨过后，太阳从厚厚的云层中探出头来。",
  fontSize: 48,
  color: "#404040",
  fontWeight: "regular",
  audioUrl: null,
  annotations: [],
};

const firstImage: ImageElement = {
  id: "page-1-image",
  type: "image",
  x: 1000,
  y: 196,
  width: 774,
  height: 582,
  zIndex: 1,
  src: asset("scene-3.png"),
  alt: "石头和阳光下的场景",
  objectFit: "contain",
};

const firstDecoration: ImageElement = {
  id: "page-1-decoration",
  type: "image",
  x: 1074,
  y: 692,
  width: 622,
  height: 332,
  zIndex: 3,
  src: asset("scene-7.png"),
  alt: "太阳和北风插画",
  objectFit: "contain",
};

const firstMotion: MotionElement = {
  id: "page-1-motion",
  type: "motion",
  x: 1410,
  y: 746,
  width: 370,
  height: 220,
  zIndex: 4,
  src: null,
  fileName: "待上传动效",
  objectFit: "contain",
};

const secondText: TextElement = {
  id: "page-2-text",
  type: "text",
  x: 924,
  y: 112,
  width: 840,
  height: 350,
  zIndex: 2,
  content: "我把钻石献给尊贵的国王，他一定会非常喜欢！",
  fontSize: 48,
  color: "#404040",
  fontWeight: "regular",
  audioUrl: null,
  annotations: [],
};

const secondImage: ImageElement = {
  id: "page-2-image",
  type: "image",
  x: 132,
  y: 160,
  width: 700,
  height: 724,
  zIndex: 1,
  src: asset("scene-9.png"),
  alt: "故事角色插图",
  objectFit: "contain",
};

const secondBubble: BubbleElement = {
  id: "page-2-bubble",
  type: "bubble",
  x: 1000,
  y: 540,
  width: 650,
  height: 250,
  zIndex: 3,
  content: "好的先生，请把我也带给国王吧，他一定会喜欢我。",
  direction: "left",
  tailX: 8,
  tailY: 70,
  audioUrl: null,
};

const thirdTitle: TextElement = {
  id: "page-3-title",
  type: "text",
  x: 660,
  y: 94,
  width: 620,
  height: 90,
  zIndex: 3,
  content: "有用的石头",
  fontSize: 52,
  color: "#353e42",
  fontWeight: "bold",
  audioUrl: null,
  annotations: [],
};

const thirdText: TextElement = {
  id: "page-3-text",
  type: "text",
  x: 184,
  y: 250,
  width: 800,
  height: 390,
  zIndex: 2,
  content:
    "几天后，有人来石场拉石头，原来是村里的人要盖房子啦。鹅卵石心想：虽然不能见国王，但我还可以盖房子呀。",
  fontSize: 48,
  color: "#404040",
  fontWeight: "regular",
  audioUrl: null,
  annotations: [],
};

const thirdImage: ImageElement = {
  id: "page-3-image",
  type: "image",
  x: 1070,
  y: 360,
  width: 680,
  height: 510,
  zIndex: 1,
  src: asset("scene-7.png"),
  alt: "石头插画",
  objectFit: "contain",
};

const richText = (html: string) => ({
  html,
  text: html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim(),
});

const uploadedAsset = (url: string, fileName: string, mimeType: string): ProductionAsset => ({
  url,
  fileName,
  mimeType,
  uploadedAt: "2026-08-24T09:00:00.000Z",
});

const requirement = (
  id: string,
  type: RequirementType,
  title: string,
  html: string,
  target: RequirementTarget | null,
  asset: ProductionAsset | null = null,
): ProductionRequirement => ({
  id,
  type,
  title,
  brief: richText(html),
  target,
  asset,
  status: asset ? "uploaded" : "pending",
});

const createPage = (
  id: string,
  label: string,
  elements: AnimationBookPage["elements"],
  backgroundColor = "#fefcf8",
  requirements: ProductionRequirement[] = [],
): AnimationBookPage => {
  const visualRequirements = elements
    .filter((element): element is ImageElement | MotionElement => element.type === "image" || element.type === "motion")
    .filter((element) => !requirements.some(
      (candidate) => candidate.type === element.type && candidate.target?.kind === "element" && candidate.target.elementId === element.id,
    ))
    .map((element) => requirement(
      `${element.id}-brief`,
      element.type,
      element.type === "image" ? "图片制作需求" : "动效制作需求",
      "",
      { kind: "element", elementId: element.id },
    ));
  const nextRequirements = [...requirements, ...visualRequirements];
  const playbackOrder: PlaybackOrderItem[] = elements.map((element) => ({
    elementId: element.id,
    displayMode: "always",
  }));

  return {
    id,
    label,
    kind: "page",
    backgroundColor,
    elements,
    appearanceOrder: elements.map((element) => element.id),
    playbackOrder,
    requirements: nextRequirements,
  };
};

export const initialAnimationBook: AnimationBook = {
  id: "animation-book-demo",
  title: "我是有用的鹅卵石",
  language: "zh",
  coverLayout: "split",
  cover: {
    id: "cover",
    label: "封面",
    kind: "cover",
    backgroundColor: "#fefcf8",
    elements: [coverImage, coverTitle, coverMeta],
    appearanceOrder: [coverImage.id, coverTitle.id, coverMeta.id],
    playbackOrder: [],
    requirements: [
      requirement(
        "cover-image-brief",
        "image",
        "封面主视觉",
        "<p><strong>画面方向：</strong>保留温暖的绘本质感，北风和太阳需要有明显的角色关系。</p><p>构图以左右分区为主，主体清晰，适合儿童阅读。</p><figure><img src=\"/animation-book/assets/scene-2.jpeg\" alt=\"参考构图\"><figcaption>参考构图与色彩氛围</figcaption></figure>",
        { kind: "element", elementId: coverImage.id },
        uploadedAsset(asset("scene-1.jpeg"), "scene-1.jpeg", "image/jpeg"),
      ),
    ],
  },
  pages: [
    createPage(
      "page-1",
      "正文 1",
      [firstText, firstImage, firstDecoration, firstMotion],
      "#fefcf8",
      [
        requirement(
          "page-1-image-brief",
          "image",
          "石头与阳光场景",
          "<p>请保持画面明亮、干净，突出雨后阳光照在石头上的质感。</p><p><em>参考重点：</em>暖黄色光线、清晰的石头轮廓和留白。</p>",
          { kind: "element", elementId: firstImage.id },
          uploadedAsset(asset("scene-3.png"), "scene-3.png", "image/png"),
        ),
        requirement(
          "page-1-motion-brief",
          "motion",
          "阳光闪动动效",
          "<p>让阳光区域有轻微闪动感，节奏舒缓，不要影响正文阅读。</p><p>动效产物上传后先以静态占位展示。</p>",
          { kind: "element", elementId: firstMotion.id },
        ),
        requirement(
          "page-1-text-audio-brief",
          "audio",
          "正文语音",
          "<p>语速偏慢，语气温和，注意“暴雨”和“太阳”两个词的情绪转折。</p>",
          { kind: "element", elementId: firstText.id },
        ),
      ],
    ),
    createPage(
      "page-2",
      "正文 2",
      [secondImage, secondText, secondBubble],
      "#fefcf8",
      [
        requirement(
          "page-2-image-brief",
          "image",
          "角色场景插画",
          "<p>角色表情要有礼貌但略带期待，画面保留对话气泡的安全空间。</p>",
          { kind: "element", elementId: secondImage.id },
          uploadedAsset(asset("scene-9.png"), "scene-9.png", "image/png"),
        ),
        requirement(
          "page-2-bubble-audio-brief",
          "audio",
          "角色对话语音",
          "<p>声音要有请求感，句尾保持轻柔，不要过度夸张。</p>",
          { kind: "element", elementId: secondBubble.id },
        ),
      ],
    ),
    createPage(
      "page-3",
      "正文 3",
      [thirdTitle, thirdText, thirdImage],
      "#fefcf8",
      [
        requirement(
          "page-3-text-audio-brief",
          "audio",
          "正文语音",
          "<p>语气轻快，强调故事从失望转向有用的情绪变化。</p>",
          { kind: "element", elementId: thirdText.id },
        ),
      ],
    ),
  ],
};

export const getElementLabel = (type: AnimationBookPage["elements"][number]["type"]) => {
  if (type === "text") return "文本";
  if (type === "image") return "图片";
  if (type === "motion") return "动效";
  return "气泡";
};
