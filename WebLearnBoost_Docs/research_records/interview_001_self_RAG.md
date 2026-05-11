# Interview 001: Self Interview - RAG Learning

## 1. Basic Info

- Interview type: Self interview
- Participant: Product initiator
- Scenario: Learning RAG-related tutorial/documentation
- Date: 2026-05-11
- Material used: Multiple webpages found through search engines and AI recommendations; no single fixed article.
- Interview status: Completed

## 2. Interview Goal

This interview records a real RAG learning experience and validates early assumptions from `02_用户调研.md`.

Main questions:

- Does the learner experience "understood while reading, but unable to explain later"?
- Does the learner worry about missing key concepts, limitations, or pitfalls?
- How does the learner currently use AI while reading technical materials?
- Would a generated learning package help the learner feel more confident about mastery?

## 3. Interview Notes

### 3.1 Before Learning: Motivation And Material Selection

#### Q1. 最近一次学习 RAG 相关资料，是因为什么触发的？

Answer:

最近学习 RAG 主要有三个触发点：看到岗位/JD 或相关文章频繁提到 RAG；想补 AI 技术知识；被某些相关概念卡住，想弄清楚它到底是什么、怎么用，以及和其他概念的关系。

Evidence / behavior:

- 触发来源包括岗位/JD、技术文章和概念卡点。
- 学习动机既有求职表达，也有知识补齐。

Emotion / friction:

- 对 AI 技术知识体系有补齐焦虑。
- 对相关概念之间的关系存在不确定感。

Insight:

- 学习动机不是单纯兴趣，而是“求职需要 + 技术体系补全 + 概念卡点”共同驱动。

#### Q2. 你当时希望通过这篇资料解决什么问题？

Answer:

希望先搞清楚 RAG 到底是什么，再理解它的完整流程，同时希望以后能在面试或简历里讲清楚相关内容。

Evidence / behavior:

- 目标同时包含理解概念、掌握流程和对外表达。

Emotion / friction:

- 希望学习结果能转化成可表达的内容，而不只是看过资料。

Insight:

- 产品需要支持“理解 -> 结构化 -> 能讲清”的转化，而不是只生成摘要。

#### Q3. 你是怎么找到这篇资料的？它是官方文档、技术博客、教程，还是别人推荐的内容？

Answer:

资料主要来自搜索引擎或 AI 推荐，并且不是固定只看一篇，而是在多个网页之间来回切换。

Evidence / behavior:

- 使用搜索引擎和 AI 推荐找资料。
- 学习过程不是单篇文章线性阅读，而是多网页跳转。

Emotion / friction:

- 多资料切换容易带来路径不确定，不知道哪篇该先看、哪篇更适合当前阶段。

Insight:

- 学习地图不只需要总结当前网页，也可能需要提示当前网页在学习路径中的位置。

#### Q4. 打开资料前，你是否已经知道自己要重点看什么？

Answer:

打开资料前基本不知道要重点看什么，只是先点进去看看，希望从资料里建立初步认知。

Evidence / behavior:

- 进入资料前没有明确阅读目标或重点清单。

Emotion / friction:

- 容易一边读一边判断重点，前期进入状态慢。

Insight:

- 读前学习地图具有明确价值，可以帮助用户先建立方向。

#### Q5. 如果资料很长，你通常会先通读、跳读，还是先问 AI？

Answer:

如果资料很长，通常会先尝试从头通读，但过程中会跳读，挑看起来重要或能看懂的部分；也可能复制给 AI 让它总结。如果内容太长、太密，容易先收藏、放弃，或者转而找一篇更短的资料。

Evidence / behavior:

- 通读、跳读、问 AI、收藏、放弃、找短资料都会发生。

Emotion / friction:

- 长资料会带来读不完和难进入的压力。

Insight:

- 产品应帮助用户降低长文档进入门槛，但不能只做压缩摘要，需要服务后续掌握。

### 3.2 During Learning: Reading Behavior And Friction

#### Q6. 阅读过程中，你会做哪些动作？例如划重点、复制给 AI、做笔记、收藏、截图。

Answer:

阅读过程中会复制内容给 AI、截图、收藏链接、搜索不懂的词，也会用 Obsidian + LLM 搭建个人知识库来整理资料。这个方式有一定效果，但整理成本很高，耗时间也耗 token。很多时候注意力被“怎么整理、怎么归档、怎么让知识库结构更好”占据，反而挤压了真正理解和学习的时间。

