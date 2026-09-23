# TODO · ACG Riff 补充线（songbook + technique）

> 状态：2026-09-23 Phase A 及复查补强已实现；基线测速、通用动作阶梯、记录恢复/校验与拨弦视频已补齐。等待用户确认具体 riff 和时间戳后进入 Phase B。这是**补充线**，不改变 MISSION 主方向（乐理 / 写歌 / 爵士）。
> 实现前必读：`CLAUDE.md`（表格与 SVG 方向约定）、`NOTES.md`（用户偏好、组件清单）、`assets/` 下现有组件源码。

## 0. 背景与定位

- 用户新增的练歌目标：弹下《青春コンプレックス》（結束バンド）的 **riff 部分**（不是 solo）。
- 用户自述对 "riff" 这个概念本身不理解，也缺"一首歌由哪些段落组成"的知识 → 需要先补概念课，再拆歌，最后练手。
- 用户设备：**电吉他**。练习设计按电吉他写（强力和弦、手掌闷音、音箱失真下的止音都算数），不用为木吉他妥协。
- 现有 4 轮课（`lessons/` 13、`lessons2/` 21、`lessons3/` 18、`lessons4/` 12）理论已经够用，本线**不新增乐理**，只做：概念 → 歌曲解剖 → 手上技巧。
- 这条线是**练习日程型**，不是"看完一节往前走"的课程型：进度指标是可复现的"稳定 BPM"，不是单次最高 BPM 或"完成了几课"。

## 1. 硬性约定

1. 术语统一 **英文 + 中文**，例如 `Riff（重复乐句）`、`Chorus（副歌）`、`Pre-chorus（导歌）`。**不要使用日语术语**（不写 Aメロ / サビ / 間奏 之类）。
2. 音名一律科学音名（E2、B3……），表格按 `CLAUDE.md`：行 = 1–6 弦、列 = 品格。SVG 指板图用 `assets/chord-diagram.js` / `fretboard-visual.js`，琴头在上、6→1 弦从左到右、圆点内标指号。
3. **不复制完整 tab / band score**（版权）。页面只写：riff 所在小节数、把位、音名、节奏格、难点；完整谱链接到外部来源（Songsterr / 官方 band score 购买页 / Ultimate Guitar），并在 `RESOURCES.md` 登记。
4. 凡是本工作区无法从一手来源核实的事实（调、速度、riff 每次出现的小节位置、时间戳）必须在页面上标 **「待核实」**，并留一个让用户听歌核对的任务，不能凭印象写死。
5. 不修改现有课程页面或其专属资产；允许为新入口和项目状态更新 `MISSION.md`、`NOTES.md`、`README.md`、`RESOURCES.md`、根 `index.html` 与本文件。新交互放在 `assets/technique.css/js`。
6. 进度存本地：新 localStorage key `guitar-theory-technique-progress-v1`，与 lessons2/3/4 的 key 分开；页面明示"仅本浏览器、非学习证据"。
7. 每页无 JavaScript 也可阅读、打印。
8. **歌名《青春コンプレックス》是专有名词，保留原文**，不翻译、不转写成标题；文件名用 romaji `seishun-complex`。"不用日语"只针对术语。
9. **不引用歌词**（一句都不引），只描述段落。
10. `assets/rhythm-grid.js` 是**扫弦模型**（动作 = 扫/空扫/止音/打击/掌根制音/低音/分解，和弦表只有 C/G/Am/F/D/E/C/E/G/B 八个开放和弦），**不能表示强力和弦或单音 riff**。riff 节奏一律用**静态节奏表**呈现（列 = `1 e & a 2 e & a …` 每格一列，行 = 拨向 ↓/↑ 与 PM 闷音标记），不要改 rhythm-grid 去塞强力和弦，也不要伪造 riff 的播放音频。示范速度用原曲变速播放 + 外部节拍器。
11. 页面骨架对齐现有课程（以 `lessons4/0005-muting-and-space.html` 为结构参考）：`header.lesson-header` 内 `nav.crumbs`（第一项链 `../index.html` 课程总览）→ `kicker` → `h1` → `subtitle`；正文用 `h2` 分节；拿琴任务用 `div.callout.practice`；末尾有小测 / 检索 + 「来源」节。
12. 全站统一两个操作性定义，所有页面引用同一份、不要各写各的：
    - **「干净」** = 节拍器下不掉拍、没有漏音、闷音处无余响、不该响的弦不响、无打品杂音；录音回听可确认。
    - **BPM 阶梯** = 起点取「原速 50%」与「诊断稳定值」二者较低者；连续 3 遍干净 → +4 BPM；连续 2 遍不干净 → −8 BPM 并回到分块练习；到原速后再连续 5 遍干净才算过关。

## 2. 动手前必须核实的事实（写入页面前先查）

