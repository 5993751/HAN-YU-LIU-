/* =========================================================
   转场帷幕 + 启动入口 + 键盘监听 (js/main.js)
   注意：smoothNavigate / fadeAudioOut / fadeAudioIn 是旧版
   多页面时期留下的函数，目前无人调用，原样保留待日后清理
   ========================================================= */

function revealPageCurtain() {
    const curtain = document.getElementById('pageCurtain');
    if (curtain) {
        setTimeout(() => curtain.classList.add('fade-out'), 60);
    }
}

function smoothNavigate(targetUrl) {
    const curtain = document.getElementById('pageCurtain');
    const activeAudio = document.getElementById('hallAudio') || document.getElementById('galAudio');
    if (activeAudio && !activeAudio.paused) fadeAudioOut(activeAudio, 650);

    if (curtain) {
        curtain.classList.remove('fade-out');
        setTimeout(() => { window.location.href = targetUrl; }, 720);
    } else {
        window.location.href = targetUrl;
    }
}

function fadeAudioOut(audioEl, duration) {
    const startVol = audioEl.volume;
    const steps = 15;
    const stepTime = duration / steps;
    let currentStep = 0;
    const timer = setInterval(() => {
        currentStep++;
        audioEl.volume = Math.max(0, startVol * (1 - currentStep / steps));
        if (currentStep >= steps) {
            clearInterval(timer);
            audioEl.pause();
            audioEl.volume = startVol;
        }
    }, stepTime);
}

function fadeAudioIn(audioEl, duration = 1200) {
    audioEl.volume = 0;
    audioEl.play().then(() => {
        const steps = 20;
        const stepTime = duration / steps;
        let currentStep = 0;
        const timer = setInterval(() => {
            currentStep++;
            audioEl.volume = Math.min(1, currentStep / steps);
            if (currentStep >= steps) clearInterval(timer);
        }, stepTime);
    }).catch(() => {});
}

document.addEventListener('DOMContentLoaded', () => {
    revealPageCurtain();
    initHomePage();

    const params = new URLSearchParams(window.location.search);
    const workParam = params.get('work');
    const chParam = parseInt(params.get('chapter')) || 1;
    if (workParam) {
        openGallerySpace(workParam, chParam);
    }
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