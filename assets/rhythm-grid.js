/**
 * initRhythmGrid(element, {id, tempo, subdivision, feel, editable,
 *   allowedActions, bars:[{chord, cells, changes:[{slot,chord}]}], description})
 * Four quarter-note beats per bar. A change starts on the numbered zero-based
 * subdivision slot; each bar starts with its declared chord. Playback is a
 * synthesized timing aid, not an acoustic-guitar model or a performance grader.
 */
(function () {
  'use strict';
  var STORE = 'guitar-theory-lessons4-rhythm-v1:';
  var context = null;
  var activeStop = null;
  var memory = Object.create(null);
  var chords = {
    C: [48, 52, 55, 60, 64], G: [43, 47, 50, 55, 59, 67],
    Am: [45, 52, 57, 60, 64], F: [53, 57, 60],
    D: [50, 57, 62, 66], E: [40, 47, 52, 56, 59, 64],
    'C/E': [40, 48, 52, 55, 60, 64], 'G/B': [47, 50, 55, 59, 67]
  };
  var actions = {
    strum: { label: '扫弦', short: '扫', explain: '触弦，和弦发声；上下扫沿相应方向依次发音。' },
    air: { label: '空扫', short: '空', explain: '手经过琴弦但不触弦，不新增声音；上一格的余音可以继续。' },
    rest: { label: '止音', short: '停', explain: '在这一格主动止住余音，留下安静；不是空扫。' },
    mute: { label: '打击', short: '击', explain: '轻触制住琴弦后扫出短促打击声；这一格有新声音。' },
    palm: { label: '掌根制音', short: '短', explain: '掌根在琴桥附近轻贴弦，保留音高但缩短延音；不是无音高的打击。' },
    bass: { label: '低音', short: '低', explain: '只弹当前和弦最低音；斜线和弦使用斜线后的低音。' },
    pluck: { label: '分解', short: '分', explain: '每次只弹一个较高的和弦音，依次循环；试听用于辨认织体，具体选弦以课文为准。' }
  };

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }
  function button(cls, text) {
    var node = el('button', cls, text); node.type = 'button'; return node;
  }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function clamp(value, low, high, fallback) {
    var number = Number(value);
    return Number.isFinite(number) ? Math.max(low, Math.min(high, number)) : fallback;
  }
  function own(object, key) { return Object.prototype.hasOwnProperty.call(object, key); }
  function validate(config) {
    if (!config || typeof config.id !== 'string' || !config.id.trim()) throw new Error('节奏图需要独立的 id');
    if ([2, 3, 4].indexOf(config.subdivision) === -1) throw new Error('subdivision 只能是 2、3 或 4');
    if (!Array.isArray(config.bars) || !config.bars.length) throw new Error('节奏图至少需要一个小节');
    var allowed = config.allowedActions || ['strum', 'air', 'rest'];
    if (!Array.isArray(allowed) || !allowed.length || allowed.some(function (action) { return !own(actions, action); })) throw new Error('节奏动作无效');
    config.bars.forEach(function (bar) {
      if (!own(chords, bar.chord)) throw new Error('尚未定义和弦：' + bar.chord);
      if (!Array.isArray(bar.cells) || bar.cells.length !== 4 * config.subdivision || bar.cells.some(function (action) { return !own(actions, action); })) throw new Error('每小节需要 4 × subdivision 个有效动作');
      var slots = new Set();
      (bar.changes || []).forEach(function (change) {
        if (!Number.isInteger(change.slot) || change.slot < 0 || change.slot >= bar.cells.length || !own(chords, change.chord) || slots.has(change.slot)) throw new Error('和弦变化需要有效且不重复的 slot');
        slots.add(change.slot);
      });
    });
  }

  window.initRhythmGrid = function (container, input) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) throw new Error('找不到节奏图容器');
    if (container.rhythmGrid) container.rhythmGrid.destroy();
    try { validate(input); }
    catch (error) { container.replaceChildren(el('p', 'rg-error', error.message)); throw error; }
    var config = copy(input);
    var sub = config.subdivision, perBar = sub * 4;
    var allowed = Array.from(new Set(config.allowedActions || ['strum', 'air', 'rest']));
    var editable = config.editable !== false;
    var key = STORE + config.id;
    var original = { tempo: Math.round(clamp(config.tempo, 50, 120, 72)), feel: sub === 2 && config.feel === 'swing' ? 'swing' : 'straight', cells: config.bars.map(function (bar) { return bar.cells.slice(); }) };
    var state = copy(original), storageOK = true;
    var signature = JSON.stringify({ subdivision: sub, bars: config.bars, allowed: allowed });
    try {
      var stored = JSON.parse(localStorage.getItem(key) || 'null');
      if (stored && stored.signature === signature) {
        state.tempo = Math.round(clamp(stored.tempo, 50, 120, original.tempo));
        state.feel = sub === 2 && stored.feel === 'swing' ? 'swing' : 'straight';
        if (editable && Array.isArray(stored.cells) && stored.cells.length === config.bars.length && stored.cells.every(function (bar, i) {
          return Array.isArray(bar) && bar.length === perBar && bar.every(function (action, slot) { return allowed.indexOf(action) !== -1 || action === original.cells[i][slot]; });
        })) state.cells = stored.cells;
      }
    } catch (_) { storageOK = false; if (memory[key] && memory[key].signature === signature) state = copy(memory[key]); }
    var running = false, pending = false, generation = 0, scheduler = null, output = null;
    var nodes = new Set(), pitched = new Set(), timers = new Set(), cellButtons = [], controls = [];
    var destroyed = false, pluckIndex = 0;
    var score = el('div', 'rg-score');
    var status = el('p', 'rg-status', '待播放 · 先预备一小节，再循环此谱');
    status.dataset.rhythmStatus = ''; status.setAttribute('role', 'status');
    var editStatus = el('span', 'rg-edit-status'); editStatus.setAttribute('role', 'status');
    var start = button('rg-start', '试听循环'); start.dataset.rhythmStart = '';
    var stopButton = button('', '停止'); stopButton.dataset.rhythmStop = ''; stopButton.disabled = true;
    var reset = button('', '恢复本图预设'); reset.dataset.rhythmReset = '';
    var tempo = el('input'); tempo.type = 'number'; tempo.min = '50'; tempo.max = '120'; tempo.step = '1'; tempo.value = state.tempo; tempo.dataset.rhythmTempo = '';
    var volume = el('input'); volume.type = 'range'; volume.min = '0'; volume.max = '.5'; volume.step = '.01'; volume.value = '.28'; volume.setAttribute('aria-label', '试听音量');
    var feel = el('select'); feel.dataset.rhythmFeel = '';
    [['straight', '均分八分'], ['swing', 'Swing 近似']].forEach(function (item) { var option = el('option', '', item[1]); option.value = item[0]; feel.appendChild(option); });
    feel.value = state.feel;
    var toolbar = el('div', 'rg-controls');
    toolbar.append(start, stopButton);
    var tempoLabel = el('label', '', '速度'); tempoLabel.append(tempo, document.createTextNode('BPM')); toolbar.append(tempoLabel);
    if (sub === 2) { var feelLabel = el('label', '', '时值'); feelLabel.appendChild(feel); toolbar.appendChild(feelLabel); }
    var volumeLabel = el('label', '', '音量'); volumeLabel.appendChild(volume); toolbar.appendChild(volumeLabel);
    toolbar.appendChild(reset); controls.push(tempo, feel, reset);
    container.classList.add('rhythm-grid'); container.dataset.subdivision = String(sub); container.dataset.rhythmId = config.id;
    container.replaceChildren();
    if (config.description) container.appendChild(el('p', 'rg-description', config.description));
    container.append(toolbar, status, score);

    function countLabel(slot) {
      var beat = Math.floor(slot / sub) + 1, part = slot % sub;
      return part === 0 ? String(beat) : sub === 2 ? '&' : sub === 3 ? ['','trip','let'][part] : ['','e','&','a'][part];
    }
    function locationLabel(bar, slot) {
      return '第 ' + (bar + 1) + ' 小节，第 ' + (Math.floor(slot / sub) + 1) + ' 拍' + (slot % sub ? '的 ' + countLabel(slot) : '正拍');
    }
    function chordAt(barIndex, slot) {
      var bar = config.bars[barIndex], name = bar.chord;
      (bar.changes || []).slice().sort(function (a, b) { return a.slot - b.slot; }).forEach(function (change) { if (change.slot <= slot) name = change.chord; });
      return name;
    }
    function paintCell(node, bar, slot) {
      var action = state.cells[bar][slot], data = actions[action];
      var direction = slot % 2 === 0 ? '↓' : '↑';
      var symbol = action === 'strum' ? (sub === 3 ? '●' : direction) : action === 'air' ? (sub === 3 ? '○' : '(' + direction + ')') : { rest: '—', mute: '×', palm: sub === 3 ? '●·' : direction + '·', bass: 'B', pluck: 'P' }[action];
      node.replaceChildren(el('span', 'rg-symbol', symbol), el('span', 'rg-action', data.short));
      node.dataset.action = action;
      var next = allowed[(allowed.indexOf(action) + 1) % allowed.length];
      var label = locationLabel(bar, slot) + '，' + chordAt(bar, slot) + '，' + data.label + (editable ? '；点击切换为' + actions[next].label : '');
      node.setAttribute('aria-label', label); node.title = label;
    }
    function save() {
      var value = { signature: signature, tempo: state.tempo, feel: state.feel, cells: state.cells };
      memory[key] = copy(value);
      try { localStorage.setItem(key, JSON.stringify(value)); }
      catch (_) { storageOK = false; }
    }
    function storageMessage() { return storageOK ? '修改仅保存在本浏览器。' : '浏览器存储不可用，修改仅在本次页面有效。'; }
    function renderScore() {
      score.replaceChildren(); cellButtons = [];
      config.bars.forEach(function (bar, barIndex) {
        var section = el('div', 'rg-bar'); section.dataset.rhythmBar = String(barIndex);
        var heading = el('h4', 'rg-bar-title', '第 ' + (barIndex + 1) + ' 小节'); heading.appendChild(el('strong', '', chordAt(barIndex, 0))); section.appendChild(heading);
        var beats = el('div', 'rg-beats'); beats.style.setProperty('--rg-subdivision', String(sub));
        for (var beat = 0; beat < 4; beat++) {
          var group = el('div', 'rg-beat');
          for (var part = 0; part < sub; part++) {
            (function (slot) {
              var wrapper = el('div', 'rg-slot'); wrapper.appendChild(el('span', 'rg-count', countLabel(slot)));
              var cell = button('rg-cell'); cell.dataset.rhythmCell = barIndex + ':' + slot; cell.disabled = !editable; paintCell(cell, barIndex, slot);
              cell.addEventListener('click', function () {
                if (running || pending || !editable) return;
                state.cells[barIndex][slot] = allowed[(allowed.indexOf(state.cells[barIndex][slot]) + 1) % allowed.length];
                paintCell(cell, barIndex, slot); save();
                editStatus.textContent = locationLabel(barIndex, slot) + '：' + actions[state.cells[barIndex][slot]].label + '。' + storageMessage();
              });
              wrapper.appendChild(cell);
              var change = (bar.changes || []).find(function (item) { return item.slot === slot && slot !== 0; });
              wrapper.appendChild(el('span', 'rg-change', change ? '→' + change.chord : ''));
              cellButtons.push(cell); group.appendChild(wrapper);
            })(beat * sub + part);
          }
          beats.appendChild(group);
        }
        section.appendChild(beats); score.appendChild(section);
      });
    }
    renderScore();
    container.appendChild(el('p', 'rg-help', editable ? '点击格子依次切换：' + allowed.map(function (action) { return actions[action].label; }).join(' → ') + '。播放时锁定节奏与速度；先停止再修改。' : '此谱用于对照试听，动作不可编辑；停止后可调整速度。'));
    editStatus.textContent = storageMessage(); container.appendChild(editStatus);
    var legend = el('details', 'rg-legend'); legend.appendChild(el('summary', '', '动作图例与试听说明'));
    var list = el('dl');
    var shown = Array.from(new Set(allowed.concat(state.cells.reduce(function (all, row) { return all.concat(row); }, []))));
    shown.forEach(function (action) { list.append(el('dt', '', actions[action].label), el('dd', '', actions[action].explain)); });
    legend.appendChild(list);
    legend.appendChild(el('p', '', sub === 3 ? '每拍分成三个相等位置（1 trip let）。本图不指定三连音的上下扫法；按课文动作练习。' : '↓↑ 表示扫弦与空扫时连续的手臂摆动方向。B / P 是单音动作，选弦以课文为准。'));
    if (sub === 2) legend.appendChild(el('p', '', 'Swing 试听把每拍两格近似分为 2∶1；真实 Swing 随速度和演奏者变化，不是固定比例。'));
    legend.appendChild(el('p', '', '这是合成音的节奏参考，不会录音或判断你的演奏。每次开始先数四拍；和弦箭头在对应格生效。F 使用 xx321x（F3–A3–C4）。'));
    container.appendChild(legend);

    function lock(locked) {
      controls.forEach(function (control) { control.disabled = locked; });
      cellButtons.forEach(function (cell) { cell.disabled = locked || !editable; });
      start.disabled = locked; stopButton.disabled = !locked;
    }
    function stop(message) {
      generation++; running = false; pending = false;
      clearInterval(scheduler); scheduler = null;
      timers.forEach(clearTimeout); timers.clear();
      nodes.forEach(function (voice) { try { voice.source.stop(); } catch (_) {} voice.source.disconnect(); voice.gain.disconnect(); });
      nodes.clear(); pitched.clear();
      if (output) { output.disconnect(); output = null; }
      cellButtons.forEach(function (cell) { cell.classList.remove('is-current'); cell.removeAttribute('aria-current'); });
      lock(false); status.setAttribute('aria-live', 'polite');
      status.textContent = typeof message === 'string' ? message : '已停止 · 再开始会重新预备一小节';
      if (activeStop === stop) activeStop = null;
    }
    function track(source, gain, pitchedVoice, end) {
      var voice = { source: source, gain: gain, end: end };
      nodes.add(voice); if (pitchedVoice) pitched.add(voice);
      source.onended = function () { nodes.delete(voice); pitched.delete(voice); source.disconnect(); gain.disconnect(); };
      return voice;
    }
    function tone(note, when, duration, level, pitchedVoice, waveform) {
      var source = context.createOscillator(), gain = context.createGain();
      source.type = waveform || 'triangle'; source.frequency.value = 440 * Math.pow(2, (note - 69) / 12);
      gain.gain.setValueAtTime(.0001, when);
      gain.gain.exponentialRampToValueAtTime(level, when + .006);
      gain.gain.exponentialRampToValueAtTime(Math.max(.0001, level * .28), when + Math.min(.1, duration * .3));
      gain.gain.exponentialRampToValueAtTime(.0001, when + duration);
      source.connect(gain).connect(output);
      track(source, gain, pitchedVoice, when + duration + .02); source.start(when); source.stop(when + duration + .02);
    }
    function damp(when) {
      pitched.forEach(function (voice) {
        if (voice.end <= when) return;
        var gain = voice.gain.gain;
        if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(when);
        else { gain.cancelScheduledValues(when); gain.setValueAtTime(.012, when); }
        gain.exponentialRampToValueAtTime(.0001, when + .018);
        try { voice.source.stop(when + .025); } catch (_) {}
        voice.end = when + .025;
      });
    }
    function percussion(when) {
      var duration = .055, length = Math.ceil(context.sampleRate * duration);
      var buffer = context.createBuffer(1, length, context.sampleRate), samples = buffer.getChannelData(0);
      for (var i = 0; i < length; i++) samples[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
      var source = context.createBufferSource(), gain = context.createGain(); source.buffer = buffer;
      gain.gain.setValueAtTime(.16, when); gain.gain.exponentialRampToValueAtTime(.0001, when + duration);
      source.connect(gain).connect(output); track(source, gain, false, when + duration); source.start(when); source.stop(when + duration);
    }
    function playAction(action, chord, slot, when, beatDuration) {
      if (action === 'air') return;
      if (['rest', 'mute', 'strum', 'palm'].indexOf(action) !== -1) damp(when);
      if (action === 'rest') return;
      if (action === 'mute') { percussion(when); return; }
      var notes = chords[chord].slice();
      if (action === 'bass') notes = notes.slice(0, 1);
      else if (action === 'pluck') { var upper = notes.slice(-3); notes = [upper[pluckIndex++ % upper.length]]; }
      else if (sub !== 3 && slot % 2) notes.reverse();
      var duration = action === 'palm' ? .105 : Math.min(2.5, beatDuration * 3.2);
      notes.forEach(function (note, index) { tone(note, when + index * .005, duration, action === 'bass' || action === 'pluck' ? .14 : .075, true); });
    }
    tempo.addEventListener('change', function () { if (running || pending) return; state.tempo = Math.round(clamp(tempo.value, 50, 120, original.tempo)); tempo.value = state.tempo; save(); });
    feel.addEventListener('change', function () { if (running || pending) return; state.feel = feel.value === 'swing' ? 'swing' : 'straight'; save(); });
    volume.addEventListener('input', function () { if (output && context) output.gain.setTargetAtTime(Number(volume.value), context.currentTime, .02); });
    reset.addEventListener('click', function () {
      if (running || pending) return;
      state = copy(original); tempo.value = state.tempo; feel.value = state.feel; save(); renderScore();
      editStatus.textContent = '本图已恢复预设。' + storageMessage();
    });
    stopButton.addEventListener('click', function () { stop(); });
    start.addEventListener('click', async function () {
      if (running || pending || destroyed) return;
      if (activeStop) activeStop('已停止 · 另一张节奏图开始播放');
      activeStop = stop; pending = true; lock(true);
      var token = ++generation;
      status.textContent = '正在准备音频…';
      try {
        var Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) throw new Error('此浏览器不支持音频试听');
        context = context || new Audio();
        await context.resume();
        if (token !== generation || destroyed || document.hidden) { if (token === generation) stop(); return; }
        pending = false; running = true;
        state.tempo = Math.round(clamp(tempo.value, 50, 120, original.tempo)); tempo.value = state.tempo; save();
        var beatDuration = 60 / state.tempo;
        output = context.createGain(); output.gain.value = Number(volume.value); output.connect(context.destination);
        var origin = context.currentTime + .08, tick = -perBar, length = config.bars.length * perBar;
        pluckIndex = 0; status.setAttribute('aria-live', 'off');
        function timeAt(index) {
          var relative = index + perBar;
          var fraction = (relative % sub) / sub;
          if (sub === 2 && state.feel === 'swing' && relative % sub) fraction = 2 / 3;
          return origin + (Math.floor(relative / sub) + fraction) * beatDuration;
        }
        function schedule() {
          if (!running || token !== generation) return;
          while (timeAt(tick) < context.currentTime + .1) {
            var when = timeAt(tick), pre = tick < 0, local = pre ? tick + perBar : tick % length;
            var bar = Math.floor(local / perBar), slot = local % perBar;
            if (slot % sub === 0) tone(slot === 0 ? 91 : 84, when, .035, pre ? .12 : .045, false, 'sine');
            if (!pre) {
              if (local === 0) pluckIndex = 0;
              playAction(state.cells[bar][slot], chordAt(bar, slot), slot, when, beatDuration);
            }
            (function (preparing, barIndex, slotIndex, at) {
              var timer = setTimeout(function () {
                timers.delete(timer); if (!running || token !== generation) return;
                status.textContent = preparing ? '预备 · 第 ' + (Math.floor(slotIndex / sub) + 1) + ' / 4 拍' : '第 ' + (barIndex + 1) + ' / ' + config.bars.length + ' 小节 · ' + chordAt(barIndex, slotIndex) + ' · ' + countLabel(slotIndex) + (slotIndex % sub ? '（第 ' + (Math.floor(slotIndex / sub) + 1) + ' 拍内）' : ' 拍');
                cellButtons.forEach(function (cell, index) {
                  var current = !preparing && index === barIndex * perBar + slotIndex;
                  cell.classList.toggle('is-current', current); if (current) cell.setAttribute('aria-current', 'step'); else cell.removeAttribute('aria-current');
                });
              }, Math.max(0, (at - context.currentTime) * 1000));
              timers.add(timer);
            })(pre, bar, slot, when);
            tick++;
          }
        }
        schedule(); scheduler = setInterval(schedule, 25);
      } catch (error) {
        if (token !== generation || destroyed) return;
        stop('音频未能启动：' + error.message + '。仍可按谱配合实体节拍器练习。');
      }
    });
    function hidden() { if (document.hidden && (running || pending)) stop('页面离开前已停止 · 回来后可重新开始'); }
    function pagehide() { if (running || pending) stop(); }
    document.addEventListener('visibilitychange', hidden); window.addEventListener('pagehide', pagehide);
    var api = {
      stop: stop,
      getState: function () { return copy({ id: config.id, tempo: state.tempo, feel: state.feel, cells: state.cells, running: running, pending: pending }); },
      destroy: function () {
        stop(); destroyed = true; document.removeEventListener('visibilitychange', hidden); window.removeEventListener('pagehide', pagehide);
        container.replaceChildren(); container.classList.remove('rhythm-grid'); delete container.rhythmGrid;
      }
    };
    container.rhythmGrid = api;
    return api;
  };
})();
