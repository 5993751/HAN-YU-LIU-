/* 启动入口与全局键盘导航 */

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const workParam = params.get('work');
    const chParam = parseInt(params.get('chapter'), 10) || 1;

    applySiteText();
    randomizePaperEdges();
    initAudioViz();
    initHomePage();

    if (workParam) {
        openGallerySpace(workParam, chParam);
    }

    initLoadingCurtain();
});

document.addEventListener('keydown', (e) => {
    if (isCurtainBlocking() || isTypingTarget(e.target)) return;

    if (document.body.classList.contains('mode-gallery')) {
        if (e.key === 'ArrowRight') changeChapter(1);
        if (e.key === 'ArrowLeft') changeChapter(-1);
        if (e.key === 'Escape') closeGalleryToHome();
    } else {
        const featuredView = document.getElementById('view-featured');
        if (!featuredView || !featuredView.classList.contains('active')) return;
        if (e.key === 'ArrowRight') moveSlide(1);
        if (e.key === 'ArrowLeft') moveSlide(-1);
    }
});
