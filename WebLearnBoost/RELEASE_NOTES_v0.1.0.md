# WebLearnBoost v0.1.0 试用版说明

这是 WebLearnBoost 的第一个可手动验收试用版，目标是验证“把网页变成学习地图和训练题”的主流程是否可用。

## 主要功能

- 从当前网页整页生成学习地图
- 从网页选中文本生成学习地图
- 生成重点摘要和选择题训练
- 答对后自动进入下一题
- 答错后停留在当前题并显示明显反馈
- 显示原文依据，并尝试回到来源网页定位
- 本地保存同一 URL 的多个学习包版本
- 删除单个历史版本
- 导出 Markdown 学习包
- 支持 OpenAI Compatible provider
- 支持通用 Anthropic Compatible provider

## 试用安装

1. 下载 `WebLearnBoost-v0.1.0.zip`。
2. 解压 zip。
3. 打开 `chrome://extensions` 或 `edge://extensions`。
4. 开启开发者模式。
5. 点击“加载已解压的扩展程序”。
6. 选择解压后的扩展文件夹。

更详细步骤见 `INSTALL_FOR_TESTERS.md`。

## 配置要求

需要自备一个兼容模型接口：

- OpenAI Compatible：使用 chat completions 请求格式
- Anthropic Compatible：使用 Messages API 请求格式

需要填写：

- Provider
- Base URL
- API Key
- Model
- 输出语言

## 已知限制

- 目前只支持文本生成，不支持 vision、文件、tool use 或 streaming。
- 不支持浏览器内部页、扩展商店页面和部分受限页面。
- 内容提取质量会受网页结构影响。
- AI 生成速度和稳定性取决于用户配置的模型服务。
- API Key、设置和历史记录保存在本地浏览器里，没有云同步。
- 暂不上架 Chrome Web Store，先通过 GitHub Release 或压缩包分发试用。

## 建议反馈格式

- 浏览器和版本：
- 操作系统：
- Provider 类型：
- 测试网页 URL：
- 操作步骤：
- 实际结果：
- 期望结果：
- 截图或错误提示：
