/* 动态光影控制：各展厅章节专属光路切换与电脑端阻尼微视差 */

const LIGHT_PRESETS = {
    home: {
        a: ['-19%', '-18%', '-14deg', 1.15, 1.0],
        b: ['6%', '-14%', '12deg', 1.05, 0.95],
        vig: ['2%', '2%'],
        colorA: 'rgba(255, 214, 148, 0.50)',
        colorB: 'rgba(255, 236, 198, 0.32)',
        vigColor: 'rgba(90, 74, 52, 0.20)'
    },
    // 作品 1《泡沫与微光》
    'w1-showa': {
        a: ['0%', '15%', '4deg', 1.15, 0.90],
        b: ['-12%', '8%', '-8deg', 0.95, 0.88],
        vig: ['0%', '-3%'],
        colorA: 'rgba(226, 204, 168, 0.34)',
        colorB: 'rgba(205, 188, 162, 0.22)',
        vigColor: 'rgba(72, 62, 48, 0.18)'
    },
    'w1-morandi': {
        a: ['-8%', '-17%', '-6deg', 1.15, 1.0],
        b: ['12%', '-10%', '10deg', 1.0, 0.95],
        vig: ['2%', '2%'],
        colorA: 'rgba(255, 218, 158, 0.44)',
        colorB: 'rgba(246, 214, 198, 0.30)',
        vigColor: 'rgba(92, 74, 62, 0.15)'
    },
    'w1-gilded': {
        a: ['17%', '-17%', '16deg', 1.20, 1.05],
        b: ['-12%', '4%', '-10deg', 1.05, 0.95],
        vig: ['-3%', '2%'],
        colorA: 'rgba(255, 206, 118, 0.48)',
        colorB: 'rgba(255, 232, 176, 0.30)',
        vigColor: 'rgba(104, 76, 36, 0.16)'
    },
    'w1-golden-glow': {
        a: ['0%', '-19%', '0deg', 1.24, 1.08],
        b: ['-4%', '10%', '6deg', 1.08, 0.92],
        vig: ['0%', '2%'],
        colorA: 'rgba(255, 216, 132, 0.46)',
        colorB: 'rgba(255, 236, 184, 0.28)',
        vigColor: 'rgba(112, 86, 42, 0.14)'
    },
    'w1-mirage': {
        a: ['15%', '11%', '-14deg', 1.06, 0.92],
        b: ['-13%', '13%', '10deg', 0.96, 0.88],
        vig: ['-2%', '-3%'],
        colorA: 'rgba(206, 222, 220, 0.38)',
        colorB: 'rgba(232, 218, 194, 0.22)',
        vigColor: 'rgba(54, 62, 64, 0.20)'
    },
    'w1-crash': {
        a: ['-10%', '-17%', '-22deg', 0.88, 1.18],
        b: ['14%', '16%', '14deg', 0.92, 0.86],
        vig: ['0%', '2%'],
        colorA: 'rgba(166, 184, 206, 0.15)',
        colorB: 'rgba(196, 120, 102, 0.09)',
        vigColor: 'rgba(6, 8, 12, 0.42)'
    },
    'w1-ruins': {
        a: ['2%', '-17%', '-2deg', 1.28, 0.86],
        b: ['-12%', '4%', '6deg', 1.10, 0.88],
        vig: ['1%', '2%'],
        colorA: 'rgba(236, 240, 246, 0.44)',
        colorB: 'rgba(214, 220, 228, 0.26)',
        vigColor: 'rgba(68, 72, 78, 0.14)'
    },
    'w1-gather': {
        a: ['-17%', '0%', '-10deg', 1.12, 1.0],
        b: ['10%', '-10%', '10deg', 0.98, 0.94],
        vig: ['2%', '2%'],
        colorA: 'rgba(238, 232, 196, 0.42)',
        colorB: 'rgba(208, 224, 198, 0.28)',
        vigColor: 'rgba(68, 76, 60, 0.15)'
    },
    'w1-dawn': {
        a: ['-19%', '8%', '-6deg', 1.16, 0.98],
        b: ['8%', '-8%', '8deg', 1.02, 0.92],
        vig: ['3%', '2%'],
        colorA: 'rgba(255, 224, 172, 0.44)',
        colorB: 'rgba(255, 242, 214, 0.28)',
        vigColor: 'rgba(88, 74, 54, 0.14)'
    },
    // 作品 2《长眠与飞翔》
    abyss: {
        a: ['-12%', '-17%', '-16deg', 0.90, 1.18],
        b: ['0%', '4%', '-6deg', 0.86, 0.95],
        vig: ['2%', '2%'],
        colorA: 'rgba(222, 178, 96, 0.19)',
        colorB: 'rgba(188, 142, 68, 0.10)',
        vigColor: 'rgba(6, 5, 4, 0.46)'
    },
    limbo: {
        a: ['-4%', '0%', '0deg', 1.22, 1.12],
        b: ['6%', '-6%', '6deg', 1.10, 1.05],
        vig: ['0%', '2%'],
        colorA: 'rgba(255, 252, 236, 0.56)',
        colorB: 'rgba(255, 255, 255, 0.42)',
        vigColor: 'rgba(120, 118, 110, 0.08)'
    },
    sky: {
        a: ['16%', '-17%', '14deg', 1.24, 1.06],
        b: ['-12%', '-8%', '-10deg', 1.10, 1.0],
        vig: ['-2%', '2%'],
        colorA: 'rgba(255, 252, 238, 0.48)',
        colorB: 'rgba(198, 228, 224, 0.32)',
        vigColor: 'rgba(58, 78, 72, 0.12)'
    },
    // 作品 3《将会成为怎样的大人呢？》
    'w3-night': {
        a: ['17%', '-17%', '16deg', 1.02, 1.05],
        b: ['-15%', '16%', '-10deg', 0.96, 0.86],
        vig: ['-2%', '-2%'],
        colorA: 'rgba(142, 176, 230, 0.16)',
        colorB: 'rgba(224, 198, 162, 0.09)',
        vigColor: 'rgba(5, 8, 16, 0.44)'
    },
    'w3-mirror': {
        a: ['-14%', '-2%', '-8deg', 1.12, 1.12],
        b: ['12%', '-12%', '10deg', 0.98, 0.96],
        vig: ['2%', '2%'],
        colorA: 'rgba(255, 255, 255, 0.58)',
        colorB: 'rgba(214, 224, 238, 0.32)',
        vigColor: 'rgba(74, 84, 98, 0.12)'
    },
    'w3-sunset': {
        a: ['-15%', '15%', '14deg', 1.22, 0.96],
        b: ['8%', '6%', '8deg', 1.06, 0.92],
        vig: ['3%', '-3%'],
        colorA: 'rgba(248, 162, 88, 0.36)',
        colorB: 'rgba(255, 208, 142, 0.26)',
        vigColor: 'rgba(92, 46, 32, 0.18)'
    },
    'w3-starry': {
        a: ['2%', '-15%', '-20deg', 1.24, 0.82],
        b: ['-10%', '-4%', '-16deg', 1.06, 0.78],
        vig: ['0%', '2%'],
        colorA: 'rgba(152, 184, 242, 0.16)',
        colorB: 'rgba(198, 212, 255, 0.10)',
        vigColor: 'rgba(4, 6, 14, 0.45)'
    }
};

