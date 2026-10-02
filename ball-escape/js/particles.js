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

      for (var i = 0; i < count; i++) {
        var t0 = ring.gap + gapHalf + arc * (i / count);
        var t1 = ring.gap + gapHalf + arc * ((i + 0.72) / count);
        var mid = (t0 + t1) / 2;
        var sp = C.particles.speedMin + rng() * (C.particles.speedMax - C.particles.speedMin);
        state.particles.push({
          x: Math.cos(mid) * ring.radius,
          y: Math.sin(mid) * ring.radius,
          vx: Math.cos(mid) * sp,
          vy: Math.sin(mid) * sp,
          rot: 0,
          spin: (rng() * 2 - 1) * C.particles.spin,
          a0: t0 - mid,
          a1: t1 - mid,
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
        p.rad += 26 * dt;
        p.rot += p.spin * dt;
      }
    },

    clear: function (state) {
      state.particles.length = 0;
    }
  };
})(window.BE);
