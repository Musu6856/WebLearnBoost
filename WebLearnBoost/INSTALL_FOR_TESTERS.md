# WebLearnBoost 试用安装说明

这是一份给内测用户看的安装说明。WebLearnBoost 目前还没有上架浏览器扩展商店，需要用开发者模式手动加载。

## 你需要准备

- Chrome、Edge 或其他 Chromium 系浏览器
- 一个可用的 OpenAI Compatible 或 Anthropic Compatible 模型接口
- 对应的 Base URL、API Key 和 Model 名称

## 安装步骤

1. 下载发布包 `WebLearnBoost-v0.1.1.zip`。
2. 解压这个 zip，得到一个扩展文件夹。
3. 打开浏览器扩展管理页：
   - Chrome：地址栏输入 `chrome://extensions`
   - Edge：地址栏输入 `edge://extensions`
4. 打开右上角的“开发者模式”。
5. 点击“加载已解压的扩展程序”。
6. 选择刚才解压出来的扩展文件夹。
7. 打开任意普通网页，点击 WebLearnBoost 扩展入口，在侧边栏开始使用。

注意：不要直接选择 zip 文件，浏览器需要加载解压后的文件夹。

## 配置模型

1. 打开 WebLearnBoost 侧边栏。
2. 点击右上角设置按钮。
3. 选择 Provider：
   - `OpenAI Compatible`
   - `Anthropic Compatible`
4. 填写 Base URL、API Key、Model 和输出语言。
5. 保存后回到入口页生成学习地图。

## 建议测试流程

1. 打开一篇普通文章页。
2. 用“整页”生成学习地图。
3. 点击开始训练，完成几道选择题。
4. 点击原文依据，确认能回到来源页面或看到可理解提示。
5. 导出 Markdown，检查内容是否完整。
6. 再选中网页里的一段文字，用“选中段落”重新测试。
7. 打开历史，确认能看到多个版本并能删除。

## 反馈问题时请带上

- 浏览器名称和版本
- 操作系统
- Provider 类型，不需要提供 API Key
- 测试网页 URL
- 出错前的操作步骤
- 截图或错误提示文字
- 是否可以稳定复现

## 已知限制

- 只支持普通网页，不支持浏览器内部页面、扩展商店页面和部分受限页面。
- 选区模式需要先在网页正文里选中可复制文本。
- AI 生成速度取决于你配置的模型服务。
- API Key 和历史记录保存在浏览器本地；卸载扩展或清理浏览器数据可能会删除它们。
