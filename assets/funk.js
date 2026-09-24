(function () {
  'use strict';

  var STORE = 'guitar-theory-lessons5-progress-v1';
  var audioContext = null;
  var activeStop = null;
  var memory = {};
  var storageAvailable = true;
  var chordNotes = {
    Muted: [],
    D9: [50, 54, 60, 64],
    E9: [52, 56, 62, 66]
  };
  var actionInfo = {
    hit: { short: '响', name: '和弦短音', left: '按实', leftDetail: '品丝后方保持压力', leftState: 'press', right: '触弦发声' },
    ghost: { short: '×', name: '制音扫弦', left: '轻触制音', leftDetail: '放掉压力，不离开琴弦', leftState: 'touch', right: '触弦打击' },
    air: { short: '空', name: '空扫', left: '轻触待机', leftDetail: '放掉压力，右手不触弦', leftState: 'touch', right: '经过但不触弦' },
    stop: { short: '停', name: '主动止音', left: '截断余音', leftDetail: '轻触弦或配合右掌止住', leftState: 'stop', right: '掌侧止音' },
    palm: { short: '短', name: '掌根短音', left: '按实', leftDetail: '音高仍由左手决定', leftState: 'press', right: '掌根贴桥后触弦' }
  };
  var leftInfo = {
    press: { label: '按实', detail: '品丝后方保持压力', visual: 'press' },
    touch: { label: '轻触制音', detail: '放掉压力，不离开琴弦', visual: 'touch' },
    hold: { label: '保持按法', detail: '让上一音继续延长', visual: 'press' },
    stop: { label: '截断余音', detail: '轻触弦或配合右掌止住', visual: 'stop' },
    move: { label: '移动形状', detail: '放压后整体滑到下一把位', visual: 'hold' }
  };

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function readProgress() {
    try {
      var value = JSON.parse(localStorage.getItem(STORE) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch (_) {
      storageAvailable = false;
      return memory;
    }
  }

  function saveProgress(value) {
    memory = value;
    try { localStorage.setItem(STORE, JSON.stringify(value)); }
    catch (_) { storageAvailable = false; }
  }

  function initProgress() {
    var lessonId = document.body.dataset.funkLesson;
    var state = readProgress();

    if (lessonId) {
      var entry = state[lessonId] || {};
      document.querySelectorAll('[data-funk-check]').forEach(function (box) {
        box.checked = !!(entry.checks || {})[box.dataset.funkCheck];
        box.addEventListener('change', function () {
          var latest = readProgress();
          var current = latest[lessonId] || {};
          current.checks = current.checks || {};
          current.checks[box.dataset.funkCheck] = box.checked;
          latest[lessonId] = current;
          saveProgress(latest);
        });
      });

      var status = document.querySelector('[data-funk-review-status]');
      function paintReview() {
        var current = readProgress()[lessonId] || {};
        document.querySelectorAll('[data-funk-review]').forEach(function (button) {
          button.setAttribute('aria-pressed', String(current.stage === button.dataset.funkReview));
        });
        if (status) {
          status.textContent = (current.stage === 'reviewed' ? '自评：隔日复弹通过' : current.stage === 'practiced' ? '已练过，等待隔日复弹' : '尚无自评记录') +
            (current.date ? ' · ' + current.date : '') + (storageAvailable ? '（仅存本浏览器）' : '（存储不可用，本次页面有效）');
        }
      }
      document.querySelectorAll('[data-funk-review]').forEach(function (button) {
        button.addEventListener('click', function () {
          var latest = readProgress();
          var current = latest[lessonId] || {};
          current.stage = current.stage === button.dataset.funkReview ? '' : button.dataset.funkReview;
          current.date = new Date().toLocaleDateString('zh-CN');
          latest[lessonId] = current;
          saveProgress(latest);
          paintReview();
        });
      });
      paintReview();
    }

    var practiced = 0;
    var reviewed = 0;
    document.querySelectorAll('[data-funk-course-lesson]').forEach(function (link) {
      var value = state[link.dataset.funkCourseLesson] || {};
      if (value.stage) practiced += 1;
      if (value.stage === 'reviewed') reviewed += 1;
      link.classList.toggle('done', !!value.stage);
      link.classList.toggle('reviewed', value.stage === 'reviewed');
    });
    var courseStatus = document.querySelector('[data-funk-course-progress]');
    if (courseStatus) courseStatus.textContent = '自评进度：练过 ' + practiced + ' / 8 · 隔日复弹通过 ' + reviewed + ' / 8。创建或浏览页面不算掌握。';
  }

  function parseCell(value) {
    var objectCell = value && typeof value === 'object' && !Array.isArray(value);
    var raw = objectCell ? value.action : value;
    var accent = objectCell ? !!value.accent : typeof raw === 'string' && raw.slice(-1) === '!';
    var action = accent && !objectCell ? raw.slice(0, -1) : raw;
    if (!actionInfo[action]) throw new Error('未知 Funk 动作：' + action);
    var left = objectCell && value.left ? value.left : actionInfo[action].leftState;
    if (!leftInfo[left]) throw new Error('未知左手状态：' + left);
    return { action: action, accent: accent, left: left };
  }

  function initGroove(container, config) {
    var bars = config.bars.map(function (bar) {
      if (!chordNotes[bar.chord]) throw new Error('未知和弦：' + bar.chord);
      if (!Array.isArray(bar.cells) || bar.cells.length !== 16) throw new Error('每小节必须有 16 个动作');
      return { chord: bar.chord, cells: bar.cells.map(parseCell) };
    });
    var flat = [];
    bars.forEach(function (bar, barIndex) {
      bar.cells.forEach(function (cell, slot) { flat.push({ bar: barIndex, slot: slot, chord: bar.chord, action: cell.action, accent: cell.accent, left: cell.left }); });
    });
    var tempoValue = Math.max(45, Math.min(120, Number(config.tempo) || 72));
    var running = false;
    var scheduler = null;
    var timers = new Set();
    var nodes = new Set();
    var pitched = new Set();
    var output = null;
    var generation = 0;
    var selected = 0;
    var cellButtons = [];

    container.classList.add('funk-lab');
    var title = el('h3', '', config.title || 'Funk 动作演示');
    var description = el('p', 'funk-lab-description', config.description || '点击任一格查看左右手动作，或播放完整循环。');
    var controls = el('div', 'funk-controls');
    var start = el('button', '', '播放循环'); start.type = 'button'; start.dataset.funkStart = '';
    var stopButton = el('button', '', '停止'); stopButton.type = 'button'; stopButton.disabled = true;
    var step = el('button', '', '单步'); step.type = 'button';
    var tempo = el('input'); tempo.type = 'number'; tempo.min = '45'; tempo.max = '120'; tempo.step = '1'; tempo.value = tempoValue;
    var tempoLabel = el('label', '', '速度'); tempoLabel.append(tempo, document.createTextNode(' BPM'));
    controls.append(start, stopButton, step, tempoLabel);
    var status = el('p', 'funk-status', '待开始 · 点击格子可先看动作'); status.setAttribute('role', 'status');

    var motion = el('div', 'funk-motion');
    var left = el('div', 'funk-hand');
    var leftVisual = el('div', 'funk-left-visual');
    for (var ls = 0; ls < 6; ls += 1) leftVisual.appendChild(el('span', 'funk-fret-string'));
    leftVisual.appendChild(el('span', 'funk-finger-bar'));
    var leftText = el('div');
    leftText.append(el('strong', '', '左手'), el('span', 'funk-hand-output'), el('span', 'funk-hand-detail'));
    left.append(leftVisual, leftText);
    var right = el('div', 'funk-hand');
    var rightVisual = el('div', 'funk-right-visual');
    for (var rs = 0; rs < 6; rs += 1) rightVisual.appendChild(el('span', 'funk-pick-string'));
    rightVisual.appendChild(el('span', 'funk-pick'));
    var rightText = el('div');
    rightText.append(el('strong', '', '右手'), el('span', 'funk-hand-output'), el('span', 'funk-hand-detail'));
    right.append(rightVisual, rightText);
    motion.append(left, right);

    var score = el('div', 'funk-score');
    var countNames = ['1', 'e', '&', 'a'];
    bars.forEach(function (bar, barIndex) {
      var barNode = el('section', 'funk-bar');
      var heading = el('h4', 'funk-bar-title', '第 ' + (barIndex + 1) + ' 小节 · ' + (bar.chord === 'Muted' ? '制音弦' : bar.chord));
      heading.appendChild(el('span', '', '1↓ e↑ &↓ a↑ · 连续摆动'));
      barNode.appendChild(heading);
      var beats = el('div', 'funk-beats');
      for (var beat = 0; beat < 4; beat += 1) {
        var beatNode = el('div', 'funk-beat');
        for (var part = 0; part < 4; part += 1) {
          (function (slot) {
            var cell = bar.cells[slot];
            var index = barIndex * 16 + slot;
            var button = el('button', 'funk-cell'); button.type = 'button';
            button.dataset.action = cell.action;
            button.dataset.accent = String(cell.accent);
            button.append(el('span', 'funk-count', countNames[slot % 4]), el('span', 'funk-direction', slot % 2 === 0 ? '↓' : '↑'), el('span', 'funk-action', actionInfo[cell.action].short));
            button.setAttribute('aria-label', '第 ' + (barIndex + 1) + ' 小节，第 ' + (Math.floor(slot / 4) + 1) + ' 拍 ' + countNames[slot % 4] + '，' + (slot % 2 === 0 ? '下扫' : '上扫') + '，' + actionInfo[cell.action].name + (cell.left === 'move' ? '，左手移动把位' : '') + (cell.accent ? '，重音' : ''));
            button.addEventListener('click', function () { if (!running) select(index, true); });
            cellButtons.push(button);
            beatNode.appendChild(button);
          })(beat * 4 + part);
        }
        beats.appendChild(beatNode);
      }
      barNode.appendChild(beats);
      score.appendChild(barNode);
    });
    var legend = el('p', 'funk-legend');
    legend.innerHTML = '<b>响</b> 按实发声　<b>×</b> 轻触弦后扫出打击声　<b>空</b> 手经过但不碰弦　<b>停</b> 主动截断余音　<b>&gt;</b> 重音';
    container.replaceChildren(title, description, controls, status, motion, score, legend);

    function select(index, animate) {
      selected = ((index % flat.length) + flat.length) % flat.length;
      var item = flat[selected];
      var info = actionInfo[item.action];
      var leftState = leftInfo[item.left];
      cellButtons.forEach(function (button, buttonIndex) {
        button.classList.toggle('is-current', buttonIndex === selected);
        if (buttonIndex === selected) button.setAttribute('aria-current', 'true');
        else button.removeAttribute('aria-current');
      });
      leftVisual.dataset.state = leftState.visual;
      leftText.querySelector('.funk-hand-output').textContent = leftState.label;
      leftText.querySelector('.funk-hand-detail').textContent = leftState.detail;
      var direction = item.slot % 2 === 0 ? '下扫 ↓' : '上扫 ↑';
      rightText.querySelector('.funk-hand-output').textContent = direction + ' · ' + info.right;
      rightText.querySelector('.funk-hand-detail').textContent = item.accent ? '这一格加重，动作幅度仍保持小' : '非重音保持轻、短、放松';
      rightVisual.className = 'funk-right-visual';
      if (item.action === 'air') rightVisual.classList.add('is-air');
      if (item.action === 'stop') rightVisual.classList.add('is-stop');
      if (animate && item.action !== 'stop') {
        void rightVisual.offsetWidth;
        rightVisual.classList.add(item.slot % 2 === 0 ? 'animate-down' : 'animate-up');
      }
      status.textContent = '第 ' + (item.bar + 1) + ' 小节 · 第 ' + (Math.floor(item.slot / 4) + 1) + ' 拍 ' + countNames[item.slot % 4] + ' · ' + info.name + (item.accent ? ' · 重音' : '');
    }

    function tone(note, when, duration, level, trackPitched) {
      var oscillator = audioContext.createOscillator();
      var gain = audioContext.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.value = 440 * Math.pow(2, (note - 69) / 12);
      gain.gain.setValueAtTime(.0001, when);
      gain.gain.exponentialRampToValueAtTime(level, when + .006);
      gain.gain.exponentialRampToValueAtTime(.0001, when + duration);
      oscillator.connect(gain).connect(output);
      var voice = { source: oscillator, gain: gain, end: when + duration };
      nodes.add(voice);
      if (trackPitched !== false) pitched.add(voice);
      oscillator.onended = function () { nodes.delete(voice); pitched.delete(voice); oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(when); oscillator.stop(when + duration + .02);
    }

    function damp(when) {
      pitched.forEach(function (voice) {
        if (voice.end <= when) return;
        var gain = voice.gain.gain;
        gain.cancelScheduledValues(when);
        gain.setValueAtTime(.015, when);
        gain.exponentialRampToValueAtTime(.0001, when + .018);
        try { voice.source.stop(when + .025); } catch (_) {}
        voice.end = when + .025;
      });
    }

    function noise(when, level) {
      var length = Math.ceil(audioContext.sampleRate * .045);
      var buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
      var samples = buffer.getChannelData(0);
      for (var i = 0; i < length; i += 1) samples[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
      var source = audioContext.createBufferSource();
      var gain = audioContext.createGain();
      source.buffer = buffer;
      gain.gain.setValueAtTime(level, when);
      gain.gain.exponentialRampToValueAtTime(.0001, when + .045);
      source.connect(gain).connect(output);
      var voice = { source: source, gain: gain, end: when + .05 };
      nodes.add(voice);
      source.onended = function () { nodes.delete(voice); source.disconnect(); gain.disconnect(); };
      source.start(when); source.stop(when + .05);
    }

    function playItem(item, when, sixteenth) {
      if (item.action === 'air') {
        if (item.left === 'touch' || item.left === 'stop' || item.left === 'move') damp(when);
        return;
      }
      if (item.action === 'stop') { damp(when); return; }
      if (item.action === 'ghost') { damp(when); noise(when, item.accent ? .22 : .11); return; }
      damp(when);
      var notes = chordNotes[item.chord];
      var duration = item.action === 'palm' ? Math.min(.09, sixteenth * .65) : Math.min(.16, sixteenth * .88);
      var level = item.accent ? .095 : .055;
      notes.forEach(function (note, noteIndex) { tone(note, when + noteIndex * .004, duration, level, true); });
    }

    function stop(message) {
      generation += 1;
      running = false;
      clearInterval(scheduler); scheduler = null;
      timers.forEach(clearTimeout); timers.clear();
      nodes.forEach(function (voice) { try { voice.source.stop(); } catch (_) {} voice.source.disconnect(); voice.gain.disconnect(); });
      nodes.clear(); pitched.clear();
      if (output) { output.disconnect(); output = null; }
      start.disabled = false; stopButton.disabled = true; tempo.disabled = false; step.disabled = false;
      status.textContent = message || '已停止 · 单步可继续检查动作';
      if (activeStop === stop) activeStop = null;
    }

    step.addEventListener('click', function () { if (!running) select(selected + 1, true); });
    stopButton.addEventListener('click', function () { stop(); });
    start.addEventListener('click', async function () {
      if (running) return;
      if (activeStop) activeStop('已停止 · 另一张 Funk 动作图开始播放');
      activeStop = stop;
      var token = ++generation;
      start.disabled = true; stopButton.disabled = false; tempo.disabled = true; step.disabled = true;
      try {
        var Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) throw new Error('此浏览器不支持 Web Audio');
        audioContext = audioContext || new Audio();
        await audioContext.resume();
        if (token !== generation || document.hidden) { if (token === generation) stop(); return; }
        var bpm = Math.max(45, Math.min(120, Number(tempo.value) || tempoValue));
        tempo.value = bpm;
        var sixteenth = 60 / bpm / 4;
        output = audioContext.createGain(); output.gain.value = .55; output.connect(audioContext.destination);
        running = true;
        var tick = -16;
        var origin = audioContext.currentTime + .08;
        function timeAt(index) { return origin + (index + 16) * sixteenth; }
        function click(when, strong) { tone(strong ? 91 : 84, when, .028, strong ? .06 : .032, false); }
        function schedule() {
          if (!running || token !== generation) return;
          while (timeAt(tick) < audioContext.currentTime + .1) {
            var when = timeAt(tick);
            var pre = tick < 0;
            var local = pre ? tick + 16 : tick % flat.length;
            if (local % 4 === 0) click(when, local % 16 === 0);
            if (!pre) playItem(flat[local], when, sixteenth);
            (function (preparing, localIndex, at) {
              var timer = setTimeout(function () {
                timers.delete(timer);
                if (!running) return;
                if (preparing) status.textContent = '预备 · 第 ' + (Math.floor(localIndex / 4) + 1) + ' 拍';
                else select(localIndex, true);
              }, Math.max(0, (at - audioContext.currentTime) * 1000));
              timers.add(timer);
            })(pre, local, when);
            tick += 1;
          }
        }
        schedule();
        scheduler = setInterval(schedule, 25);
      } catch (error) {
        stop('音频未能启动；仍可用单步演示。' + error.message);
      }
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden && running) stop(); });
    window.addEventListener('pagehide', function () { if (running) stop(); });
    select(0, false);
  }

  initProgress();
  var dataNode = document.getElementById('funk-data');
  if (!dataNode) return;
  var data = JSON.parse(dataNode.textContent);
  (data.chords || []).forEach(function (chord) {
    var target = document.getElementById(chord.target);
    if (target && window.renderChordDiagram) renderChordDiagram(target, chord);
  });
  (data.grooves || []).forEach(function (groove, index) {
    var target = document.getElementById(groove.target || ('funk-groove-' + index));
    if (target) initGroove(target, groove);
  });
  var quiz = document.getElementById('funk-quiz');
  if (quiz && window.initQuiz && data.questions) initQuiz(quiz, data.questions, { shuffleChoices: true, summary: '概念答对后，还要以录音和隔日复弹判断演奏是否过关。' });
  document.body.classList.add('funk-enhanced');
})();
