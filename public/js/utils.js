/* 公共工具函数与文案应用入口 */

function normalizeSrc(src) {
    if (!src) return "";
    const a = document.createElement('a');
    a.href = src;
    return a.href;
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el && text !== undefined) el.textContent = text;
}

function isProjectReady(project) {
    return !!project && project.isReady !== false;
}

function isTypingTarget(target) {
    if (!target || !target.tagName) return false;
    const tag = target.tagName.toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    return !!target.isContentEditable;
}

function isCurtainBlocking() {
    const curtain = document.getElementById('pageCurtain');
    if (!curtain) return false;
    return !curtain.classList.contains('curtain-opening') && !curtain.classList.contains('curtain-hidden');
}

function resolveChapterTheme(themeName, project) {
    const workThemes = project && project.themes;
    const entry = (workThemes && workThemes[themeName])
        || (typeof CHAPTER_THEMES !== 'undefined' && CHAPTER_THEMES[themeName]);
    if (!entry) return { color: '#f2ede2', dark: false };
    if (typeof entry === 'string') return { color: entry, dark: false };
    return { color: entry.color || '#f2ede2', dark: !!entry.dark };
}

function getWorkCopy(project) {
    if (!project) return { title: '', date: '', intro: '' };
    return {
        title: project.title || '',
        date: project.date || '',
        intro: project.intro || ''
    };
}

function applySiteText() {
    if (typeof SITE_TEXT === 'undefined') return;
    if (SITE_TEXT.pageTitle) document.title = SITE_TEXT.pageTitle;

    const c = SITE_TEXT.curtain || {};
    setText('curtainEyebrow', c.eyebrow);
    setText('curtainHintText', c.loading);

    const h = SITE_TEXT.home || {};
    setText('ui-site-title', h.siteTitle);
    setText('ui-site-subtitle', h.siteSubtitle);
    setText('btn-featured', h.navFeatured);
    setText('btn-archive', h.navArchive);
    setText('ui-mood-date', h.moodDate);
    setText('ui-mood-text', h.moodText);
    setText('feat-enter-btn', h.defaultEnterBtn);
    setText('ui-rotate-hint', h.rotateHint);
    const featPrev = document.getElementById('feat-prev-btn');
    if (featPrev && h.prevSlideTitle) featPrev.title = h.prevSlideTitle;
    const featNext = document.getElementById('feat-next-btn');
    if (featNext && h.nextSlideTitle) featNext.title = h.nextSlideTitle;

    const a = SITE_TEXT.archive || {};
    setText('ui-archive-desc', a.intro);
    setText('archive-empty', a.empty);
    const searchEl = document.getElementById('archive-search');
    if (searchEl && a.searchPlaceholder !== undefined) {
        searchEl.placeholder = a.searchPlaceholder;
    }
    const sortLabels = {
        default: a.sortDefault,
        newest: a.sortNewest,
        oldest: a.sortOldest
    };
    document.querySelectorAll('#archive-sort .archive-sort-btn').forEach(btn => {
        const label = sortLabels[btn.dataset.sort];
        if (label !== undefined) btn.textContent = label;
    });

    const g = SITE_TEXT.gallery || {};
    setText('gal-back-link', g.back);
    const galPrev = document.getElementById('gal-prev-btn');
    if (galPrev && g.prevChapterTitle) galPrev.title = g.prevChapterTitle;
    const galNext = document.getElementById('gal-next-btn');
    if (galNext && g.nextChapterTitle) galNext.title = g.nextChapterTitle;

    const f = SITE_TEXT.finale || {};
    setText('finale-eyebrow', f.eyebrow);
    setText('finale-title', f.title);
    setText('finale-text', f.text);
    setText('finale-divider-text', f.divider);
    setText('finale-enter-btn', f.nextBtn);
    setText('finale-replay-btn', f.replayBtn);
    setText('finale-home-btn', f.homeBtn);
    setText('finale-hint', f.hint);

    const m = SITE_TEXT.music || {};
    setText('globalMusicState', m.initialState);
    setText('globalTrackName', m.initialTrack);
    const nextMusicBtn = document.getElementById('globalNextBtn');
    if (nextMusicBtn && m.nextTitle) nextMusicBtn.title = m.nextTitle;
}

function lazyLoadSlideImages(containerEl, index) {
    if (!containerEl) return;
    const slides = containerEl.querySelectorAll('[data-index]');
    const total = slides.length;
    if (!total) return;

    const loadSlideAt = (i, priority) => {
        const img = containerEl.querySelector(`[data-index="${i}"] img`);
        if (!img) return Promise.resolve();

        if (!img.dataset.src) {
            if (img.complete && img.naturalWidth > 0) img.classList.add('developed');
            return Promise.resolve();
        }

        return new Promise(resolve => {
            let settled = false;
            const finish = (markDeveloped) => {
                if (markDeveloped) img.classList.add('developed');
                if (settled) return;
                settled = true;
                window.clearTimeout(timer);
                resolve();
            };
            const timer = window.setTimeout(() => finish(false), 900);

            img.decoding = 'async';
            if ('fetchPriority' in img) img.fetchPriority = priority;
            img.addEventListener('load', () => finish(true), { once: true });
            img.addEventListener('error', () => finish(false), { once: true });

            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            if (img.complete && img.naturalWidth > 0) finish(true);
        });
    };

    // 优先保障当前展示画作的带宽，完成后再预加载前后邻近张
    loadSlideAt(index, 'high').then(() => {
        if (total <= 1) return;
        const nextIdx = index >= total ? 1 : index + 1;
        const prevIdx = index <= 1 ? total : index - 1;
        loadSlideAt(nextIdx, 'low');
        if (prevIdx !== nextIdx) loadSlideAt(prevIdx, 'low');
    });
}

function shiftHueWash(hex, hueShift, lightShift, alpha) {
    const v = hex.replace('#', '');
    const full = v.length === 3 ? v.split('').map(c => c + c).join('') : v;
    const r = parseInt(full.slice(0, 2), 16) / 255;
    const g = parseInt(full.slice(2, 4), 16) / 255;
    const b = parseInt(full.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const light = (max + min) / 2;
    const delta = max - min;

    let hue = 0;
    let sat = 0;
    if (delta !== 0) {
        sat = delta / (1 - Math.abs(2 * light - 1));
        if (max === r) hue = ((g - b) / delta) % 6;
        else if (max === g) hue = (b - r) / delta + 2;
        else hue = (r - g) / delta + 4;
        hue *= 60;
    }

    hue = (hue + hueShift + 360) % 360;
    const light2 = Math.min(96, Math.max(4, light * 100 + lightShift));
    return `hsla(${hue.toFixed(0)}, ${(sat * 100).toFixed(0)}%, ${light2.toFixed(0)}%, ${alpha})`;
}

function isReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}
