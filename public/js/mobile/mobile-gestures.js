/* 手机端跟手滑动翻页（仅 <=900px 生效，电脑端完全跳过） */

(function () {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let touching = false;
    let gestureLock = '';
    let followStage = null;
    let followResetTimer = 0;
    let lastSwipeAt = 0;

    const LOCK_THRESHOLD = 10;
    const STAGE_SWIPE_DIST = 54;
    const FLICK_VELOCITY = 0.45;
    const FLICK_MIN_DIST = 30;
    const FALLBACK_SWIPE_DIST = 68;

    function isMobileWidth() {
        return window.innerWidth <= 900;
    }

    function canSwipeNow(target) {
        if (!isMobileWidth()) return false;
        if (isCurtainBlocking() || isTypingTarget(target)) return false;

        const viewer = document.getElementById('mobileArtViewer');
        if (viewer && viewer.classList.contains('open')) return false;

        const finaleEl = document.getElementById('finaleOverlay');
        if (finaleEl && finaleEl.classList.contains('show')) return false;

        if (target && target.closest && target.closest('.gallery-footer, .showcase-dots, .archive-filters, .global-music-dock')) {
            return false;
        }

        if (!document.body.classList.contains('mode-gallery')) {
            const featuredView = document.getElementById('view-featured');
            if (!featuredView || !featuredView.classList.contains('active')) return false;
        }
        return true;
    }

    function resolveFollowStage(target) {
        if (!target || !target.closest) return null;
        if (document.body.classList.contains('mode-gallery')) {
            return target.closest('#gal-left-stage');
        }
        return target.closest('#feat-stage');
    }

    function clearFollowImmediate(el) {
        if (!el) return;
        if (followResetTimer) {
            window.clearTimeout(followResetTimer);
            followResetTimer = 0;
        }
        el.style.transition = '';
    }

    function springFollowBack(el) {
        if (!el) return;
        if (!el.style.translate || el.style.translate === '0px 0px') {
            el.style.translate = '';
            return;
        }
        el.style.transition = 'translate 0.3s cubic-bezier(0.22, 1, 0.36, 1)';
        el.style.translate = '0px 0px';
        followResetTimer = window.setTimeout(() => {
            followResetTimer = 0;
            el.style.transition = '';
            el.style.translate = '';
        }, 320);
    }

    document.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1 || !canSwipeNow(e.target)) {
            touching = false;
            gestureLock = '';
            followStage = null;
            return;
        }
        touching = true;
        gestureLock = '';
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = performance.now();
        followStage = resolveFollowStage(e.target);
        clearFollowImmediate(followStage);
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (!touching || e.touches.length !== 1) return;

        const t = e.touches[0];
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;

        if (!gestureLock) {
            if (Math.abs(dx) < LOCK_THRESHOLD && Math.abs(dy) < LOCK_THRESHOLD) return;
            if (Math.abs(dy) > Math.abs(dx) * 0.85) {
                gestureLock = 'v';
                touching = false;
                springFollowBack(followStage);
                followStage = null;
                return;
            }
            gestureLock = 'h';
        }

        if (gestureLock === 'h' && followStage && !(typeof isReducedMotion === 'function' && isReducedMotion())) {
            const clamped = Math.max(-72, Math.min(72, dx * 0.38));
            followStage.style.translate = `${clamped.toFixed(1)}px 0px`;
        }
    }, { passive: true });

    function finishTouch(e, cancelled) {
        if (!touching) return;
        touching = false;

        const stage = followStage;
        followStage = null;
        springFollowBack(stage);

        if (cancelled || gestureLock === 'v' || !canSwipeNow(e.target)) {
            gestureLock = '';
            return;
        }

        const t = e.changedTouches && e.changedTouches[0];
        if (!t) {
            gestureLock = '';
            return;
        }

        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;
        const dt = Math.max(16, performance.now() - touchStartTime);
        const velocity = Math.abs(dx) / dt;

        let triggered = false;
        if (stage) {
            const passDist = Math.abs(dx) >= STAGE_SWIPE_DIST || (velocity >= FLICK_VELOCITY && Math.abs(dx) >= FLICK_MIN_DIST);
            triggered = passDist && Math.abs(dx) > Math.abs(dy) * 1.25;
        } else {
            triggered = Math.abs(dx) >= FALLBACK_SWIPE_DIST && Math.abs(dx) > Math.abs(dy) * 1.6;
        }

        gestureLock = '';
        if (!triggered) return;

        lastSwipeAt = performance.now();
        if (document.body.classList.contains('mode-gallery')) {
            changeChapter(dx < 0 ? 1 : -1);
        } else {
            moveSlide(dx < 0 ? 1 : -1);
        }
    }

    document.addEventListener('touchend', (e) => finishTouch(e, false), { passive: true });
    document.addEventListener('touchcancel', (e) => finishTouch(e, true), { passive: true });

    window.wasRecentMobileSwipe = function () {
        return (performance.now() - lastSwipeAt) < 280;
    };
})();