const FALLBACK_POSES = [
    { a: ['-14%', '-14%', '-12deg', 1.12, 1.0], b: ['10%', '-10%', '12deg', 1.0, 0.95],  vig: ['2%', '2%'] },
    { a: ['14%', '-14%', '14deg', 1.14, 1.02],  b: ['-10%', '6%', '-10deg', 0.98, 0.94], vig: ['-2%', '2%'] },
    { a: ['-15%', '8%', '-8deg', 1.12, 0.96],   b: ['8%', '-10%', '8deg', 1.02, 0.92],   vig: ['3%', '-2%'] },
    { a: ['4%', '-16%', '2deg', 1.22, 0.92],    b: ['-8%', '10%', '-6deg', 1.02, 0.9],   vig: ['0%', '2%'] }
];

let lightStageEl = null;
let parallaxBound = false;
let parallaxFrame = 0;
let parallaxTargetX = 0;
let parallaxTargetY = 0;
let parallaxCurrentX = 0;
let parallaxCurrentY = 0;

function getLightStage() {
    if (!lightStageEl) {
        lightStageEl = document.getElementById('paperLightStage');
    }
    return lightStageEl;
}

function buildFallbackPreset(context) {
    const idx = Math.max(0, ((context.chapterIndex || 1) - 1) % FALLBACK_POSES.length);
    const pose = FALLBACK_POSES[idx];
    const base = context.baseColor || '#f2ede2';
    const isDark = !!context.isDark;

    return {
        a: pose.a,
        b: pose.b,
        vig: pose.vig,
        colorA: shiftHueWash(base, isDark ? 12 : -10, isDark ? 14 : 8, isDark ? 0.18 : 0.42),
        colorB: shiftHueWash(base, isDark ? -14 : 12, isDark ? 8 : 12, isDark ? 0.11 : 0.28),
        vigColor: isDark ? 'rgba(4, 6, 12, 0.44)' : shiftHueWash(base, 0, -28, 0.18)
    };
}

