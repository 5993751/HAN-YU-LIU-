/* 手机端氛围与联动（仅 <=900px 生效）：底部章节坞居中、画框随滚收缩、陀螺仪光影视差 */

(function () {
    let scrollFrame = 0;
    let scrollBound = false;

    let gyroBound = false;
    let gyroPermRequested = false;
    let gyroBaseBeta = null;
    let gyroBaseGamma = null;
    let gyroTargetX = 0;
    let gyroTargetY = 0;
    let gyroCurrentX = 0;
    let gyroCurrentY = 0;
    let gyroFrame = 0;

    function isMobileViewport() {
        return window.innerWidth <= 900;
    }

    function isPortraitMobile() {
        return isMobileViewport() && window.innerHeight > window.innerWidth;
    }

    function centerHorizontalItem(containerEl, activeEl) {
        if (!containerEl || !activeEl) return;
        const maxLeft = containerEl.scrollWidth - containerEl.clientWidth;
        if (maxLeft <= 2) return;
        const targetLeft = activeEl.offsetLeft - (containerEl.clientWidth - activeEl.offsetWidth) / 2;
        containerEl.scrollTo({
            left: Math.max(0, Math.min(maxLeft, targetLeft)),
            behavior: 'smooth'
        });
    }

    function ensureMobileDockArrows() {
        const footer = document.getElementById('gal-footer-dots');
        if (!footer) return;
        const track = footer.querySelector('.footer-track');
        if (!track) return;

        if (!footer.querySelector('.mobile-dock-arrow.prev')) {
            const prevBtn = document.createElement('button');
            prevBtn.type = 'button';
            prevBtn.className = 'mobile-dock-arrow prev';
            prevBtn.setAttribute('aria-label', '上一页');
            prevBtn.textContent = '‹';
            prevBtn.addEventListener('click', () => changeChapter(-1));
            footer.insertBefore(prevBtn, track);
        }

        if (!footer.querySelector('.mobile-dock-arrow.next')) {
            const nextBtn = document.createElement('button');
            nextBtn.type = 'button';
            nextBtn.className = 'mobile-dock-arrow next';
            nextBtn.setAttribute('aria-label', '下一页');
            nextBtn.textContent = '›';
            nextBtn.addEventListener('click', () => changeChapter(1));
            footer.appendChild(nextBtn);
        }
    }

    function updateStageCollapse() {
        scrollFrame = 0;
        const container = document.getElementById('gal-container');
        const leftStage = document.getElementById('gal-left-stage');
        if (!container || !leftStage) return;

        if (!isPortraitMobile() || !document.body.classList.contains('mode-gallery')) {
            container.classList.remove('is-stage-collapsed');
            container.style.removeProperty('--stage-collapse');
            container.style.removeProperty('--stage-progress');
            container.style.removeProperty('--stage-scale');
            return;
        }

        const stageH = leftStage.offsetHeight || 280;
        const maxCollapse = Math.round(stageH * 0.36);
        const scrollTop = Math.max(0, container.scrollTop);
        const collapse = Math.min(maxCollapse, scrollTop);
        const progress = maxCollapse > 0 ? collapse / maxCollapse : 0;
        const scale = Math.max(0.62, (stageH - collapse * 0.90) / stageH);

        container.classList.toggle('is-stage-collapsed', collapse > 1);
        container.style.setProperty('--stage-collapse', `${collapse.toFixed(1)}px`);
        container.style.setProperty('--stage-progress', progress.toFixed(3));
        container.style.setProperty('--stage-scale', scale.toFixed(3));
    }

    function scheduleStageCollapse() {
        if (!scrollFrame) {
            scrollFrame = window.requestAnimationFrame(updateStageCollapse);
        }
    }

    function bindGalleryScrollCollapse() {
        if (scrollBound) return;
        const container = document.getElementById('gal-container');
        if (!container) return;
        scrollBound = true;
        container.addEventListener('scroll', scheduleStageCollapse, { passive: true });
        window.addEventListener('resize', scheduleStageCollapse, { passive: true });
        window.addEventListener('orientationchange', scheduleStageCollapse, { passive: true });
    }

    window.onGalleryChapterChange = function (ctx) {
        bindGalleryScrollCollapse();

        const leftStage = document.getElementById('gal-left-stage');
        if (leftStage && ctx && ctx.baseColor) {
            leftStage.style.setProperty('--gal-stage-bg', ctx.baseColor);
        }

        const container = document.getElementById('gal-container');
        if (container) {
            container.classList.remove('is-stage-collapsed');
            container.style.setProperty('--stage-collapse', '0px');
            container.style.setProperty('--stage-progress', '0');
            container.style.setProperty('--stage-scale', '1');
        }

        if (!isMobileViewport()) return;

        ensureMobileDockArrows();

        const track = document.querySelector('#gal-footer-dots .footer-track');
        const activeDot = document.querySelector('#gal-footer-dots .nav-dot-btn.active');
        centerHorizontalItem(track, activeDot);
    };

    window.onRestoreHomeSpace = function () {
        if (typeof window.closeMobileArtViewer === 'function') {
            window.closeMobileArtViewer();
        }
        const container = document.getElementById('gal-container');
        if (container) {
            container.classList.remove('is-stage-collapsed');
            container.style.removeProperty('--stage-collapse');
            container.style.removeProperty('--stage-progress');
            container.style.removeProperty('--stage-scale');
        }
    };

    window.onHomeSlideChange = function () {
        if (!isMobileViewport()) return;
        const dotsBox = document.getElementById('feat-dots');
        const activeDot = dotsBox && dotsBox.querySelector('.s-dot.active');
        centerHorizontalItem(dotsBox, activeDot);
    };

    /* 陀螺仪光影视差：随握持倾斜微幅漂移窗光（不覆盖电脑端鼠标视差） */
    function stepGyroParallax() {
        gyroFrame = 0;
        if (!isMobileViewport() || document.hidden) return;
        const stage = document.getElementById('paperLightStage');
        if (!stage) return;

        const dx = gyroTargetX - gyroCurrentX;
        const dy = gyroTargetY - gyroCurrentY;
        if (Math.abs(dx) < 0.08 && Math.abs(dy) < 0.08) {
            gyroCurrentX = gyroTargetX;
            gyroCurrentY = gyroTargetY;
            stage.style.setProperty('--light-px', `${gyroCurrentX.toFixed(2)}px`);
            stage.style.setProperty('--light-py', `${gyroCurrentY.toFixed(2)}px`);
            return;
        }

        gyroCurrentX += dx * 0.06;
        gyroCurrentY += dy * 0.06;
        stage.style.setProperty('--light-px', `${gyroCurrentX.toFixed(2)}px`);
        stage.style.setProperty('--light-py', `${gyroCurrentY.toFixed(2)}px`);
        gyroFrame = window.requestAnimationFrame(stepGyroParallax);
    }

    function handleDeviceOrientation(e) {
        if (!isMobileViewport() || document.hidden) return;
        if (typeof e.beta !== 'number' || typeof e.gamma !== 'number') return;

        if (gyroBaseBeta === null || gyroBaseGamma === null) {
            gyroBaseBeta = e.beta;
            gyroBaseGamma = e.gamma;
            return;
        }

        // 缓慢适应用户改变握持姿势，仅响应自然晃动与倾斜
        gyroBaseBeta += (e.beta - gyroBaseBeta) * 0.008;
        gyroBaseGamma += (e.gamma - gyroBaseGamma) * 0.008;

        const nx = Math.max(-1, Math.min(1, (e.gamma - gyroBaseGamma) / 22));
        const ny = Math.max(-1, Math.min(1, (e.beta - gyroBaseBeta) / 22));
        const damp = document.body.classList.contains('dark-chapter') ? 0.5 : 1;

        gyroTargetX = nx * 16 * damp;
        gyroTargetY = ny * 12 * damp;
        if (!gyroFrame) gyroFrame = window.requestAnimationFrame(stepGyroParallax);
    }

    function bindGyroListener() {
        if (gyroBound) return;
        gyroBound = true;
        window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && gyroFrame) {
                window.cancelAnimationFrame(gyroFrame);
                gyroFrame = 0;
            }
        });
    }

    function initGyroParallax() {
        if (typeof isReducedMotion === 'function' && isReducedMotion()) return;
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        if (typeof window.DeviceOrientationEvent === 'undefined') return;

        if (typeof window.DeviceOrientationEvent.requestPermission === 'function') {
            const requestOnce = () => {
                if (gyroPermRequested || !isMobileViewport()) return;
                gyroPermRequested = true;
                window.DeviceOrientationEvent.requestPermission()
                    .then(state => { if (state === 'granted') bindGyroListener(); })
                    .catch(() => {});
            };
            document.addEventListener('click', requestOnce, { once: true });
        } else {
            bindGyroListener();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGyroParallax);
    } else {
        initGyroParallax();
    }
})();
