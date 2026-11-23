/* 进场幕布：等待首屏媒体与字体就绪后放行，三点墨滴散开退场 */

const CURTAIN_MIN_MS = 700;
const CURTAIN_MAX_MS = 8000;
const CURTAIN_BREEZE_MAX_MS = 5000;
const CURTAIN_FONT_MAX_MS = 2000;

let curtainEl = null;
let curtainStart = 0;
let curtainReady = false;
let curtainOpened = false;
let curtainDrops = [];
let curtainPoints = [];
let curtainProgress = [0, 0, 0];
let curtainCanvas = null;
let curtainCtx = null;
let curtainBase = null;
let curtainW = 0;
let curtainH = 0;
let curtainRadiusMax = 0;
let curtainResizeBound = false;

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function waitForBreezeMedia() {
    return new Promise(resolve => {
        if (document.documentElement.dataset.breezeReady === '1') {
            resolve();
            return;
        }
        const cap = window.setTimeout(resolve, CURTAIN_BREEZE_MAX_MS);
        document.addEventListener('breeze:first-ready', () => {
            window.clearTimeout(cap);
            resolve();
        }, { once: true });
    });
}

function waitForFirstShowcaseImage() {
    return new Promise(resolve => {
        const img = document.querySelector('#feat-stage .showcase-slide.active img');
        if (!img) {
            resolve();
            return;
        }
        if (img.complete && img.naturalWidth) {
            resolve();
            return;
        }
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
    });
}

function waitForFonts() {
    return new Promise(resolve => {
        let settled = false;
        const finish = () => {
            if (settled) return;
            settled = true;
            window.clearTimeout(cap);
            resolve();
        };
        const cap = window.setTimeout(finish, CURTAIN_FONT_MAX_MS);

        const checkReady = () => {
            if (!document.fonts || !document.fonts.ready) {
                finish();
                return;
            }
            document.fonts.ready.then(finish).catch(finish);
        };

        const sheet = document.getElementById('siteFontSheet');
        if (sheet && sheet.media === 'print') {
            sheet.addEventListener('load', checkReady, { once: true });
            sheet.addEventListener('error', finish, { once: true });
        } else {
            checkReady();
        }
    });
}

function initLoadingCurtain() {
    curtainEl = document.getElementById('pageCurtain');
    if (!curtainEl || curtainOpened) return;
    curtainStart = performance.now();

    const anchors = [[28, 32], [72, 30], [50, 72]];
    const durations = [2.6, 3.6, 4.8];
    for (let i = durations.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [durations[i], durations[j]] = [durations[j], durations[i]];
    }
    for (let i = 0; i < 3; i++) {
        const x = Math.min(90, Math.max(10, anchors[i][0] + (Math.random() - 0.5) * 22));
        const y = Math.min(90, Math.max(10, anchors[i][1] + (Math.random() - 0.5) * 22));
        curtainDrops.push(durations[i]);
        curtainPoints.push({ x: x, y: y });
    }
    setupCurtainCanvas();

    const veil = document.getElementById('curtainVeil');
    if (veil) {
        if (prefersReducedMotion()) {
            veil.style.display = 'none';
        } else {
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => veil.classList.add('curtain-veil-out'));
            });
        }
    }

    const settle = () => markCurtainReady();
    Promise.all([
        waitForBreezeMedia(),
        waitForFirstShowcaseImage(),
        waitForFonts()
    ]).then(settle).catch(settle);
    window.setTimeout(settle, CURTAIN_MAX_MS);
}

function markCurtainReady() {
    if (curtainReady || curtainOpened || !curtainEl) return;
    curtainReady = true;

    const rest = Math.max(0, CURTAIN_MIN_MS - (performance.now() - curtainStart));
    window.setTimeout(() => {
        if (curtainOpened || !curtainEl) return;
        const textBox = document.getElementById('curtainText');
        if (textBox) textBox.classList.add('curtain-text-out');

        window.setTimeout(() => {
            if (curtainOpened || !curtainEl) return;
            const hintText = document.getElementById('curtainHintText');
            const dots = document.getElementById('curtainDots');
            const readyLabel = (typeof SITE_TEXT !== 'undefined' && SITE_TEXT.curtain && SITE_TEXT.curtain.ready) || '轻点进入';
            if (hintText) hintText.textContent = readyLabel;
            if (dots) dots.style.display = 'none';
            if (textBox) textBox.classList.remove('curtain-text-out');

            curtainEl.addEventListener('pointerdown', openLoadingCurtain, { once: true });
            curtainEl.addEventListener('touchstart', openLoadingCurtain, { once: true, passive: true });
            curtainEl.addEventListener('click', openLoadingCurtain, { once: true });
            document.addEventListener('keydown', onCurtainKey);
            window.setTimeout(() => {
                if (!curtainOpened) curtainEl.classList.add('curtain-ready');
            }, 950);
        }, 900);
    }, rest);
}

function onCurtainKey(e) {
    if (e.key === 'Enter' || e.key === ' ') openLoadingCurtain();
}