Evidence / behavior:

- 使用 AI 解释资料。
- 使用截图、收藏和搜索辅助阅读。
- 使用 Obsidian + LLM 搭建个人知识库。

Emotion / friction:

- 整理动作过重，学习本身被工具流程吞掉。
- 对时间和 token 成本敏感。

Insight:

- WebLearnBoost 不应再制造复杂整理负担，而应把网页快速转成轻量学习包。

#### Q7. 哪些内容最容易让你停下来？是概念定义、概念对比、代码步骤、限制条件，还是案例？

Answer:

最容易停下来的内容包括概念定义、代码步骤/实现流程、限制条件/适用边界、案例/项目落地，以及大量专有名词。概念定义决定能不能入门，代码和案例决定能不能落地，限制条件决定会不会误用，专有名词太多会显著增加阅读阻力。

Evidence / behavior:

- 会在概念、流程、边界和案例处停顿。
- 代码实现会影响理解，但不是最核心关注点。

Emotion / friction:

- 专有名词密集会增加阅读负担。
- 限制条件和适用边界容易引发不确定感。

Insight:

- 第一版更应强调概念结构、流程逻辑、适用边界和案例理解，而不是深入代码训练。

#### Q8. 你会不会担心自己漏掉了关键内容？如果会，具体担心漏掉什么？

Answer:

经常会想看了这个还要看什么、要去哪里看、学习路径对不对。也担心自己是否掌握了概念的原理和边界。

Evidence / behavior:

- 关心当前资料之后的下一步学习内容。
- 关心概念原理和边界是否掌握。

Emotion / friction:

- 最大的不确定不是单个细节，而是整体学习路径是否正确。

Insight:

- “学习地图”需要覆盖文章内部结构，也应提示下一步学习方向或待补知识。

#### Q9. 你有没有把网页内容交给 AI 解释或总结？如果有，通常怎么操作？

Answer:

如果 AI 能访问链接，就直接给链接；但有些网站需要登录信息，AI 访问不了，只能手动复制给 AI。也会使用已有浏览器插件，例如 Gemini 相关工具，但这些工具只能在特定浏览器中使用，还需要账号，有时候也挺麻烦。另一个方式是把资料整理进 Obsidian + LLM 的个人知识库。

Evidence / behavior:

- 优先给 AI 链接。
- 遇到登录限制时手动复制内容。
- 尝试过浏览器插件和个人知识库流程。

Emotion / friction:

- AI 无法访问链接、插件依赖浏览器/账号、知识库维护成本高，都会打断学习。

Insight:

- 插件应在当前网页上下文中直接提取内容，减少“AI 访问不了网页”带来的复制成本。

#### Q10. AI 的回答有没有让你感觉“不确定它是不是覆盖完整”？

Answer:

AI 的回答经常看起来是对的，也愿意相信它，但同时又不完全信任。主要不确定它有没有覆盖原文重点，回答有时过于概括，可能漏掉细节。看完 AI 回答后仍然需要回原文核对，也会继续追问“还有什么我需要知道的吗”。整体状态是矛盾的：很想依赖 AI 提高学习效率，但又担心它漏讲、概括过度或没有依据。

Evidence / behavior:

- 会回原文核对 AI 回答。
- 会继续追问 AI 是否还有遗漏。

Emotion / friction:

- 想信任 AI，但缺少信任依据。

Insight:

- 原文依据/定位是建立信任的底座，尤其在用户不确定时发挥作用。

#### Q11. 学习过程中，有没有出现来回复制、追问、核对原文很麻烦的情况？

Answer:

有，而且贯穿整个学习过程。主要麻烦点包括：AI 无法访问需要登录的网页时必须手动复制；AI 回答后仍要回原文核对；为了整理到 Obsidian + LLM 知识库，需要额外花时间整理、归档和消耗 token。这些动作会打断学习节奏，让注意力从理解内容转移到处理工具流程。

Evidence / behavior:

- 手动复制网页内容。
- AI 回答后回原文核对。
- 维护个人知识库。

Emotion / friction:

- 工具流程抢占学习注意力。

Insight:

