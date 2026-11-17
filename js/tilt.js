/* =========================================================
   展厅照片的随性倾斜 (js/tilt.js)
   · 每翻到一章重新抽一次角度，同一章再回来会换一个姿态
   · 角度按图片宽高比收敛：越宽越克制，竖图可以多一点
   · 第二篇宽银幕、第三篇极简模式各自再收一点
   · 第三篇的散落碎片本身已带倾斜，不再叠加
   ========================================================= */

const TILT_STRAIGHT_RATE = 0.24; // 约四分之一的概率保持端正

function applyGalleryTilt() {
    const stage = document.getElementById('gal-left-stage');
    if (!stage) return;

    const activeSlide = stage.querySelector('.gal-slide-item.active');
    if (!activeSlide) return;

    // 散落碎片本身已有 rot，保持原样
    if (activeSlide.classList.contains('scatter-stage-item')) return;

    const frame = activeSlide.querySelector('.art-frame-wrapper');
    if (!frame) return;

    const img = frame.querySelector('img');
    if (!img) return;

    const apply = () => {
        const angle = pickGalleryTilt(img, currentGalleryProject);
        // 与首页共用同一个 CSS 变量 --tilt，避免内联 transform 盖掉样式表里的规则
        frame.style.setProperty('--tilt', angle === 0 ? '0deg' : angle.toFixed(2) + 'deg');
    };

    // 宽高比要等图片知道自己的尺寸；已加载就立即摆，未加载就等加载完再摆
    if (img.complete && img.naturalWidth) {
        apply();
    } else {
        img.addEventListener('load', apply, { once: true });
    }
}

/* 按宽高比 + 展厅布局算一个克制的随机角度 */
function pickGalleryTilt(img, project) {
    const w = img.naturalWidth || 4;
    const h = img.naturalHeight || 3;
    const ratio = w / h;

    let max;
    if (ratio >= 1.9) max = 0.45;        // 超宽幅，几乎摆正
    else if (ratio >= 1.45) max = 0.65;  // 常规横图
    else if (ratio >= 1.1) max = 0.85;
    else if (ratio >= 0.85) max = 1.0;   // 接近方图
    else max = 1.15;                     // 竖图

    const mode = project && project.layoutMode;
    if (mode === 'cinematic') max *= 0.8;          // 第二篇宽银幕，保持端正的力量感
    else if (mode === 'minimal-scatter') max *= 0.85; // 第三篇极简，克制一点

    if (window.innerWidth <= 900) max *= 0.85;     // 手机端舞台小，幅度再收

    if (Math.random() < TILT_STRAIGHT_RATE) return 0;

    const angle = (Math.random() * 2 - 1) * max;
    return Math.abs(angle) < 0.18 ? 0 : angle;     // 太小的角度看着别扭，直接摆正
}
