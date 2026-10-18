/* =========================================================
   独立档案小册子：作品 2《长眠与飞翔》（专属电影宽银幕力量感排版 + 无简评版）
   ========================================================= */
const WORK_2 = {
    id: "work-2",
    isReady: true,
    layoutMode: "cinematic", // ⭐ 专属开关：开启第二篇独有的“宽银幕电影感”张力布局（仅影响第2篇，不影响第1篇）
    tag: "2026 · 个人随笔与视觉切片",
    titleMain: "【随笔】长眠与飞翔",
    titleSub: "2026.10.16",
    homeIntro: "从冷酷的终点，到白色的中转，再到卸去所有重力后的漫长升腾。",
    enterBtnText: "翻开 →",
    archiveDate: "",
    cover: "assets/work-2/01.webp",

    bgm: [
        { title: "无关罪人，无关圣徒", src: "assets/work-2/bgm-ch1.mp3" },
        { title: "一场漫长的歇息", src: "assets/work-2/bgm-ch2.mp3" },
        { title: "飘扬", src: "assets/work-2/bgm-ch3.mp3" }
    ],

    items: [
        // ================= 第 1 章：压抑、剥夺、歌剧对峙感 =================
        {
            id: 1,
            type: "image",
            navChar: "壹",
            badgeNum: "ACT I",
            title: "无关罪人，无关圣徒",
            src: "assets/work-2/01.webp",
            theme: "abyss", // 专为第一章定制的深邃暗金压抑氛围
            bgmSrc: "assets/work-2/bgm-ch1.mp3",
            bgmTitle: "无关罪人，无关圣徒",
            footnote: "",   // 已彻底删除简评
            essay: `
                <div class="w2-stanza-dramatic">
                    <div class="verse-pair">
                        <span class="v-en">Death don't discriminate</span>
                        <span class="v-zh">死亡不分</span>
                    </div>
                    <div class="verse-pair">
                        <span class="v-en">Between the sinners and the saints</span>
                        <span class="v-zh">罪人与圣徒</span>
                    </div>
                    <div class="verse-pair">
                        <span class="v-en">It takes, and it takes, and it takes</span>
                        <span class="v-zh">他总是索取，再索取</span>
                    </div>
                    <div class="verse-pair">
                        <span class="v-en">The day arrives, no delay, no escape</span>
                        <span class="v-zh">如期而至，无处可逃</span>
                    </div>
                    <div class="verse-pair">
                        <span class="v-en">Strip it all down, naked and bare</span>
                        <span class="v-zh">卸下一切，赤身裸体</span>
                    </div>
                    <div class="verse-pair climax">
                        <span class="v-en">Forced to stare, to face... yourself</span>
                        <span class="v-zh">被迫对视，面对……你自己</span>
                    </div>
                </div>
            `
        },

        // ================= 第 2 章：白色车站、虚无、渐入长眠 =================
        {
            id: 2,
            type: "image",
            navChar: "贰",
            badgeNum: "ACT II",
            title: "一场漫长的歇息",
            src: "assets/work-2/02.webp",
            theme: "limbo", // 专为第二章定制的純白迷雾车站氛围
            bgmSrc: "assets/work-2/bgm-ch2.mp3",
            bgmTitle: "一场漫长的歇息",
            footnote: "",   // 已彻底删除简评
            essay: `
                <div class="w2-prose-limbo">
                    <p class="lead-line">我站在一片白色里。</p>
                    <p>我不知道自己是怎么到这里的。脚下有地面，但没有影子。四周什么都没有，又好像什么都有，只是还没有决定要变成什么样子。</p>
                    <p>不远处有一把长椅。长椅上坐着一个人。<span class="em-self">是我自己。</span></p>
                    <p>他看着前方，目光越过我，落在某个我看不见的地方。就是很平静地，看着。</p>
                    <p>我走过去，在他旁边坐下。</p>
                    <p class="fade-thought">道德、责任、信念、梦想。<br>这些东西从我心里经过，像水从指缝里淌过去，留不下什么。</p>
                    <div class="dialogue-block">
                        <p>“所以这就是结局吗？”我问他。</p>
                        <p>他没有看我，只是点了点头。</p>
                        <p>“这一路，是很糟糕。”他的语气很平淡，像是在诉说别人的事情。</p>
                    </div>
                    <p>我站起来。远处有一列火车，车门开着，空荡荡的，没有人上车，也没有人下车。</p>
                    <p>我走上去，在靠窗的位置坐下。座椅很软，很干净。车窗外面还是白的，什么都看不见，但不觉得害怕。</p>
                    <p>火车动了，很轻，几乎感觉不到。困意上来的时候，我没有抵抗。</p>
                    <p class="sleep-fade-1">像是累了很久很久，终于可以躺下来，闭上眼睛休息了。</p>
                    <p class="sleep-fade-2">然后我就睡着了。</p>
                </div>
            `
        },

        // ================= 第 3 章：微风、失重上升、终极自由 =================
        {
            id: 3,
            type: "image",
            navChar: "叁",
            badgeNum: "ACT III",
            title: "飘扬",
            src: "assets/work-2/03.webp",
            theme: "sky", // 专为第三章定制的微风天青色氛围
            bgmSrc: "assets/work-2/bgm-ch3.mp3",
            bgmTitle: "飘扬",
            footnote: "",   // 已彻底删除简评
            essay: `
                <div class="w2-prose-sky">
                    <p>风很大，灌进我的耳朵，灌进我的衣服。<br>我张开口，大口大口地呼吸。空气是凉的，有草和泥土的味道，很久没有闻到过了。</p>
                    <p class="float-callout">我在上升。</p>
                    <p>风托着我的衣服，鼓起来，又贴下去。我的手臂抱着一个人。我不知道她是谁，也没有低头去看她的脸。她只是安静地靠在我怀里，像一件很轻很轻的东西。</p>
                    <p class="float-callout">我们一起上升。</p>
                    <p>风从耳边过去，从发梢过去。我的眼睛看着远方。<br>下面是稻田，绿茸茸的一片，被风吹出波纹。再远一点，是几座矮矮的建筑，屋顶上有烟，被风拉成斜斜的线。天很高，云很白，什么都看得很清楚。</p>
                    <p class="stop-mind">我不想再想了。</p>
                    <p>大脑慢慢停下来，像一台终于关掉的机器。我只顾着呼吸，贪婪地、大口地，把风吸进去，再吐出来。风一直吹，我一直飘。什么都不用做，什么都不用说。</p>
                    <p class="final-free">就这样飘着。<br><span>很好。</span></p>
                </div>
            `
        }
    ]
};