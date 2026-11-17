/* =========================================================
   进场幕布 (js/loader.js)
   首屏关键资源就绪前，冷灰电视噪点幕布挡住入口；
   就绪后显示“轻点进入”，点击 → 从随机一点像墨滴一样散开，
   里面的大厅同步用 1.2s 淡入浮出来。
   只负责“等待 + 放行”，不参与首页/展厅任何逻辑。
   ========================================================= */

const CURTAIN_MIN_MS = 700;         // 最短展示：缓存命中时不至于一闪而过
const CURTAIN_MAX_MS = 8000;        // 最长等待：资源再慢也放人
const CURTAIN_BREEZE_MAX_MS = 5000; // 首个背景视频最多等 5 秒
const CURTAIN_FONT_MAX_MS = 2000;   // 字体最多等 2 秒，等不到先用系统衬线

let curtainEl = null;
let curtainStart = 0;
let curtainReady = false;
let curtainOpened = false;
let curtainDrops = [];       // 每滴墨的时长（秒）
let curtainPoints = [];      // 每滴墨的落点（百分比）
let curtainProgress = [0, 0, 0];   // 每滴墨的当前进度 0~1
let curtainCanvas = null;
let curtainCtx = null;
let curtainBase = null;      // 灰底 + 光的离屏缓存
let curtainW = 0;
let curtainH = 0;
let curtainRadiusMax = 0;
let curtainResizeBound = false;

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* 首个背景媒体就绪：信号由 js/breeze.js 派发（document 上的 breeze:first-ready） */
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

/* 首页轮播第一张图解码完成（出错也算完成，不能把人挡在门口） */
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
        if (!document.fonts || !document.fonts.ready) {
            resolve();
            return;
        }
        const cap = window.setTimeout(resolve, CURTAIN_FONT_MAX_MS);
        document.fonts.ready.then(() => {
            window.clearTimeout(cap);
            resolve();
        }).catch(() => {
            window.clearTimeout(cap);
            resolve();
        });
    });
}

function initLoadingCurtain() {
    curtainEl = document.getElementById('pageCurtain');
    if (!curtainEl || curtainOpened) return;
    curtainStart = performance.now();

    // 三个圆：大致铺开在三个区域，各自随机抖动；
    // 三档时长随机分配到三个位置，所以每次快慢顺序都不同，但彼此差距明显
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

    // 首屏只做一次：整块幕布从纸色薄纱里浮出来，和切页一样是淡的
    const veil = document.getElementById('curtainVeil');
    if (veil) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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

/* 资源齐了：先补足最短展示时间，再让旧文案淡出 → 换字 → 淡入，
   不硬切；淡入完成后才开始“细线呼吸”，并接收点击 */
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
            if (hintText) hintText.textContent = '轻点进入';
            if (dots) dots.style.display = 'none';   // 进入状态不再需要省略号
            if (textBox) textBox.classList.remove('curtain-text-out');

            curtainEl.addEventListener('pointerdown', openLoadingCurtain, { once: true });
            // 个别浏览器不派发 pointerdown，补上触摸与点击，保证一定能进入
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

function openLoadingCurtain() {
    if (curtainOpened || !curtainEl) return;
    curtainOpened = true;
    document.removeEventListener('keydown', onCurtainKey);

    const scene = curtainEl.querySelector('.curtain-scene');
    if (scene) scene.classList.add('curtain-scene-out');

    if (prefersReducedMotion()) {
        curtainEl.classList.add('curtain-hidden');
        return;
    }

    curtainEl.classList.add('curtain-opening');
    runCurtainSpread();
}

/* 幕布底子交给 canvas：冷灰 + 三束环境光，和 CSS 原来那套完全同参数 */
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
        window.addEventListener('resize', () => {
            if (!curtainCanvas) return;
            sizeCurtainCanvas();
            paintCurtain();
        });
    }
}

/* 灰底与光只画一次，缓存成离屏画布；每帧只做拷贝 + 挖洞 */
function sizeCurtainCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    curtainW = window.innerWidth;
    curtainH = window.innerHeight;
    curtainCanvas.width = Math.round(curtainW * dpr);
    curtainCanvas.height = Math.round(curtainH * dpr);
    curtainRadiusMax = Math.hypot(curtainW, curtainH) * 1.02;   // 任意落点都能盖满全屏
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

/* 以椭圆方式铺一层渐变，参数与 css 里的 radial-gradient 一致 */
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

/* 整帧：铺灰底 + 光 → 再按进度把圆“挖掉”。
   destination-out 是并集，挖掉的地方就是透明的，一定透出里面的内容 */
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

/* 每滴按自己的时长长大，全部到齐后锁成全透，再整层淡出 */
function runCurtainSpread() {
    const start = performance.now();

    const step = () => {
        const elapsed = performance.now() - start;
        let allDone = true;

        curtainDrops.forEach((duration, i) => {
            const t = Math.min(1, elapsed / (duration * 1000));
            if (t < 1) allDone = false;
            curtainProgress[i] = 1 - Math.pow(1 - t, 1.8);   // 起手果断、后段缓缓收尾
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
            window.setTimeout(() => curtainEl.classList.add('curtain-hidden'), 900);
        }, 160);
    };

    window.requestAnimationFrame(step);
}
