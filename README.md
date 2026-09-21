# 吉他乐理与编曲课程

一套以吉他为载体的中文实用乐理课程，目标是把音名、和弦、音阶、听觉和编曲知识转化为指板上的实际能力。

## 课程入口

- `lessons/`：第一轮基础课程，共 13 课，覆盖指板音名、开放和弦、大调体系、顺阶和弦、常用进行、五声音阶、布鲁斯与调式。
- `lessons2/index.html`：第二轮 Practical Theory Route，共 7 个 Grade、21 课，重点训练全指板导航、目标音即兴、声部连接、练耳、CAGED 与综合创作。
- `reference/`：适合打印和复习的知识参考卡。

## 本地运行

课程由静态 HTML、CSS 和 JavaScript 构成。使用本地 HTTP 服务可以让跨页面学习进度正常保存：

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

然后打开：

```text
http://127.0.0.1:4173/lessons2/index.html
```

## 教学设计

课程目标和学习约束记录在 `MISSION.md`，资源依据记录在 `RESOURCES.md`，教学路线与后续调整记录在 `NOTES.md`。每节课包含一个小而明确的学习成果、拿琴练习、过关标准、检索测验和资料来源。

Lessons 2 的 7 级结构参考 JustinGuitar Practical Music Theory 官方公开的学习成果；具体讲解、练习和项目均针对本工作区的学习目标独立设计。