| 项目 | 说明 | 来源要求 |
|---|---|---|
| 歌曲调性 | 主调 + riff 段落是否同调 | tab/band score 或 TheoryTab；页面给出推导（用哪几个音判断的） |
| 速度（BPM） | 原速 | tab/band score 标注；用于 50/70/90/100% 练习阶梯 |
| 曲式与小节数 | Intro / Verse / Pre-chorus / Chorus / Interlude / Bridge / Final chorus / Outro 各多少小节 | 从谱推；时间戳 = 小节数 × 拍长，标"待核实"，交给用户听着对 |
| Riff 内容 | 用到的弦/品、是否含滑音 / 击勾弦 / 八度音型、左手是否需要横按 | 决定 `technique/` 需要哪些练习项，**先查再定练习清单** |
| Riff 出现位置 | 出现几次、每次是否有变体 | 解剖表核心内容 |
| 双吉他分工 | riff 段落里 Lead guitar 与 Rhythm guitar 各弹什么 | 谱中两个 guitar 声部 |
| **候选 riff 清单** | 全曲可能被称作 riff 的段落不止一处（intro riff、verse 下的 riff、chorus 的节奏型……）。在 `songbook/0003` 放「请确认是这一段」的核对项；不替用户默认选择，确认前不展开 technique 的具体练习项 | 谱 + 用户确认 |

## 3. 新建文件

### 3.1 `songbook/`（歌曲解剖，不需要拿琴）

#### `songbook/index.html`
- 说明本目录用途：每首歌一页，先解剖后练。
- 列出已有页面 + "歌曲阶梯"占位（后续歌曲按难度递增，青春コンプレックス暂为顶端）。
- 链接 `technique/index.html`。

#### `songbook/0001-song-parts-and-guitar-roles.html` — 歌曲段落与吉他角色
纯概念课，用青春コンプレックス作例子，但内容对所有歌通用。
- **A. 歌曲段落**（英文 + 中文对照表）：Intro（前奏）、Verse（主歌）、Pre-chorus（导歌）、Chorus（副歌）、Interlude / Solo（间奏）、Bridge（桥段）、Final chorus（末段副歌，说明常见转调）、Outro（尾奏）。每个段落一句"它在歌里干什么"。
- **B. 器乐角色词汇表**：Riff / Solo / Lick / Fill / Backing（伴奏）—— 长度、是否重复、在歌里的角色三列对比表（讨论稿里已有雏形）。用两个用户可能听过的通用例子解释 riff（如 Smoke on the Water、Seven Nation Army），再指向青春コンプレックス的 riff。
- **C. 乐队分工**：Lead guitar（主音吉他）vs Rhythm guitar（节奏吉他）在同一段落里分别干什么；riff 通常是主音吉他的活。
- Tab 阅读已拆分到 `songbook/0002-tab-and-rhythm-reading.html`，避免概念课过长。
- **E. 与已有课程的连接**：段落对比 → `lessons4/0008`、`lessons4/0011`；和声节奏 → `lessons4/0006`；止音/闷音动作词汇 → `reference/0016-rhythm-actions.html`；级数分析 → `lessons/0005`、`lessons/0006`。
- **F. 小测**：`initQuiz(container, questions, options)`，5–6 题（riff 与 solo 的区别、Pre-chorus 的作用、谁弹 riff、tab 上第一条线是哪根弦等）。

#### `songbook/0002-tab-and-rhythm-reading.html` — Tab 与节奏速读

- 单独讲六线谱方向、品格数字、奏法记号与“哪里 / 何时 / 怎么弹”三遍读取法。
- 示例只使用独立位置，不拼成歌曲音序。

#### `songbook/0003-seishun-complex-anatomy.html` — 青春コンプレックス 解剖
- **A. 基本信息**：调、速度、拍号、双吉他配置。未核实项标「待核实」。
- **B. 全曲时间轴表**：列 = 段落 | 小节数 | 估算时间戳（待核实） | Lead guitar 在干嘛 | Rhythm guitar 在干嘛 | 和弦级数。**标出 riff 每一次出现及变体**。
- **C. Riff 本身**：
  - 小节数、所在把位；SVG 指板图（按 CLAUDE.md 方向约定）+ 科学音名表；
  - 节奏：静态节奏表（见 §1.10；只呈现节奏骨架 + 拨向 + PM 标记，不呈现完整旋律 tab）；
  - 难点标注（换弦、闷音切换、速度）；
  - 需要的技巧项 → 逐条链接到 `technique/`。
