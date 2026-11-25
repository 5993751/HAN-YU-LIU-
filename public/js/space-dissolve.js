/* 首页大厅与展厅空间淡变转场 */

let spacePhase = 'idle';
let spaceToken = 0;

function playSpaceDissolve(applyFn) {
    const fromEl = document.querySelector('.space-wrapper.active');

    if (!fromEl) {
        applyFn();
        return;
    }

    if (spacePhase === 'out') return;

    spacePhase = 'out';
    const token = ++spaceToken;
    document.querySelectorAll('.space-entering').forEach(el => el.classList.remove('space-entering'));

    fromEl.classList.add('space-fading');

    // 620ms 对应 css/effects.css 中 .space-fading 退色时长
    window.setTimeout(() => {
        if (token !== spaceToken) return;

        applyFn();
        fromEl.classList.remove('space-fading');

        const toEl = document.querySelector('.space-wrapper.active');
        if (!toEl) {
            spacePhase = 'idle';
            return;
        }

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
