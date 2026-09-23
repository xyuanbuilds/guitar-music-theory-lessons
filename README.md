# 吉他乐理与编曲课程

一套以吉他为载体的中文实用乐理课程，目标是把音名、和弦、音阶、听觉和编曲知识转化为指板上的实际能力。

## 课程入口

- `lessons/`：第一轮基础课程，共 13 课，覆盖指板音名、开放和弦、大调体系、顺阶和弦、常用进行、五声音阶、布鲁斯与调式。
- `lessons2/index.html`：第二轮 Practical Theory Route，共 7 个 Grade、21 课，重点训练全指板导航、目标音即兴、声部连接、练耳、CAGED 与综合创作；具体把位课配有带手指号的可视化按法图。
- `lessons3/index.html`：爵士音阶与即兴，15 节核心课 + 3 节选修，从七和弦落点、swing、ii–V–I 走向小调、Jazz Blues 和原创 solo；每课配有推荐按法图、科学音名表、可调速伴奏、短句示范和独立自评进度。
- `lessons4/index.html`：写歌工作坊，共 12 课。从节奏诊断、八分/十六分、切分和制音，逐步完成同一首作品的主歌、副歌、低音线、织体、36 小节曲式与录音修订；作品草稿跨课保存并可导出。
- `songbook/index.html`：歌曲解剖型页面，先学段落与 Tab 阅读，再确认《青春コンプレックス》的具体目标 riff；不是线性理论课程。
- `technique/index.html`：每日 15 分钟练习面板，用手上诊断、统一速度协议和稳定 BPM 日志推进；不是按“完成课数”前进。
- `reference/`：适合打印和复习的知识参考卡。

## 本地运行

课程由静态 HTML、CSS 和 JavaScript 构成。使用本地 HTTP 服务可以让跨页面学习进度正常保存：

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

然后打开：

```text
http://127.0.0.1:4173/
http://127.0.0.1:4173/lessons2/index.html
http://127.0.0.1:4173/lessons3/index.html
http://127.0.0.1:4173/lessons4/index.html
http://127.0.0.1:4173/songbook/index.html
http://127.0.0.1:4173/technique/index.html
```

## 教学设计

课程目标和学习约束记录在 `MISSION.md`，资源依据记录在 `RESOURCES.md`，教学路线与后续调整记录在 `NOTES.md`。每节课包含一个小而明确的学习成果、拿琴练习、过关标准、检索测验和资料来源。

Lessons 2 的 7 级结构参考 JustinGuitar Practical Music Theory 官方公开的学习成果；具体讲解、练习和项目均针对本工作区的学习目标独立设计。

Lessons 3 依据 Open Music Theory 与 Jazz Guitar Online 的原始教学文章独立设计，来源逐课列出。Web Audio 伴奏需要点击开始；切走页面自动停止。进度仅保存在本浏览器，与 Lessons 2 分开；自评和概念小测不代替演奏反馈。正文与谱例无 JavaScript 也可阅读、打印。

Lessons 4 依据 musictheory.net 的时值课程、Open Music Theory 的 swing 资料，以及 Berklee Online 教师 Pat Pattison、Andrea Stolpe 的写作教学独立设计。播放器是计时和织体参照，不录音、不评分；跨课作品单与练习勾选也不等于已经掌握。

Songbook / Technique 只用 Aniplex 完整发行录音固定听辨版本，具体演奏顺序回到授权谱源；页面不复制歌词或完整 Tab。目标、诊断与稳定 BPM 仅保存在本浏览器，不作为教师确认的掌握证据。
