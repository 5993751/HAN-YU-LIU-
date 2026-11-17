/* =========================================================
   水墨淡变转场 (js/chapter-dissolve.js)
   换章时左右两栏（连同里面的画作）一起缓缓退色，等页面淡尽后再换内容；
   底色由 body 自己的 background-color 过渡在两章之间慢慢混色，
   所以中间看到的是「两种纸色的渐变」，不是一次硬切
   ========================================================= */

let dissolvePhase = 'idle';   // idle | out | in
let dissolvePending = null;   // 淡出期间又按了翻页：记下最新一次，等淡尽时一起生效
let dissolveToken = 0;

const DISSOLVE_OUT_MS = 850;   // 与 css/effects.css 里 .chapter-fading 的过渡时长一致
const DISSOLVE_IN_MS = 1350;   // 与 css/effects.css 里 #gal-left-stage 的浮回时长一致

function playChapterDissolve(applyFn) {
    const left = document.getElementById('gal-left-stage');
    const right = document.getElementById('gal-right-notes');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!left || !right || reduceMotion) {
        applyFn();
        return;
    }

    // 正在淡出：只记下最新目标，避免连按丢步或回跳
    if (dissolvePhase === 'out') {
        dissolvePending = applyFn;
        return;
    }

    // 上一轮还在往回浮也没关系，从当前不透明度接着淡出即可
    dissolvePhase = 'out';
    const token = ++dissolveToken;

    left.classList.add('chapter-fading');
    right.classList.add('chapter-fading');

    window.setTimeout(() => {
        if (token !== dissolveToken) return;

        const apply = dissolvePending || applyFn;
        dissolvePending = null;
        apply();

        left.classList.remove('chapter-fading');
        right.classList.remove('chapter-fading');

        dissolvePhase = 'in';
        window.setTimeout(() => {
            if (token !== dissolveToken) return;
            dissolvePhase = 'idle';
        }, DISSOLVE_IN_MS + 150);
    }, DISSOLVE_OUT_MS);
}

/* 关展厅 / 弹谢幕卡时立刻收干净，避免内容停在半透明状态 */
function cancelChapterDissolve() {
    dissolveToken++;
    dissolvePhase = 'idle';
    dissolvePending = null;

    ['gal-left-stage', 'gal-right-notes'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('chapter-fading');
    });
}