- 第一版应减少复制、整理和归档负担，让用户更快进入学习和验证。

### 3.3 After Learning: Mastery Check

#### Q12. 学完之后，你怎么判断自己是否真的学会了？

Answer:

学完后主要通过几个方式判断自己是否学会：能不能用自己的话讲出来，能不能整理进笔记，能不能回答 AI 或别人追问的问题，以及能不能继续看懂更进阶的资料。掌握感不是来自“看完”，而是来自复述、整理、问答和继续学习时的顺畅程度。

Evidence / behavior:

- 以复述、笔记、问答、进阶阅读作为掌握判断。

Emotion / friction:

- 缺少即时、明确的掌握确认方式。

Insight:

- 自测和复述引导可以作为“是否掌握”的验证机制。

#### Q13. 如果让你不用看资料，讲清 RAG 的核心逻辑或适用场景，你能讲到什么程度？

Answer:

目前讲 RAG 的核心逻辑和适用场景还不稳定，需要看资料或问 AI 才能讲清。说明学习后还没有形成稳定的可复述结构，概念掌握依赖外部资料和 AI 辅助。

Evidence / behavior:

- 离开资料和 AI 后，表达不稳定。

Emotion / friction:

- 有“知道但讲不清”的不确定感。

Insight:

- 学习包需要帮助用户形成可复述结构，而不仅是理解原文。

#### Q14. 哪些内容最容易过一会儿就忘？

Answer:

英文术语和专有名词本身反而相对好记；更容易忘的是概念定义、完整流程、步骤之间为什么这样连接、和其他概念的区别、适用场景、限制条件和坑点。代码实现细节不是当前主要关注点，因为现阶段更偏理解产品/技术概念和应用边界，而不是深入工程实现。

Evidence / behavior:

- 容易忘的是结构、关系、边界和场景，不是词本身。

Emotion / friction:

- 记住名词不等于掌握概念。

Insight:

- 概念卡、对比卡和学习地图应围绕结构关系和适用边界设计。

#### Q15. 你是否会回头复习这篇资料？如果会，靠什么复习？

Answer:

会回头复习，主要靠回原网页和查看自己整理的 Obsidian 笔记。复习入口依赖原资料和个人知识库，而不是一个轻量的学习结果页。

Evidence / behavior:

- 回看原网页。
- 查看 Obsidian 笔记。

Emotion / friction:

- 复习入口分散，依赖资料和个人整理。

Insight:

- 本地学习包和导出 Markdown 可以作为轻量复习入口。

#### Q16. 你是否有过“看完觉得懂了，但之后做项目/解释给别人时发现讲不清”的经历？

Answer:

经常有这种情况。主观感觉是“我知道这个东西”，但真正要表达时会发现表述不清晰、逻辑有点混乱，说明知识还没有从模糊理解转成稳定表达。

Evidence / behavior:

- 经常出现知道但讲不清的情况。

Emotion / friction:

- 理解感和表达能力之间存在落差。

Insight:

- 产品核心应服务“从看懂到能讲清”的转化。

### 3.4 Concept Reaction: Learning Package

Concept shown:

> WebLearnBoost can turn the current webpage into a learning package, including a learning map, key points, concept/comparison cards, multiple-choice self-test, and source evidence.

#### Q17. 这几个部分里，哪一个对你最有帮助？

Answer:

最有帮助的是学习地图和选择题自测，其次是重点、概念卡/对比卡、原文依据/定位。学习地图对应“我该怎么学、接下来还要看什么、路径对不对”的问题；选择题自测对应“我到底掌握了没有”的问题。重点和卡片是学习材料本身，原文依据主要支撑可信感。

Evidence / behavior:

- 功能优先级为学习地图、自测、重点/卡片、原文依据。

Emotion / friction:

- 最需要路径感和掌握确认。

Insight:

- 第一版体验应突出学习地图和自测，而不是只突出摘要。

#### Q18. 哪一个你觉得可能没必要？

Answer:

都有必要，只是优先级不同。第一版不应该删掉某一类能力，但可以在展示层级上突出学习地图和选择题自测，把重点、概念卡/对比卡、原文依据作为支撑模块。

Evidence / behavior:

- 所有学习包模块都有价值，但优先级不同。

Emotion / friction:

- 不希望第一版过度简化到只剩摘要。

Insight:

