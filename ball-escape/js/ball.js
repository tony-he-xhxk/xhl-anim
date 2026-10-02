/* 小球：位置、速度（速率随活动半径缩放，保证屏幕上的节奏始终一致） */
(function (BE) {
  'use strict';

  var C = BE.Config;

  function speed(state) {
    var hub = BE.Rings.hub(state);
    var radius = hub ? hub.radius : C.world.r0;
    return Math.max(C.world.speedMin, C.world.speedFactor * radius);
  }

  BE.Ball = {
    speed: speed,

    create: function (state) {
      var angle = state.rng() * Math.PI * 2;
      var v = speed(state);
      return {
        x: 0,
        y: 0,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        r: C.world.ballRadius
      };
    },

    /* 活动半径变化后，把速率拉回目标值（方向不变） */
    retarget: function (state) {
      var ball = state.ball;
      var current = Math.hypot(ball.vx, ball.vy) || 1;
      var target = speed(state);
      ball.vx = ball.vx / current * target;
      ball.vy = ball.vy / current * target;
    }
  };
})(window.BE);
