/* 主循环：状态机、计时、调度各模块 */
(function (BE) {
  'use strict';

  var C = BE.Config;
  var params = {};

  var stage = null;
  var canvas = null;
  var ctx = null;
  var view = { w: 1, h: 1, dpr: 1, ctx: null, background: null };
  var state = null;
  var lastTime = 0;
  var resultShown = false;

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function createState() {
    var seed = (C.seed !== null && C.seed !== undefined)
      ? (C.seed >>> 0)
      : ((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0);

    var s = {
      rng: mulberry32(seed),
      seed: seed,
      params: {
        rings: params.rings,
        speedScale: params.speedScale,
        gapDeg: params.gapDeg,
        addPerHit: params.addPerHit,
        countdownOn: params.countdownOn,
        countdownSec: params.countdownSec
      },
      rings: [],
      ball: null,
      particles: [],
      trail: [],
      destroyedCount: 0,
      bounces: 0,
      elapsed: 0,
      wear: 0,
      gapHalf: 0,
      noAddNext: false,   // 上一次撞击之后穿过圆环 → 下一次撞击不再新增圆环
      freeBounces: 0,     // 统计：因“穿出后免费”而没有增环的撞击次数
      status: 'ready',
      scale: 1,
      scaleTarget: 1,
      focusX: 0,
      focusY: 0,
      scaleDirty: true
    };

    s.gapHalf = BE.Rings.gapHalfRad(s);
    s.rings = BE.Rings.buildInitial(s);
    s.ball = BE.Ball.create(s);
    BE.Camera.init(s, view);
    return s;
  }

  function resize() {
    if (!stage) return;
    var rect = stage.getBoundingClientRect();
    var w = Math.max(1, Math.round(rect.width));
    var h = Math.max(1, Math.round(rect.height));
    var dpr = Math.min(2, window.devicePixelRatio || 1);

    // 尺寸没有变化时不要重设 canvas.width/height——那会清空画布并闪一帧
    if (w === view.w && h === view.h && dpr === view.dpr && view.background) return;

    view.w = w;
    view.h = h;
    view.dpr = dpr;
    view.ctx = ctx;

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    BE.Render.prepare(view);
    if (state) {
      // 立刻重绘一帧，避免 canvas 尺寸变化（会清空画布）后出现空白
      BE.Camera.markDirty(state);
      state.scaleTarget = BE.Camera.fit(state, view);
      BE.Render.draw(ctx, state, view);
      BE.UI.sync(state);
    }
  }

  function pushTrail(s) {
    var trail = s.trail;
    trail.push({ x: s.ball.x, y: s.ball.y });
    while (trail.length > C.trail.length) trail.shift();
  }

  /* startRunning: 新一局是否立刻播放；showOverlay: 是否重新弹出“进入动画”遮罩 */
  function restart(startRunning, showOverlay) {
    state = createState();
    resultShown = false;
    BE.UI.hideResult();
    if (startRunning) {
      state.status = 'running';
      BE.UI.hideStart();
    } else {
      state.status = 'ready';
      if (showOverlay) BE.UI.showStart();
      else BE.UI.hideStart();
    }
    BE.UI.sync(state);
  }

  function applySpeed() {
    params.speedScale = parseFloat(document.getElementById('optSpeed').value) || 0;
    if (!state) return;
    state.params.speedScale = params.speedScale;
    for (var i = 0; i < state.rings.length; i++) {
      state.rings[i].omega = BE.Rings.rotationSpeed(i, params.speedScale);
    }
  }

  var handlers = {
    /* 只关闭“进入动画”遮罩，不改变播放状态：进入后由“开始”按钮决定何时播放 */
    onEnter: function () {
      BE.UI.hideStart();
    },
    /* 双语义按钮：开始 → 播放；暂停 → 暂停；继续 → 继续 */
    onToggle: function () {
      if (!state) return;
      if (state.status === 'ready' || state.status === 'paused') {
        state.status = 'running';
      } else if (state.status === 'running') {
        state.status = 'paused';
      } else {
        restart(true);   // won / lost 状态下点它 → 直接开新的一局
        return;
      }
      BE.UI.sync(state);
    },
    onRestart: function () { restart(true, false); },
    onAgain: function () { restart(true, false); },
    /* 只关掉结算遮罩、保留当前画面；随后调参会进入“静止待开始”，不用再手动暂停 */
    onTune: function () {
      BE.UI.hideResult();
      BE.UI.focusPanel();
    },
    onStructChange: function () {
      params = BE.UI.read();
      // 只有原本正在播放才继续播放；已结算或未开始都回到静止，方便连续调参
      restart(state && state.status === 'running', false);
    },
    onSpeedChange: function () { applySpeed(); },
    onCountdownChange: function () {
      params = BE.UI.read();
      if (state) {
        state.params.countdownOn = params.countdownOn;
        state.params.countdownSec = params.countdownSec;
      }
    }
  };

  function frame(now) {
    requestAnimationFrame(frame);
    if (!lastTime) lastTime = now;
    var dt = (now - lastTime) / 1000;
    lastTime = now;
    if (!isFinite(dt) || dt < 0) dt = 0;
    if (dt > 0.034) dt = 0.034;

    if (state.status === 'running') {
      state.elapsed += dt;

      var rings = state.rings;
      for (var i = state.destroyedCount; i < rings.length; i++) {
        rings[i].gap += rings[i].omega * dt;
      }
      state.gapHalf = BE.Rings.gapHalfRad(state);

      BE.Physics.step(state, dt);
      BE.Particles.update(state, dt);
      pushTrail(state);

      if (state.status === 'running' && state.params.countdownOn &&
          state.elapsed >= state.params.countdownSec) {
        state.status = 'lost';
      }
    } else if (state.status === 'won' || state.status === 'lost') {
      BE.Particles.update(state, dt);
    }

    BE.Camera.update(state, view, dt);
    BE.Render.draw(ctx, state, view);
    BE.UI.sync(state);

    if ((state.status === 'won' || state.status === 'lost') && !resultShown) {
      resultShown = true;
      BE.UI.showResult(state);
    }
  }

  function onKey(event) {
    var target = event.target || {};
    var tag = target.tagName || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || target.isContentEditable) return;

    // 遮罩期间：回车 / 空格只负责“进入动画”，不会偷偷开始播放
    if (BE.UI.isStartVisible()) {
      if (event.key === 'Enter' || event.code === 'Space') {
        event.preventDefault();
        handlers.onEnter();
      }
      return;
    }

    if (event.code === 'Space') {
      event.preventDefault();
      handlers.onToggle();
    } else if (event.key === 'r' || event.key === 'R') {
      handlers.onRestart();
    }
  }

  function init() {
    stage = document.getElementById('stage');
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    view.ctx = ctx;
    view.background = null;

    resize();
    BE.UI.init(handlers);
    params = BE.UI.read();
    restart(false, true);   // 首屏：静止 + 全局“进入动画”遮罩

    window.addEventListener('resize', resize);
    if (window.ResizeObserver && stage) {
      new ResizeObserver(resize).observe(stage);
    }
    window.addEventListener('keydown', onKey);
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window.BE);