- 功能可都保留，但视觉和流程优先级要分层。

#### Q19. 你更希望在阅读前生成学习地图，还是阅读后生成复习材料？

Answer:

理想流程是阅读前先生成学习地图，帮助建立方向和重点；阅读后再生成或使用自测/复习材料，检查是否掌握。也就是“读前定路径，读后做验证”。

Evidence / behavior:

- 使用期望分为读前和读后两个阶段。

Emotion / friction:

- 读前需要方向，读后需要确认。

Insight:

- 两步流程成立：先学习地图，再学习包/自测。

#### Q20. 选择题自测会让你更有掌握感，还是会增加负担？

Answer:

选择题自测会带来更强的掌握感，但前提是题目不能太简单、太偏，必须和原文重点强相关。自测的价值在于验证理解，而不是制造形式化负担。

Evidence / behavior:

- 自测接受度取决于题目质量和相关性。

Emotion / friction:

- 担心低质量题目变成负担。

Insight:

- 题目生成需要绑定原文重点和学习目标。

#### Q21. 每条内容能回到原文依据，对你判断 AI 是否可靠有没有帮助？

Answer:

原文依据/定位很有帮助，会增加对 AI 输出的信任感；但它不是最高优先级，更多是在内容不确定时用于核对和确认。也就是说，它是信任底座，不一定是用户第一眼最想看的功能。

Evidence / behavior:

- 需要时会回原文核对。

Emotion / friction:

- 想信任 AI，但需要依据。

Insight:

- 原文定位应保持可见但不过度抢占主流程。

#### Q22. 如果只能保留三个功能，你会保留哪三个？

Answer:

如果第一版只能保留三个功能，会优先保留学习地图、重点摘要、选择题自测。

Evidence / behavior:

- MVP 优先级明确为学习地图、重点、自测。

Emotion / friction:

- 这三个功能分别对应路径、材料和掌握确认。

Insight:

- 第一版 MVP 应围绕“定路径 -> 抓重点 -> 做验证”组织。

## 4. Summary

### 4.1 Key Findings

- 核心痛点不是“不知道 RAG 这个词”，而是学习路径不确定：看完这篇还要看什么、去哪里看、当前路径是否正确。
- 用户会主动整理资料，甚至使用 Obsidian + LLM 搭建个人知识库，但整理动作过重，反而挤压真正学习时间。
- 用户很想依赖 AI 提升效率，但缺少信任依据；AI 回答看似合理，仍需要回原文核对。
- 学习后的主要问题是“知道但讲不清”，说明当前资料和 AI 回答没有稳定转化成可复述结构。
- 学习包方案中，学习地图和选择题自测最能回应核心问题，重点摘要是必要基础，原文依据是信任底座。

### 4.2 Pain Point Ranking

1. 学习路径不确定：不知道接下来学什么、当前路径是否正确。
2. 学完讲不清：读的时候觉得懂，但离开资料和 AI 后表达不稳定。
3. 整理成本高：Obsidian + LLM 有效果，但耗时间、耗 token，并挤压学习本身。
4. AI 信任依据不足：想相信 AI，但担心漏点、概括过度，需要回原文核对。
5. 长资料进入门槛高：资料太长时容易跳读、问 AI、收藏、放弃或找短资料。

### 4.3 Product Implications

- 第一版体验应突出“读前定路径，读后做验证”。
- 学习地图应优先呈现文章核心结构、推荐阅读顺序、下一步可能需要补的知识。
- 重点摘要需要作为学习材料基础，但不能成为唯一卖点。
- 选择题自测需要和原文重点强相关，避免太简单或太偏。
- 原文依据/定位应作为信任底座，在需要核对时可快速回看。
- 产品不应做成重型知识库系统，应该减少整理负担，生成轻量学习包。

### 4.4 Inputs For PRD

- MVP 核心链路：提取网页 -> 生成学习地图 -> 生成重点摘要 -> 生成选择题自测 -> 支持原文核对。
- 第一版优先功能：学习地图、重点摘要、选择题自测。
- 支撑功能：概念卡/对比卡、原文依据/定位、本地保存和 Markdown 导出。
- 用户流程应支持读前和读后两个使用时机。
- 失败场景需要覆盖 AI 无法访问网页、内容过长、题目质量不足、原文定位失败。
