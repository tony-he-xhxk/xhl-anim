/* 渲染：圆环（彩虹半径映射）、小球与拖尾、碎裂粒子 */
(function (BE) {
  'use strict';

  var C = BE.Config;
  var TWO_PI = Math.PI * 2;

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  function buildBackground(view) {
    var g = view.ctx.createRadialGradient(
      view.w * 0.5, view.h * 0.46, 0,
      view.w * 0.5, view.h * 0.46, Math.max(view.w, view.h) * 0.78
    );
    g.addColorStop(0, '#141033');
    g.addColorStop(0.5, '#0a0a18');
    g.addColorStop(1, '#04040a');
    view.background = g;
  }

  BE.Render = {
    prepare: function (view) { buildBackground(view); },

    draw: function (ctx, state, view) {
      ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
      ctx.fillStyle = view.background || C.theme.background;
      ctx.fillRect(0, 0, view.w, view.h);

      ctx.save();
      ctx.translate(view.w / 2, view.h / 2);
      ctx.scale(state.scale, state.scale);
      ctx.translate(-state.focusX, -state.focusY);

      var rings = state.rings;
      var start = state.destroyedCount;
      var lineWidth = clamp(2 / state.scale, 0.55, C.world.ringGap * 0.42);

      for (var i = rings.length - 1; i >= start; i--) {
        var ring = rings[i];
        var hue = C.hueOf(ring.index);
        var isHub = (i === start);
        var a0 = ring.gap + state.gapHalf;
        var a1 = ring.gap + TWO_PI - state.gapHalf;
        if (a1 <= a0) continue;

        ctx.beginPath();
        ctx.arc(0, 0, ring.radius, a0, a1);
        ctx.lineCap = 'round';

        // 外层柔光
        ctx.strokeStyle = 'hsla(' + hue + ', 92%, 62%, ' + (isHub ? 0.22 : 0.13) + ')';
        ctx.lineWidth = lineWidth * 3.6;
        ctx.stroke();

        // 主体线条
        ctx.strokeStyle = 'hsla(' + hue + ', ' + (isHub ? '96%' : '88%') + ', ' + (isHub ? '70%' : '62%') + ', ' + (isHub ? 1 : 0.92) + ')';
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }

      // 碎裂粒子
      var list = state.particles;
      for (var p = 0; p < list.length; p++) {
        var part = list[p];
        var life = clamp(part.life / part.ttl, 0, 1);
        var alpha = (1 - life) * (1 - life) * 0.95;
        if (alpha <= 0.01) continue;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.rad, part.a0 + part.rot, part.a1 + part.rot);
        ctx.strokeStyle = 'hsla(' + part.hue + ', 92%, 66%, ' + alpha + ')';
        ctx.lineWidth = lineWidth * (1.6 - life);
        ctx.stroke();
      }

      var ball = state.ball;

      // 拖尾
      var trail = state.trail;
      if (trail.length > 1) {
        for (var t = 1; t < trail.length; t++) {
          var ratio = t / trail.length;
          ctx.beginPath();
          ctx.moveTo(trail[t - 1].x, trail[t - 1].y);
          ctx.lineTo(trail[t].x, trail[t].y);
          ctx.strokeStyle = 'hsla(' + C.theme.hueStart + ', 95%, 72%, ' + (ratio * 0.45) + ')';
          ctx.lineWidth = ball.r * 1.5 * ratio;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }

      // 小球
      var halo = ball.r * 5;
      var glow = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, halo);
      glow.addColorStop(0, 'rgba(255,255,255,0.95)');
      glow.addColorStop(0.28, 'rgba(196,132,252,0.55)');
      glow.addColorStop(0.7, 'rgba(34,211,238,0.16)');
      glow.addColorStop(1, 'rgba(34,211,238,0)');
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, halo, 0, TWO_PI);
      ctx.fillStyle = glow;
      ctx.fill();

      var core = ctx.createRadialGradient(ball.x - ball.r * 0.3, ball.y - ball.r * 0.34, ball.r * 0.1, ball.x, ball.y, ball.r);
      core.addColorStop(0, '#ffffff');
      core.addColorStop(0.55, '#f4f0ff');
      core.addColorStop(1, '#a855f7');
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, TWO_PI);
      ctx.fillStyle = core;
      ctx.fill();

      ctx.restore();
    }
  };
})(window.BE);
