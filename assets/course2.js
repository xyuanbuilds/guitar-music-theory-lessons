(function () {
  'use strict';

  var STORAGE_KEY = 'guitar-theory-lessons2-progress-v1';

  function readProgress() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (_) { return {}; }
  }

  function writeProgress(progress) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }
    catch (_) { /* Local files can disable storage; the lesson still works. */ }
  }

  function initChecklist(container, lessonId, items) {
    if (!container) return;
    var progress = readProgress();
    var checked = progress[lessonId + ':checks'] || [];
    var list = document.createElement('ul');
    list.className = 'practice-list';

    items.forEach(function (item, index) {
      var row = document.createElement('li');
      row.className = 'practice-item';
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = checked.indexOf(index) !== -1;
      input.setAttribute('aria-label', item);
      var label = document.createElement('span');
      label.textContent = item;
      input.addEventListener('change', function () {
        var state = readProgress();
        var values = state[lessonId + ':checks'] || [];
        values = input.checked ? values.concat(index) : values.filter(function (x) { return x !== index; });
        state[lessonId + ':checks'] = values.filter(function (x, i, a) { return a.indexOf(x) === i; });
        writeProgress(state);
      });
      row.appendChild(input);
      row.appendChild(label);
      list.appendChild(row);
    });
    container.appendChild(list);
  }

  function initCompletion(container, lessonId, nextHref) {
    if (!container) return;
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'complete-button';
    var next = document.createElement('a');
    next.href = nextHref || 'index.html';
    next.textContent = nextHref ? '进入下一课 →' : '返回课程地图 →';

    function paint() {
      var done = !!readProgress()[lessonId];
      button.textContent = done ? '✓ 已完成' : '标记本课完成';
      button.classList.toggle('is-done', done);
    }

    button.addEventListener('click', function () {
      var state = readProgress();
      state[lessonId] = !state[lessonId];
      writeProgress(state);
      paint();
    });
    paint();
    container.appendChild(button);
    container.appendChild(next);
  }

  function initCourseMap() {
    var progress = readProgress();
    document.querySelectorAll('[data-lesson-id]').forEach(function (link) {
      link.classList.toggle('done', !!progress[link.getAttribute('data-lesson-id')]);
    });
    var total = document.querySelectorAll('[data-lesson-id]').length;
    var done = document.querySelectorAll('[data-lesson-id].done').length;
    var counter = document.querySelector('[data-progress-count]');
    if (counter) counter.textContent = done + ' / ' + total;
  }

  function initCourseQuiz(container, questions) {
    var shuffled = questions.map(function (question) {
      var choices = question.choices.map(function (label, index) {
        return { label: label, correct: index === question.answer };
      });
      for (var i = choices.length - 1; i > 0; i -= 1) {
        var j = Math.floor(Math.random() * (i + 1));
        var temporary = choices[i];
        choices[i] = choices[j];
        choices[j] = temporary;
      }
      return {
        prompt: question.prompt,
        choices: choices.map(function (choice) { return choice.label; }),
        answer: choices.findIndex(function (choice) { return choice.correct; }),
        explain: question.explain
      };
    });
    window.initQuiz(container, shuffled);
  }

  function noteFrequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function playTone(context, frequency, start, duration) {
    var oscillator = context.createOscillator();
    var gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  function initIntervalTrainer(container) {
    if (!container) return;
    var intervals = [
      { name: '大三度', semitones: 4 },
      { name: '小三度', semitones: 3 },
      { name: '纯四度', semitones: 5 },
      { name: '纯五度', semitones: 7 }
    ];
    var current = null;
    var context = null;
    var prompt = document.createElement('p');
    prompt.textContent = '先听两个音，再凭听感选择音程。';
    var play = document.createElement('button');
    play.type = 'button';
    play.className = 'audio-button';
    play.textContent = '▶ 播放音程';
    var choices = document.createElement('div');
    choices.className = 'ear-controls';
    var feedback = document.createElement('div');
    feedback.className = 'ear-feedback';

    function newRound() {
      current = intervals[Math.floor(Math.random() * intervals.length)];
      current.root = 48 + Math.floor(Math.random() * 10);
      feedback.textContent = '';
      feedback.className = 'ear-feedback';
    }

    function playCurrent() {
      context = context || new (window.AudioContext || window.webkitAudioContext)();
      var now = context.currentTime + 0.05;
      playTone(context, noteFrequency(current.root), now, 0.48);
      playTone(context, noteFrequency(current.root + current.semitones), now + 0.58, 0.55);
    }

    intervals.forEach(function (interval) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'ear-choice';
      button.textContent = interval.name;
      button.addEventListener('click', function () {
        if (interval.name === current.name) {
          feedback.textContent = '答对：' + current.name + '。再听一题。';
          feedback.className = 'ear-feedback good';
          window.setTimeout(newRound, 900);
        } else {
          feedback.textContent = '再听一次。先哼根音，再感觉第二个音离它有多远。';
          feedback.className = 'ear-feedback bad';
        }
      });
      choices.appendChild(button);
    });
    play.addEventListener('click', playCurrent);
    container.appendChild(prompt);
    container.appendChild(play);
    container.appendChild(choices);
    container.appendChild(feedback);
    newRound();
  }

  window.Course2 = {
    initChecklist: initChecklist,
    initCompletion: initCompletion,
    initCourseMap: initCourseMap,
    initQuiz: initCourseQuiz,
    initIntervalTrainer: initIntervalTrainer
  };
})();
