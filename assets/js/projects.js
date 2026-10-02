/**
 * 动效集萃 · 站点与项目数据
 * 新增一个动效：在 projects 里加一条记录，并把封面图放进 assets/covers/ 即可，无需改动页面结构。
 */
window.SITE_DATA = {
  site: {
    title: '动效集萃',
    subtitle: '把解压感拉满的网页动效，一个入口全部收集。',
    footer: {
      copy: '© {year} xingheling.cn',
      links: [
        { label: '博客', href: 'https://xingheling.cn' },
        // TODO: 换成你自己的仓库地址
        { label: 'GitHub', href: 'https://github.com/' }
      ]
    }
  },
  projects: [
    {
      id: 'ball-escape',
      title: '小球逃离环形圈',
      subtitle: 'Ball Escape · 解压向 2D 动画',
      description: '小球被困在层层同心圆环之中，每次撞击都会在外侧生出新的圆环，唯有对准旋转的缺口才能层层突破。逃出全部圆环的那一刻，动画结束并结算耗时。',
      tags: ['2D 动画', 'Canvas', '物理碰撞', '解压'],
      cover: './assets/covers/ball-escape.svg',
      href: './ball-escape/',
      accent: '#a855f7',
      accentAlt: '#22d3ee'
    }
  ]
};
