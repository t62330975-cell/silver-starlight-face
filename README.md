# CERVIS · 银白星光

一个以银白星河和粒子人脸为视觉主题的肌肤探索交互作品。项目展示从视觉主页、原始照片采集到示例报告的完整体验。

**在线体验：[打开作品](https://silver-starlight-face.t62330975.chatgpt.site/)**  
**直接体验采集页：[面部照片采集](https://silver-starlight-face.t62330975.chatgpt.site/#assessment)**

## 面试展示路径

1. 在主页观看粒子从四周汇聚成人脸，点击人脸体验扩散与重新汇聚。
2. 点击像素箭头进入采集页，试用摄像头或上传原始照片。
3. 点击右上角“规则”，查看拍摄与对齐要求。
4. 点击“查看示例报告”，观察 LatticeLoader 进度组件，查看八维指标、雷达图和护理建议。
5. 切换早晚建议或导出带有演示标记的 JSON 报告。

## 功能与范围

| 功能 | 当前状态 |
| --- | --- |
| WebGL 粒子人脸、点击扩散、滚动文字、银白流星 | 已实现 |
| 手机 / 电脑摄像头拍照与照片上传 | 已实现；需要浏览器摄像头权限 |
| JPG / PNG / WebP 上传，15 MB 限制 | 已实现 |
| 保存原图与重新采集 | 已实现 |
| 本地人脸位置、距离、角度与粗略光线引导 | MediaPipe Face Landmarker；加载失败时可手动拍照 |
| 八维皮肤报告、雷达图、护理建议 | 固定示例，**不根据用户照片生成** |
| 真实皮肤分析或医学诊断 | 未接入 |
| YouCam API | 当前没有调用，不消耗分析额度 |

网页不磨皮、不调色，摄像头本身的自动处理需在设备端关闭。照片保留在当前浏览器内；当前采集流程不会将照片上传到分析服务。页面会下载自托管模型与静态资源。

## 技术实现

- 原生 WebGL 着色器：对参考图进行亮度采样，形成粒子人脸及交互轨迹。
- React 19 + esbuild：主页加载控件、报告状态组件与内嵌采集界面。
- MediaPipe Tasks Vision 0.10.21：浏览器本地人脸关键点引导。
- Canvas 2D / CSS：检测页星河、流星、轨道标志、扫描框与规则弹窗。
- React Bits LatticeLoader：点阵状态、耗时及报告准备进度。
- 内嵌页面构建使用替换回调，避免组件脚本中的特殊字符被误处理。

## 本地运行

需要 Node.js 与 pnpm（packageManager 为 pnpm 10.11.0）。

```sh
pnpm install --frozen-lockfile
pnpm run build
```

通过静态服务器打开 `dist/`。例如安装了 Python 时：

```sh
python -m http.server 8765 --directory dist
```

浏览器访问 http://localhost:8765/ 。摄像头需要 HTTPS 或本机 localhost 安全上下文；远程演示使用上方 HTTPS 在线链接。

## 验证

```sh
node test-capture.mjs
node test-demo.mjs
node test-scene.mjs
node test-embedding.mjs
```

这些检查覆盖模拟摄像头权限与清理、原图保留、上传限制、规则弹窗、示例隔离、报告准备失败重试、减少动态效果，以及嵌入脚本与中文文本完整性。它们不替代实机摄像头及浏览器视觉测试。

## 文件结构

- `src/`：采集逻辑、示例报告、点阵组件与星空背景。
- `dist/`：可直接部署的静态资源、图像、字体、模型与已构建脚本。
- `build.mjs`：构建脚本。
- `embed-assessment.mjs`：安全嵌入采集页面的构建辅助函数。

## 素材与组件说明

粒子视觉方向参考 [isladjan/particles-playground](https://github.com/isladjan/particles-playground)，当前着色器及轨迹逻辑独立编写。人脸图与星轨标志由项目创作者提供。

Righteous 与 Orbitron 字体的 OFL 许可保留在 `dist/fonts/`。LatticeLoader 源码来自项目创作者提供的 React Bits 组件说明。MediaPipe 依赖的来源与版本见 `package.json` 及 `pnpm-lock.yaml`。本仓库不对第三方素材和组件重新授权。

## 后续方向

接入服务端皮肤分析 API 后，再提供真实图像分析与对应建议；API 密钥应只保存在服务端。当前作品展示已有交互和报告设计，示例数值不代表临床评分。
