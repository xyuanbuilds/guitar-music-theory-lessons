(function () {
  'use strict';

  var KEY = 'guitar-theory-technique-progress-v1';

  function emptyState() {
    return { target: null, diagnostic: null, records: [] };
  }

  function readState() {
    try {
      var parsed = JSON.parse(localStorage.getItem(KEY));
      if (!parsed || typeof parsed !== 'object') return emptyState();
      return {
        target: parsed.target || null,
        diagnostic: parsed.diagnostic || null,
        records: Array.isArray(parsed.records) ? parsed.records : []
      };
    } catch (error) {
      return emptyState();
    }
  }

  function writeState(state, changedKeys) {
    try {
      var latest = readState();
      (changedKeys || ['target', 'diagnostic', 'records']).forEach(function (key) {
        latest[key] = state[key];
      });
      localStorage.setItem(KEY, JSON.stringify(latest));
      state.target = latest.target;
      state.diagnostic = latest.diagnostic;
      state.records = latest.records;
      return true;
    } catch (error) {
      return false;
    }
  }

  function today() {
    var now = new Date();
    var local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach(function (node) {
      node.textContent = value;
    });
  }

  function targetLabel(target) {
    if (!target) return '尚未确认';
    return target.candidate + (target.timestamp ? ' · ' + target.timestamp : '');
  }

  function renderTarget(state) {
    setText('[data-target-summary]', targetLabel(state.target));
    document.querySelectorAll('[data-target-state]').forEach(function (node) {
      node.dataset.state = state.target ? 'ready' : 'locked';
    });
    document.querySelectorAll('[data-target-locked]').forEach(function (node) {
      node.hidden = Boolean(state.target);
    });
    document.querySelectorAll('[data-target-ready]').forEach(function (node) {
      node.hidden = !state.target;
    });
  }

  function bindTargetForm(state) {
    var form = document.querySelector('[data-target-form]');
    if (!form) return;
    if (state.target) {
      var saved = form.querySelector('[name="candidate"][value="' + state.target.candidateId + '"]');
      if (saved) saved.checked = true;
      form.elements.timestamp.value = state.target.timestamp || '';
    }
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var selected = form.querySelector('[name="candidate"]:checked');
      var status = form.querySelector('[data-save-status]');
      if (!selected) {
        status.textContent = '请先选择一个候选段落。';
        return;
      }
      var custom = form.elements.custom.value.trim();
      var label = selected.dataset.label;
      if (selected.value === 'other') {
        if (!custom) {
          status.textContent = '选择“其它”时，请写下段落描述。';
          return;
        }
        label = '其它：' + custom;
      }
      state.target = {
        candidateId: selected.value,
        candidate: label,
        timestamp: form.elements.timestamp.value.trim(),
        confirmedAt: new Date().toISOString()
      };
      if (writeState(state, ['target'])) {
        status.textContent = '已确认。训练面板已解锁目标状态，但专项练习仍需按授权谱核对后生成。';
        renderTarget(state);
      } else {
        status.textContent = '浏览器未允许保存；请手动记下选择。';
      }
    });
  }

  function diagnosticMarkdown(data) {
    return [
      '# 手上诊断 · ' + data.date,
      '',
      '| 项目 | 结果 |',
      '| --- | --- |',
      '| E → Am 一分钟干净切换 | ' + data.changes + ' 次 |',
      '| 6 弦 E2 八分下拨 | ' + data.downBpm + ' BPM，' + data.downSeconds + ' 秒 |',
      '| 1 弦 E4 十六分交替拨 | ' + data.altBpm + ' BPM，' + data.altSeconds + ' 秒 |',
      '| E5 强力和弦 + palm mute | ' + data.powerBpm + ' BPM，' + data.powerBars + ' 小节 |',
      '| 5 弦 C3 → F3 换把 | ' + data.shift + ' |',
      '| 备注 | ' + (data.notes || '无') + ' |',
      '',
      '> 自测数据，不代表老师确认或掌握证明。'
    ].join('\n');
  }

  function bindDiagnostic(state) {
    var form = document.querySelector('[data-diagnostic-form]');
    if (!form) return;
    var output = document.querySelector('[data-diagnostic-output]');
    if (state.diagnostic) {
      Object.keys(state.diagnostic).forEach(function (key) {
        if (form.elements[key]) form.elements[key].value = state.diagnostic[key];
      });
      output.value = diagnosticMarkdown(state.diagnostic);
    } else {
      form.elements.date.value = today();
    }
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var data = {};
      new FormData(form).forEach(function (value, key) { data[key] = String(value).trim(); });
      state.diagnostic = data;
      output.value = diagnosticMarkdown(data);
      var status = form.querySelector('[data-save-status]');
      status.textContent = writeState(state, ['diagnostic']) ? '诊断已保存在本浏览器；下次应从这些稳定值开始。' : '无法保存，但下方摘要仍可复制。';
    });
    var copy = document.querySelector('[data-copy-diagnostic]');
    if (copy) copy.addEventListener('click', function () {
      var output = document.querySelector('[data-diagnostic-output]');
      var status = form.querySelector('[data-save-status]');
      if (!output.value) {
        status.textContent = '请先完成表单并生成诊断摘要。';
        return;
      }
      output.select();
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        status.textContent = '浏览器未允许自动复制；文本已选中，可手动复制。';
        return;
      }
      navigator.clipboard.writeText(output.value).then(function () {
        copy.textContent = '已复制';
      }).catch(function () {
        status.textContent = '浏览器未允许自动复制；文本已选中，可手动复制。';
      });
    });
  }

  function markdownCell(value, fallback) {
    var text = value === undefined || value === null || value === '' ? (fallback || '') : String(value);
    return text.replace(/\r?\n/g, ' ').replace(/\|/g, '\\|');
  }

  function recordContext(item) {
    var target = item.targetContext || '旧记录 · 未标记目标';
    return target + (item.sourceRange ? ' · ' + item.sourceRange : '');
  }

  function optionalNumber(value, suffix) {
    return value === undefined || value === null || value === '' ? '—' : value + (suffix || '');
  }

  function recordsMarkdown(records) {
    var lines = [
      '| 日期 | 练习项 | 目标 / 区间 | BPM | 细分 | 时长/小节 | 尝试次数 | 干净次数 | 原曲百分比 | 备注 |',
      '| --- | --- | --- | ---: | --- | --- | ---: | ---: | ---: | --- |'
    ];
    records.forEach(function (item) {
      lines.push('| ' + [
        markdownCell(item.date),
        markdownCell(item.exercise),
        markdownCell(recordContext(item)),
        markdownCell(optionalNumber(item.bpm)),
        markdownCell(item.subdivision),
        markdownCell(item.amount),
        markdownCell(item.attempts),
        markdownCell(item.clean),
        markdownCell(optionalNumber(item.percent, '%')),
        markdownCell(item.notes)
      ].join(' | ') + ' |');
    });
    return lines.join('\n');
  }

  function renderRecords(state) {
    var body = document.querySelector('[data-record-body]');
    if (!body) return;
    body.innerHTML = '';
    if (!state.records.length) {
      body.innerHTML = '<tr><td colspan="11">还没有记录。先做诊断，再记录稳定结果。</td></tr>';
      return;
    }
    state.records.map(function (item, index) {
      return { item: item, index: index };
    }).reverse().forEach(function (entry) {
      var item = entry.item;
      var row = document.createElement('tr');
      [
        item.date,
        item.exercise,
        recordContext(item),
        optionalNumber(item.bpm),
        item.subdivision,
        item.amount,
        item.attempts,
        item.clean,
        optionalNumber(item.percent, '%'),
        item.notes || ''
      ].forEach(function (value) {
        var cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
      });
      var action = document.createElement('td');
      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'secondary record-delete';
      remove.dataset.recordIndex = String(entry.index);
      if (item.id) remove.dataset.recordId = item.id;
      remove.textContent = '删除';
      remove.setAttribute('aria-label', '删除 ' + item.date + ' ' + item.exercise + ' 记录');
      action.appendChild(remove);
      row.appendChild(action);
      body.appendChild(row);
    });
  }

  function bindRecords(state) {
    var form = document.querySelector('[data-record-form]');
    if (!form) return;
    form.elements.date.value = today();
    renderRecords(state);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var item = {};
      new FormData(form).forEach(function (value, key) { item[key] = String(value).trim(); });
      var status = form.querySelector('[data-save-status]');
      var attempts = Number(item.attempts);
      var clean = Number(item.clean);
      if (clean > attempts) {
        status.textContent = '干净次数不能大于尝试次数。';
        return;
      }
      var noBpmNeeded = ['姿势 / 拨片 / 落点', 'C3 → F3 换把', '录音回听'].indexOf(item.exercise) !== -1;
      if (!noBpmNeeded && !item.bpm) {
        status.textContent = '这个节拍练习需要填写 BPM。';
        return;
      }
      if ((item.percent && !item.sourceRange) || (!item.percent && item.sourceRange)) {
        status.textContent = '原曲跟弹请同时填写百分比和时间区间；通用练习两项都留空。';
        return;
      }
      var latest = readState();
      state.target = latest.target;
      state.diagnostic = latest.diagnostic;
      state.records = latest.records;
      item.id = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
      item.targetContext = state.target ? targetLabel(state.target) : '通用技巧（目标未确认）';
      state.records.push(item);
      status.textContent = writeState(state, ['records']) ? '已记录稳定结果。' : '浏览器未允许保存。';
      renderRecords(state);
    });
    var body = document.querySelector('[data-record-body]');
    body.addEventListener('click', function (event) {
      var button = event.target.closest('[data-record-index]');
      if (!button) return;
      if (button.dataset.armed !== 'true') {
        button.dataset.armed = 'true';
        button.textContent = '确认删除';
        return;
      }
      var localItem = state.records[Number(button.dataset.recordIndex)];
      var latest = readState();
      var removalIndex = -1;
      if (button.dataset.recordId) {
        removalIndex = latest.records.findIndex(function (item) { return item.id === button.dataset.recordId; });
      } else if (localItem) {
        var serialized = JSON.stringify(localItem);
        removalIndex = latest.records.findIndex(function (item) { return JSON.stringify(item) === serialized; });
      }
      if (removalIndex === -1) {
        form.querySelector('[data-save-status]').textContent = '该记录已在其它标签页中更改，请重新加载后再试。';
        return;
      }
      latest.records.splice(removalIndex, 1);
      state.records = latest.records;
      writeState(state, ['records']);
      renderRecords(state);
      form.querySelector('[data-save-status]').textContent = '已删除该条训练记录；目标和诊断数据仍保留。';
    });
    var exportButton = document.querySelector('[data-export-records]');
    if (exportButton) exportButton.addEventListener('click', function () {
      var blob = new Blob([recordsMarkdown(state.records)], { type: 'text/markdown;charset=utf-8' });
      var link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'technique-bpm-records-' + today() + '.md';
      link.click();
      URL.revokeObjectURL(link.href);
    });
    var clearButton = document.querySelector('[data-clear-technique]');
    if (clearButton) clearButton.addEventListener('click', function () {
      if (clearButton.dataset.armed !== 'true') {
        clearButton.dataset.armed = 'true';
        clearButton.textContent = '再次点击确认清除';
        return;
      }
      state.records = [];
      writeState(state, ['records']);
      renderRecords(state);
      clearButton.dataset.armed = 'false';
      clearButton.textContent = '清空全部训练记录';
      form.querySelector('[data-save-status]').textContent = '训练记录已清空；目标和诊断数据仍保留。';
    });
  }

  function bindVideoLoaders() {
    document.querySelectorAll('[data-video-id]').forEach(function (button) {
      button.addEventListener('click', function () {
        var shell = button.closest('[data-video-shell]');
        if (!shell) return;
        var iframe = document.createElement('iframe');
        var start = Number(button.dataset.videoStart) || 0;
        iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(button.dataset.videoId) + (start ? '?start=' + start : '');
        iframe.title = button.dataset.videoTitle || '吉他技巧视频演示';
        iframe.loading = 'lazy';
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.allow = 'encrypted-media; fullscreen; picture-in-picture';
        iframe.allowFullscreen = true;
        shell.replaceChildren(iframe);
      });
    });
  }

  var state = readState();
  renderTarget(state);
  bindTargetForm(state);
  bindDiagnostic(state);
  bindRecords(state);
  bindVideoLoaders();
}());
