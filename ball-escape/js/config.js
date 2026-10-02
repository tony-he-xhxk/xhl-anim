/* 小球逃离环形圈 · 全局配置与默认参数
   所有可调项集中在这里，UI 滑杆只覆盖 defaults 中的四项。 */
(function (global) {
  'use strict';

  var Config = {
    // 固定随机种子（null = 每次随机），便于复现某一次运行
    seed: null,

    world: {
      r0: 62,            // 最内层圆环半径（世界单位）
      ringGap: 34,       // 环距：固定不变，永不压缩
      ballRadius: 6,     // 小球半径
      speedFactor: 4.6,  // 小球速率 = speedFactor × 当前最内层圆环半径
      speedMin: 140      // 速率下限
    },

    rings: {
      maxRings: 100,      // 松弛封顶：达到后不再新增圆环
      initialMin: 3,
      initialMax: 24,
      gapDegMin: 8,       // 缺口大小滑杆下限（度）
      gapDegMax: 60,      // 缺口大小滑杆上限（度）
      gapGrowthPerHit: 4,  // 每次撞击后全局缺口增长（度）—— “缺口变大”机制
      gapDegCap: 330,     // 缺口增长上限（度），保留一小段弧使圆环仍可见
      wearSpread: 0.4     // 环数越多，单次撞击分摊到每层环上的损伤越少（越大越难）
    },

    rotation: {
      base: 0.34,        // 基准角速度 rad/s
      patternAmp: 0.42,  // 各环速度差异幅度
      patternFreq: 1.3   // 各环速度差异频率
    },

    bounce: {
      jitterDeg: 16,       // 反弹方向随机偏转（度）：打破“沿直径来回”的镜面不变性
      maxChordAngleDeg: 72 // 限制与内向法线的夹角，避免贴壁高频弹跳
    },

    camera: {
      fitFactor: 0.9,    // 最外环占视口短边的比例
      minScale: 0.06,
      maxScale: 3.4,
      deadZone: 0.7,     // 中心安全区（占比），球越界才轻微移动焦点
      followEase: 0.06,
      scaleEase: 0.09,
      maxPanSpeed: 620   // 焦点最大移动速度（屏幕像素/秒）
    },

    particles: {
      perRing: 20,
      max: 900,
      life: 1.2,
      speedMin: 90,
      speedMax: 380,
      spin: 1.6
    },

    trail: { length: 20 },

    theme: {
      hueStart: 280,
      hueStep: 27,
      background: '#06060f'
    },

    // 默认参数：实测调校为“最终能逃出，但不轻松”
    defaults: {
      rings: 8,
      speedScale: 1,
      gapDeg: 26,
      addPerHit: 1,
      countdownOn: false,
      countdownSec: 60
    }
  };

  Config.hueOf = function (index) {
    var h = (Config.theme.hueStart - index * Config.theme.hueStep) % 360;
    return h < 0 ? h + 360 : h;
  };

  global.BE = global.BE || {};
  global.BE.Config = Config;
})(typeof window !== 'undefined' ? window : globalThis);