function applyLightPreset(stage, preset) {
    if (!stage || !preset) return;
    const s = stage.style;
    s.setProperty('--light-color-a', preset.colorA);
    s.setProperty('--light-color-b', preset.colorB);
    s.setProperty('--light-vignette-color', preset.vigColor);

    s.setProperty('--pose-a-x', preset.a[0]);
    s.setProperty('--pose-a-y', preset.a[1]);
    s.setProperty('--pose-a-rot', preset.a[2]);
    s.setProperty('--pose-a-sx', String(preset.a[3]));
    s.setProperty('--pose-a-sy', String(preset.a[4]));

    s.setProperty('--pose-b-x', preset.b[0]);
    s.setProperty('--pose-b-y', preset.b[1]);
    s.setProperty('--pose-b-rot', preset.b[2]);
    s.setProperty('--pose-b-sx', String(preset.b[3]));
    s.setProperty('--pose-b-sy', String(preset.b[4]));

    s.setProperty('--vig-x', preset.vig[0]);
    s.setProperty('--vig-y', preset.vig[1]);
}

function updateSceneLighting(context) {
    const stage = getLightStage();
    if (!stage) return;

    const ctx = context || { mode: 'home' };
    if (ctx.mode !== 'gallery') {
        applyLightPreset(stage, LIGHT_PRESETS.home);
        return;
    }

    const presetKey = (ctx.item && ctx.item.lightPreset) || ctx.theme;
    const preset = (presetKey && LIGHT_PRESETS[presetKey]) || buildFallbackPreset(ctx);
    applyLightPreset(stage, preset);
}

function stepLightParallax() {
    parallaxFrame = 0;
    const stage = getLightStage();
    if (!stage) return;

    const dx = parallaxTargetX - parallaxCurrentX;
    const dy = parallaxTargetY - parallaxCurrentY;

    if (Math.abs(dx) < 0.12 && Math.abs(dy) < 0.12) {
        parallaxCurrentX = parallaxTargetX;
        parallaxCurrentY = parallaxTargetY;
        stage.style.setProperty('--light-px', `${parallaxCurrentX.toFixed(2)}px`);
        stage.style.setProperty('--light-py', `${parallaxCurrentY.toFixed(2)}px`);
        return;
    }

    parallaxCurrentX += dx * 0.045;
    parallaxCurrentY += dy * 0.045;
    stage.style.setProperty('--light-px', `${parallaxCurrentX.toFixed(2)}px`);
    stage.style.setProperty('--light-py', `${parallaxCurrentY.toFixed(2)}px`);

    parallaxFrame = window.requestAnimationFrame(stepLightParallax);
}

function scheduleLightParallax() {
    if (!parallaxFrame) {
        parallaxFrame = window.requestAnimationFrame(stepLightParallax);
    }
}

function bindLightParallax() {
    if (parallaxBound) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (isReducedMotion()) return;

    parallaxBound = true;

    window.addEventListener('mousemove', (e) => {
        const w = window.innerWidth || 1;
        const h = window.innerHeight || 1;
        const nx = (e.clientX / w - 0.5) * 2;
        const ny = (e.clientY / h - 0.5) * 2;
        const damp = document.body.classList.contains('dark-chapter') ? 0.5 : 1;

        parallaxTargetX = nx * 26 * damp;
        parallaxTargetY = ny * 18 * damp;
        scheduleLightParallax();
    }, { passive: true });

    document.documentElement.addEventListener('mouseleave', () => {
        parallaxTargetX = 0;
        parallaxTargetY = 0;
        scheduleLightParallax();
    }, { passive: true });
}

function initLighting() {
    updateSceneLighting({ mode: 'home' });
    bindLightParallax();
}