function onCurtainResize() {
    if (!curtainCanvas) return;
    sizeCurtainCanvas();
    paintCurtain();
}

function cleanupCurtain() {
    if (curtainResizeBound) {
        window.removeEventListener('resize', onCurtainResize);
        curtainResizeBound = false;
    }
    if (curtainCanvas && curtainCanvas.parentNode) {
        curtainCanvas.parentNode.removeChild(curtainCanvas);
    }
    curtainCanvas = null;
    curtainCtx = null;
    curtainBase = null;
}

function openLoadingCurtain() {
    if (curtainOpened || !curtainEl) return;
    curtainOpened = true;
    document.removeEventListener('keydown', onCurtainKey);

    const scene = curtainEl.querySelector('.curtain-scene');
    if (scene) scene.classList.add('curtain-scene-out');

    if (prefersReducedMotion()) {
        curtainEl.classList.add('curtain-hidden');
        cleanupCurtain();
        return;
    }

    curtainEl.classList.add('curtain-opening');
    runCurtainSpread();
}

function setupCurtainCanvas() {
    if (!curtainEl || curtainCanvas) return;
    curtainCanvas = document.createElement('canvas');
    curtainCanvas.className = 'curtain-canvas';
    curtainCanvas.setAttribute('aria-hidden', 'true');
    curtainEl.insertBefore(curtainCanvas, curtainEl.firstChild);
    curtainCtx = curtainCanvas.getContext('2d');
    sizeCurtainCanvas();
    paintCurtain();

    if (!curtainResizeBound) {
        curtainResizeBound = true;
        window.addEventListener('resize', onCurtainResize);
    }
}

function sizeCurtainCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    curtainW = window.innerWidth;
    curtainH = window.innerHeight;
    curtainCanvas.width = Math.round(curtainW * dpr);
    curtainCanvas.height = Math.round(curtainH * dpr);
    curtainRadiusMax = Math.hypot(curtainW, curtainH) * 1.02;
    curtainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    curtainBase = document.createElement('canvas');
    curtainBase.width = curtainCanvas.width;
    curtainBase.height = curtainCanvas.height;
    const bctx = curtainBase.getContext('2d');
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = curtainW;
    const h = curtainH;
    bctx.fillStyle = '#cdcac3';
    bctx.fillRect(0, 0, w, h);
    paintEllipseLight(bctx, w * 0.06, -h * 0.12, w * 0.72, h * 0.60, [[0, 'rgba(255, 226, 178, 0.34)'], [0.64, 'rgba(255, 226, 178, 0)']]);
    paintEllipseLight(bctx, w * 1.0, h * 1.06, w * 0.62, h * 0.54, [[0, 'rgba(58, 52, 42, 0.20)'], [0.72, 'rgba(58, 52, 42, 0)']]);
    paintEllipseLight(bctx, w * 0.5, h * 0.42, w * 0.54, h * 0.46, [[0, 'rgba(255, 255, 255, 0.13)'], [0.70, 'rgba(255, 255, 255, 0)']]);
}

function paintEllipseLight(ctx, cx, cy, rx, ry, stops) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(rx, ry);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    stops.forEach(s => g.addColorStop(s[0], s[1]));
    ctx.fillStyle = g;
    ctx.fillRect(-1e5, -1e5, 2e5, 2e5);
    ctx.restore();
}

function paintCurtain() {
    if (!curtainCtx) return;
    const ctx = curtainCtx;
    const w = curtainW;
    const h = curtainH;

    ctx.clearRect(0, 0, w, h);
    if (curtainBase) {
        ctx.drawImage(curtainBase, 0, 0, w, h);
    } else {
        ctx.fillStyle = '#cdcac3';
        ctx.fillRect(0, 0, w, h);
    }

    ctx.globalCompositeOperation = 'destination-out';
    curtainPoints.forEach((point, i) => {
        const progress = curtainProgress[i] || 0;
        if (progress <= 0) return;
        const r = progress * curtainRadiusMax;
        const cx = point.x / 100 * w;
        const cy = point.y / 100 * h;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, 'rgba(0, 0, 0, 1)');
        g.addColorStop(0.8, 'rgba(0, 0, 0, 1)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
}

function runCurtainSpread() {
    const start = performance.now();

    const step = () => {
        const elapsed = performance.now() - start;
        let allDone = true;

        curtainDrops.forEach((duration, i) => {
            const t = Math.min(1, elapsed / (duration * 1000));
            if (t < 1) allDone = false;
            curtainProgress[i] = 1 - Math.pow(1 - t, 1.8);
        });
        paintCurtain();

        if (!allDone) {
            window.requestAnimationFrame(step);
            return;
        }

        curtainProgress = [1, 1, 1];
        paintCurtain();
        window.setTimeout(() => {
            curtainEl.classList.add('curtain-fading');
            window.setTimeout(() => {
                curtainEl.classList.add('curtain-hidden');
                cleanupCurtain();
            }, 900);
        }, 160);
    };

    window.requestAnimationFrame(step);
}
