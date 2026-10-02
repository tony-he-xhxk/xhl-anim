/* 界面：参数面板、HUD、开始 / 结果遮罩 */
(function (BE) {
  'use strict';

  var C = BE.Config;
  var el = {};
  var app = {};
  var cache = { rings: null, escaped: null, time: null, pause: null };

  function $(id) { return document.getElementById(id); }

  function bind(node, type, fn) {
    if (node) node.addEventListener(type, fn);
  }

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function formatTime(sec) {
    var s = Math.max(0, sec);
    var m = Math.floor(s / 60);
    var rest = s - m * 60;
    var whole = Math.floor(rest);
    var tenths = Math.floor((rest - whole) * 10);
    return pad2(m) + ':' + pad2(whole) + '.' + tenths;
  }

  function setupRange(node, out, cfg) {
    if (!node) return;
    node.min = String(cfg.min);
    node.max = String(cfg.max);
    node.step = String(cfg.step);
    node.value = String(cfg.value);
    if (out) out.textContent = cfg.format ? cfg.format(cfg.value) : String(cfg.value);
  }

  BE.UI = {
    formatTime: formatTime,

    init: function (handlers) {
      app = handlers || {};

      el.rings = $('optRings');
      el.ringsOut = $('optRingsOut');
      el.speed = $('optSpeed');
      el.speedOut = $('optSpeedOut');
      el.gap = $('optGap');
      el.gapOut = $('optGapOut');
      el.add = $('optAdd');
      el.addOut = $('optAddOut');
      el.countdownOn = $('countdownOn');
      el.countdownSec = $('countdownSec');
      el.countdownWrap = $('countdownWrap');
      el.pauseBtn = $('pauseBtn');
      el.restartBtn = $('restartBtn');
      el.startOverlay = $('startOverlay');
      el.startBtn = $('startBtn');
      el.resultOverlay = $('resultOverlay');
      el.resultTitle = $('resultTitle');
      el.resultText = $('resultText');
      el.againBtn = $('againBtn');
      el.hudRings = $('hudRings');
      el.hudEscaped = $('hudEscaped');
      el.hudTime = $('hudTime');

      var d = C.defaults;
      setupRange(el.rings, el.ringsOut, { min: C.rings.initialMin, max: C.rings.initialMax, step: 1, value: d.rings, format: function (v) { return v + ' 层'; } });
      setupRange(el.speed, el.speedOut, { min: 0, max: 2, step: 0.05, value: d.speedScale, format: function (v) { return Number(v).toFixed(2) + '×'; } });
      setupRange(el.gap, el.gapOut, { min: C.rings.gapDegMin, max: C.rings.gapDegMax, step: 1, value: d.gapDeg, format: function (v) { return v + '°'; } });
      setupRange(el.add, el.addOut, { min: 1, max: 3, step: 1, value: d.addPerHit, format: function (v) { return v + ' 层'; } });

      if (el.countdownOn) el.countdownOn.checked = !!d.countdownOn;
      if (el.countdownSec) el.countdownSec.value = String(d.countdownSec);
      this.syncCountdown();

      bind(el.rings, 'input', function () { el.ringsOut.textContent = el.rings.value + ' 层'; });
      bind(el.speed, 'input', function () {
        el.speedOut.textContent = Number(el.speed.value).toFixed(2) + '×';
        if (app.onSpeedChange) app.onSpeedChange();
      });
      bind(el.gap, 'input', function () { el.gapOut.textContent = el.gap.value + '°'; });
      bind(el.add, 'input', function () { el.addOut.textContent = el.add.value + ' 层'; });

      bind(el.rings, 'change', function () { if (app.onStructChange) app.onStructChange(); });
      bind(el.gap, 'change', function () { if (app.onStructChange) app.onStructChange(); });
      bind(el.add, 'change', function () { if (app.onStructChange) app.onStructChange(); });

      bind(el.countdownOn, 'change', function () {
        BE.UI.syncCountdown();
        if (app.onCountdownChange) app.onCountdownChange();
      });
      bind(el.countdownSec, 'change', function () {
        if (app.onCountdownChange) app.onCountdownChange();
      });

      bind(el.pauseBtn, 'click', function () { if (app.onPause) app.onPause(); });
      bind(el.restartBtn, 'click', function () { if (app.onRestart) app.onRestart(); });
      bind(el.startBtn, 'click', function () { if (app.onStart) app.onStart(); });
      bind(el.againBtn, 'click', function () { if (app.onAgain) app.onAgain(); });
    },

    read: function () {
      var sec = parseInt(el.countdownSec && el.countdownSec.value, 10);
      if (!isFinite(sec) || sec < 5) sec = C.defaults.countdownSec;
      return {
        rings: parseInt(el.rings.value, 10) || C.defaults.rings,
        speedScale: parseFloat(el.speed.value),
        gapDeg: parseFloat(el.gap.value) || C.defaults.gapDeg,
        addPerHit: parseInt(el.add.value, 10) || C.defaults.addPerHit,
        countdownOn: !!(el.countdownOn && el.countdownOn.checked),
        countdownSec: sec
      };
    },

    syncCountdown: function () {
      if (el.countdownWrap) el.countdownWrap.hidden = !(el.countdownOn && el.countdownOn.checked);
    },

    sync: function (state) {
      var remaining = state.rings.length - state.destroyedCount;
      if (cache.rings !== remaining) {
        cache.rings = remaining;
        if (el.hudRings) el.hudRings.textContent = String(remaining);
      }
      if (cache.escaped !== state.destroyedCount) {
        cache.escaped = state.destroyedCount;
        if (el.hudEscaped) el.hudEscaped.textContent = String(state.destroyedCount);
      }
      var time = formatTime(state.elapsed);
      if (cache.time !== time) {
        cache.time = time;
        if (el.hudTime) el.hudTime.textContent = time;
      }
      var label = state.status === 'paused' ? '继续' : '暂停';
      if (cache.pause !== label) {
        cache.pause = label;
        if (el.pauseBtn) el.pauseBtn.textContent = label;
      }
    },

    hideStart: function () {
      if (el.startOverlay) el.startOverlay.hidden = true;
    },

    showStart: function () {
      if (el.startOverlay) el.startOverlay.hidden = false;
    },

    hideResult: function () {
      if (el.resultOverlay) el.resultOverlay.hidden = true;
    },

    showResult: function (state) {
      if (!el.resultOverlay) return;
      var time = formatTime(state.elapsed);
      if (state.status === 'won') {
        el.resultTitle.textContent = '小球成功逃离！';
        el.resultText.textContent = '用时 ' + time + '，撞击 ' + state.bounces + ' 次，共击碎 ' +
          state.rings.length + ' 层圆环。';
      } else {
        var remaining = state.rings.length - state.destroyedCount;
        el.resultTitle.textContent = '时间到，小球仍被困住';
        el.resultText.textContent = '限时 ' + state.params.countdownSec + ' 秒，已逃离 ' +
          state.destroyedCount + ' 层，还剩 ' + remaining + ' 层。';
      }
      el.resultOverlay.hidden = false;
    }
  };
})(window.BE);
