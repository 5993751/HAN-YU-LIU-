/* 进场幕布：等待首屏媒体与字体就绪后放行，点处生水错落化开退场 */

const CURTAIN_MIN_MS = 700;
const CURTAIN_MAX_MS = 8000;
const CURTAIN_BREEZE_MAX_MS = 5000;
const CURTAIN_FONT_MAX_MS = 2000;
const CURTAIN_SPREAD_FADE_START_MS = 1350;
const CURTAIN_FADE_DURATION_MS = 1550;
const CURTAIN_WET_RIM_ALPHA = 0.065;
const WATER_STAMP_SIZE = 320;

let curtainEl = null;
let curtainStart = 0;
let curtainReady = false;
let curtainOpened = false;
let curtainFadingStarted = false;
let curtainDrops = [];
let curtainStamps = [];
let curtainRimStamps = [];
let curtainCanvas = null;
let curtainCtx = null;
let curtainBase = null;
let curtainW = 0;
let curtainH = 0;
let curtainRadiusMax = 0;
let curtainResizeBound = false;

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

function randRange(min, max) {
    return min + Math.random() * (max - min);
}

function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
}

function drawFeatheredLobe(ctx, cx, cy, rx, ry, angle, innerAlpha, midAlpha) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.scale(rx, ry);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, `rgba(0, 0, 0, ${innerAlpha})`);
    g.addColorStop(0.35, `rgba(0, 0, 0, ${midAlpha})`);
    g.addColorStop(0.68, `rgba(0, 0, 0, ${(midAlpha * 0.35).toFixed(3)})`);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
}

function drawWetRimLobe(ctx, cx, cy, rx, ry, angle, alpha) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.scale(rx, ry);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, 'rgba(78, 68, 54, 0)');
    g.addColorStop(0.48, 'rgba(78, 68, 54, 0)');
    g.addColorStop(0.68, `rgba(78, 68, 54, ${alpha})`);
    g.addColorStop(0.84, `rgba(78, 68, 54, ${(alpha * 0.52).toFixed(3)})`);
    g.addColorStop(1, 'rgba(78, 68, 54, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
}

/* 预生成 3 组带不规则多瓣柔边与外缘水雾微斑的离屏水晕印章，避免方形裁切 */
function buildWaterStamps() {
    if (curtainStamps.length > 0) return;
    const size = WATER_STAMP_SIZE;
    const center = size / 2;
    const maxR = size * 0.45;

    for (let s = 0; s < 3; s++) {
        const blotch = document.createElement('canvas');
        blotch.width = size;
        blotch.height = size;
        const bctx = blotch.getContext('2d');

        const rim = document.createElement('canvas');
        rim.width = size;
        rim.height = size;
        const rctx = rim.getContext('2d');

        drawFeatheredLobe(bctx, center, center, maxR * 0.72, maxR * 0.68, randRange(0, Math.PI), 0.92, 0.56);
        drawWetRimLobe(rctx, center, center, maxR * 0.76, maxR * 0.72, 0, 0.24);

        const lobeCount = 10;
        for (let i = 0; i < lobeCount; i++) {
            const baseAngle = (i / lobeCount) * Math.PI * 2 + randRange(-0.26, 0.26);
            const dist = randRange(0.20, 0.38) * maxR;
            const lx = center + Math.cos(baseAngle) * dist;
            const ly = center + Math.sin(baseAngle) * dist;
            const rx = randRange(0.38, 0.54) * maxR;
            const ry = rx * randRange(0.76, 1.0);
            const rot = baseAngle + randRange(-0.5, 0.5);

            drawFeatheredLobe(bctx, lx, ly, rx, ry, rot, randRange(0.42, 0.64), randRange(0.20, 0.34));
            drawWetRimLobe(rctx, lx, ly, rx * 1.02, ry * 1.02, rot, randRange(0.14, 0.22));
        }

        for (let i = 0; i < 16; i++) {
            const a = randRange(0, Math.PI * 2);
            const dist = randRange(0.36, 0.60) * maxR;
            const lx = center + Math.cos(a) * dist;
            const ly = center + Math.sin(a) * dist;
            const rx = randRange(0.16, 0.30) * maxR;
            const ry = rx * randRange(0.72, 1.0);
            drawFeatheredLobe(bctx, lx, ly, rx, ry, a, randRange(0.24, 0.40), randRange(0.09, 0.16));
        }

        curtainStamps.push(blotch);
        curtainRimStamps.push(rim);
    }
}

