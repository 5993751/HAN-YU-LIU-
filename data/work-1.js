/* =========================================================
   独立档案小册子：作品 1《泡沫与微光》（九章精简版）
   ---------------------------------------------------------
   每章只保留三样东西：
     title  → 题目
     essay  → 副标题（era-stamp 那一行）+ 正文
     theme  → 这一章的整页色调，保持原样即可

   正文排版由三个 class 组成（样式在 css/gallery.css 末尾「16. 展厅一正文排版」）：
     verse-scene → 画面白描，字小、颜色淡、左侧一条细线
     verse-body  → 正文，正常字重
     verse-turn  → 收束句，衬线字体、字距更开、上方一小段短线
   <br> 是手工换行；想合并成一行，删掉 <br> 即可
   ========================================================= */
const WORK_1 = {
    id: "work-1",
    isReady: true,
    enterBtnText: "翻开 →",
    category: "视觉作品",        // 个人记录分类（分类按钮会自动生成，可自行改名）

    // 展厅配乐
    bgm: [
        { title: "泡沫与微光", src: "assets/work-1/bgm-1.mp3" }
    ],

    // 9 张图 + 9 种页面色调
    items: [
        // ================= 第一阶段：泡沫酝酿期 =================
        {
            id: 1, type: "image", navChar: "涌", badgeNum: "PHASE I · 01",
            title: "地面裂开了", src: "assets/work-1/01.webp",
            theme: "w1-showa", // 1. 昭和老照片低饱和暖褐调
            essay: `
                <div class="w1-verse">
                    <span class="era-stamp">STAGE 01 · 酝酿与初涌</span>
                    <p class="verse-scene">硬邦邦的城市地面裂开了缝，<br>透明泡沫从地底钻出来，<br>慢悠悠飘向阴沉的天空。</p>
                    <p class="verse-body">经济从低谷里慢慢复苏，<br>轻飘飘的，慢悠悠的，<br>好像不知不觉，<br>就要走进一段全新的日子。</p>
                </div>
            `
        },
        {
            id: 2, type: "image", navChar: "升", badgeNum: "PHASE I · 02",
            title: "太阳出来了，泡泡攒成了团", src: "assets/work-1/02.webp",
            theme: "w1-morandi", // 2. 80年代百货莫兰迪柔和暖粉米色
            essay: `
                <div class="w1-verse">
                    <span class="era-stamp">STAGE 01 · 萌芽与升温</span>
                    <p class="verse-scene">暖黄的太阳从灰云里透出光来，<br>大团气泡裹着云气往天上涌，<br>城市还是沉在底下，<br>可亮起来的地方已经越来越多，</p>
                    <p class="verse-turn">经济复苏的势头渐渐显了出来，<br>整个社会都好像都沾了点向上的生气！</p>
                </div>
            `
        },

        // ================= 第二阶段：泡沫鼎盛期 =================
        {
            id: 3, type: "image", navChar: "繁", badgeNum: "PHASE II · 03",
            title: "一切繁华如绫罗绸缎", src: "assets/work-1/03.webp",
            theme: "w1-gilded", // 3. 流金盛景暖琥珀光影调
            essay: `
                <div class="w1-verse">
                    <span class="era-stamp gold">STAGE 02 · 全盛与狂欢</span>
                    <p class="verse-scene">太阳明晃晃挂在天上，<br>大团泡泡裹着云气飘满半空，<br>海边立起摩天轮，<br>彩色气球顺着风飘，<br>鲜亮的颜色遍地都是。</p>
                    <p class="verse-turn">这是最繁盛的时代！</p>
                </div>
            `
        },
        {
            id: 4, type: "image", navChar: "光", badgeNum: "PHASE II · 04",
            title: "这是最好的时代", src: "assets/work-1/04.webp",
            theme: "w1-golden-glow", // 4. 流金盛景暖琥珀光影调
            essay: `
                <div class="w1-verse">
                    <span class="era-stamp gold-light">STAGE 02 · 黄金与微光</span>
                    <p class="verse-scene">创作者们沉下心来，<br>俯身凝望整个世界，<br>不停探寻、<br>追问着什么。</p>
                    <p class="verse-turn">他们有大把大把的时间沉潜思考，<br>梦幻般的作品如雨后春笋般肆意生长。</p>
                </div>
            `
        },
        {
            id: 5, type: "image", navChar: "悬", badgeNum: "PHASE II · 05",
            title: "裂痕爬出来了", src: "assets/work-1/05.webp",
            theme: "w1-mirage", // 5. 幻象危影错位青灰调
            essay: `
                <div class="w1-verse">
                    <span class="era-stamp">STAGE 02 · 顶峰与危影</span>
                    <p class="verse-scene">云层慢慢沉下来，<br>最大的泡泡表面爬满细裂纹，<br>小人还站在泡泡边上，看似还在高处，<br>可碎裂的预兆，<br>已经藏不住了。</p>
                    <p class="verse-body">经济泡沫走到了破裂的边缘，<br>连那些鲜亮的作品里，<br>都隐隐透出了摇晃的预感。</p>
                </div>
            `
        },

        // ================= 第三阶段：泡沫破裂与余温 =================
        {
            id: 6, type: "image", navChar: "裂", badgeNum: "PHASE III · 06",
            title: "一场大爆炸", src: "assets/work-1/06.webp",
            theme: "w1-crash", // 6. 崩盘瞬间纪实冷峻铁灰调（深色压抑模式）
            essay: `
                <div class="w1-verse">
                    <span class="era-stamp crash">STAGE 03 · 崩盘与跌落</span>
                    <p class="verse-scene">黑沉沉的龙卷风卷向地面，房屋碎成瓦砾，<br>泡泡的残片混着人影四散飞溅，<br>整座城市都跟着陷进崩塌里。</p>
                    <p class="verse-body">经济泡沫彻底破裂，<br>膨胀的时代轰然崩塌。</p>
                    <p class="verse-turn">那些曾肆意生长的梦幻作品，<br>连同所有鲜亮的光景，<br>一齐从高空重重跌落。</p>
                </div>
            `
        },
        {
            id: 7, type: "image", navChar: "寂", badgeNum: "PHASE III · 07",
            title: "匆匆的脚步", src: "assets/work-1/07.webp",
            theme: "w1-ruins", // 7. 空城废墟清冷雾白调
            essay: `
                <div class="w1-verse">
                    <span class="era-stamp">STAGE 03 · 空寂与消解</span>
                    <p class="verse-scene">灰蒙的天空压得很低，行人低着头匆匆走过，<br>地上散着碎泡泡、相片、书本和胶片，<br>泡沫彻底破了，<br>日子一下落回地面。</p>
                    <p class="verse-body">人们都攥着生计往前赶，<br>脚步匆匆，<br>那些曾经鲜亮的作品与梦幻，<br>散在路边。</p>
                </div>
            `
        },
        {
            id: 8, type: "image", navChar: "拾", badgeNum: "PHASE III · 08",
            title: "回望的脚步", src: "assets/work-1/08.webp",
            theme: "w1-gather", // 8. 碎片重寻写生浅苔绿纸调
            essay: `
                <div class="w1-verse">
                    <span class="era-stamp">STAGE 03 · 打捞与重寻</span>
                    <p class="verse-scene">人们总算从生计的奔忙里缓过神，<br>那些被丢下的作品和记忆，<br>终于等来了迟来的目光。</p>
                    <p class="verse-turn">有些回望与联结，<br>从来都只会晚到，<br>但不会缺席。</p>
                </div>
            `
        },
        {
            id: 9, type: "image", navChar: "留", badgeNum: "PHASE III · 09",
            title: "被遗忘的年代", src: "assets/work-1/09.webp",
            theme: "w1-dawn", // 9. 平淡余温柔和晨光暖米色
            essay: `
                <div class="w1-verse">
                    <span class="era-stamp">STAGE 03 · 余温与长存</span>
                    <p class="verse-scene">散落的作品与记忆终归被整理收藏，<br>多数人照旧忙着赶路往前，</p>
                    <p class="verse-turn">可总有人会停下脚步，<br>回望那个时代留下的痕迹。</p>
                </div>
            `
        }
    ]
};