- **D. 听力任务（不拿琴）**：听三遍；第一遍只数段落边界并写下时间戳；第二遍只听 Lead guitar；第三遍数 riff 出现次数。把结果和 B 表对照，把「待核实」项改成核实值——这一步的结果要用户回填。附**慢速跟听工作流**：YouTube 播放速度 0.5×/0.75×、或 Moises / Transcribe! 等变速不变调工具（登记进 RESOURCES，选免费可用的）；说明变速后闷音和拨向更容易听清。
- **E. 练习计划**：50% / 70% / 90% / 100% 仅为录音检查点；升降速统一使用 +4 / −8 算法，原速连续 5 遍干净才过关。
- **F. 来源**：谱源链接（不复制谱面）。

### 3.2 `technique/`（手上技巧，练习日程型）

#### `technique/index.html` — 每日 15 分钟练习日程
- 说明：这不是课程，是循环练习；进度记 BPM。
- 顶部先放**「与 lessons4 如何并行」**一小段：technique 每天 15 分钟固定在前（热身性质），lessons4 每周推进 2–3 课；同一天不设两个新目标；单个练习项 ≤ 5 分钟，前臂发紧或疼痛立即停止、当天不再练该项。
- 练习项清单（**最终清单以 §2 核实 riff 内容后为准**，下面是预期项）：
  0. 姿势、拨片握法与拨片厚度（电吉他快速下拨一般用较厚拨片，写成"一般建议"不写成规定）、手腕发力 vs 小臂发力、右手掌根靠桥的位置（闷音的前提）
  1. 强力和弦（Power chord）6 弦根 / 5 弦根 + 手掌闷音（Palm mute）—— 根音认位复用 `lessons/0001`
  2. 下拨 8 分持续（Down-picking endurance）—— 60 → 原速的 BPM 阶梯
  3. 交替拨弦 16 分（Alternate picking）—— 单弦 → 跨弦
  4. 换弦与横向换把（针对 riff 中实际出现的移动）
  5. （视核实结果）滑音 / 击勾弦 / 八度音型
  6. Riff 分块拼装（Chunking）：按小节拆、按乐句拼、慢速→原速
- 每项：目标动作分解、常见错误、**BPM 记录表**（localStorage，允许导出为文本），过关标准（引用 §1.12 的统一定义，不另写）。
- BPM 导出包含日期、练习项、BPM、细分、时长/小节、尝试次数、干净次数、原曲百分比与备注；日志不逐条写入 `learning-records/`。
- 底部链接 `songbook/0003` 的目标确认。

#### `technique/0000-hands-diagnostic.html` — 手上诊断（先做）
5 个可量化任务，页面只生成可复制摘要，不自动写入 `learning-records/`：
1. E → Am 一分钟干净切换次数
2. 单弦 8 分下拨稳定 BPM（节拍器，连续 30 秒）
3. 单弦 16 分交替拨弦稳定 BPM
4. 6 弦根强力和弦 + 闷音，4 小节 8 分的稳定 BPM
5. 从 5 弦 3 品 → 5 弦 8 品换把，能否不看指板落准（成功 / 失败）
每项给记录格式，页面末尾生成一段可复制的 Markdown 供用户贴进学习记录。
- 另要求用手机录 30 秒视频（左右手都入镜）自留，学习记录里只写数值与日期，不上传。诊断任务用的 BPM 起点与递增规则同 §1.12。

#### 各练习项是否拆成独立页
- 默认全部放在 `technique/index.html` 一页内（锚点导航），避免又变成"课程"。
- 只有在某项内容超过一屏且带自己的指板图（如强力和弦指型 + 闷音位置）时才拆为 `technique/0001-*.html`，从 index 链过去。

### 3.3 `learning-records/0002-acg-riff-goal.md`
- 记录目标新增（补充线，不是方向变更），与 `0001-jazz-solo-goal.md` 同格式。
- 明确写：此记录不表示掌握程度；掌握证据来自 `technique/0000` 诊断结果和 BPM 记录。
- 诊断做完后另开 `0003-hands-diagnostic-YYYY-MM-DD.md` 记录结果（由用户回填，agent 不要伪造）。

### 3.4 `reference/0018-clean-tempo-protocol.html`
- `0017` 已被写歌工作坊占用。新增 0018，作为全站“干净”、稳定 BPM 测量和 +4 / −8 / 原速 5 遍规则的唯一来源。

### 3.5 可选：`assets/technique.css` / `assets/technique.js`
- 仅在 BPM 记录表需要交互时新建；否则复用 `style.css` + `course2.css`。
- `technique.js` 若写，功能限定：读写 `guitar-theory-technique-progress-v1`、渲染 BPM 表、导出文本。不另写节拍器，页面明确让用户用外部节拍器（手机 app 即可）+ 原曲变速播放。

## 4. 修改现有文件

