/* =========================================================
   独立档案小册子：作品 1《泡沫与微光》（九重时代色调 + 三阶段定制排版升级版）
   ========================================================= */
const WORK_1 = {
    id: "work-1",
    isReady: true,
    tag: "2026 · 近期整理的一组视觉思考（共九章）",
    titleMain: "泡沫与微光",
    titleSub: "关于黄金时代的一点个人思考",
    homeIntro: "有时候会好奇，当一个热闹的时代像泡泡一样升起又破掉之后，留在普通人生活里的到底是什么？在这里，图像是思考的载体，文字是记忆的注脚，试着去打捞那些膨胀、碎裂与被重新拾起的瞬间。",
    enterBtnText: "翻开这组作品 →",
    archiveDate: "2026 · 9 Chapters",
    cover: "assets/work-1/03.webp",

    // 展厅配乐
    bgm: [
        { title: "泡沫与微光 · 展厅配乐", src: "assets/work-1/bgm-1.mp3" }
    ],

    // 9张图与三阶段定制排版（已按酝酿-鼎盛-破裂绑定9种专属页面色调与排版结构）
    items: [
        // ================= 第一阶段：泡沫酝酿期 =================
        {
            id: 1, type: "image", navChar: "涌", badgeNum: "PHASE I · 01",
            title: "地面裂开了", src: "assets/work-1/01.webp",
            theme: "w1-showa", // 1. 昭和老照片低饱和暖褐调
            essay: `
                <div class="w1-box stage-brewing">
                    <span class="era-stamp">STAGE 01 · 酝酿与初涌</span>
                    <p class="lead-quote">像气泡一样，轻飘飘的，慢悠悠的，</p>
                    <p>日本的经济从低谷里慢慢复苏，<br>好像不知不觉，就要走进一段全新的日子。</p>
                </div>
            `,
            footnote: "硬邦邦的城市地面裂开了缝，透明泡沫从地底钻出来，慢悠悠飘向阴沉的天空。<br>日子平平静静没波澜，只有这些泡泡在悄悄往上升。"
        },
        {
            id: 2, type: "image", navChar: "升", badgeNum: "PHASE I · 02",
            title: "太阳出来了，泡泡攒成了团", src: "assets/work-1/02.webp",
            theme: "w1-morandi", // 2. 80年代百货莫兰迪柔和暖粉米色
            essay: `
                <div class="w1-box stage-brewing">
                    <span class="era-stamp">STAGE 01 · 萌芽与升温</span>
                    <p>经济复苏的势头渐渐显了出来，<span class="warm-glow">天光跟着亮起来，</span></p>
                    <p class="indent-line">整个社会都好像都沾了点向上的生气。</p>
                </div>
            `,
            footnote: "暖黄的太阳从灰云里透出光来，大团气泡裹着云气往天上涌，<br>城市还是沉在底下，可亮起来的地方已经越来越多。"
        },

        // ================= 第二阶段：泡沫鼎盛期 =================
        {
            id: 3, type: "image", navChar: "繁", badgeNum: "PHASE II · 03",
            title: "一切繁华如绫罗绸缎", src: "assets/work-1/03.webp",
            theme: "w1-gilded", // 3. 流金盛景暖琥珀光影调
            essay: `
                <div class="w1-box stage-heyday">
                    <span class="era-stamp gold">STAGE 02 · 全盛与狂欢</span>
                    <p class="heyday-big">这是最繁盛的时代，</p>
                    <p>热闹和繁华从四处冒出来，<br>好像整个时代都飘在鲜亮的劲儿里。</p>
                </div>
            `,
            footnote: "太阳明晃晃挂在天上，大团泡泡裹着云气飘满半空，<br>海边立起摩天轮，彩色气球顺着风飘，鲜亮的颜色遍地都是。"
        },
        {
            id: 4, type: "image", navChar: "光", badgeNum: "PHASE II · 04",
            title: "这是最好的时代", src: "assets/work-1/04.webp",
            theme: "w1-golden-glow", // ⭐ 改成这个
            essay: `
                <div class="w1-box stage-gold-light"> <!-- ⭐ 改成这个 -->
                    <span class="era-stamp gold-light">STAGE 02 · 黄金与微光</span>
                    <p>创作者们沉下心来，俯身凝望整个世界，<br>不停探寻、追问着什么。</p>
                    <p class="gold-highlight">他们有大把大把的时间沉潜思考，<br>梦幻般的作品如雨后春笋般肆意生长。</p>
                </div>
            `,
            footnote: "明黄的太阳悬在天上，彩云和泡泡铺了满空，<br>书本、音符、奔跑的人影散在各处，站在中心的姑娘，像被整个时代的鲜活气裹着。"
        },
        {
            id: 5, type: "image", navChar: "悬", badgeNum: "PHASE II · 05",
            title: "裂痕爬出来了", src: "assets/work-1/05.webp",
            theme: "w1-mirage", // 5. 幻象危影错位青灰调
            essay: `
                <div class="w1-box stage-mirage">
                    <span class="era-stamp">STAGE 02 · 顶峰与危影</span>
                    <p>表面的热闹还没散，不安已经悄悄往下沉。</p>
                    <p class="tilted-warning">经济泡沫走到了破裂的边缘，<br>连那些鲜亮的作品里，都隐隐透出了摇晃的预感。</p>
                </div>
            `,
            footnote: "云层慢慢沉下来，最大的泡泡表面爬满细裂纹，<br>小人还站在泡泡边上，看似还在高处，可碎裂的预兆，已经藏不住了。"
        },

        // ================= 第三阶段：泡沫破裂与余温 =================
        {
            id: 6, type: "image", navChar: "裂", badgeNum: "PHASE III · 06",
            title: "一场大爆炸", src: "assets/work-1/06.webp",
            theme: "w1-crash", // 6. 崩盘瞬间纪实冷峻铁灰调（深色压抑模式）
            essay: `
                <div class="w1-box stage-crash">
                    <span class="era-stamp crash">STAGE 03 · 崩盘与跌落</span>
                    <p class="crash-heavy">经济泡沫彻底破裂，膨胀的时代轰然崩塌。</p>
                    <p class="crash-fall">那些曾肆意生长的梦幻作品，连同所有鲜亮的光景，<br>一齐从高空重重跌落。</p>
                </div>
            `,
            footnote: "黑沉沉的龙卷风卷向地面，房屋碎成瓦砾，<br>泡泡的残片混着人影四散飞溅，整座城市都跟着陷进崩塌里。"
        },
        {
            id: 7, type: "image", navChar: "寂", badgeNum: "PHASE III · 07",
            title: "匆匆的脚步", src: "assets/work-1/07.webp",
            theme: "w1-ruins", // 7. 空城废墟清冷雾白调
            essay: `
                <div class="w1-box stage-ruins">
                    <span class="era-stamp">STAGE 03 · 空寂与消解</span>
                    <p>泡沫彻底破了，日子一下落回地面。</p>
                    <p class="sparse-line">人们都攥着生计往前赶，脚步匆匆，<br>那些曾经鲜亮的作品与梦幻，散在路边。</p>
                </div>
            `,
            footnote: "灰蒙的天空压得很低，行人低着头匆匆走过，<br>地上散着碎泡泡、相片、书本和胶片，四下里安安静静，只剩赶路的脚步声。"
        },
        {
            id: 8, type: "image", navChar: "拾", badgeNum: "PHASE III · 08",
            title: "回望的脚步", src: "assets/work-1/08.webp",
            theme: "w1-gather", // 8. 碎片重寻写生浅苔绿纸调
            essay: `
                <div class="w1-box stage-aftermath">
                    <span class="era-stamp">STAGE 03 · 打捞与重寻</span>
                    <p>人们总算从生计的奔忙里缓过神。<br>那些被丢下的作品和记忆，终于等来了迟来的目光。</p>
                    <p class="warm-return">有些回望与联结，从来都只会晚到，不会缺席。</p>
                </div>
            `,
            footnote: "浅淡的天光铺在地上，有些人蹲下身，捡拾散落的书本、胶片和泡泡残片。<br>四下里安安静静，散落一地的过往，正被一点点重新拾起。"
        },
        {
            id: 9, type: "image", navChar: "留", badgeNum: "PHASE III · 09",
            title: "被遗忘的年代", src: "assets/work-1/09.webp",
            theme: "w1-dawn", // 9. 平淡余温柔和晨光暖米色
            essay: `
                <div class="w1-box stage-aftermath">
                    <span class="era-stamp">STAGE 03 · 余温与长存</span>
                    <p>散落的作品与记忆终归被整理收藏，<br>多数人照旧忙着赶路往前，</p>
                    <p class="final-linger">可总有人会停下脚步，<br>回望那个时代留下的痕迹。</p>
                </div>
            `,
            footnote: "浅淡的天光铺着地面，三层书架立在路中间，摆着收整好的书本、胶片和泡泡残片。<br>行人大多匆匆走过，唯有一个人影停在架前，静静望着那些被收好的过往。"
        }
    ]
};