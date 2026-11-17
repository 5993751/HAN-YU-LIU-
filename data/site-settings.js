/* =========================================================
   【私人总控中心 1：全局设置表】 (data/site-settings.js)
   ========================================================= */

const SITE_SETTINGS = {
    // 1. 顶部大标题与英文副标题
    siteTitle: "H A N Y U   L I U",
    siteSubtitle: "A PERSONAL ARCHIVE OF IMAGES & WORDS",

    // 2. 右上角两个主导航按钮
    navFeaturedText: "首页",
    navArchiveText: "个人记录",

    // 3. 首页左下角独立“心情便签”（只改下面这两行即可，和作品推荐互不影响）
    moodDate: "2026.10.18",
    moodText: "啦啦啦————",

    // 4. 「个人记录」页面说明（标题由顶部导航标签承担，这里只留一句介绍）
    archivePageDesc: "一些视觉尝试、随笔，和留存下来的思考片段。",

    // 5. 首页作品预览切换间隔（毫秒，5500 代表 5.5 秒）
    homeSlideInterval: 5500,

    // 6. 🌿 首页微风动态背景（正反往返拼接视频 + 双视频接力无缝循环）
    //    新背景统一放进 assets/breeze/ 文件夹，按 bg-1.mp4、bg-2.mp4、bg-3.mp4… 依次命名，
    //    格式、编码与 bg-1.mp4 完全一致即可。丢进文件夹后刷新页面会自动发现，不用改代码。
    breezeBackgrounds: [
        "assets/breeze/bg-1.mp4"
    ],
    breezeFilePrefix: "assets/breeze/bg-",
    breezeFileExt: ".mp4",
    breezeMaxFiles: 12,
    breezeSwitchMinutes: 5,
    breezeSlowFactor: 1.0  // 1 = 原速播放；想要更慢的呼吸感可改 0.5
};