| 文件 | 改动 |
|---|---|
| `MISSION.md` | 在 Why 后新增一段（日期 2026-09-22）：新增补充目标——弹下青春コンプレックス的 riff，用 `songbook/` + `technique/` 承接；主方向不变。Success looks like 增加一条："能在原速下干净弹出青春コンプレックス的 riff 段落，并说出它在曲式中出现的位置与每次的变化"。Constraints 更新设备说明：用户使用电吉他。 |
| `NOTES.md` | 新增小节「ACG Riff 补充线（2026-09-22）」：定位（补充、练习日程型、进度=BPM）、与 lessons4 的边界（节奏概念归 lessons4，电吉他执行层归 technique，`songbook/0001` 是 lessons4 曲式课的具体案例，互相链接不重讲）、术语约定（英文+中文，不用日语）、新 localStorage key、组件清单补 `technique.*`（如有）。 |
| `index.html`（根目录，已存在） | 「选择课程」区追加 `songbook/index.html` 与 `technique/index.html` 两个入口（**仅追加**，不改现有项和样式）；如做了 `reference/0017`，在「复习与依据」区追加。 |
| `README.md` | 课程入口新增 `songbook/index.html` 与 `technique/index.html` 两行；说明它们是练习/解剖型页面，不是线性课程。 |
| `RESOURCES.md` | Knowledge 新增小节「ACG Riff · songbook / technique」：登记谱源（Songsterr / 官方 band score / Ultimate Guitar 页面）、TheoryTab 页面（如有该曲）、JustinGuitar 强力和弦与手掌闷音的免费课页面、交替拨弦基础教程（选一手、免费、可核对的来源）。Gaps 新增：曲式时间戳与 riff 变体需用户听歌核实；BPM 记录是自评不是教师反馈。 |
| `lessons4/0011-form-transitions-ending.html` | **不修改**。如需互链，只在 `songbook/0001` 单向链接过去；lessons4 的回链留待其维护者处理（NOTES 中写明）。 |

## 5. 实现顺序

1. 核实 §2 的事实（先查谱源，把结论和来源写进 `RESOURCES.md`）。
2. `learning-records/0002-acg-riff-goal.md` + `MISSION.md` + `NOTES.md`（先让文档与意图一致）。
3. `songbook/0001-song-parts-and-guitar-roles.html` 与 `0002-tab-and-rhythm-reading.html`。
4. `technique/0000-hands-diagnostic.html`。
5. `songbook/0003-seishun-complex-anatomy.html`（依赖 §2）。
6. `technique/index.html`（练习项清单依赖 §2 中 riff 内容）。
7. `songbook/index.html`、`README.md`、`RESOURCES.md` 收尾。

## 6. 验收标准

- [x] 全部页面术语为英文 + 中文；歌曲等专有名词按约定保留原文。
- [x] 所有音名带八度；所有表格按 CLAUDE.md 行列约定；所有 SVG 和弦图方向正确、圆点内有指号。
- [x] 页面中没有整段 tab、没有歌词；谱源以链接给出并登记在 RESOURCES。
- [x] `songbook/0003` 有候选 riff 确认项；用户确认前不生成具体 riff 专项练习。
- [x] 「干净」定义与 BPM 阶梯正文只在 Reference 0018，训练页和诊断页均链接引用。
- [x] 根目录 `index.html` 能进到 songbook 与 technique；`nav.crumbs` 第一项回到 `../index.html`。
- [x] 没有用 rhythm-grid 伪装强力和弦或 riff 播放。
- [x] 未核实事实全部标「待核实」并配有用户核对任务。
- [x] 本轮没有修改 `lessons4/` 与其专属资产。
- [x] 新 localStorage key 与旧 key 互不干扰；禁用 JS 时页面仍可读。
- [x] `MISSION.md` / `NOTES.md` / `README.md` / `RESOURCES.md` 与新目录一致。
- [x] 本地服务打开新页面无控制台报错；桌面与手机视口已实际检查。

## 7. 明确不做

- 不做 solo 段落的教学（用户目标是 riff）。
- 不新增乐理课；不新开 `lessons5/`。
- 不做完整歌曲的扒带成品或 tab 转写。
- 不做音箱 / 效果器 / 音色调校教程（超出 MISSION 范围，只允许一句"用轻度失真便于听清闷音"级别的提示）。
- 不在没有用户回填的情况下写任何"已掌握"类的学习记录。

## 8. 后续（本轮不做，留作占位）

- 歌曲阶梯：在青春コンプレックス前面垫 2–3 首更容易的 ACG 曲目，每首一页同格式。曲目待用户提供意向后再对谱排序。
- 根目录 `index.html` 的**进度总览**：目前只有入口列表，没有合并 lessons2/3/4 + technique 四个 localStorage key 的进度视图（此前分析中提出，尚未实现）。
- 建议每完成 §5 的一步提交一次，commit message 前缀 `songbook:` / `technique:` / `docs:`，便于回退。
- 若用户后续想弹 solo，再从 `technique/` 扩推弦 / 揉弦 / legato 项，不另开线。
