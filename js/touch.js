/* 触屏左右滑动翻页 */

(function () {
    let touchStartX = 0;
    let touchStartY = 0;
    let touching = false;

    const SWIPE_THRESHOLD = 60;
    const SWIPE_RATIO = 1.3;

    function canSwipeNow(target) {
        if (isCurtainBlocking() || isTypingTarget(target)) return false;
        if (target && target.closest && target.closest('.gallery-footer')) return false;

        const finaleEl = document.getElementById('finaleOverlay');
        if (finaleEl && finaleEl.classList.contains('show')) return false;

        if (!document.body.classList.contains('mode-gallery')) {
            const featuredView = document.getElementById('view-featured');
            if (!featuredView || !featuredView.classList.contains('active')) return false;
        }
        return true;
    }

    document.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1 || !canSwipeNow(e.target)) {
            touching = false;
            return;
        }
        touching = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        if (!touching) return;
        touching = false;
        if (!canSwipeNow(e.target)) return;

        const t = e.changedTouches[0];
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;

        if (Math.abs(dx) < SWIPE_THRESHOLD) return;
        if (Math.abs(dx) < Math.abs(dy) * SWIPE_RATIO) return;

        if (document.body.classList.contains('mode-gallery')) {
            changeChapter(dx < 0 ? 1 : -1);
        } else {
            moveSlide(dx < 0 ? 1 : -1);
        }
    }, { passive: true });
})();
