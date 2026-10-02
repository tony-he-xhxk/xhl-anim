/**
 * 动效集萃 · 站点与项目数据
 * 新增一个动效：在 projects 里加一条记录，并把封面图放进 assets/covers/ 即可，无需改动页面结构。
 */
window.SITE_DATA = {
  site: {
    title: '动效集萃',
    subtitle: '把解压感拉满的网页动效，一个入口全部收集。',
    footer: {
      copy: '星河绫 ·',
      links: [
        { label: 'GitHub', href: 'https://github.com/tony-he-xhxk/xhl-anim', icon: 'github' }
      ]
    }
  },
  projects: [
    {
      id: 'ball-escape',
      title: '小球逃离环形圈',
      subtitle: 'Ball Escape · 解压向 2D 动画',
      description: '小球被困在层层同心圆环之中，每撞一次就会在外侧生出新的圆环，唯有对准旋转的缺口才能层层突破；穿出缺口后的下一次撞击则不再增环。逃出全部圆环的那一刻，动画结束并结算耗时。',
      tags: ['2D 动画', 'Canvas', '物理碰撞', '解压'],
      cover: './assets/covers/ball-escape.svg',
      href: './ball-escape/',
      accent: '#a855f7',
      accentAlt: '#22d3ee'
    }
  ]
};
