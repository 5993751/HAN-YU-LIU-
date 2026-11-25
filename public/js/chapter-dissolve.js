/* 展厅章节水墨淡变转场 */

let dissolvePhase = 'idle';
let dissolvePending = null;
let dissolveToken = 0;

// 与 css/effects.css 中 .chapter-fading 及 #gal-left-stage 的过渡时长保持一致
const DISSOLVE_OUT_MS = 850;
const DISSOLVE_IN_MS = 1350;

function playChapterDissolve(applyFn) {
    const left = document.getElementById('gal-left-stage');
    const right = document.getElementById('gal-right-notes');
    if (!left || !right) {
        applyFn();
        return;
    }

    if (dissolvePhase === 'out') {
        dissolvePending = applyFn;
        return;
    }

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

function cancelChapterDissolve() {
    dissolveToken++;
    dissolvePhase = 'idle';
    dissolvePending = null;

    ['gal-left-stage', 'gal-right-notes'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('chapter-fading');
    });
}
