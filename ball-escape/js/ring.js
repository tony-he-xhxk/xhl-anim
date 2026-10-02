/* 圆环：半径、缺口角、角速度（各环不同但成规律） */
(function (BE) {
  'use strict';

  var C = BE.Config;

  function rotationSpeed(index, speedScale) {
    var pattern = 1 + C.rotation.patternAmp * Math.sin(index * C.rotation.patternFreq);
    var direction = (index % 2 === 0) ? 1 : -1;
    return C.rotation.base * pattern * direction * speedScale;
  }

  function gapHalfRad(state) {
    var deg = Math.min(C.rings.gapDegCap, state.params.gapDeg + state.wear);
    return deg * Math.PI / 180 / 2;
  }

  BE.Rings = {
    rotationSpeed: rotationSpeed,
    gapHalfRad: gapHalfRad,

    create: function (index, radius, rng, speedScale) {
      return {
        index: index,
        radius: radius,
        gap: rng() * Math.PI * 2,
        omega: rotationSpeed(index, speedScale)
      };
    },

    buildInitial: function (state) {
      var count = state.params.rings;
      var rings = [];
      for (var i = 0; i < count; i++) {
        rings.push(this.create(i, C.world.r0 + i * C.world.ringGap, state.rng, state.params.speedScale));
      }
      return rings;
    },

    addOuter: function (state, count) {
      var rings = state.rings;
      var added = 0;
      while (added < count && rings.length < C.rings.maxRings) {
        var last = rings[rings.length - 1];
        var index = rings.length;
        var radius = (last ? last.radius : C.world.r0 - C.world.ringGap) + C.world.ringGap;
        rings.push(this.create(index, radius, state.rng, state.params.speedScale));
        added++;
      }
      return added;
    },

    hub: function (state) {
      return state.rings[state.destroyedCount] || null;
    },

    outermost: function (state) {
      var rings = state.rings;
      return rings.length ? rings[rings.length - 1] : null;
    },

    outermostRadius: function (state) {
      var ring = this.outermost(state);
      return ring ? ring.radius : C.world.r0;
    }
  };
})(window.BE);
