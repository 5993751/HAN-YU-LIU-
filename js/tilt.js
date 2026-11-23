/* 画框随性倾斜角度计算（供首页与展厅共用） */

const TILT_STRAIGHT_RATE = 0.24;

function applyGalleryTilt() {
    const stage = document.getElementById('gal-left-stage');
    if (!stage) return;

    const activeSlide = stage.querySelector('.gal-slide-item.active');
    if (!activeSlide) return;

    if (activeSlide.classList.contains('scatter-stage-item')) return;

    const frame = activeSlide.querySelector('.art-frame-wrapper');
    if (!frame) return;

    const img = frame.querySelector('img');
    if (!img) return;

    const apply = () => {
        const angle = pickGalleryTilt(img, currentGalleryProject);
        frame.style.setProperty('--tilt', angle === 0 ? '0deg' : angle.toFixed(2) + 'deg');
    };

    if (img.complete && img.naturalWidth) {
        apply();
    } else {
        img.addEventListener('load', apply, { once: true });
    }
}

function pickGalleryTilt(img, project) {
    const w = img.naturalWidth || 4;
    const h = img.naturalHeight || 3;
    const ratio = w / h;

    let max;
    if (ratio >= 1.9) max = 0.45;
    else if (ratio >= 1.45) max = 0.65;
    else if (ratio >= 1.1) max = 0.85;
    else if (ratio >= 0.85) max = 1.0;
    else max = 1.15;

    const mode = project && project.layoutMode;
    if (mode === 'cinematic') max *= 0.8;
    else if (mode === 'minimal-scatter') max *= 0.85;

    if (window.innerWidth <= 900) max *= 0.85;

    if (Math.random() < TILT_STRAIGHT_RATE) return 0;

    const angle = (Math.random() * 2 - 1) * max;
    return Math.abs(angle) < 0.18 ? 0 : angle;
}
