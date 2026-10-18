/* =========================================================
   【私人总控中心 1：全局设置表】 (data/site-settings.js)
   ========================================================= */

const SITE_SETTINGS = {
    // 1. 顶部大标题与英文副标题
    siteTitle: "H A N Y U   L I U",
    siteSubtitle: "VISUAL ARCHIVE & DIGITAL CURATOR",

    // 2. 右上角两个主导航按钮
    navFeaturedText: "近期作品",
    navArchiveText: "个人记录",

    // 3. 左上角“近期碎碎念便签”（随时在这里更新你的近况）
    moodDate: "2026.10.18",
    moodText: "啦啦啦————",

    // 4. 「个人记录」页面说明
    archivePageTitle: "个人记录",
    archivePageDesc: "一些视觉尝试、随笔，和留存下来的思考片段。",

    // 5. 首页作品预览切换间隔（毫秒，5500 代表 5.5 秒）
    homeSlideInterval: 5500,

    // 6. 🌿 首页微风动态背景（正反往返拼接视频 + 双视频接力无缝循环）
    breezeBackgrounds: [
        "assets/breeze/bg-1.mp4"
    ],
    breezeSwitchMinutes: 5,
    breezeSlowFactor: 1.0  // 1 = 原速播放；想要更慢的呼吸感可改 0.5
};