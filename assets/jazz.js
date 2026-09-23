(function () {
  'use strict';
  if (!window.FretboardVisual && document.querySelector('[data-fingering-set]')) {
    var fingeringScript = document.createElement('script');
    fingeringScript.src = '../assets/fretboard-visual.js?v=2';
    document.head.appendChild(fingeringScript);
  }
  var KEY = 'guitar-theory-lessons3-progress-v1';
  var memory = {};
  var storageAvailable = true;
  var activeStop = null;
  var audioContext = null;
  function read() {
    try {
      var parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (_) { storageAvailable = false; return memory; }
  }
  function save(state) {
    memory = state;
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (_) { storageAvailable = false; }
  }
  function shuffled(question) {
    var options = question.choices.map(function (label, i) { return { label: label, correct: i === question.answer }; });
    for (var i = options.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = options[i]; options[i] = options[j]; options[j] = tmp;
    }
    return { prompt: question.prompt, choices: options.map(function (x) { return x.label; }), answer: options.findIndex(function (x) { return x.correct; }), explain: question.explain };
  }
  function progress() {
    var id = document.body.dataset.lesson;
    var state = read();
    var entry = state[id] || {};
    document.querySelectorAll('[data-check]').forEach(function (box) {
      box.checked = !!(entry.checks || {})[box.dataset.check];
      box.addEventListener('change', function () {
        var latest = read(); var value = latest[id] || {};
        value.checks = value.checks || {}; value.checks[box.dataset.check] = box.checked;
        latest[id] = value; save(latest);
      });
    });
    var output = document.querySelector('[data-review-status]');
    function paint() {
      var current = read()[id] || {};
      document.querySelectorAll('[data-review]').forEach(function (button) {
        button.setAttribute('aria-pressed', String(current.stage === button.dataset.review));
      });
      if (output) output.textContent = (current.stage === 'reviewed' ? '自评：隔日复弹通过' : current.stage === 'practiced' ? '已练过，等待隔日复弹' : '尚无自评记录') +
        (current.date ? ' · ' + current.date : '') + (storageAvailable ? '（仅存本浏览器）' : '（浏览器存储不可用，本次页面有效）');
    }
    document.querySelectorAll('[data-review]').forEach(function (button) {
      button.addEventListener('click', function () {
        var latest = read(); var value = latest[id] || {};
        value.stage = value.stage === button.dataset.review ? '' : button.dataset.review;
        value.date = new Date().toLocaleDateString('zh-CN');
        latest[id] = value; save(latest); paint();
      });
    });
    paint();
    var count = 0; var reviewed = 0;
    document.querySelectorAll('[data-course-lesson]').forEach(function (link) {
      var value = state[link.dataset.courseLesson] || {};
      link.classList.toggle('done', !!value.stage);
      link.classList.toggle('reviewed', value.stage === 'reviewed');
      if (value.stage) count++;
      if (value.stage === 'reviewed') reviewed++;
    });
    var counter = document.querySelector('[data-course-progress]');
    if (counter) counter.textContent = '自评进度：练过 ' + count + ' / 18 · 隔日复弹通过 ' + reviewed + ' / 18。绿色为练过，顶边紫线为复弹通过。';
  }
  function midi(note) {
    var match = /^([A-G])([#b]?)(-?\d+)$/.exec(note);
    if (!match) throw new Error('无效音名：' + note);
    return 12 * (Number(match[3]) + 1) + { C:0,D:2,E:4,F:5,G:7,A:9,B:11 }[match[1]] + (match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0);
  }
  function initLab(container, config) {
    var start = container.querySelector('[data-start]');
    var stopButton = container.querySelector('[data-stop]');
    var tempo = container.querySelector('[data-tempo]');
    var feel = container.querySelector('[data-feel]');
    var mode = container.querySelector('[data-mode]');
    var volume = container.querySelector('[data-volume]');
    var status = container.querySelector('[data-lab-status]');
    var cards = container.querySelectorAll('[data-bar]');
    var running = false, request = 0, interval = null, output = null, nodes = new Set(), timers = new Set();
    function stop() {
      request++; running = false;
      clearInterval(interval); interval = null;
      timers.forEach(clearTimeout); timers.clear();
      nodes.forEach(function (node) { try { node.stop(); } catch (_) {} node.disconnect(); }); nodes.clear();
      if (output) { output.disconnect(); output = null; }
      [tempo, feel, mode].forEach(function (input) { input.disabled = false; });
      start.disabled = false; stopButton.disabled = true;
      status.textContent = '已停止 · 再开始会重新预备一小节';
      cards.forEach(function (card) { card.classList.remove('active'); });
      if (activeStop === stop) activeStop = null;
    }
    function tone(note, when, duration, level, type) {
      var oscillator = audioContext.createOscillator();
      var gain = audioContext.createGain();
      oscillator.type = type || 'sine';
      oscillator.frequency.value = 440 * Math.pow(2, (note - 69) / 12);
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(level, when + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + Math.max(.025, duration));
      oscillator.connect(gain).connect(output);
      nodes.add(oscillator);
      oscillator.onended = function () { nodes.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(when); oscillator.stop(when + duration + .03);
    }
    volume.addEventListener('input', function () {
      if (output) output.gain.setTargetAtTime(Number(volume.value), audioContext.currentTime, .02);
    });
    stopButton.addEventListener('click', stop);
    start.addEventListener('click', async function () {
      if (activeStop) activeStop();
      var token = ++request;
      activeStop = stop;
      start.disabled = true; stopButton.disabled = false;
      try {
        var Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) throw new Error('浏览器不支持 Web Audio');
        audioContext = audioContext || new Audio();
        await audioContext.resume();
        if (token !== request || document.hidden) { if (token === request) stop(); return; }
        var bpm = Math.max(50, Math.min(140, Number(tempo.value) || 72));
        tempo.value = bpm;
        var beat = 60 / bpm, ratio = feel.value === 'swing' ? 2 / 3 : .5;
        var demo = mode.value === 'demo';
        [tempo, feel, mode].forEach(function (input) { input.disabled = true; });
        output = audioContext.createGain(); output.gain.value = Number(volume.value); output.connect(audioContext.destination);
        running = true;
        var tick = -8, origin = audioContext.currentTime + .1;
        function timeAt(slot) {
          return origin + (Math.floor((slot + 8) / 2) + ((slot + 8) % 2 ? ratio : 0)) * beat;
        }
        function schedule() {
          if (!running) return;
          while (timeAt(tick) < audioContext.currentTime + .12) {
            var when = timeAt(tick);
            var pre = tick < 0, local = pre ? tick + 8 : tick % (config.chords.length * 8);
            var bar = Math.floor(local / 8), slot = local % 8;
            if (slot % 2 === 0) {
              tone(slot === 0 ? 91 : 84, when, .035, .08);
              if (!pre) {
                var chord = config.chords[bar];
                if (slot === 0 || slot === 4) tone(midi(chord.bass), when, beat * .7, .22, 'triangle');
                if (slot === 0) chord.voices.forEach(function (note) { tone(midi(note), when, beat * 3.6, .075); });
              }
            }
            if (!pre && demo && config.phrase) {
              var note = config.phrase[bar][slot];
              if (note !== '·' && note !== '—') {
                var end = slot + 1;
                while (end < 8 && config.phrase[bar][end] === '—') end++;
                tone(midi(note), when, Math.max(.04, (timeAt(tick + end - slot) - when) * .9), .18, 'triangle');
              }
            }
            (function (preparing, barIndex, beatNumber, at) {
              var timer = setTimeout(function () {
                timers.delete(timer);
                if (!running) return;
                status.textContent = preparing ? '预备 · 第 ' + beatNumber + ' 拍' : '第 ' + (barIndex + 1) + ' / ' + config.chords.length + ' 小节 · ' + config.chords[barIndex].name + ' · 第 ' + beatNumber + ' 拍';
                cards.forEach(function (card, i) { card.classList.toggle('active', !preparing && i === barIndex); });
              }, Math.max(0, (at - audioContext.currentTime) * 1000));
              timers.add(timer);
            })(pre, bar, Math.floor(slot / 2) + 1, when);
            tick++;
          }
        }
        schedule(); interval = setInterval(schedule, 25);
      } catch (error) {
        stop(); status.textContent = '音频未能启动。可用实体节拍器继续练习；' + error.message;
      }
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });
    window.addEventListener('pagehide', stop);
  }
  progress();
  var data = document.querySelector('#lesson-data');
  if (data) {
    var config = JSON.parse(data.textContent);
    var quiz = document.querySelector('#quiz');
    if (quiz && window.initQuiz) window.initQuiz(quiz, config.quiz.map(shuffled), { summary: '这是概念检索；是否进入下一课，以录音与隔日复弹标准为准。' });
    var lab = document.querySelector('[data-lab]');
    if (lab) initLab(lab, config);
  }
})();
