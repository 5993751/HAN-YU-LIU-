/* =========================================================
   触屏滑动翻页 (js/touch.js)
   手机：左滑 = 下一页/下一章，右滑 = 上一页/上一章
   · 只监听 touch 事件——电脑端鼠标键盘操作完全不受影响
   · 被动监听（passive），绝不拦截页面原生竖向滚动
   ========================================================= */

(function () {
    let touchStartX = 0;
    let touchStartY = 0;
    let touching = false;

    const SWIPE_THRESHOLD = 60;   // 横向位移超过 60px 才算滑动
    const SWIPE_RATIO = 1.3;      // 且横向位移要明显大于纵向（防止误触竖向滚动）

    document.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) { touching = false; return; }  // 多指手势不处理
        touching = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        if (!touching) return;
        touching = false;

        const t = e.changedTouches[0];
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;

        if (Math.abs(dx) < SWIPE_THRESHOLD) return;             // 位移太短：当作点按，忽略
        if (Math.abs(dx) < Math.abs(dy) * SWIPE_RATIO) return;  // 更像竖向滚动：忽略

        if (document.body.classList.contains('mode-gallery')) {
            changeChapter(dx < 0 ? 1 : -1);   // 左滑下一章，右滑上一章
        } else {
            moveSlide(dx < 0 ? 1 : -1);       // 首页轮播同理
        }
    }, { passive: true });
})();