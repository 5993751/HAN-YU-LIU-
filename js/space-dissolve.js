/* =========================================================
   空间淡变转场 (js/space-dissolve.js)
   进入展厅 / 回到大厅时，先让当前空间整页缓缓退色，
   淡尽后再换空间，让新空间从纸色里慢慢浮起来；
   底色同样交给 body 的 background-color 过渡在两套底色之间混色
   ========================================================= */

let spacePhase = 'idle';   // idle | out | in
let spaceToken = 0;

function playSpaceDissolve(applyFn) {
    const fromEl = document.querySelector('.space-wrapper.active');

    // 没有正在显示的空间：直接切换
    if (!fromEl) {
        applyFn();
        return;
    }

    // 正在整页退色：忽略连点，避免两次搭展厅叠在一起
    if (spacePhase === 'out') return;

    spacePhase = 'out';
    const token = ++spaceToken;
    document.querySelectorAll('.space-entering').forEach(el => el.classList.remove('space-entering'));

    fromEl.classList.add('space-fading');

    window.setTimeout(() => {
        if (token !== spaceToken) return;

        applyFn();
        fromEl.classList.remove('space-fading');

        const toEl = document.querySelector('.space-wrapper.active');
        if (!toEl) {
            spacePhase = 'idle';
            return;
        }

        // 新空间先以透明度 0 落位，下一帧才开始浮上来
        toEl.classList.add('space-entering');
        void toEl.offsetHeight;
        window.requestAnimationFrame(() => {
            if (token !== spaceToken) return;
            toEl.classList.remove('space-entering');

            spacePhase = 'in';
            window.setTimeout(() => {
                if (token !== spaceToken) return;
                spacePhase = 'idle';
            }, 1250);
        });
    }, 620);
}
