(function () {
  'use strict';

  var STORE = 'guitar-theory-lessons6-progress-v1';
  var audioContext = null;
  var activeStop = null;
  var memory = {};
  var storageAvailable = true;

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
    } catch (_) { storageAvailable = false; return memory; }
  }

  function saveProgress(value) {
    memory = value;
    try { localStorage.setItem(STORE, JSON.stringify(value)); }
    catch (_) { storageAvailable = false; }
  }

  function initProgress() {
    var id = document.body.dataset.fusionLesson;
    var state = readProgress();
    if (id) {
      var entry = state[id] || {};
      document.querySelectorAll('[data-fusion-check]').forEach(function (box) {
        box.checked = !!(entry.checks || {})[box.dataset.fusionCheck];
        box.addEventListener('change', function () {
          var latest = readProgress();
          var current = latest[id] || {};
          current.checks = current.checks || {};
          current.checks[box.dataset.fusionCheck] = box.checked;
          latest[id] = current; saveProgress(latest);
        });
      });
      var status = document.querySelector('[data-fusion-review-status]');
      function paint() {
        var current = readProgress()[id] || {};
        document.querySelectorAll('[data-fusion-review]').forEach(function (button) {
          button.setAttribute('aria-pressed', String(current.stage === button.dataset.fusionReview));
        });
        if (status) status.textContent = (current.stage === 'reviewed' ? '自评：隔日复弹通过' : current.stage === 'practiced' ? '已录过，等待隔日复弹' : '尚无自评记录') +
          (current.date ? ' · ' + current.date : '') + (storageAvailable ? '（仅存本浏览器）' : '（存储不可用，本次页面有效）');
      }
      document.querySelectorAll('[data-fusion-review]').forEach(function (button) {
        button.addEventListener('click', function () {
          var latest = readProgress(); var current = latest[id] || {};
          current.stage = current.stage === button.dataset.fusionReview ? '' : button.dataset.fusionReview;
          current.date = new Date().toLocaleDateString('zh-CN');
          latest[id] = current; saveProgress(latest); paint();
        });
      });
      paint();
    }
    var practiced = 0, reviewed = 0;
    document.querySelectorAll('[data-fusion-course-lesson]').forEach(function (link) {
      var value = state[link.dataset.fusionCourseLesson] || {};
      if (value.stage) practiced += 1;
      if (value.stage === 'reviewed') reviewed += 1;
      link.classList.toggle('done', !!value.stage);
      link.classList.toggle('reviewed', value.stage === 'reviewed');
    });
    var output = document.querySelector('[data-fusion-course-progress]');
    if (output) output.textContent = '自评进度：录过 ' + practiced + ' / 10 · 隔日复弹通过 ' + reviewed + ' / 10。浏览页面不算掌握。';
  }

  function midi(note) {
    var match = /^([A-G])([#b]?)(-?\d+)$/.exec(note);
    if (!match) throw new Error('无效科学音名：' + note);
    return 12 * (Number(match[3]) + 1) + { C:0,D:2,E:4,F:5,G:7,A:9,B:11 }[match[1]] + (match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0);
  }

  function parseCell(value) {
    if (value === '-' || value == null) return { kind: 'rest', label: '—', technique: '休止' };
    if (value === 'x') return { kind: 'ghost', label: '×', technique: '制音' };
    if (value === '~') return { kind: 'hold', label: '—', technique: '延音' };
    if (typeof value === 'string') return { kind: 'note', note: value, label: value, technique: '拨弦' };
    return {
      kind: value.kind || (value.note ? 'note' : 'rest'), note: value.note,
      label: value.label || value.note || (value.kind === 'ghost' ? '×' : '—'),
      technique: value.technique || (value.kind === 'rest' ? '休止' : '拨弦'),
      accent: !!value.accent, target: !!value.target
    };
  }

  function countLabels(config) {
    if (config.counts) return config.counts;
    if (config.cellsPerBar === 16) return ['1','e','&','a','2','e','&','a','3','e','&','a','4','e','&','a'];
    if (config.cellsPerBar === 8) return ['1','&','2','&','3','&','4','&'];
    if (config.cellsPerBar === 7) return ['1','2','1','2','1','2','3'];
    return Array.from({ length: config.cellsPerBar }, function (_, i) { return String(i + 1); });
  }

  function makeCurve(amount) {
    var samples = 256, curve = new Float32Array(samples);
    for (var i = 0; i < samples; i++) {
      var x = i * 2 / samples - 1;
      curve[i] = (1 + amount) * x / (1 + amount * Math.abs(x));
    }
    return curve;
  }

  function initLab(container, config) {
    var groups = config.groups || [config.cellsPerBar];
    if (groups.reduce(function (a, b) { return a + b; }, 0) !== config.cellsPerBar) throw new Error('分组与小节格数不符');
    var counts = countLabels(config);
    var bars = config.bars.map(function (bar) {
      if (!Array.isArray(bar.cells) || bar.cells.length !== config.cellsPerBar) throw new Error('每小节格数必须是 ' + config.cellsPerBar);
      return { chord: bar.chord, bass: bar.bass, voices: bar.voices || [], cells: bar.cells.map(parseCell) };
    });
    var flat = [];
    bars.forEach(function (bar, barIndex) {
      bar.cells.forEach(function (cell, slot) { flat.push({ bar: barIndex, slot: slot, chord: bar.chord, cell: cell }); });
    });
    container.classList.add('fusion-lab');
    container.appendChild(el('h3', '', config.title || 'Fusion 短句演示'));
    container.appendChild(el('p', 'fusion-lab-description', config.description || '单步查看每格，再播放循环。'));
    var controls = el('div', 'fusion-controls');
    var start = el('button', '', config.loop === false ? '播放 ' + bars.length + ' 小节' : '播放循环'); start.type = 'button'; start.dataset.fusionStart = '';
    var stopButton = el('button', '', '停止'); stopButton.type = 'button'; stopButton.disabled = true;
    var step = el('button', '', config.backingOnly ? '逐小节查看' : '单步'); step.type = 'button';
    controls.append(start, stopButton, step);
    var tempoLabel = el('label', '', 'BPM');
    var tempo = document.createElement('input'); tempo.type = 'number'; tempo.min = '40'; tempo.max = '150'; tempo.value = String(config.tempo || 72); tempoLabel.appendChild(tempo); controls.appendChild(tempoLabel);
    var modeLabel = el('label', '', '播放内容');
    var mode = document.createElement('select');
    (config.backingOnly ? [['backing','只播伴奏']] : [['demo','伴奏 + 示范'],['backing','只播伴奏']]).forEach(function (option) { var node = el('option', '', option[1]); node.value = option[0]; mode.appendChild(node); });
    modeLabel.appendChild(mode); controls.appendChild(modeLabel);
    var feel = null;
    if (config.allowFeel) {
      var feelLabel = el('label', '', '八分感觉'); feel = document.createElement('select');
      [['straight','Straight'],['swing','Swing 近似']].forEach(function (option) { var node = el('option', '', option[1]); node.value = option[0]; feel.appendChild(node); });
      feelLabel.appendChild(feel); controls.appendChild(feelLabel);
    }
    var toneLabel = el('label', '', '合成音色');
    var toneMode = document.createElement('select');
    [['clean','Clean'],['edge','Edge']].forEach(function (option) { var node = el('option', '', option[1]); node.value = option[0]; toneMode.appendChild(node); });
    toneLabel.appendChild(toneMode); controls.appendChild(toneLabel);
    container.appendChild(controls);
    var status = el('p', 'fusion-status', config.backingOnly ? '尚未播放 · 一小节预备后完整播放 16 小节' : '尚未播放 · 点任意一格可查看动作'); container.appendChild(status);
    var cellButtons = [], barNodes = [];
    var arrangement = config.backingOnly ? el('div', 'fusion-arrangement') : container;
    if (config.backingOnly) container.appendChild(arrangement);
    bars.forEach(function (bar, barIndex) {
      var barNode = el('section', 'fusion-bar');
      barNodes.push(barNode);
      var title = el('p', 'fusion-bar-title'); title.append(el('strong', '', '第 ' + (barIndex + 1) + ' 小节'), el('span', '', bar.chord)); barNode.appendChild(title);
      if (config.backingOnly) {
        barNode.appendChild(el('p', 'fusion-meta', '自由 solo · 共 4 拍'));
        arrangement.appendChild(barNode);
        return;
      }
      var groupRow = el('div', 'fusion-groups'); var offset = 0;
      groups.forEach(function (size, groupIndex) {
        var group = el('div', 'fusion-group'); group.style.setProperty('--group-size', size); group.dataset.group = String(groupIndex + 1);
        for (var i = 0; i < size; i++) {
          var slot = offset + i, cell = bar.cells[slot], button = el('button', 'fusion-cell'); button.type = 'button';
          button.dataset.kind = cell.kind; button.dataset.accent = String(cell.accent); button.dataset.target = String(cell.target);
          button.append(el('span', 'fusion-count', counts[slot]), el('span', 'fusion-symbol', cell.label), el('span', 'fusion-technique', cell.technique));
          (function (index) { button.addEventListener('click', function () { select(index); }); })(barIndex * config.cellsPerBar + slot);
          group.appendChild(button); cellButtons.push(button);
        }
        offset += size; groupRow.appendChild(group);
      });
      barNode.appendChild(groupRow); container.appendChild(barNode);
    });
    var inspector = el('div', 'fusion-inspector');
    var inspectorTitle = el('strong', '', '当前格'); var inspectorText = el('span', '', ''); inspector.append(inspectorTitle, inspectorText); container.appendChild(inspector);
    var legend = el('p', 'fusion-legend'); legend.innerHTML = config.backingOnly ? '按正文的 16 小节安排自己弹；高亮小节跟随伴奏，完整播放一遍后停止。' : '<b>音名</b> = 发声　<b>×</b> = 制音　<b>—</b> = 休止/延音　<b>绿底边</b> = 预定落点　<b>&gt;</b> = 重音'; container.appendChild(legend);

    var selected = 0, running = false, timer = null, timers = new Set(), nodes = new Set(), output = null, shaper = null, generation = 0;
    function position(slot) {
      if (config.cellsPerBar === 7) return '第 ' + (slot + 1) + ' 个八分格（组内 ' + counts[slot] + '）';
      var division = config.cellsPerBar === 16 ? 4 : 2;
      return String(Math.floor(slot / division) + 1) + (slot % division ? counts[slot] : ' 拍');
    }
    function select(index) {
      selected = (index + flat.length) % flat.length;
      cellButtons.forEach(function (button, i) { button.classList.toggle('is-current', i === selected); });
      var item = flat[selected], c = item.cell;
      barNodes.forEach(function (bar, i) { bar.classList.toggle('is-current', i === item.bar); });
      inspectorText.textContent = '第 ' + (item.bar + 1) + ' 小节 · ' + position(item.slot) + ' · ' + item.chord + (config.backingOnly ? ' · 自由 solo' : ' · ' + (c.note || c.label) + ' · ' + c.technique + (c.target ? ' · 和弦落点' : ''));
    }
    select(0);
    step.addEventListener('click', function () { select(selected + (config.backingOnly ? config.cellsPerBar : 1)); });

    function stop() {
      generation += 1; running = false; clearInterval(timer); timer = null;
      timers.forEach(clearTimeout); timers.clear();
      nodes.forEach(function (node) { try { node.stop(); } catch (_) {} try { node.disconnect(); } catch (_) {} }); nodes.clear();
      if (output) { output.disconnect(); output = null; }
      if (shaper) { shaper.disconnect(); shaper = null; }
      start.disabled = false; stopButton.disabled = true; [tempo, mode, feel, toneMode].filter(Boolean).forEach(function (input) { input.disabled = false; });
      status.textContent = '已停止 · 再播放会重新预备一小节';
      if (activeStop === stop) activeStop = null;
    }
    stopButton.addEventListener('click', stop);

    function synth(note, when, duration, level, type) {
      var oscillator = audioContext.createOscillator(), gain = audioContext.createGain(); oscillator.type = type || 'triangle';
      oscillator.frequency.value = 440 * Math.pow(2, (midi(note) - 69) / 12);
      gain.gain.setValueAtTime(.0001, when); gain.gain.exponentialRampToValueAtTime(level, when + .008); gain.gain.exponentialRampToValueAtTime(.0001, when + Math.max(.04, duration));
      oscillator.connect(gain).connect(output); nodes.add(oscillator);
      oscillator.onended = function () { nodes.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(when); oscillator.stop(when + duration + .04);
    }
    function ghost(when) {
      var oscillator = audioContext.createOscillator(), gain = audioContext.createGain(); oscillator.type = 'square'; oscillator.frequency.value = 145;
      gain.gain.setValueAtTime(.035, when); gain.gain.exponentialRampToValueAtTime(.0001, when + .035); oscillator.connect(gain).connect(output); nodes.add(oscillator);
      oscillator.onended = function () { nodes.delete(oscillator); oscillator.disconnect(); gain.disconnect(); }; oscillator.start(when); oscillator.stop(when + .04);
    }
    start.addEventListener('click', async function () {
      if (activeStop) activeStop();
      var token = ++generation; activeStop = stop; start.disabled = true; stopButton.disabled = false;
      try {
        var Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) throw new Error('浏览器不支持 Web Audio');
        audioContext = audioContext || new Audio(); await audioContext.resume();
        if (token !== generation || document.hidden) { if (token === generation) stop(); return; }
        var bpm = Math.max(40, Math.min(150, Number(tempo.value) || 72)); tempo.value = bpm;
        var beat = 60 / bpm, cellDuration = config.cellsPerBar === 16 ? beat / 4 : beat / 2;
        var swing = feel && feel.value === 'swing' && config.cellsPerBar === 8;
        var barDuration = config.cellsPerBar === 7 ? beat * 3.5 : beat * 4;
        [tempo, mode, feel, toneMode].filter(Boolean).forEach(function (input) { input.disabled = true; });
        output = audioContext.createGain(); output.gain.value = toneMode.value === 'edge' ? .42 : .34;
        if (toneMode.value === 'edge') { shaper = audioContext.createWaveShaper(); shaper.curve = makeCurve(4); output.connect(shaper).connect(audioContext.destination); }
        else output.connect(audioContext.destination);
        running = true; var tick = -config.cellsPerBar, origin = audioContext.currentTime + .1;
        function offsetInBar(local) {
          if (swing) return Math.floor(local / 2) * beat + (local % 2 ? beat * 2 / 3 : 0);
          return local * cellDuration;
        }
        function timeAt(index) {
          if (index < 0) return origin + offsetInBar(index + config.cellsPerBar);
          var cycle = Math.floor(index / config.cellsPerBar);
          var local = index % config.cellsPerBar;
          return origin + barDuration + cycle * barDuration + offsetInBar(local);
        }
        function schedule() {
          if (!running) return;
          while (timeAt(tick) < audioContext.currentTime + .13) {
            if (config.loop === false && tick >= flat.length) {
              var ending = setTimeout(function () {
                timers.delete(ending); stop();
                status.textContent = '已完成 ' + bars.length + ' 小节 · 回听录音，只选一项修订';
              }, Math.max(0, (timeAt(tick) - audioContext.currentTime) * 1000));
              timers.add(ending); clearInterval(timer); timer = null;
              return;
            }
            var when = timeAt(tick), preparing = tick < 0;
            var local = ((tick % (bars.length * config.cellsPerBar)) + bars.length * config.cellsPerBar) % (bars.length * config.cellsPerBar);
            var barIndex = Math.floor(local / config.cellsPerBar), slot = local % config.cellsPerBar, bar = bars[barIndex], cell = bar.cells[slot];
            var pulse = config.cellsPerBar === 16 ? slot % 4 === 0 : (config.cellsPerBar === 7 ? groups.reduce(function (acc, size) { acc.push((acc.length ? acc[acc.length - 1] : 0) + size); return acc; }, [0]).indexOf(slot) >= 0 : slot % 2 === 0);
            if (pulse) synth(slot === 0 ? 'A5' : 'E5', when, .025, preparing ? .055 : .035, 'square');
            if (!preparing && slot === 0) {
              if (bar.bass) synth(bar.bass, when, Math.min(barDuration * .65, beat * 1.8), .18, 'triangle');
              bar.voices.forEach(function (note) { synth(note, when, Math.min(barDuration * .72, beat * 2.4), .045, 'sine'); });
            }
            if (!preparing && mode.value === 'demo') {
              if (cell.kind === 'note') {
                var end = slot + 1; while (end < config.cellsPerBar && bar.cells[end].kind === 'hold') end += 1;
                synth(cell.note, when, Math.max(.05, (timeAt(tick + end - slot) - when) * .86), cell.accent ? .2 : .145, 'triangle');
              } else if (cell.kind === 'ghost') ghost(when);
            }
            (function (isPreparing, index, chord, at) {
              var id = setTimeout(function () {
                timers.delete(id); if (!running) return;
                if (isPreparing) status.textContent = '预备 · ' + position(index % config.cellsPerBar);
                else { select(index); status.textContent = '第 ' + (Math.floor(index / config.cellsPerBar) + 1) + ' / ' + bars.length + ' 小节 · ' + chord + ' · ' + position(index % config.cellsPerBar); }
              }, Math.max(0, (at - audioContext.currentTime) * 1000)); timers.add(id);
            })(preparing, local, bar.chord, when);
            tick += 1;
          }
        }
        schedule(); timer = setInterval(schedule, 25);
      } catch (error) { stop(); status.textContent = '音频未能启动；可继续用静态表与实体节拍器练习。' + error.message; }
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });
    window.addEventListener('pagehide', stop);
  }

  function initMixer(container) {
    container.querySelectorAll('input[type="range"]').forEach(function (input) {
      var output = container.querySelector('output[for="' + input.id + '"]');
      function paint() {
        var low = input.dataset.low || '轻', high = input.dataset.high || '强';
        output.textContent = Number(input.value) < 34 ? low : Number(input.value) > 66 ? high : '中等比重';
      }
      input.addEventListener('input', paint); paint();
    });
  }

  initProgress();
  document.querySelectorAll('[data-fusion-mixer]').forEach(initMixer);
  var data = document.querySelector('#fusion-data');
  if (data) {
    try {
      var config = JSON.parse(data.textContent);
      (config.labs || []).forEach(function (lab, index) { var container = document.querySelector('#fusion-lab-' + index); if (container) initLab(container, lab); });
      var quiz = document.querySelector('#fusion-quiz');
      if (quiz && window.initQuiz) window.initQuiz(quiz, config.questions || [], { shuffleChoices: true, summary: '概念答对不等于手上通过；请用录音与隔日复弹判断。' });
      document.body.classList.add('fusion-enhanced');
    } catch (error) {
      document.querySelectorAll('.fusion-lab').forEach(function (lab) { lab.hidden = true; });
      var target = document.querySelector('[data-fusion-error]') || document.createElement('p');
      target.textContent = '互动配置无法读取，已保留静态谱例：' + error.message;
      if (!target.parentNode) document.querySelector('main').appendChild(target);
    }
  }
})();
