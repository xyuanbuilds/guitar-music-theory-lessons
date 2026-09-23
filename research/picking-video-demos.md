# 每日技巧：拨弦演示视频核查

访问日期：2026-09-23。范围：为每日技巧页选择教师本人发布的基础动作演示，不转写目标歌曲，也不下载视频。

## 可采用的视频

| 训练内容 | 原始视频 / 作者 | 长度 | 建议观看入口 | 核查依据 |
|---|---|---|---|---|
| 握拨片 | [How to Hold a Guitar Pick & Best Guitar Picks — JustinGuitar](https://www.youtube.com/watch?v=-04Et5qIoa4) | 5:38 | [03:51 握拨片](https://www.youtube.com/watch?v=-04Et5qIoa4&t=231s) | 官方 YouTube watch 页的 `videoDetails` 与作者章节；oEmbed 返回同标题、作者及 iframe |
| 上下交替拨弦 | [3 Tips to NAIL Alternate Picking — JustinGuitar](https://www.youtube.com/watch?v=q8SHmo1-dac) | 5:00 | [00:43 拨片角度](https://www.youtube.com/watch?v=q8SHmo1-dac&t=43s)；[02:00 In & Out](https://www.youtube.com/watch?v=q8SHmo1-dac&t=120s) | 官方 YouTube watch 页的 `videoDetails` 与作者章节；oEmbed 返回同标题、作者及 iframe |
| 掌根闷音 | [This Is How Rock Guitar Players Palm Mute — JustinGuitar](https://www.youtube.com/watch?v=5H7Q6dSxuQc) | 6:38 | [01:30 掌根位置](https://www.youtube.com/watch?v=5H7Q6dSxuQc&t=90s)；[04:38 闷音与拨片角度](https://www.youtube.com/watch?v=5H7Q6dSxuQc&t=278s) | 官方视频说明直接链接 [Palm Muting 原课](https://www.justinguitar.com/guitar-lessons/palm-muting-bg-1203)；oEmbed 返回同标题、作者及 iframe |
| 连续下拨 | [Daily Downstroke Routine — The-Art-of-Guitar](https://www.youtube.com/watch?v=HOAM5N_kd4E) | 8:36（此前来源核查） | 从头观看，按本课程诊断速度练，不追视频速度 | 本仓库 [既有来源核查](acg-riff-sources.md)；主代理本轮复核 oEmbed 作者、标题与 iframe |

以上三个 JustinGuitar 视频的作者频道均为 `https://www.youtube.com/@justinguitar`，watch 页频道 ID 均为 `UCBNkm8o5LiEVLxO8w0p2sfQ`。视频身份、标题与上述章节时间置信度高；它们是教师本人的通用技巧材料，不能证明《青春コンプレックス》的指定 riff 使用这些奏法。

## 嵌入与教学建议

- 可使用 YouTube 官方嵌入播放器，并保留视频原页链接。oEmbed 成功表明平台提供嵌入代码，不等于已经证明所有网络、地区与浏览器中都能播放。
- 握拨片视频的动作章节从 03:51 开始；前段主要讲拨片选择。使用 `start=231` 可直接进入用户需要的动作演示。
- 交替拨弦可先看 00:43 和 02:00 的作者章节，再回到单弦慢速练习；不要把视频速度自动记入诊断基线。
- 掌根闷音从 01:30 的动作说明进入。先听开放、轻闷与过度压弦的声音差别，再练节奏。
- 下拨视频属于日常速度 / 耐力练习，可观察动作，但初学者应使用课程里的短时、放松测试；不要求照搬演示速度或练习量。
- 页面中的中文“观察重点”和原创练习是课程设计建议，不声称是视频逐字译文；字幕可用性与自动翻译准确性未核实。

## 已核实与限制

1. 本轮通过 YouTube 搜索发现视频，再读取各视频官方 watch metadata 和 YouTube oEmbed；没有下载媒体。
2. JustinGuitar 官网课页本轮直接请求返回 Cloudflare 403，因此没有据该响应确认站内播放器 ID。掌根闷音对应关系由官方视频说明中的原课链接补充确认。
3. 交替拨弦视频确为 JustinGuitar 初学交替拨教学，但其描述仅链接 Grade 1 课程集合；本轮没有证明它就是 `beginner-alternate-picking-b1-601` 页内的同一个播放器。页面宜引用视频本身，不把这个对应关系写成事实。
4. 未继续查找 Power Chords 1 的嵌入 ID：本轮所需的握拨片、连续下拨、交替拨和掌根闷音已覆盖，避免增加与拨弦动作关系较弱的视频。
5. 尚未据本轮研究完整观看四个视频或完成实际嵌入播放验证；最终页面需检查播放器容器及原页备用链接。播放限制应如实说明，不能把 metadata 验证说成已实际播放。

## 可复核接口

YouTube oEmbed：`https://www.youtube.com/oembed?url=<URL 编码后的 watch 链接>&format=json`。本轮三个 JustinGuitar 视频均返回 JSON，其中 `author_name` 为 `JustinGuitar`，`html` 包含对应 ID 的 `youtube.com/embed/…` iframe。上述长度和章节来自同一视频官方 watch 页的 `videoDetails.lengthSeconds` 与 `shortDescription`。
