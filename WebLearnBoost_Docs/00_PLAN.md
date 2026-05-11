# 网页学习增强器：产品与实现计划

## Summary
做一个独立重写的 Chrome/Edge 浏览器插件，参考 AISummarizer 这类网页总结插件的思路，但产品定位改为“AI 技术资料学习增强器”。目标用户是正在自学 RAG、Agent、MCP、AI 框架文档和技术博客的人。

第一版核心体验：用户打开一篇技术网页，插件先生成“学习地图”，再进入训练页，输出重点、概念卡/对比卡、选择题。每条内容带原文摘录和页面定位。目标验收是：用户能在 10 分钟内完成一篇资料的学习包生成和自测。

协作方式：你参与选题、问题定义、调研判断、竞品分析、PRD确认、原型反馈和验收；代码实现由我来做，但每个产品关键点先讨论再落地。

## Key Changes
- 产品形态：Chrome/Edge Manifest V3 插件，React + TypeScript，技术感清爽风格。
- 内容输入：支持整页提取和选中段落提取，第一版只覆盖普通网页、技术博客、技术文档，不做 PDF/YouTube。
- 学习流程：两步式侧边栏，先展示学习地图，再进入重点、卡片、自测。
- AI 接入：无后端，用户本地填写 API Key；支持 OpenAI-compatible 接口和 Claude-compatible 接口。
- 可信机制：学习地图、重点、卡片、题目、解析都带原文依据；能跳回网页对应位置。
- 保存机制：学习包保存在浏览器插件本地存储；默认保留最近 50 篇，支持查看、删除单篇、导出 Markdown。
- 成本提示：生成前显示预计处理字数和轻量成本提醒，不做复杂预算系统。

## Interfaces And Data
- 设置页字段：provider 类型、base URL、API Key、model、输出语言，默认中文解释并保留英文术语。
- 学习包字段：网页标题、URL、生成时间、输入范围、知识点清单、学习地图、重点、概念卡、对比卡、选择题、答题记录、来源锚点。
- 题量规则：短文 3 题，中等 5 题，长文 8 题。
- 知识点状态：生成后默认未掌握；答对相关选择题后自动更新为已掌握。
- 导出格式：Markdown，包含标题、链接、学习地图、重点、卡片、题目、答案解析和原文依据。

## Work Plan
- 阶段 1：产品定义  
  和你一起完成问题定义、目标用户、核心场景、痛点优先级、现有方案不足。
- 阶段 2：调研与竞品  
  先用你的真实场景做模拟调研，再设计访谈问题，后续补 2-3 个真实用户反馈；竞品看 AI 总结插件、Anki/Quizlet、NotebookLM、AI 学习工具。
- 阶段 3：PRD 与原型  
  输出 PRD，明确用户故事、流程、字段、异常状态、优先级；再做低保真侧边栏原型，重点确认两步流程是否顺。
- 阶段 4：代码实现  
  独立新建插件项目，不直接 fork；使用 Readability 思路提取正文，侧边栏展示学习包，调用用户配置的 AI 接口，保存本地历史。
- 阶段 5：验证与迭代  
  用 3 篇 AI 技术网页测试：短文、中等教程、长技术文档；检查学习地图是否完整、题目是否有效、来源定位是否可用、10 分钟学习闭环是否成立。

## Test Plan
- 功能测试：整页生成、选段生成、API 设置、学习地图、卡片、自测、答案解析、来源跳转、本地保存、删除、Markdown 导出。
- 内容测试：RAG、Agent、MCP 三类网页各至少 1 篇，验证是否漏掉核心概念。
- 兼容测试：Chrome 和 Edge；普通技术博客、文档站、长文章。
- 失败场景：无 API Key、接口报错、网页正文提取失败、文章太长、AI 返回格式不合法。
- 验收标准：打开一篇 AI 技术教程后，10 分钟内完成学习包生成、自测和至少一次来源回看。

## Assumptions
- 项目工作名暂定为“网页学习增强器”，正式命名后面再定。
- 第一版优先真实可用和作品集表达，不做账号系统、云同步、PDF、YouTube、移动端。
- 参考资料包括 [AISummarizer](https://github.com/gumob/AISummarizer)、[MZR Summarizer](https://github.com/zainriaz-dev/mzr-summarizer)、[Mozilla Readability](https://github.com/mozilla/readability)、[Chrome Side Panel API](https://developer.chrome.com/docs/extensions/reference/sidePanel/)。