function initLoadingCurtain() {
    curtainEl = document.getElementById('pageCurtain');
    if (!curtainEl || curtainOpened) return;
    curtainStart = performance.now();

    buildWaterStamps();
    setupCurtainCanvas();

    const veil = document.getElementById('curtainVeil');
    if (veil) {
        if (isReducedMotion()) {
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
    document.dispatchEvent(new CustomEvent('curtain:ready'));

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
    if (e.key === 'Enter' || e.key === ' ') openLoadingCurtain(e);
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
    curtainStamps = [];
    curtainRimStamps = [];
    curtainDrops = [];
}

function extractTapOrigin(e) {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    let clientX = null;
    let clientY = null;

    if (e) {
        if (e.touches && e.touches[0]) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches[0]) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else if (typeof e.clientX === 'number' && typeof e.clientY === 'number' && (e.clientX > 0 || e.clientY > 0)) {
            clientX = e.clientX;
            clientY = e.clientY;
        }
    }

    if (clientX === null || clientY === null) {
        return { x: randRange(42, 58), y: randRange(56, 68) };
    }
    return {
        x: clamp((clientX / w) * 100, 8, 92),
        y: clamp((clientY / h) * 100, 8, 92)
    };
}

function buildCurtainDrops(originX, originY) {
    curtainDrops = [];

    curtainDrops.push({
        x: originX,
        y: originY,
        delay: 0,
        duration: 2450,
        maxRadiusRatio: 0.74,
        rot: randRange(0, Math.PI * 2),
        rotSpeed: randRange(-0.25, 0.25),
        stretchX: randRange(0.95, 1.08),
        stretchY: randRange(0.92, 1.05),
        stampIdx: 0,
        t: 0,
        progress: 0,
        alpha: 0
    });

    const satOffsets = [
        { delay: 70, duration: 1900, ratio: 0.34, stampIdx: 1 },
        { delay: 150, duration: 2100, ratio: 0.38, stampIdx: 2 }
    ];
    satOffsets.forEach((sat, idx) => {
        const angle = randRange(0, Math.PI * 2) + idx * Math.PI;
        const dist = randRange(6, 12);
        curtainDrops.push({
            x: clamp(originX + Math.cos(angle) * dist, 6, 94),
            y: clamp(originY + Math.sin(angle) * dist, 6, 94),
            delay: sat.delay,
            duration: sat.duration,
            maxRadiusRatio: sat.ratio,
            rot: randRange(0, Math.PI * 2),
            rotSpeed: randRange(-0.32, 0.32),
            stretchX: randRange(0.92, 1.1),
            stretchY: randRange(0.9, 1.08),
            stampIdx: sat.stampIdx,
            t: 0,
            progress: 0,
            alpha: 0
        });
    });

    const anchors = [[24, 28], [76, 26], [26, 74], [74, 72]];
    const sorted = anchors
        .map(([ax, ay]) => ({ ax, ay, d: Math.hypot(ax - originX, ay - originY) }))
        .sort((a, b) => b.d - a.d)
        .slice(0, 3);

    const farDelays = [200, 440, 680];
    const farDurations = [2550, 2600, 2650];
    const farRatios = [0.64, 0.68, 0.70];

    sorted.forEach((anchor, i) => {
        curtainDrops.push({
            x: clamp(anchor.ax + randRange(-8, 8), 12, 88),
            y: clamp(anchor.ay + randRange(-8, 8), 12, 88),
            delay: farDelays[i],
            duration: farDurations[i],
            maxRadiusRatio: farRatios[i],
            rot: randRange(0, Math.PI * 2),
            rotSpeed: randRange(-0.22, 0.22),
            stretchX: randRange(0.94, 1.08),
            stretchY: randRange(0.92, 1.06),
            stampIdx: (i + 1) % curtainStamps.length,
            t: 0,
            progress: 0,
            alpha: 0
        });
    });
}

function easeWaterSpread(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const a = Math.pow(t, 1.35);
    const b = Math.pow(1 - t, 1.85);
    return a / (a + b);
}

function openLoadingCurtain(e) {
    if (curtainOpened || !curtainEl) return;
    curtainOpened = true;
    curtainEl.removeEventListener('pointerdown', openLoadingCurtain);
    curtainEl.removeEventListener('touchstart', openLoadingCurtain);
    curtainEl.removeEventListener('click', openLoadingCurtain);
    document.removeEventListener('keydown', onCurtainKey);

    const scene = curtainEl.querySelector('.curtain-scene');
    if (scene) scene.classList.add('curtain-scene-out');

    if (isReducedMotion()) {
        curtainEl.classList.add('curtain-hidden');
        cleanupCurtain();
        return;
    }

    buildWaterStamps();
    const origin = extractTapOrigin(e);
    buildCurtainDrops(origin.x, origin.y);

    curtainEl.classList.add('curtain-opening');
    window.setTimeout(() => {
        if (curtainEl) curtainEl.classList.add('curtain-passthrough');
    }, 380);
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

    if (curtainDrops.length === 0 || curtainStamps.length === 0) return;

    curtainDrops.forEach(drop => {
        if (drop.progress <= 0.02) return;
        const rimStamp = curtainRimStamps[drop.stampIdx];
        if (!rimStamp) return;

        const r = drop.progress * curtainRadiusMax * drop.maxRadiusRatio;
        const size = r * 2 * 1.04;
        const cx = (drop.x / 100) * w;
        const cy = (drop.y / 100) * h;

        ctx.save();
        ctx.globalAlpha = CURTAIN_WET_RIM_ALPHA * drop.alpha * Math.sin(Math.min(1, drop.t) * Math.PI);
        ctx.translate(cx, cy);
        ctx.rotate(drop.rot + drop.rotSpeed * drop.progress);
        ctx.scale(drop.stretchX, drop.stretchY);
        ctx.drawImage(rimStamp, -size / 2, -size / 2, size, size);
        ctx.restore();
    });

    ctx.globalCompositeOperation = 'destination-out';
    curtainDrops.forEach(drop => {
        if (drop.progress <= 0) return;
        const stamp = curtainStamps[drop.stampIdx];
        if (!stamp) return;

        const r = drop.progress * curtainRadiusMax * drop.maxRadiusRatio;
        const size = r * 2;
        const cx = (drop.x / 100) * w;
        const cy = (drop.y / 100) * h;

        ctx.save();
        ctx.globalAlpha = drop.alpha;
        ctx.translate(cx, cy);
        ctx.rotate(drop.rot + drop.rotSpeed * drop.progress);
        ctx.scale(drop.stretchX, drop.stretchY);
        ctx.drawImage(stamp, -size / 2, -size / 2, size, size);
        ctx.restore();
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
}

function runCurtainSpread() {
    const start = performance.now();

    const step = () => {
        if (!curtainEl || curtainEl.classList.contains('curtain-hidden')) return;

        const elapsed = performance.now() - start;
        let allDone = true;

        curtainDrops.forEach(drop => {
            const raw = (elapsed - drop.delay) / drop.duration;
            const t = clamp(raw, 0, 1);
            if (t < 1) allDone = false;
            drop.t = t;
            drop.progress = easeWaterSpread(t);
            drop.alpha = Math.min(1, t * 2.4);
        });

        paintCurtain();

        if (!curtainFadingStarted && elapsed >= CURTAIN_SPREAD_FADE_START_MS) {
            curtainFadingStarted = true;
            curtainEl.classList.add('curtain-fading');
            window.setTimeout(() => {
                if (!curtainEl) return;
                curtainEl.classList.add('curtain-hidden');
                cleanupCurtain();
            }, CURTAIN_FADE_DURATION_MS + 60);
        }

        if (!allDone) {
            window.requestAnimationFrame(step);
        }
    };

    window.requestAnimationFrame(step);
}
