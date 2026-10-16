/* =========================================================
   HANYU LIU 网站作品总控台 (projects-data.js)
   💡 以后想更换【首页当前展映】的作品，或者在【作品集】里加新画廊，
   完全不需要修改 HTML，只需要在这里修改文字和图片路径即可！
   ========================================================= */

const SITE_DATA = {
    
    // 1. 首页【当前展映 (Featured)】主打展示的作品配置
    featuredProject: {
        tag: "01 CURRENT EXHIBITION — 2026",
        titleMain: "泡沫与微光",
        titleSub: "黄金时代的个人思考与反思",
        description: "从泡沫初涌到人文微光的九个时代切面。一段关于经济膨胀、人文深耕、泡沫崩解与精神留存的视觉编年史。",
        galleryUrl: "gallery-golden-age.html", // 点击进入哪个画廊文件
        slideInterval: 5500,                   // ⏱️ 自动切换时间：5500毫秒 (即 5.5 秒)
        
        // 轮播的 9 张海报配置
        slides: [
            { id: 1, char: "涌", name: "地面裂开了", img: "assets/golden-age/01.jpg" },
            { id: 2, char: "升", name: "太阳出来了，泡泡攒成了团", img: "assets/golden-age/02.jpg" },
            { id: 3, char: "繁", name: "一切繁华如绫罗绸缎", img: "assets/golden-age/03.jpg" },
            { id: 4, char: "光", name: "这是最好的时代", img: "assets/golden-age/04.jpg" },
            { id: 5, char: "悬", name: "裂痕爬出来了", img: "assets/golden-age/05.jpg" },
            { id: 6, char: "裂", name: "一场大爆炸", img: "assets/golden-age/06.jpg" },
            { id: 7, char: "寂", name: "匆匆的脚步", img: "assets/golden-age/07.jpg" },
            { id: 8, char: "拾", name: "回望的脚步", img: "assets/golden-age/08.jpg" },
            { id: 9, char: "留", name: "被遗忘的年代", img: "assets/golden-age/09.jpg" }
        ]
    },

    // 2. 【作品集 (Archive)】网格里展示的所有项目列表（以后有新作品直接往数组里加一行即可）
    archiveList: [
        {
            date: "2026 · Series (9 A3 Posters)",
            title: "泡沫与微光：黄金时代的个人思考与反思",
            cover: "assets/golden-age/03.jpg",
            url: "gallery-golden-age.html",
            isReady: true
        },
        {
            date: "2024 - 2025 · Visual Design",
            title: "日常解构与碎片重构系列（整理中）",
            cover: "",
            placeholderText: "PAST WORKS ARCHIVE",
            url: "#",
            isReady: false
        },
        {
            date: "2026.Q4 · Upcoming",
            title: "下一期数字叙事企划",
            cover: "",
            placeholderText: "COMING SOON",
            url: "#",
            isReady: false
        }
    ]
};