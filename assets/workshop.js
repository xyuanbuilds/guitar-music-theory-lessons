/* Shared composition notebook. Self-reports never mark demonstrated mastery. */
(function () {
  'use strict';
  var DATA_KEY = 'guitar-theory-lessons4-work-v1';
  var PROGRESS_KEY = 'guitar-theory-lessons4-practice-v1';
  var fields = [
    ['title', '作品名称'], ['intent', '想表达的画面或情绪'], ['tempo', '拍号、速度与律动'],
    ['diagnosis', '起点诊断：速度、卡点、练习分支'], ['patternA', '主歌节奏 A（写清细分和每一格）'],
    ['patternB', '对比节奏 B（写清细分和每一格）'], ['anticipation', '提前换和弦的位置'],
    ['feel', '均分 / shuffle 的试听决定'], ['mute', '止音与制音安排'],
    ['verseChords', '主歌 8 小节和弦与换和弦拍点'], ['verseMelody', '主歌旋律：音名、起拍、时值与歌词'],
    ['chorus', '副歌 8 小节：和弦、旋律、歌词与对比手段'], ['bass', '低音线及实际按法'],
    ['texture', '分解、扫弦与留白安排'], ['form', '完整曲式、小节数与结尾'],
    ['revision', '录音文件名、时间点、修改前后与隔日复弹']
  ];
  var memory = {}, storageOK = true;
  function read(key) {
    if (!storageOK && Object.prototype.hasOwnProperty.call(memory, key)) return memory[key];
    try { var v = JSON.parse(localStorage.getItem(key) || '{}'); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
    catch (_) { storageOK = false; return memory[key] || {}; }
  }
  function write(key, value) {
    memory[key] = value;
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (_) { storageOK = false; }
  }
  function node(tag, text, cls) { var n = document.createElement(tag); if (text != null) n.textContent = text; if (cls) n.className = cls; return n; }
  function stamp() { return new Date().toISOString(); }
  function notebookText() {
    var saved = read(DATA_KEY);
    return '我的写歌工作坊 · 作品单\n\n' + fields.map(function (f) { return f[1] + '\n' + (typeof saved[f[0]] === 'string' && saved[f[0]].trim() ? saved[f[0]] : '（待创作）'); }).join('\n\n') + '\n\n本单是个人草稿与自评，不代表已通过演奏评定。\n';
  }
  function paintSheet() { document.querySelectorAll('[data-work-sheet]').forEach(function (n) { n.textContent = notebookText(); }); }
  function statusText() { return storageOK ? '已保存在本浏览器。请使用同一网址学习，并定期导出备份。' : '浏览器存储不可用；本页草稿暂存于内存，请离开前导出。'; }
  var configNode = document.getElementById('workshop-data');
  var config = configNode ? JSON.parse(configNode.textContent) : {};
  document.querySelectorAll('[data-work-field]').forEach(function (input) {
    var key = input.dataset.workField;
    var saved = read(DATA_KEY); input.value = typeof saved[key] === 'string' ? saved[key] : '';
    input.addEventListener('input', function () {
      // Merge only this field, so different lesson tabs preserve other fields.
      var current = read(DATA_KEY); current[key] = input.value; current.updatedAt = stamp(); write(DATA_KEY, current);
      document.querySelectorAll('[data-save-status]').forEach(function (n) { n.textContent = statusText(); }); paintSheet();
    });
  });
  // Probe writes as some browsers allow reading storage but reject saving it.
  try { var probe = DATA_KEY + ':probe'; localStorage.setItem(probe, '1'); localStorage.removeItem(probe); } catch (_) { storageOK = false; }
  document.querySelectorAll('[data-save-status]').forEach(function (n) { n.textContent = storageOK ? '输入即保存；所有课程共用这一份作品草稿。' : statusText(); });
  document.querySelectorAll('[data-work-export]').forEach(function (button) {
    button.addEventListener('click', function () {
      var blob = new Blob([notebookText()], { type: 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob), a = node('a'); a.href = url; a.download = 'lessons4-my-song.txt'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });
  });
  document.querySelectorAll('[data-work-print]').forEach(function (button) {
    button.addEventListener('click', function () { paintSheet(); document.body.classList.add('print-work'); window.print(); document.body.classList.remove('print-work'); });
  });
  window.addEventListener('afterprint', function () { document.body.classList.remove('print-work'); });
  function renderProgress() {
    var all = read(PROGRESS_KEY);
    document.querySelectorAll('[data-progress-lesson]').forEach(function (el) {
      var record = all[el.dataset.progressLesson] || {};
      el.textContent = record.recalled ? '自评：已隔日复弹' : record.practiced ? '自评：已拿琴练习' : '尚未记录练习';
    });
    var summary = document.querySelector('[data-course-progress]');
    if (summary) {
      var practiced = 0, recalled = 0;
      for (var i = 1; i <= 12; i++) { var r = all[String(i)] || {}; if(r.practiced)practiced++; if(r.recalled)recalled++; }
      summary.textContent = '自评练习 ' + practiced + ' / 12 · 隔日复弹 ' + recalled + ' / 12。打开页面和答对小测不会改变进度。';
    }
    var panel = document.querySelector('[data-practice-panel]');
    if (panel && config.id) {
      panel.replaceChildren(node('p', '完成本课拿琴任务后再勾选；隔日复弹指另一天不看谱重做。'));
      var record = all[config.id] || {};
      [['practiced','今天实际拿琴完成了本课任务'], ['recalled','另一天不看谱复弹，记录了结果']].forEach(function (item) {
        var label = node('label'), box = node('input'); box.type = 'checkbox'; box.checked = Boolean(record[item[0]]); box.dataset.practice = item[0];
        label.append(box, document.createTextNode(item[1])); panel.appendChild(label);
        box.addEventListener('change', function () {
          var current = read(PROGRESS_KEY), entry = current[config.id] || {};
          entry[item[0]] = box.checked ? stamp() : null;
          if (item[0] === 'recalled' && box.checked && !entry.practiced) entry.practiced = stamp();
          if (item[0] === 'practiced' && !box.checked) entry.recalled = null;
          current[config.id] = entry; write(PROGRESS_KEY, current); renderProgress();
          var msg = document.querySelector('[data-practice-status]'); if(msg)msg.textContent = statusText();
        });
      });
    }
  }
  (config.chords || []).forEach(function (chord, i) {
    var target = document.getElementById('work-chord-' + i);
    if (target && window.renderChordDiagram) { renderChordDiagram(target, chord); var svg = target.querySelector('svg'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', chord.name + '，6 到 1 弦：' + chord.frets.join('、')); }
  });
  (config.rhythms || []).forEach(function (rhythm, i) {
    var target = document.getElementById('work-rhythm-' + i);
    if (target && window.initRhythmGrid) {
      initRhythmGrid(target, rhythm);
      var fallback = target.previousElementSibling;
      if (fallback && fallback.classList.contains('rhythm-fallback')) fallback.hidden = true;
    }
  });
  if (config.questions && window.initQuiz) {
    var questions = config.questions.map(function(q) {
      var order = q.choices.map(function (text, i) { return { text: text, correct: i === q.answer }; });
      for (var i = order.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = order[i]; order[i] = order[j]; order[j] = t; }
      return {prompt:q.prompt, choices:order.map(function(o){return o.text;}), answer:order.findIndex(function(o){return o.correct;}), explain:q.explain};
    });
    initQuiz(document.getElementById('work-quiz'), questions, { summary: '这是概念检索；请用实际演奏和隔日复弹检查是否会用。' });
  }
  window.addEventListener('storage', function (event) {
    if (event.key === DATA_KEY || event.key === null) {
      var saved = read(DATA_KEY);
      document.querySelectorAll('[data-work-field]').forEach(function (input) { if(document.activeElement !== input) input.value = typeof saved[input.dataset.workField] === 'string' ? saved[input.dataset.workField] : ''; });
      paintSheet();
    }
    if (event.key === PROGRESS_KEY || event.key === null) renderProgress();
  });
  paintSheet(); renderProgress();
})();
