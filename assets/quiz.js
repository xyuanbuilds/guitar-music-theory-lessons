/**
 * Shared retrieval-practice quiz component.
 * Usage in a lesson HTML file:
 *
 *   <div class="quiz" id="quiz-1"></div>
 *   <script src="../assets/quiz.js"></script>
 *   <script>
 *     initQuiz(document.getElementById('quiz-1'), [
 *       { prompt: '6 弦 5 品是哪个音？', choices: ['A2', 'G2', 'B2', 'C3'], answer: 0 },
 *       // ...
 *     ]);
 *   </script>
 *
 * Rules this component enforces (per teach skill quiz guidance):
 *   - choices are rendered as fixed-width buttons, so differing label
 *     length never gives a visual clue.
 *   - feedback is immediate, per-question (tight feedback loop).
 *   - one question shown at a time; "next" only appears after answering.
 */
function initQuiz(container, questions) {
  var current = 0;
  var correctCount = 0;
  var answered = false;

  function render() {
    container.innerHTML = '';
    answered = false;

    var progress = document.createElement('div');
    progress.className = 'quiz-progress';
    progress.textContent = '第 ' + (current + 1) + ' / ' + questions.length + ' 题';
    container.appendChild(progress);

    var q = questions[current];

    var prompt = document.createElement('div');
    prompt.className = 'quiz-prompt';
    prompt.textContent = q.prompt;
    container.appendChild(prompt);

    var choicesEl = document.createElement('div');
    choicesEl.className = 'quiz-choices';

    q.choices.forEach(function (choice, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-choice';
      btn.textContent = choice;
      btn.addEventListener('click', function () { handleAnswer(i, btn, choicesEl); });
      choicesEl.appendChild(btn);
    });
    container.appendChild(choicesEl);

    var feedback = document.createElement('div');
    feedback.className = 'quiz-feedback';
    feedback.id = 'quiz-feedback-slot';
    container.appendChild(feedback);

    var nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'quiz-next';
    nextBtn.textContent = (current === questions.length - 1) ? '查看结果' : '下一题';
    nextBtn.addEventListener('click', function () {
      if (current < questions.length - 1) {
        current += 1;
        render();
      } else {
        renderSummary();
      }
    });
    container.appendChild(nextBtn);
    container._nextBtn = nextBtn;
  }

  function handleAnswer(i, btn, choicesEl) {
    if (answered) return;
    answered = true;
    var q = questions[current];
    var buttons = choicesEl.querySelectorAll('.quiz-choice');
    buttons.forEach(function (b, idx) {
      b.disabled = true;
      if (idx === q.answer) b.classList.add('correct');
    });
    var feedback = container.querySelector('#quiz-feedback-slot');
    if (i === q.answer) {
      correctCount += 1;
      feedback.textContent = '✓ 对了。' + (q.explain || '');
      feedback.className = 'quiz-feedback correct';
    } else {
      btn.classList.add('incorrect');
      feedback.textContent = '✗ 不对，正确答案是 ' + q.choices[q.answer] + '。' + (q.explain || '');
      feedback.className = 'quiz-feedback incorrect';
    }
    container._nextBtn.style.display = 'inline-block';
  }

  function renderSummary() {
    container.innerHTML = '';
    var summary = document.createElement('div');
    summary.className = 'quiz-summary';
    summary.textContent = '本组答对 ' + correctCount + ' / ' + questions.length + '。';
    if (correctCount === questions.length) {
      summary.textContent += ' 全对，可以进入下一课了。';
    } else {
      summary.textContent += ' 建议刷新页面再练一轮，直到能稳定全对。';
    }
    container.appendChild(summary);

    var retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.className = 'quiz-next';
    retryBtn.style.display = 'inline-block';
    retryBtn.textContent = '重新练一轮';
    retryBtn.addEventListener('click', function () {
      current = 0;
      correctCount = 0;
      render();
    });
    container.appendChild(retryBtn);
  }

  render();
}
