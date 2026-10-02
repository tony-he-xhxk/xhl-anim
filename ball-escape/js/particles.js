/* 碎裂粒子：圆环被击穿时拆成弧段向外飞散 */
(function (BE) {
  'use strict';

  var C = BE.Config;
  var TWO_PI = Math.PI * 2;

  BE.Particles = {
    spawn: function (state, ring) {
      var rng = state.rng;
      var count = C.particles.perRing;
      var gapHalf = state.gapHalf;
      var arc = Math.max(0.001, TWO_PI - gapHalf * 2);

      // 每碎裂一层都补一圈向外扩散的“冲击环”，让“这一层碎了”一眼可见
      var shocks = state.shocks || (state.shocks = []);
      shocks.push({ r: ring.radius, life: 0, ttl: 0.38, hue: C.hueOf(ring.index) });

      for (var i = 0; i < count; i++) {
        var t0 = ring.gap + gapHalf + arc * (i / count);
        var t1 = ring.gap + gapHalf + arc * ((i + 0.72) / count);
        var mid = (t0 + t1) / 2;
        var sp = C.particles.speedMin + rng() * (C.particles.speedMax - C.particles.speedMin);
        var px = Math.cos(mid) * ring.radius;
        var py = Math.sin(mid) * ring.radius;
        state.particles.push({
          x: px, y: py,          // 当前位置
          x0: px, y0: py,        // 出生位置：作为刚体旋转的中心
          vx: Math.cos(mid) * sp,
          vy: Math.sin(mid) * sp,
          rot: 0,
          spin: (rng() * 2 - 1) * C.particles.spin,
          a0: t0,                // 绝对角度：出生瞬间弧段与原圆环完全重合
          a1: t1,
          rad: ring.radius,
          life: 0,
          ttl: C.particles.life * (0.75 + rng() * 0.5),
          hue: C.hueOf(ring.index)
        });
      }

      var over = state.particles.length - C.particles.max;
      if (over > 0) state.particles.splice(0, over);
    },

    update: function (state, dt) {
      var list = state.particles;
      for (var i = list.length - 1; i >= 0; i--) {
        var p = list[i];
        p.life += dt;
        if (p.life >= p.ttl) {
          list.splice(i, 1);
          continue;
        }
        var drag = Math.max(0, 1 - 0.7 * dt);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= drag;
        p.vy *= drag;
        p.rot += p.spin * dt;
      }

      var shocks = state.shocks;
      if (shocks) {
        for (var s = shocks.length - 1; s >= 0; s--) {
          shocks[s].life += dt;
          if (shocks[s].life >= shocks[s].ttl) shocks.splice(s, 1);
        }
      }
    },

    clear: function (state) {
      state.particles.length = 0;
      if (state.shocks) state.shocks.length = 0;
    }
  };
})(window.BE);
