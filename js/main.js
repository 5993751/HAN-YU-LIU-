/* =========================================================
   转场帷幕 + 启动入口 + 键盘监听 (js/main.js)
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const workParam = params.get('work');
    const chParam = parseInt(params.get('chapter')) || 1;

    randomizePaperEdges();
    initAudioViz();
    initHomePage();

    // 深处链接（?work=）直接进展厅，其淡变在幕布后面完成
    if (workParam) {
        openGallerySpace(workParam, chParam);
    }

    // 最后启动进场幕布：此时首屏已渲染，图片与背景视频已开始下载
    initLoadingCurtain();
});

document.addEventListener('keydown', (e) => {
    if (document.body.classList.contains('mode-gallery')) {
        if (e.key === 'ArrowRight') changeChapter(1);
        if (e.key === 'ArrowLeft') changeChapter(-1);
        if (e.key === 'Escape') closeGalleryToHome();
    } else {
        if (e.key === 'ArrowRight') moveSlide(1);
        if (e.key === 'ArrowLeft') moveSlide(-1);
    }
});