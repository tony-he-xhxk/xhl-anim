/* 相机：缩放只在“新增/碎裂圆环”这类离散事件时平滑更新；平移用中心死区松弛跟随 */
(function (BE) {
  'use strict';

  var C = BE.Config;

  function targetScale(state, view) {
    var extent = BE.Rings.outermostRadius(state) + 12;
    var short = Math.min(view.w, view.h);
    var scale = (short * C.camera.fitFactor * 0.5) / Math.max(extent, 1);
    return Math.min(C.camera.maxScale, Math.max(C.camera.minScale, scale));
  }

  BE.Camera = {
    fit: targetScale,

    init: function (state, view) {
      state.scale = targetScale(state, view);
      state.scaleTarget = state.scale;
      state.focusX = 0;
      state.focusY = 0;
      state.scaleDirty = false;
    },

    markDirty: function (state) {
      state.scaleDirty = true;
    },

    update: function (state, view, dt) {
      if (state.scaleDirty) {
        state.scaleTarget = targetScale(state, view);
        state.scaleDirty = false;
      }

      var k = Math.min(1, C.camera.scaleEase * dt * 60);
      state.scale += (state.scaleTarget - state.scale) * k;

      var scale = state.scale;
      var cx = view.w / 2;
      var cy = view.h / 2;
      var sx = (state.ball.x - state.focusX) * scale + cx;
      var sy = (state.ball.y - state.focusY) * scale + cy;
      var halfX = view.w * C.camera.deadZone / 2;
      var halfY = view.h * C.camera.deadZone / 2;

      var tx = state.focusX;
      var ty = state.focusY;
      if (sx > cx + halfX) tx += (sx - cx - halfX) / scale;
      else if (sx < cx - halfX) tx -= (cx - halfX - sx) / scale;
      if (sy > cy + halfY) ty += (sy - cy - halfY) / scale;
      else if (sy < cy - halfY) ty -= (cy - halfY - sy) / scale;

      var ease = Math.min(1, C.camera.followEase * dt * 60);
      var dx = (tx - state.focusX) * ease;
      var dy = (ty - state.focusY) * ease;
      var len = Math.hypot(dx, dy);
      var maxStep = (C.camera.maxPanSpeed * dt) / scale;
      if (maxStep > 0 && len > maxStep) {
        dx = dx / len * maxStep;
        dy = dy / len * maxStep;
      }
      state.focusX += dx;
      state.focusY += dy;
    }
  };
})(window.BE);
