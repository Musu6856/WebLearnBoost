# WebLearnBoost

WebLearnBoost 是一个浏览器扩展试用版，用于把当前网页或选中文本转成学习地图、训练题、本地历史记录和可导出的 Markdown 学习包。

## 试用版下载

当前版本通过 GitHub Releases 分发。

1. 在 Releases 下载 `WebLearnBoost-v0.1.0.zip`。
2. 解压 zip。
3. 打开 Chrome 或 Edge 的扩展管理页。
4. 开启开发者模式。
5. 选择“加载已解压的扩展程序”，加载解压后的文件夹。

更详细的安装步骤见 [测试用户安装说明](WebLearnBoost/INSTALL_FOR_TESTERS.md)。

## 项目目录

插件工程位于 [WebLearnBoost](WebLearnBoost/)。

常用命令：

```powershell
cd WebLearnBoost
npm install
npm run typecheck
npm test
npm run package
```

## Provider 支持

- OpenAI Compatible
- Anthropic Compatible

用户需要自行配置 Base URL、API Key、Model 和输出语言。隐私与数据处理说明见 [PRIVACY.md](WebLearnBoost/PRIVACY.md)。

## 当前版本

最新试用版说明见 [RELEASE_NOTES_v0.1.0.md](WebLearnBoost/RELEASE_NOTES_v0.1.0.md)。
