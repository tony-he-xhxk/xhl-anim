/* 物理：直线运动 + 与最内层存活圆环的碰撞 / 穿缺口 / 碎裂 */
(function (BE) {
  'use strict';

  var C = BE.Config;
  var TWO_PI = Math.PI * 2;

  function angleDiff(a, b) {
    var d = (a - b) % TWO_PI;
    if (d > Math.PI) d -= TWO_PI;
    if (d < -Math.PI) d += TWO_PI;
    return d;
  }

  function step(state, dt) {
    var ball = state.ball;
    var rng = state.rng;
    var remaining = dt;
    var guard = 0;
    var destroyed = 0;

    while (remaining > 1e-6 && guard++ < 16) {
      var ring = BE.Rings.hub(state);
      if (!ring) {
        ball.x += ball.vx * remaining;
        ball.y += ball.vy * remaining;
        break;
      }

      var surf = Math.max(1, ring.radius - ball.r);
      var fx = ball.x, fy = ball.y;
      var nx = fx + ball.vx * remaining;
      var ny = fy + ball.vy * remaining;

      if (Math.hypot(nx, ny) < surf) {
        ball.x = nx;
        ball.y = ny;
        break;
      }

      // 求与碰撞圆的首个交点
      var dx = nx - fx, dy = ny - fy;
      var a = dx * dx + dy * dy;
      var tHit = 1;
      if (a > 1e-12) {
        var b = 2 * (fx * dx + fy * dy);
        var c = fx * fx + fy * fy - surf * surf;
        var disc = b * b - 4 * a * c;
        if (disc >= 0) {
          var sq = Math.sqrt(disc);
          var t1 = (-b - sq) / (2 * a);
          var t2 = (-b + sq) / (2 * a);
          tHit = (t1 >= 0 && t1 <= 1) ? t1 : ((t2 >= 0 && t2 <= 1) ? t2 : 1);
        }
      }
      tHit = Math.min(1, Math.max(0, tHit));

      var hx = fx + dx * tHit;
      var hy = fy + dy * tHit;
      var hitAngle = Math.atan2(hy, hx);

      if (Math.abs(angleDiff(hitAngle, ring.gap)) <= state.gapHalf) {
        // 穿过缺口：该层碎裂
        ball.x = hx;
        ball.y = hy;
        remaining *= (1 - tHit);
        state.destroyedCount++;
        destroyed++;
        BE.Particles.spawn(state, ring);
        state.scaleDirty = true;
        if (state.destroyedCount >= state.rings.length) {
          state.status = 'won';
          return destroyed;
        }
        BE.Ball.retarget(state);
        var speed = Math.hypot(ball.vx, ball.vy) || 1;
        var nudge = 1e-3;
        ball.x += ball.vx / speed * nudge;
        ball.y += ball.vy / speed * nudge;
        remaining = Math.max(0, remaining - nudge / speed);
        continue;
      }

      // 撞在圆环上：弹性反射
      var dist = Math.hypot(hx, hy) || 1;
      var ux = hx / dist, uy = hy / dist;
      var dot = ball.vx * ux + ball.vy * uy;
      var rx = ball.vx - 2 * dot * ux;
      var ry = ball.vy - 2 * dot * uy;

      var jitter = (rng() * 2 - 1) * C.bounce.jitterDeg * Math.PI / 180;
      var cos = Math.cos(jitter), sin = Math.sin(jitter);
      var vx2 = rx * cos - ry * sin;
      var vy2 = rx * sin + ry * cos;
      var len2 = Math.hypot(vx2, vy2) || 1;
      var target = BE.Ball.speed(state);
      ball.vx = vx2 / len2 * target;
      ball.vy = vy2 / len2 * target;
      ball.x = ux * (surf - 1e-3);
      ball.y = uy * (surf - 1e-3);

      state.bounces++;
      var spread = C.rings.wearSpread > 0
        ? Math.pow(C.defaults.rings / Math.max(1, state.rings.length), C.rings.wearSpread)
        : 1;
      state.wear = Math.min(
        C.rings.gapDegCap - state.params.gapDeg,
        state.wear + C.rings.gapGrowthPerHit * spread
      );
      state.gapHalf = BE.Rings.gapHalfRad(state);

      // 内侧碰撞 → 外侧新增圆环
      if (BE.Rings.addOuter(state, state.params.addPerHit) > 0) state.scaleDirty = true;

      remaining *= (1 - tHit);
      if (remaining < 1e-6) break;
    }

    return destroyed;
  }

  BE.Physics = { step: step, angleDiff: angleDiff };
})(window.BE);
