/* 手机端展厅画作全屏查看器：双指缩放、双击放大、拖拽浏览、下滑关闭（仅 <=900px 按需激活） */

(function () {
    let viewerEl = null;
    let stageEl = null;
    let imgEl = null;
    let titleEl = null;

    let scale = 1;
    let tx = 0;
    let ty = 0;
    let dismissY = 0;

    let mode = '';
    let dragStartX = 0;
    let dragStartY = 0;
    let baseTx = 0;
    let baseTy = 0;
    let pinchStartDist = 0;
    let pinchStartScale = 1;
    let lastTapTime = 0;
    let lastTapX = 0;
    let lastTapY = 0;
    let movedDuringTouch = false;

    const MIN_SCALE = 1;
    const MAX_SCALE = 4;

    function applyTransform(animate) {
        if (!imgEl || !viewerEl) return;
        imgEl.style.transition = animate ? 'transform 0.26s cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
        if (dismissY > 0 && scale <= 1.02) {
            imgEl.style.transform = `translate3d(0px, ${dismissY.toFixed(1)}px, 0) scale(1)`;
            const ratio = Math.min(0.65, dismissY / 260);
            viewerEl.style.background = `rgba(14, 13, 11, ${(0.96 * (1 - ratio)).toFixed(3)})`;
        } else {
            imgEl.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
            viewerEl.style.background = '';
        }
    }

    function clampTranslation(nextTx, nextTy, targetScale) {
        if (!imgEl || targetScale <= 1.02) return { x: 0, y: 0 };
        const w = imgEl.offsetWidth || window.innerWidth * 0.9;
        const h = imgEl.offsetHeight || window.innerHeight * 0.7;
        const maxX = Math.max(0, (w * targetScale - window.innerWidth * 0.92) * 0.5);
        const maxY = Math.max(0, (h * targetScale - window.innerHeight * 0.78) * 0.5);
        return {
            x: Math.max(-maxX, Math.min(maxX, nextTx)),
            y: Math.max(-maxY, Math.min(maxY, nextTy))
        };
    }

    function resetViewerState(animate) {
        scale = 1;
        tx = 0;
        ty = 0;
        dismissY = 0;
        applyTransform(animate);
    }

    function closeViewer() {
        if (!viewerEl || !viewerEl.classList.contains('open')) return;
        viewerEl.classList.remove('open');
        viewerEl.setAttribute('aria-hidden', 'true');
        resetViewerState(false);
    }

    function buildViewer() {
        if (viewerEl) return;

        viewerEl = document.createElement('div');
        viewerEl.id = 'mobileArtViewer';
        viewerEl.className = 'mobile-art-viewer';
        viewerEl.setAttribute('aria-hidden', 'true');
        viewerEl.innerHTML = `
            <div class="mav-topbar">
                <span class="mav-title"></span>
                <button type="button" class="mav-close" aria-label="关闭大图">✕</button>
            </div>
            <div class="mav-stage">
                <img class="mav-img" alt="">
            </div>
            <div class="mav-hint">双指缩放 · 双击放大 · 下滑关闭</div>
        `;
        document.body.appendChild(viewerEl);

        stageEl = viewerEl.querySelector('.mav-stage');
        imgEl = viewerEl.querySelector('.mav-img');
        titleEl = viewerEl.querySelector('.mav-title');

        viewerEl.querySelector('.mav-close').addEventListener('click', closeViewer);

        stageEl.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                mode = 'pinch';
                movedDuringTouch = true;
                const a = e.touches[0];
                const b = e.touches[1];
                pinchStartDist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY) || 1;
                pinchStartScale = scale;
                baseTx = tx;
                baseTy = ty;
            } else if (e.touches.length === 1) {
                const t = e.touches[0];
                dragStartX = t.clientX;
                dragStartY = t.clientY;
                baseTx = tx;
                baseTy = ty;
                dismissY = 0;
                movedDuringTouch = false;
                mode = scale > 1.02 ? 'pan' : 'dismiss';
            }
        }, { passive: true });

        stageEl.addEventListener('touchmove', (e) => {
            if (mode === 'pinch' && e.touches.length === 2) {
                const a = e.touches[0];
                const b = e.touches[1];
                const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY) || 1;
                scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, pinchStartScale * (dist / pinchStartDist)));
                const clamped = clampTranslation(baseTx, baseTy, scale);
                tx = clamped.x;
                ty = clamped.y;
                applyTransform(false);
                return;
            }

            if (e.touches.length !== 1) return;
            const t = e.touches[0];
            const dx = t.clientX - dragStartX;
            const dy = t.clientY - dragStartY;
            if (Math.abs(dx) > 6 || Math.abs(dy) > 6) movedDuringTouch = true;

            if (mode === 'pan' && scale > 1.02) {
                const clamped = clampTranslation(baseTx + dx, baseTy + dy, scale);
                tx = clamped.x;
                ty = clamped.y;
                applyTransform(false);
            } else if (mode === 'dismiss' && scale <= 1.02) {
                dismissY = dy > 0 ? dy : 0;
                applyTransform(false);
            }
        }, { passive: true });

        stageEl.addEventListener('touchend', (e) => {
            if (mode === 'pinch') {
                if (e.touches.length < 2) {
                    mode = '';
                    if (scale < 1.06) resetViewerState(true);
                }
                return;
            }

            if (mode === 'dismiss' && dismissY > 85) {
                mode = '';
                closeViewer();
                return;
            }
            if (dismissY > 0) {
                dismissY = 0;
                applyTransform(true);
            }

            if (!movedDuringTouch && e.changedTouches && e.changedTouches.length === 1) {
                const t = e.changedTouches[0];
                const now = performance.now();
                const nearPrev = Math.hypot(t.clientX - lastTapX, t.clientY - lastTapY) < 26;
                if (now - lastTapTime < 280 && nearPrev) {
                    lastTapTime = 0;
                    if (scale > 1.05) {
                        resetViewerState(true);
                    } else {
                        scale = 2.4;
                        const cx = window.innerWidth / 2;
                        const cy = window.innerHeight / 2;
                        const clamped = clampTranslation((cx - t.clientX) * 1.1, (cy - t.clientY) * 1.1, scale);
                        tx = clamped.x;
                        ty = clamped.y;
                        applyTransform(true);
                    }
                    mode = '';
                    return;
                }
                lastTapTime = now;
                lastTapX = t.clientX;
                lastTapY = t.clientY;
            }
            mode = '';
        }, { passive: true });

        stageEl.addEventListener('click', (e) => {
            if (scale <= 1.02 && e.target === stageEl) {
                closeViewer();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 900) closeViewer();
        }, { passive: true });
    }

    function openViewer(src, caption) {
        if (!src) return;
        buildViewer();
        imgEl.src = src;
        imgEl.alt = caption || '';
        titleEl.textContent = caption || '';
        resetViewerState(false);
        viewerEl.classList.add('open');
        viewerEl.setAttribute('aria-hidden', 'false');
    }

    const leftStage = document.getElementById('gal-left-stage');
    if (leftStage) {
        leftStage.addEventListener('click', (e) => {
            if (window.innerWidth > 900) return;
            if (window.wasRecentMobileSwipe && window.wasRecentMobileSwipe()) return;
            if (leftStage.classList.contains('chapter-fading')) return;

            const activeSlide = leftStage.querySelector('.gal-slide-item.active');
            if (!activeSlide) return;
            if (activeSlide.classList.contains('scatter-stage-item')) return;
            if (activeSlide.querySelector('.text-only-card')) return;

            const img = activeSlide.querySelector('.art-frame-wrapper img');
            if (!img || !img.getAttribute('src')) return;

            const chapterTitle = document.querySelector('#gal-right-notes .chapter-box.active .chapter-title');
            const caption = (chapterTitle && chapterTitle.textContent) || img.alt || '';
            openViewer(img.currentSrc || img.src, caption);
        });
    }

    window.closeMobileArtViewer = closeViewer;
})();
