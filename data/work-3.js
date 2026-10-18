/* =========================================================
   独立档案小册子：作品 3《将会成为怎样的大人呢？》
   极简意识流独白 + 记忆碎片零散浮现引擎 + 全篇单曲循环
   ========================================================= */
const WORK_3 = {
    id: "work-3",
    isReady: true,
    layoutMode: "minimal-scatter", // ⭐ 开启第三篇专属：极简无框 + 记忆碎片散落模式
    tag: "2026 · 个人随笔与视觉切片",
    titleMain: "【随笔】将会成为怎样的大人呢？",
    titleSub: "2026.10.18",                  // 留空：不显示任何副标题，保持极致纯粹
    homeIntro: "从黑夜里的蜷缩、镜前的陌生、夕阳下的奋进，到最后躺在星空下的轻声呼唤。",
    enterBtnText: "进入 →",
    archiveDate: "",
    cover: "assets/work-3/015.webp",

    // 全篇共用唯一一首配乐，翻章时自动比对同源，100%无缝续播
    bgm: [
        { title: "将会成为怎样的大人呢？", src: "assets/work-3/bgm-1.mp3" }
    ],

    items: [
        // ================= 壹：童年黑夜（5张图零散交替浮现，最后一张定格） =================
        {
            id: 1,
            type: "image",
            navChar: "壹",
            badgeNum: "",
            title: "壹",
            src: "assets/work-3/015.webp", // 供首页轮播兜底使用
            theme: "w3-night",
            footnote: "",
            // ⭐ 散落记忆碎片配置：x/y 为偏离中心的百分比，rot 为歪斜角度，scale 为缩放比例
            scatterInterval: 3400, // 每张图停留约 3.4 秒后柔和淡出，下一张浮现
            scatterImages: [
                { src: "assets/work-3/011.webp", x: "-12%", y: "-10%", rot: "-3.2deg", scale: 0.84 },
                { src: "assets/work-3/012.webp", x: "11%",  y: "9%",   rot: "2.4deg",  scale: 0.85 },
                { src: "assets/work-3/013.webp", x: "-8%",  y: "8%",   rot: "1.8deg",  scale: 0.86 },
                { src: "assets/work-3/014.webp", x: "10%",  y: "-8%",  rot: "-2.2deg", scale: 0.86 },
                { src: "assets/work-3/015.webp", x: "0%",   y: "0%",   rot: "0deg",    scale: 0.98, isFinal: true }
            ],
            essay: `
                <div class="w3-monologue w3-ch1">
                    <p class="m-fade">有些时候，有些东西总是突如其来的到来。</p>
                    <p>我抱紧双臂，蜷缩在草地上。<br><span class="m-dim">试着不去想。</span></p>
                    <p>时间一分一秒地走过，阳光一分一秒地渐亮。<br>好像，真的要来了。</p>
                    <p class="m-warm">我十分感谢有你的陪伴，有你坐在我身边。<br><span class="m-dim">虽然我们好像并没有多说些什么。</span></p>
                    <p class="m-rise">不过我还是要站起身了。</p>
                    <p class="m-question">以后究竟会发生什么呢？<br><span>以后我会成为一个什么样的……大人呢？</span></p>
                </div>
            `
        },

        // ================= 贰：青春对镜（单张竖版素描，阶梯顿挫排版） =================
        {
            id: 2,
            type: "image",
            navChar: "贰",
            badgeNum: "",
            title: "贰",
            src: "assets/work-3/02.webp",
            theme: "w3-mirror",
            footnote: "",
            essay: `
                <div class="w3-monologue w3-ch2">
                    <p>我努力的不去望，我努力的去记住。<br><span class="m-dim">那种感觉。</span></p>
                    <div class="m-stagger">
                        <p>好像的</p>
                        <p class="s-indent-1">好像的</p>
                        <p class="s-indent-2">好多东西好像已经消失了。</p>
                        <p class="s-indent-2">我们好像已经很久没有坐在一起了。</p>
                        <p class="s-indent-2">我好像知道了好多好多的东西。</p>
                    </div>
                    <p class="m-bridge">所以</p>
                    <p class="m-question">以后我会成为一个什么样的大人呢？<br><strong>以后我不想成为一个无聊的大人。</strong></p>
                </div>
            `
        },

        // ================= 叁：夕阳燃烬（单张超宽幅夕阳，由盛转衰下沉排版） =================
        {
            id: 3,
            type: "image",
            navChar: "叁",
            badgeNum: "",
            title: "叁",
            src: "assets/work-3/03.webp",
            theme: "w3-sunset",
            footnote: "",
            essay: `
                <div class="w3-monologue w3-ch3">
                    <p class="m-ardent">我努力牵起你的手。<br>我鼓起勇气的。<br>我试着说：<br><span class="m-quote">“我们一起面对。”</span></p>
                    <div class="m-vows">
                        <p>这样，我一定会成为一个努力的大人吧。</p>
                        <p>这样，我一定会成为一个善良的大人吧。</p>
                        <p>这样，我一定会成为一个成功的大人吧。</p>
                    </div>
                    <p class="m-rowing">我尝试着。<br>我努力地向前划桨。</p>
                    <div class="m-sinking">
                        <p class="sink-1">但一切好像并不是这个样子的。</p>
                        <p class="sink-2">有些越飘越远了。</p>
                        <p class="sink-3">好像不是这个样子的。</p>
                        <p class="sink-4">我好像……要成为一个无聊的大人了。</p>
                    </div>
                </div>
            `
        },

        // ================= 肆：星空走马灯（9张童年记忆散落闪回，终局星空定格） =================
        {
            id: 4,
            type: "image",
            navChar: "肆",
            badgeNum: "",
            title: "肆",
            src: "assets/work-3/049.webp",
            theme: "w3-starry",
            footnote: "",
            scatterInterval: 2700, // 9张走马灯回忆节奏稍快（2.7秒一帧），最后定格在星空草地
            scatterImages: [
                { src: "assets/work-3/041.webp", x: "-13%", y: "-9%",  rot: "-2.8deg", scale: 0.82 },
                { src: "assets/work-3/042.webp", x: "12%",  y: "-7%",  rot: "2.2deg",  scale: 0.82 },
                { src: "assets/work-3/043.webp", x: "-9%",  y: "10%",  rot: "1.6deg",  scale: 0.82 },
                { src: "assets/work-3/044.webp", x: "11%",  y: "8%",   rot: "-2.4deg", scale: 0.82 },
                { src: "assets/work-3/045.webp", x: "-11%", y: "2%",   rot: "2.0deg",  scale: 0.83 },
                { src: "assets/work-3/046.webp", x: "9%",   y: "-10%", rot: "-1.8deg", scale: 0.83 },
                { src: "assets/work-3/047.webp", x: "-4%",  y: "9%",   rot: "1.2deg",  scale: 0.84 },
                { src: "assets/work-3/048.webp", x: "2%",   y: "-3%",  rot: "-0.6deg", scale: 0.92 },
                { src: "assets/work-3/049.webp", x: "0%",   y: "0%",   rot: "0deg",    scale: 1.0, isFinal: true }
            ],
            essay: `
                <div class="w3-monologue w3-ch4">
                    <p class="walk-1">在走着</p>
                    <p class="walk-2">漫无目的的走着</p>
                    <p class="walk-3">但好像什么都没有</p>
                    <p class="walk-4">我躺了下来</p>
                    <p class="walk-call">呐，哆啦A梦!</p>
                </div>
            `
        }
    ]
};